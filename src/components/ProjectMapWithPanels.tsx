'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Settings, BarChart3, Activity } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/context/ThemeContext'
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyecto'
import { useDataContext } from '@/context/DataContext'
import { useDashboardFilters } from '@/context/DashboardContext'
import 'leaflet/dist/leaflet.css'

// Importar componentes de gráficos
import InterventionMetrics from './InterventionMetrics'
import ProjectProgressMetrics from './ProjectProgressMetrics'
import LayerControlPanel from './LayerControlPanel'

/**
 * ====================================
 * MAPA CON PANELES LATERALES - VERSIÓN LIMPIA
 * ====================================
 * 
 * Layout de tres secciones:
 * - Panel izquierdo (200px): Controles de capas
 * - Centro: Mapa interactivo
 * - Panel derecho (300px): Gráficos de métricas
 */

// Componente de mapa dinámico (sin SSR)
const DynamicProjectMap = dynamic(
  () => import('./ProjectMapCore').catch(err => {
    console.error('❌ Error importando ProjectMapCore:', err)
    return {
      default: () => (
        <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20">
          <div className="text-center p-4">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-red-700 dark:text-red-400 text-sm">Error cargando el mapa</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">Cargando mapa...</p>
        </div>
      </div>
    )
  }
)

export interface ProjectMapWithPanelsProps {
  className?: string
  height?: string
}

// Mapas base disponibles
const baseMaps = {
  light: {
    name: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    name: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }
}

// Configuración de colores para capas
const layerColors = {
  equipamientos: '#10B981', // Verde
  infraestructura_vial: '#F59E0B', // Naranja
  comunas: '#3B82F6', // Azul
  barrios: '#8B5CF6', // Púrpura
  veredas: '#EF4444', // Rojo
  corregimientos: '#06B6D4' // Cian
}

// Configuración de iconos para capas
const layerIcons = {
  equipamientos: '🏢',
  infraestructura_vial: '🛣️',
  comunas: '🏘️',
  barrios: '🏡',
  veredas: '🌳',
  corregimientos: '🌄'
}

const ProjectMapWithPanels: React.FC<ProjectMapWithPanelsProps> = ({
  className = '',
  height = '800px'
}) => {
  console.log('🚀 ProjectMapWithPanels - Componente iniciando...')
  
  // Estados del componente
  const [selectedBaseMap, setSelectedBaseMap] = useState<string>('light')
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    equipamientos: true,
    infraestructura_vial: true
  })
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    equipamientos: 0.8,
    infraestructura_vial: 0.8
  })
  const [activeChart, setActiveChart] = useState<'interventions' | 'progress'>('interventions')

  // Hooks
  const { theme } = useTheme()
  const unidadesState = useUnidadesProyecto()
  const dataContext = useDataContext()
  const { filters } = useDashboardFilters()
  
  // Sincronizar mapa base con el tema
  useEffect(() => {
    setSelectedBaseMap(theme === 'dark' ? 'dark' : 'light')
  }, [theme])
  
  // Obtener unidades de proyecto (ya procesadas por el hook)
  const unidadesProyecto = useMemo(() => {
    const rawUnidades = unidadesState.unidadesProyecto || []
    
    // Aplicar filtros si existen
    if (!filters) return rawUnidades
    
    return rawUnidades.filter(unit => {
      // Filtro por búsqueda de texto
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = filters.search.toLowerCase()
        const searchFields = [
          unit.name,
          unit.bpin,
          unit.responsible,
          unit.comuna,
          unit.barrio,
          unit.corregimiento,
          unit.vereda,
          unit.tipoIntervencion,
          unit.claseObra,
          unit.descripcion
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(searchTerm)) return false
      }

      // Otros filtros...
      if (filters.estado !== 'all' && unit.status !== filters.estado) {
        return false
      }

      return true
    })
  }, [unidadesState.unidadesProyecto, filters])

  // Debug logs
  useEffect(() => {
    console.log('🔍 ProjectMapWithPanels - Estado de datos:', {
      unidadesOriginales: unidadesState.unidadesProyecto?.length || 0,
      unidadesFiltradas: unidadesProyecto.length,
      loading: unidadesState.loading,
      error: unidadesState.error,
      muestraUnidades: unidadesState.unidadesProyecto?.slice(0, 2)
    })
  }, [unidadesProyecto, unidadesState])

  // Inicializar configuración de capas cuando hay datos
  useEffect(() => {
    if (unidadesProyecto.length > 0) {
      // Configuración inicial de visibilidad de capas
      setLayerVisibility({
        equipamientos: true,
        infraestructura_vial: true
      })
      setLayerOpacity({
        equipamientos: 0.8,
        infraestructura_vial: 0.8
      })
    }
  }, [unidadesProyecto.length])

  // Funciones de manejo de capas
  const toggleLayer = (layerName: string) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }))
  }

  const changeLayerOpacity = (layerName: string, opacity: number) => {
    setLayerOpacity(prev => ({
      ...prev,
      [layerName]: opacity
    }))
  }

  const changeLayerColor = (layerName: string, color: string) => {
    console.log(`Cambiar color de ${layerName} a ${color}`)
  }

  // Preparar datos para el control de capas
  const layerControlData = useMemo(() => {
    return ['equipamientos', 'infraestructura_vial'].map(fileName => {
      const displayName = fileName === 'infraestructura_vial' ? 'Infraestructura Vial' : 'Equipamientos'
      
      return {
        id: fileName,
        name: displayName,
        visible: layerVisibility[fileName] ?? true, // Por defecto visible
        opacity: layerOpacity[fileName] || 0.8,
        color: layerColors[fileName as keyof typeof layerColors] || '#6B7280',
        icon: layerIcons[fileName as keyof typeof layerIcons] || '📍',
        type: 'geojson' as const
      }
    })
  }, [layerVisibility, layerOpacity])

  // Mostrar loading si está cargando
  if (unidadesState.loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Cargando datos del proyecto...</p>
        </div>
      </motion.div>
    )
  }

  // Mostrar error si hay error
  if (unidadesState.error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-700 dark:text-red-400">Error: {unidadesState.error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Layout en tres columnas */}
      <div className="flex h-full">
        
        {/* Panel Izquierdo - Controles */}
        <motion.div
          initial={false}
          animate={{ 
            width: leftPanelCollapsed ? '40px' : '200px'
          }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col"
        >
          {/* Header del panel izquierdo */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!leftPanelCollapsed && (
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white">Controles</h3>
                </div>
              )}
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title={leftPanelCollapsed ? "Expandir panel" : "Contraer panel"}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${leftPanelCollapsed ? 'rotate-90' : '-rotate-90'}`} />
              </button>
            </div>
          </div>

          {/* Contenido del panel izquierdo */}
          {!leftPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <LayerControlPanel
                layers={layerControlData}
                onLayerToggle={toggleLayer}
                onOpacityChange={changeLayerOpacity}
                onColorChange={changeLayerColor}
              />
            </div>
          )}
        </motion.div>

        {/* Sección Central - Mapa */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-800">
          <DynamicProjectMap
            data={{
              allGeoJSONData: unidadesState.allGeoJSONData || {},
              unidadesProyecto: unidadesProyecto
            }}
            baseMapConfig={baseMaps[selectedBaseMap as keyof typeof baseMaps]}
            layerVisibility={layerVisibility}
            height="100%"
            theme={theme}
          />
        </div>

        {/* Panel Derecho - Métricas */}
        <motion.div
          initial={false}
          animate={{ 
            width: rightPanelCollapsed ? '40px' : '300px'
          }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col"
        >
          {/* Header del panel derecho */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title={rightPanelCollapsed ? "Expandir panel" : "Contraer panel"}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${rightPanelCollapsed ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              {!rightPanelCollapsed && (
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white">Métricas</h3>
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>
          </div>

          {/* Contenido del panel derecho */}
          {!rightPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              
              {/* Selector de tipo de gráfico */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vista</h4>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setActiveChart('interventions')}
                    className={`p-1.5 rounded text-xs transition-colors ${
                      activeChart === 'interventions'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Settings className="w-3 h-3 mx-auto mb-0.5" />
                    Tipos
                  </button>
                  <button
                    onClick={() => setActiveChart('progress')}
                    className={`p-1.5 rounded text-xs transition-colors ${
                      activeChart === 'progress'
                        ? 'bg-green-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Activity className="w-3 h-3 mx-auto mb-0.5" />
                    Progreso
                  </button>
                </div>
              </div>

              {/* Área de gráficos */}
              <div className="space-y-3">
                {activeChart === 'interventions' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                    <h3 className="text-sm font-medium mb-2">Intervenciones</h3>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Total: {unidadesProyecto.length} proyectos
                    </div>
                    <InterventionMetrics data={unidadesProyecto} />
                  </div>
                )}
                
                {activeChart === 'progress' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                    <h3 className="text-sm font-medium mb-2">Progreso</h3>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Total: {unidadesProyecto.length} proyectos
                    </div>
                    {unidadesProyecto.length > 0 && <ProjectProgressMetrics data={unidadesProyecto} />}
                  </div>
                )}
              </div>

              {/* Panel de información básica */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Estado</h4>
                <div className="space-y-0.5 text-xs text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{unidadesState.unidadesProyecto?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filtradas:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{unidadesProyecto.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ProjectMapWithPanels

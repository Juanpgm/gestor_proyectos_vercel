'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Map, Layers, ChevronDown, Check } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/context/ThemeContext'
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyecto'
import { loadAllUnidadesProyecto } from '@/utils/geoJSONLoader'
import MapLayerFilters, { type GeographicFilters } from './MapLayerFilters'
import ColorCustomizationControl, { type LayerColors } from './ColorCustomizationControl'
import 'leaflet/dist/leaflet.css'

/**
 * ====================================
 * MAPA DE UNIDADES DE PROYECTO
 * ====================================
 * 
 * Módulo unificado para la visualización de unidades de proyecto con:
 * - Marcadores interactivos de unidades de proyecto
 * - Capas de contexto geográfico (equipamientos, infraestructura)
 * - Controles de capa dinámicos
 * - Popups informativos detallados
 * - Filtrado geográfico integrado
 * 
 * Características:
 * - Carga GeoJSON unificada y optimizada
 * - Múltiples mapas base seleccionables
 * - Renderizado eficiente con canvas
 * - Interactividad completa
 */

// Componente de mapa dinámico (sin SSR)
const DynamicProjectMap = dynamic(
  () => import('./ProjectMapCore'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[700px] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando mapa de unidades de proyecto...</p>
        </div>
      </div>
    )
  }
)

export interface ProjectMapData {
  allGeoJSONData: Record<string, any>
  unidadesProyecto?: any[] // ⚠️ DEPRECATED: Ya no se usa, datos vienen desde allGeoJSONData
}

export interface ProjectMapProps {
  className?: string
  height?: string
  showControls?: boolean
  showLayerControls?: boolean
}

// Mapas base disponibles
const baseMaps = {
  openstreet: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  light: {
    name: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    name: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  voyager: {
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }
}

const ProjectMapUnified: React.FC<ProjectMapProps> = ({
  className = '',
  height = '700px',
  showControls = true,
  showLayerControls = true
}) => {
  // Estados
  const [mapData, setMapData] = useState<ProjectMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBaseMap, setSelectedBaseMap] = useState<string>('light')
  const [showBaseMapSelector, setShowBaseMapSelector] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [geographicFilters, setGeographicFilters] = useState<GeographicFilters>({
    comunas: [],
    barrios: [],
    corregimientos: []
  })
  const [layerColors, setLayerColors] = useState<Record<string, LayerColors>>({})
  
  // Configuración de capas - Dinámicamente basada en archivos cargados
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({})

  // Hooks
  const { theme } = useTheme()
  
  /**
   * Usar datos del hook optimizado en lugar de cargar independientemente
   */
  const unidadesState = useUnidadesProyecto()
  const { allGeoJSONData, unidadesProyecto: hookUnidadesProyecto, loading: hookLoading, error: hookError } = unidadesState
  
  // Memoizar unidades de proyecto para evitar re-renders innecesarios
  const unidadesProyecto = useMemo(() => {
    return hookUnidadesProyecto || []
  }, [hookUnidadesProyecto])

  console.log('📊 Estado unidades proyecto:', {
    total: unidadesProyecto.length,
    loading: hookLoading,
    error: hookError
  })

  // Verificar si estamos en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  /**
   * Sincronizar datos del hook con el estado local del mapa
   */
  useEffect(() => {
    if (isClient && !hookLoading && !hookError && allGeoJSONData) {
      // Verificar que hay datos válidos
      const hasValidData = Object.values(allGeoJSONData).some(data => 
        data && data.features && data.features.length > 0
      )

      if (hasValidData) {
        console.log('🔄 Sincronizando datos del hook con el mapa')
        
        const projectMapData: ProjectMapData = {
          allGeoJSONData,
          unidadesProyecto: hookUnidadesProyecto || []
        }

        setMapData(projectMapData)
        setLoading(false)
        setError(null)
        
        console.log('✅ Datos sincronizados desde hook global')
        Object.entries(allGeoJSONData).forEach(([fileName, data]) => {
          if (data) {
            console.log(`📊 ${fileName}: ${data.features?.length || 0} features`)
          }
        })
      }
    } else if (hookError) {
      setError(hookError)
      setLoading(false)
    } else if (hookLoading) {
      setLoading(true)
      setError(null)
    }
  }, [isClient, hookLoading, hookError, allGeoJSONData, hookUnidadesProyecto])

  /**
   * Actualizar unidades de proyecto cuando cambien desde props
   */
  useEffect(() => {
    if (mapData && unidadesProyecto && unidadesProyecto.length > 0) {
      console.log('🔄 Actualizando unidades de proyecto desde props:', unidadesProyecto.length)
      setMapData(prev => prev ? { ...prev, unidadesProyecto } : null)
    }
  }, [unidadesProyecto, mapData])

  /**
   * Inicializar visibilidad de capas basada en archivos cargados
   */
  useEffect(() => {
    if (mapData?.allGeoJSONData) {
      const initialVisibility: Record<string, boolean> = {}
      Object.keys(mapData.allGeoJSONData).forEach(fileName => {
        initialVisibility[fileName] = true // Todas las capas activadas por defecto
      })
      setLayerVisibility(initialVisibility)
    }
  }, [mapData?.allGeoJSONData])

  /**
   * Alternar visibilidad de capas
   */
  const toggleLayer = (layerName: string) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }))
  }

  /**
   * Manejar cambios en filtros geográficos
   */
  const handleGeographicFilterChange = (filters: GeographicFilters) => {
    setGeographicFilters(filters)
  }

  /**
   * Manejar cambios en colores de capas
   */
  const handleLayerColorChange = (layerId: string, colors: LayerColors) => {
    setLayerColors(prev => ({
      ...prev,
      [layerId]: colors
    }))
  }

  /**
   * Estadísticas del mapa
   */
  const mapStats = useMemo(() => {
    if (!mapData) return null
    
    // Contar features de todos los archivos GeoJSON cargados
    const geoJSONStats: Record<string, number> = {}
    let totalGeoJSONFeatures = 0
    
    Object.entries(mapData.allGeoJSONData).forEach(([fileName, data]) => {
      const count = data?.features?.length || 0
      geoJSONStats[fileName] = count
      totalGeoJSONFeatures += count
    })
    
    // Calcular total de proyectos desde GeoJSON en lugar de unidadesProyecto
    const totalProyectos = Object.values(mapData.allGeoJSONData).reduce((total, geoJSON: any) => {
      return total + (geoJSON?.features?.length || 0)
    }, 0)
    
    // Calcular proyectos activos desde GeoJSON
    const proyectosActivos = Object.values(mapData.allGeoJSONData).reduce((activos, geoJSON: any) => {
      const activosEnCapa = geoJSON?.features?.filter((f: any) => 
        f.properties?.status === 'En Ejecución' || 
        f.properties?.estado === 'En Ejecución'
      ).length || 0
      return activos + activosEnCapa
    }, 0)
    
    return {
      totalProyectos,
      totalGeoJSONFeatures,
      equipamientos: geoJSONStats.equipamientos || 0,
      infraestructura: geoJSONStats.infraestructura_vial || 0,
      proyectosActivos,
      geoJSONStats
    }
  }, [mapData])

  // Estados de carga y error
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando mapa de unidades de proyecto...</p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-700 dark:text-red-400">Error cargando el mapa: {error}</p>
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

  if (!mapData || !isClient) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header con controles */}
      {showControls && (
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
                Mapa de Unidades de Proyecto
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ubicación geográfica de {mapStats?.totalProyectos || 0} unidades de proyecto
              </p>
            </div>
            
            {/* Selector de mapa base */}
            <div className="relative">
              <button
                onClick={() => setShowBaseMapSelector(!showBaseMapSelector)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Map className="w-4 h-4" />
                <span className="text-sm font-medium">{baseMaps[selectedBaseMap as keyof typeof baseMaps]?.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showBaseMapSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showBaseMapSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                >
                  {Object.entries(baseMaps).map(([key, map]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedBaseMap(key)
                        setShowBaseMapSelector(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between"
                    >
                      <span className="text-sm">{map.name}</span>
                      {selectedBaseMap === key && <Check className="w-4 h-4 text-blue-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Controles de capas dinámicos */}
          {showLayerControls && mapData && Object.keys(layerVisibility).length > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Capas:</span>
              
              {Object.keys(mapData.allGeoJSONData).map(fileName => {
                const displayName = fileName === 'infraestructura_vial' ? 'Vías' : 
                                  fileName === 'equipamientos' ? 'Equipamientos' : 
                                  fileName.charAt(0).toUpperCase() + fileName.slice(1)
                
                const colorClass = fileName === 'equipamientos' ? 'text-green-600' : 
                                 fileName === 'infraestructura_vial' ? 'text-orange-600' :
                                 'text-blue-600'
                
                return (
                  <label key={fileName} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layerVisibility[fileName] || false}
                      onChange={() => toggleLayer(fileName)}
                      className={`w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-2 ${colorClass.replace('text-', 'text-')} focus:ring-${colorClass.split('-')[1]}-500`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{displayName}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenedor del mapa */}
      <div className="relative" style={{ height }}>
        <DynamicProjectMap
          data={mapData}
          baseMapConfig={baseMaps[selectedBaseMap as keyof typeof baseMaps]}
          layerVisibility={layerVisibility}
          height={height}
          theme={theme}
          geographicFilters={geographicFilters}
          layerColors={layerColors}
        />

        {/* Controles flotantes en el mapa */}
        <div className="absolute top-4 left-4 z-[1000] space-y-3 max-w-xs">
          {/* Control de colores */}
          <ColorCustomizationControl
            onColorChange={handleLayerColorChange}
            layers={Object.keys(mapData?.allGeoJSONData || {})}
          />
        </div>
      </div>


    </motion.div>
  )
}

export default ProjectMapUnified

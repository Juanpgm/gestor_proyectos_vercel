'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Settings, ChevronLeft, ChevronRight, MapPin, BarChart3, Activity } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useOptimizedProjectData } from '@/hooks/useOptimizedProjectData'
import OptimizedLayerControl from './OptimizedLayerControl'
import PropertiesPanel from './PropertiesPanel'
import ProgressGaugeChart from './ProgressGaugeChart'
import InterventionMetrics from './InterventionMetrics'

// Importación dinámica del mapa optimizada
const OptimizedMapCore = dynamic(() => import('./OptimizedMapCore'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando mapa...</p>
      </div>
    </div>
  )
})

interface LayerConfig {
  id: string
  name: string
  visible: boolean
  color: string
  opacity: number
  type: 'geojson' | 'points'
}

interface OptimizedMapLayoutProps {
  className?: string
  height?: string
}

const OptimizedMapLayout: React.FC<OptimizedMapLayoutProps> = ({
  className = '',
  height = '800px'
}) => {
  const { geoJSONData, unidades, loading, error } = useOptimizedProjectData()
  
  // Estados del layout
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [activeChart, setActiveChart] = useState<'gauge' | 'interventions'>('gauge')
  
  // Configuración inicial de capas - garantizamos que coincida con los datos disponibles
  const [layerConfigs, setLayerConfigs] = useState<LayerConfig[]>([
    {
      id: 'equipamientos',
      name: 'Equipamientos',
      visible: true,
      color: '#10B981',
      opacity: 0.8,
      type: 'geojson'
    },
    {
      id: 'infraestructura_vial',
      name: 'Infraestructura Vial',
      visible: true,
      color: '#F59E0B',
      opacity: 0.8,
      type: 'geojson'
    }
  ])

  // Crear métricas para el panel derecho
  const metricsData = useMemo(() => {
    const allFeatures: any[] = []
    
    // Extraer todas las features de los datos GeoJSON
    Object.values(geoJSONData).forEach((geoJSON: any) => {
      if (geoJSON?.features) {
        geoJSON.features.forEach((feature: any) => {
          if (feature.properties) {
            const props = feature.properties
            
            // Mapear los datos para que tengan la estructura esperada por los gráficos
            const mappedData = {
              ...props,
              progress: props.progress || 
                       props.porcentaje_avance || 
                       (props.avance_físico_obra || 0) * 100 || 
                       props.porcentaje_ejecutado ||
                       (props.valor_ejecutado && props.valor_total ? 
                         Math.round((props.valor_ejecutado / props.valor_total) * 100) : 0),
              
              status: props.status || 
                     props.estado || 
                     props.estado_proyecto ||
                     props.fase ||
                     'Sin especificar',
              
              tipoIntervencion: props.tipo_intervencion || 
                              props.tipo_proyecto || 
                              props.tipo ||
                              'Sin especificar',
              
              claseObra: props.clase_obra || 
                        props.clase || 
                        props.categoria ||
                        'Sin especificar',
              
              budget: props.valor_total || 
                     props.valor_contrato || 
                     props.presupuesto ||
                     props.ppto_base ||
                     0,
              
              name: props.nombre || 
                   props.titulo || 
                   props.nickname ||
                   props.seccion_via ||
                   'Proyecto sin nombre',
            }
            
            allFeatures.push(mappedData)
          }
        })
      }
    })
    
    return allFeatures
  }, [geoJSONData])

  // Crear datos para el mapa con control de visibilidad garantizado
  const mapData = useMemo(() => {
    const result: Record<string, any> = {}
    
    layerConfigs.forEach(config => {
      if (config.visible && geoJSONData[config.id]) {
        result[config.id] = {
          ...geoJSONData[config.id],
          _layerConfig: config // Inyectar configuración directamente en los datos
        }
      }
    })
    
    console.log('🗺️ Datos preparados para el mapa:', {
      configuredLayers: layerConfigs.map(c => ({ id: c.id, visible: c.visible })),
      availableData: Object.keys(geoJSONData),
      resultLayers: Object.keys(result)
    })
    
    return result
  }, [layerConfigs, geoJSONData])

  // Handler para toggle de visibilidad - FORZAR RE-RENDER
  const handleLayerToggle = useCallback((layerId: string) => {
    setLayerConfigs(prev => {
      const newConfigs = prev.map(config => 
        config.id === layerId 
          ? { ...config, visible: !config.visible }
          : config
      )
      
      console.log(`🔄 Toggle capa ${layerId}:`, {
        oldVisible: prev.find(c => c.id === layerId)?.visible,
        newVisible: newConfigs.find(c => c.id === layerId)?.visible,
        allConfigs: newConfigs.map(c => ({ id: c.id, visible: c.visible }))
      })
      
      return newConfigs
    })
  }, [])

  // Handler para actualizar propiedades de capa
  const handleLayerUpdate = useCallback((layerId: string, updates: Partial<LayerConfig>) => {
    setLayerConfigs(prev => {
      const newConfigs = prev.map(config => 
        config.id === layerId 
          ? { ...config, ...updates }
          : config
      )
      
      console.log(`🎨 Actualizar capa ${layerId}:`, updates)
      return newConfigs
    })
  }, [])

  // Handler para clicks en features
  const handleFeatureClick = useCallback((feature: any, layerType: string) => {
    console.log('🎯 Feature clickeado:', { feature, layerType })
    setSelectedFeature(feature)
    
    // Abrir panel izquierdo si está cerrado
    if (!leftPanelOpen) {
      setLeftPanelOpen(true)
    }
  }, [leftPanelOpen])

  // Estados de carga y error
  if (loading) {
    return (
      <div className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Cargando datos del proyecto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-700 dark:text-red-400">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
      style={{ height }}
    >
      <div className="flex h-full">
        
        {/* Panel Izquierdo - Control de Capas */}
        <motion.div
          initial={false}
          animate={{ width: leftPanelOpen ? '320px' : '0px' }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        >
          {leftPanelOpen && (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-800 dark:text-white">Controles del Mapa</h3>
                  </div>
                  <button
                    onClick={() => setLeftPanelOpen(false)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Control de Capas */}
              <div className="flex-1 overflow-y-auto p-3">
                <OptimizedLayerControl
                  layers={layerConfigs}
                  onLayerToggle={handleLayerToggle}
                  onLayerUpdate={handleLayerUpdate}
                />
              </div>

              {/* Panel de Propiedades */}
              {selectedFeature && (
                <div className="border-t border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Propiedades
                      </h4>
                      <button
                        onClick={() => setSelectedFeature(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <PropertiesPanel
                    feature={selectedFeature}
                    layerType="feature"
                    onClose={() => setSelectedFeature(null)}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Toggle Button para Panel Izquierdo */}
        {!leftPanelOpen && (
          <button
            onClick={() => setLeftPanelOpen(true)}
            className="absolute left-4 top-4 z-10 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Área del Mapa */}
        <div className="flex-1 relative">
          <OptimizedMapCore
            data={mapData}
            layerConfigs={layerConfigs}
            onFeatureClick={handleFeatureClick}
            height="100%"
            // Forzar re-render cuando cambien las configuraciones
            key={`map-${layerConfigs.map(c => `${c.id}-${c.visible}-${c.color}-${c.opacity}`).join('-')}`}
          />
        </div>

        {/* Panel Derecho - Métricas */}
        <motion.div
          initial={false}
          animate={{ width: rightPanelOpen ? '300px' : '0px' }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        >
          {rightPanelOpen && (
            <div className="flex-1 flex flex-col">
              {/* Header del panel derecho */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-medium text-gray-800 dark:text-white">Métricas</h3>
                  </div>
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenido del panel derecho */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">

                {/* Selector de tipo de gráfico */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vista</h4>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setActiveChart('gauge')}
                      className={`p-1.5 rounded text-xs transition-colors ${
                        activeChart === 'gauge'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Activity className="w-3 h-3 mx-auto mb-0.5" />
                      Progreso
                    </button>
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
                  </div>
                </div>

                {/* Área de gráficos */}
                <div className="space-y-3">
                  {activeChart === 'gauge' && (
                    <ProgressGaugeChart 
                      data={metricsData} 
                      showStates={true}
                      className="w-full"
                    />
                  )}
                  
                  {activeChart === 'interventions' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                      <h3 className="text-sm font-medium mb-2">Intervenciones</h3>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Total: {metricsData.length} proyectos
                      </div>
                      <InterventionMetrics data={metricsData} />
                    </div>
                  )}
                </div>

                {/* Panel de información básica */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                  <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Estado</h4>
                  <div className="space-y-0.5 text-xs text-blue-700 dark:text-blue-300">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{unidades?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>En Mapa:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{metricsData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capas:</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {layerConfigs.filter(l => l.visible).length}/{layerConfigs.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Toggle Button para Panel Derecho */}
        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="absolute right-4 top-4 z-10 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default OptimizedMapLayout

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Map as MapIcon, 
  Layers, 
  Settings, 
  Eye, 
  EyeOff, 
  ChevronDown,
  ChevronUp,
  Target,
  Maximize2,
  Filter,
  BarChart3
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyecto'

// Importación dinámica del componente del mapa para evitar problemas de SSR
const UniversalMapCore = dynamic(() => import('./UniversalMapCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
      </div>
    </div>
  )
})

interface MapLayerSimple {
  id: string
  name: string
  data: any
  visible: boolean
  opacity: number
  color: string
  icon: string
  type: 'geojson' | 'points'
}

interface SimpleMapInterfaceProps {
  className?: string
  onFeatureClick?: (feature: any, layerId: string) => void
}

const SimpleMapInterface: React.FC<SimpleMapInterfaceProps> = ({
  className = '',
  onFeatureClick
}) => {
  console.log('🗺️ SimpleMapInterface: Iniciando mapa simplificado')

  // Hook para datos de unidades de proyecto
  const { 
    unidadesProyecto, 
    loading: unidadesLoading, 
    error: unidadesError,
    allGeoJSONData
  } = useUnidadesProyecto()

  // Estados locales simples
  const [layersPanelCollapsed, setLayersPanelCollapsed] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [mapKey, setMapKey] = useState(0)

  // Convertir datos GeoJSON a capas simples
  const layers = useMemo<MapLayerSimple[]>(() => {
    if (!allGeoJSONData || Object.keys(allGeoJSONData).length === 0) {
      console.log('⚠️ No hay datos GeoJSON disponibles')
      return []
    }

    const generatedLayers: MapLayerSimple[] = []
    
    Object.entries(allGeoJSONData).forEach(([layerId, data], index) => {
      if (data && data.features && data.features.length > 0) {
        console.log(`📊 Creando capa ${layerId}: ${data.features.length} features`)
        
        // Colores predeterminados para las capas
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
        const color = colors[index % colors.length]
        
        generatedLayers.push({
          id: layerId,
          name: layerId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          data: data,
          visible: true,
          opacity: 0.7,
          color: color,
          icon: '📍',
          type: 'geojson'
        })
      }
    })

    console.log(`✅ ${generatedLayers.length} capas generadas`)
    return generatedLayers
  }, [allGeoJSONData])

  // Callback para clicks en features
  const handleFeatureClick = useCallback((feature: any, layer: any) => {
    console.log('🎯 Feature clickeado:', feature)
    setSelectedFeature(feature)
    
    if (onFeatureClick) {
      onFeatureClick(feature, layer.options?.layerId || layer.id || 'unknown')
    }
  }, [onFeatureClick])

  // Toggle visibilidad de capa
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setMapKey(prev => prev + 1) // Forzar re-render del mapa
  }, [])

  console.log('📊 Estado actual:')
  console.log('  - Capas:', layers.length)
  console.log('  - Cargando:', unidadesLoading)
  console.log('  - Error:', unidadesError)
  console.log('  - Datos GeoJSON:', Object.keys(allGeoJSONData || {}).length)

  return (
    <div className={`relative w-full h-full flex bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Panel lateral izquierdo - Control de capas SIMPLIFICADO */}
      <AnimatePresence>
        {!layersPanelCollapsed && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 top-0 bottom-0 w-80 z-[1000] pointer-events-auto"
          >
            <div className="h-full bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              {/* Header del panel */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Capas del Mapa
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {layers.length} capas cargadas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setLayersPanelCollapsed(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de capas */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: layer.color }}
                        />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {layer.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {layer.data?.features?.length || 0} elementos
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                
                {layers.length === 0 && !unidadesLoading && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay capas disponibles</p>
                  </div>
                )}
                
                {unidadesLoading && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p>Cargando capas...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor principal del mapa */}
      <div className="flex-1 relative">
        {/* Mapa principal */}
        <div className="absolute inset-0">
          {layers.length > 0 ? (
            <UniversalMapCore
              key={mapKey}
              layers={layers}
              onFeatureClick={handleFeatureClick}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                {unidadesLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-400">Cargando datos GeoJSON...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Esto puede tardar unos momentos
                    </p>
                  </>
                ) : unidadesError ? (
                  <>
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className="text-lg text-red-600 dark:text-red-400">Error cargando datos</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      {unidadesError}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 text-6xl mb-4">🗺️</div>
                    <p className="text-lg text-gray-600 dark:text-gray-400">No hay datos disponibles</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      No se encontraron capas para mostrar
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botón flotante para mostrar panel de capas */}
        {layersPanelCollapsed && (
          <div className="absolute left-4 top-4 z-[1001]">
            <button
              onClick={() => setLayersPanelCollapsed(false)}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg rounded-lg p-3 transition-all duration-200 border border-gray-200 dark:border-gray-600"
              title="Mostrar capas"
            >
              <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* Información de la feature seleccionada */}
        {selectedFeature && (
          <div className="absolute top-4 right-4 z-[1001] max-w-sm">
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Propiedades
                </h4>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFeature.properties && Object.entries(selectedFeature.properties).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="font-medium text-gray-600 dark:text-gray-400">{key}:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {String(value).substring(0, 100)}
                      {String(value).length > 100 && '...'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Estado de carga en la parte inferior */}
      {unidadesLoading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1001]">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2 flex items-center gap-3 border border-gray-200 dark:border-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Cargando datos GeoJSON... {Object.keys(allGeoJSONData || {}).length} archivos procesados
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SimpleMapInterface

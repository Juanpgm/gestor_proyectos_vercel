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
import { useUnidadesProyecto, type UnidadProyecto, getUnidadesProyectoStats } from '@/hooks/useUnidadesProyecto'
import useUnifiedLayerManagement from '@/hooks/useUnifiedLayerManagement'
import { type MapLayer } from './UniversalMapCore'
import LayerControlAdvanced from './LayerControlAdvanced'
import PropertiesPanel from './PropertiesPanel'

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

interface UnifiedMapInterfaceProps {
  initialLayersPanelCollapsed?: boolean
  initialPropertiesPanelCollapsed?: boolean
  onFeatureClick?: (feature: any, layerId: string) => void
  className?: string
  showStats?: boolean
}

const UnifiedMapInterface: React.FC<UnifiedMapInterfaceProps> = ({
  initialLayersPanelCollapsed = false,
  initialPropertiesPanelCollapsed = true,
  onFeatureClick,
  className = '',
  showStats = true
}) => {
  console.log('🗺️ UnifiedMapInterface: Renderizando componente de mapa')

  // Hook para datos de unidades de proyecto
  const { 
    unidadesProyecto, 
    loading: unidadesLoading, 
    error: unidadesError,
    allGeoJSONData,
    loadingStates
  } = useUnidadesProyecto()

  // Hook para manejo unificado de capas
  const {
    layers,
    activeBaseMap,
    updateLayer,
    toggleLayerVisibility,
    updateLayerData,
    getFilteredData,
    updateFilters,
    clearFilters,
    updateBaseMap,
    resetLayersToDefault,
    stats
  } = useUnifiedLayerManagement()

  // Estados del mapa y paneles
  const [layersPanelCollapsed, setLayersPanelCollapsed] = useState(initialLayersPanelCollapsed)
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(initialPropertiesPanelCollapsed)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [selectedLayerType, setSelectedLayerType] = useState<string>('')

  // Estado para forzar re-render del mapa
  const [mapKey, setMapKey] = useState(0)

  // Actualizar datos de capas cuando se cargan los GeoJSON
  useEffect(() => {
    if (allGeoJSONData && Object.keys(allGeoJSONData).length > 0) {
      console.log('🔄 Actualizando capas con datos GeoJSON:', Object.keys(allGeoJSONData))
      
      Object.entries(allGeoJSONData).forEach(([layerId, data]) => {
        if (data && data.features && data.features.length > 0) {
          console.log(`📊 Capa ${layerId}: ${data.features.length} features`)
          updateLayerData(layerId, data)
        }
      })
    }
  }, [allGeoJSONData, updateLayerData])

  // Callbacks del mapa
  const handleFeatureClick = useCallback((feature: any, layer: any) => {
    console.log('🎯 Feature clickeado:', feature)
    setSelectedFeature(feature)
    setSelectedLayerType(layer.options?.layerId || layer.id || 'unknown')
    
    if (onFeatureClick) {
      onFeatureClick(feature, layer.options?.layerId || layer.id || 'unknown')
    }
  }, [onFeatureClick])

  // Memoizar capas filtradas para optimización
  const memoizedLayers = useMemo(() => {
    console.log('🔄 Recalculando capas memoizadas')
    return layers.map(layer => {
      const filteredData = getFilteredData(layer.id)
      return {
        ...layer,
        data: filteredData
      }
    })
  }, [layers, getFilteredData])

  // Memoizar datos estadísticos
  const memoizedStats = useMemo(() => {
    if (!showStats) return null
    return getUnidadesProyectoStats(unidadesProyecto)
  }, [unidadesProyecto, showStats])

  console.log('📊 Estado actual de capas:', layers.length)
  console.log('🗃️ Datos GeoJSON disponibles:', Object.keys(allGeoJSONData || {}).length)

  return (
    <div className={`relative w-full h-full flex bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Panel lateral izquierdo - Control de capas */}
      <AnimatePresence>
        {!layersPanelCollapsed && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute left-0 top-0 bottom-0 w-80 z-[1000] pointer-events-auto"
          >
            <div className="h-full bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              {/* Header del panel */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Control de Capas
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {layers.length} capas disponibles
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

              {/* Control de capas avanzado */}
              <div className="flex-1 overflow-hidden">
                <LayerControlAdvanced
                  layers={memoizedLayers}
                  activeBaseMap={activeBaseMap}
                  onToggleLayer={toggleLayerVisibility}
                  onUpdateBaseMap={updateBaseMap}
                  onUpdateFilters={updateFilters}
                  onClearFilters={clearFilters}
                  onResetLayers={resetLayersToDefault}
                  stats={stats}
                  loadingStates={loadingStates}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor principal del mapa */}
      <div className="flex-1 relative">
        {/* Mapa principal */}
        <div className="absolute inset-0">
          <UniversalMapCore
            key={mapKey}
            layers={memoizedLayers}
            activeBaseMap={activeBaseMap}
            onFeatureClick={handleFeatureClick}
            className="w-full h-full"
          />
        </div>

        {/* Botón flotante para mostrar panel de capas */}
        {layersPanelCollapsed && (
          <div className="absolute left-4 top-4 z-[1001]">
            <button
              onClick={() => setLayersPanelCollapsed(false)}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg rounded-lg p-3 transition-all duration-200 border border-gray-200 dark:border-gray-600"
              title="Mostrar panel de capas"
            >
              <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* Botón flotante para panel de propiedades */}
        {propertiesPanelCollapsed && selectedFeature && (
          <div className="absolute right-4 top-4 z-[1001]">
            <button
              onClick={() => setPropertiesPanelCollapsed(false)}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg rounded-lg p-3 transition-all duration-200 border border-gray-200 dark:border-gray-600"
              title="Mostrar propiedades"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Panel lateral derecho - Propiedades */}
      <AnimatePresence>
        {!propertiesPanelCollapsed && selectedFeature && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute right-0 top-0 bottom-0 w-96 z-[1000] pointer-events-auto"
          >
            <div className="h-full bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 overflow-hidden">
              <PropertiesPanel
                feature={selectedFeature}
                layerType={selectedLayerType}
                onClose={() => setPropertiesPanelCollapsed(true)}
                stats={memoizedStats}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de estado de carga */}
      {unidadesLoading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1001]">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2 flex items-center gap-3 border border-gray-200 dark:border-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Cargando datos GeoJSON...
            </span>
          </div>
        </div>
      )}

      {/* Mostrar errores si existen */}
      {unidadesError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1001]">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 max-w-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              Error cargando datos: {unidadesError}
            </p>
          </div>
        </div>
      )}

      {/* Estadísticas flotantes (opcional) */}
      {showStats && memoizedStats && (
        <div className="absolute bottom-4 right-4 z-[1001]">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Total proyectos: {memoizedStats.total}</div>
              <div>En ejecución: {memoizedStats.enEjecucion}</div>
              <div>Completados: {memoizedStats.completados}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedMapInterface

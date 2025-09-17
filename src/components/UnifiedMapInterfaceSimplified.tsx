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
import AdvancedLayerManager from './AdvancedLayerManager'
import PropertiesPanel from './PropertiesPanel'

// Importación dinámica del componente del mapa para evitar problemas de SSR
const UniversalMapCore = dynamic(() => import('./UniversalMapCore'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
      </div>
    </div>
  )
})

interface UnifiedMapInterfaceProps {
  className?: string
  initialLayersPanelCollapsed?: boolean
  initialPropertiesPanelCollapsed?: boolean
  enablePanels?: boolean
  showStats?: boolean
}

export default function UnifiedMapInterface({ 
  className = '',
  initialLayersPanelCollapsed = true,
  initialPropertiesPanelCollapsed = true,
  enablePanels = true,
  showStats = false
}: UnifiedMapInterfaceProps) {
  // Estados del componente
  const [layersPanelCollapsed, setLayersPanelCollapsed] = useState(initialLayersPanelCollapsed)
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(initialPropertiesPanelCollapsed)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [selectedLayerType, setSelectedLayerType] = useState<string>('')
  const [mapKey, setMapKey] = useState(0)

  // Hook para gestión unificada de capas
  const {
    layers,
    updateLayer,
    resetLayersToDefault,
    toggleLayerVisibility,
    layerFilters,
    updateFilters,
    clearFilters
  } = useUnifiedLayerManagement()

  // Hook para datos de unidades de proyecto
  const { 
    unidadesProyecto, 
    loading: unidadesLoading, 
    error: unidadesError 
  } = useUnidadesProyecto()

  // Configuración del mapa base
  const baseMapConfig = {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }

  // Cálculo de estadísticas memorizadas
  const memoizedStats = useMemo(() => {
    if (!unidadesProyecto?.length) return null
    return getUnidadesProyectoStats()
  }, [unidadesProyecto])

  // Capas memorizadas para evitar re-renders innecesarios
  const memoizedLayers = useMemo(() => {
    // Convertir LayerConfig a MapLayer para el mapa
    const mapLayers: MapLayer[] = layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      type: layer.type,
      visible: layer.visible,
      data: layer.data || { type: 'FeatureCollection', features: [] },
      style: {
        fillColor: layer.color,
        color: layer.color,
        weight: 2,
        opacity: layer.opacity,
        fillOpacity: layer.opacity * 0.6
      }
    }))

    if (!unidadesProyecto?.length) return mapLayers

    // Crear capa de unidades de proyecto
    const unidadesLayer: MapLayer = {
      id: 'unidades-proyecto',
      name: 'Unidades de Proyecto',
      type: 'geojson',
      visible: true,
      data: {
        type: 'FeatureCollection',
        features: unidadesProyecto.map((unidad: UnidadProyecto) => ({
          type: 'Feature',
          properties: {
            ...unidad,
            layerType: 'unidades-proyecto'
          },
          geometry: unidad.geometry
        }))
      },
      style: {
        fillColor: '#3B82F6',
        color: '#1E40AF',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6
      }
    }

    return mapLayers.map(layer => 
      layer.id === 'unidades-proyecto' ? unidadesLayer : layer
    )
  }, [layers, unidadesProyecto])

  // Manejo de clicks en features del mapa
  const handleFeatureClick = useCallback((feature: any, layerType: string) => {
    setSelectedFeature(feature)
    setSelectedLayerType(layerType)
    if (enablePanels) {
      setPropertiesPanelCollapsed(false)
    }
  }, [enablePanels])

  // Función para refrescar el mapa
  const refreshMap = useCallback(() => {
    setMapKey(prev => prev + 1)
  }, [])

  // Efectos
  useEffect(() => {
    if (unidadesError) {
      console.error('Error cargando unidades de proyecto:', unidadesError)
    }
  }, [unidadesError])

  return (
    <div className={`flex h-full relative bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Panel lateral izquierdo - Capas */}
      <AnimatePresence>
        {enablePanels && !layersPanelCollapsed && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute left-0 top-0 bottom-0 w-96 z-[1000] pointer-events-auto"
          >
            <div className="h-full bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header del panel */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Gestión de Capas
                  </h3>
                </div>
                <button
                  onClick={() => setLayersPanelCollapsed(true)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Ocultar panel"
                >
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Control de capas avanzado */}
              <div className="flex-1 overflow-hidden">
                <AdvancedLayerManager
                  layers={layers}
                  onLayerUpdate={updateLayer}
                  onToggleVisibility={toggleLayerVisibility}
                  filters={layerFilters}
                  onFiltersChange={updateFilters}
                  onClearFilters={clearFilters}
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
            baseMapUrl={baseMapConfig.url}
            baseMapAttribution={baseMapConfig.attribution}
            onFeatureClick={handleFeatureClick}
            height="100%"
          />
        </div>

        {/* Botón flotante para mostrar panel de capas */}
        {enablePanels && layersPanelCollapsed && (
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
        {enablePanels && propertiesPanelCollapsed && selectedFeature && (
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
        {enablePanels && !propertiesPanelCollapsed && selectedFeature && (
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
              <div>Total unidades: {memoizedStats.totalUnidades}</div>
              <div>Total archivos: {memoizedStats.totalGeoJSONFiles}</div>
              <div>Cache: {memoizedStats.cacheSize} items</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
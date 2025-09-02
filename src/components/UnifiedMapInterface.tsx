'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Map as MapIcon, 
  Layers, 
  Settings, 
  Eye, 
  EyeOff, 
  Palette,
  ChevronDown,
  ChevronUp,
  Target,
  Maximize2,
  Filter,
  BarChart3
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useUnidadesProyecto, type UnidadProyecto, getUnidadesProyectoStats } from '@/hooks/useUnidadesProyectoWorking'
import { useMapDataFix } from '@/hooks/useMapDataFix'
import useUnifiedLayerManagement from '@/hooks/useUnifiedLayerManagement'
import { type MapLayer } from './UniversalMapCore'
import LayerControlAdvanced from './LayerControlAdvanced'
import PropertiesPanel from './PropertiesPanel'
import { useLayerSymbology } from '@/hooks/useLayerSymbology'
import LayerSymbologyModal from './LayerSymbologyModal'
import { useTheme } from '@/context/ThemeContext'

// Importación dinámica del componente del mapa para evitar problemas de SSR
const UniversalMapCore = dynamic(() => import('./UniversalMapCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
      </div>
    </div>
  )
})

import { CALI_COORDINATES } from '@/utils/coordinateUtils'

// Base maps configuration
const baseMaps = {
  light: {
    name: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  dark: {
    name: 'Carto Dark',  
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  satellite: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
  }
}

interface UnifiedMapInterfaceProps {
  className?: string
  height?: string
  selectedProjectUnitFromTable?: UnidadProyecto | null
  onFeatureClick?: (feature: any, layerType: string) => void
  enablePanels?: boolean
  initialLayersPanelCollapsed?: boolean
  initialPropertiesPanelCollapsed?: boolean
}

const UnifiedMapInterface: React.FC<UnifiedMapInterfaceProps> = ({
  className = '',
  height = '800px',
  selectedProjectUnitFromTable,
  onFeatureClick,
  enablePanels = true,
  initialLayersPanelCollapsed = false,
  initialPropertiesPanelCollapsed = true
}) => {
  // Hook para obtener datos GeoJSON con mejoras integradas
  const unidadesState = useUnidadesProyecto()
  const { allGeoJSONData, loading, error } = unidadesState

  // TEMPORAL: Hook de fix para bypasear problema de hidratación
  const mapDataFix = useMapDataFix()
  
  console.log('🗺️ UnifiedMapInterface: Estado de datos:', {
    loading,
    error,
    geoJSONKeys: allGeoJSONData ? Object.keys(allGeoJSONData) : [],
    features: allGeoJSONData ? Object.values(allGeoJSONData).reduce((sum, data: any) => sum + (data?.features?.length || 0), 0) : 0
  })

  console.log('🔧 UnifiedMapInterface: Fix data:', {
    fixLoading: mapDataFix.loading,
    fixError: mapDataFix.error,
    fixDataKeys: mapDataFix.allGeoJSONData ? Object.keys(mapDataFix.allGeoJSONData) : [],
    fixFeatures: mapDataFix.allGeoJSONData ? Object.values(mapDataFix.allGeoJSONData).reduce((sum, data: any) => sum + (data?.features?.length || 0), 0) : 0
  })

  // Usar datos del fix si están disponibles y los datos principales no están cargados
  const finalGeoJSONData = (!loading && allGeoJSONData && Object.keys(allGeoJSONData).length > 0) 
    ? allGeoJSONData 
    : mapDataFix.allGeoJSONData
  const finalLoading = loading && mapDataFix.loading
  const finalError = error || mapDataFix.error

  // Hook para gestión unificada de capas
  const {
    layers,
    layerFilters,
    baseMapConfig,
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

  // Hook para el tema actual
  const { theme } = useTheme()

  // Hook para simbología personalizada
  const { 
    getFeatureStyle, 
    updateLayerSymbology, 
    resetLayerSymbology,
    symbologyState,
    lastUpdateTimestamp
  } = useLayerSymbology()

  // Estados del mapa y paneles
  const [layersPanelCollapsed, setLayersPanelCollapsed] = useState(initialLayersPanelCollapsed)
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(initialPropertiesPanelCollapsed)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [selectedLayerType, setSelectedLayerType] = useState<string>('')
  const [symbologyModalOpen, setSymbologyModalOpen] = useState(false)
  const [selectedLayerForSymbology, setSelectedLayerForSymbology] = useState<string>('')

  // Estado para forzar re-render del mapa cuando cambie la simbología
  const [mapKey, setMapKey] = useState(0)

  // Efecto para adaptar el mapa base al tema actual
  useEffect(() => {
    const getThemeBasedBaseMap = () => {
      // Si el tema es 'system', detectar el tema del sistema
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        return systemTheme
      }
      return theme
    }

    const currentTheme = getThemeBasedBaseMap()
    console.log('🎨 UnifiedMapInterface: Adaptando mapa al tema:', currentTheme)
    
    // Cambiar automáticamente el mapa base según el tema
    const baseMap = baseMaps[currentTheme as keyof typeof baseMaps]
    if (baseMap && baseMapConfig.type !== currentTheme) {
      console.log('🗺️ UnifiedMapInterface: Cambiando mapa base a:', currentTheme)
      updateBaseMap(currentTheme, baseMap.url, baseMap.attribution)
      
      // Forzar re-render del mapa para aplicar el cambio inmediatamente
      setMapKey(prev => prev + 1)
    }
  }, [theme, updateBaseMap, baseMapConfig.type])

  // Actualizar datos de capas cuando se cargan los GeoJSON
  useEffect(() => {
    if (finalGeoJSONData && Object.keys(finalGeoJSONData).length > 0) {
      console.log('🔄 Actualizando datos de capas con:', Object.keys(finalGeoJSONData))
      Object.entries(finalGeoJSONData).forEach(([key, data]) => {
        updateLayerData(key, data)
      })
    }
  }, [finalGeoJSONData, updateLayerData])

  // Manejar selección desde la tabla
  useEffect(() => {
    if (selectedProjectUnitFromTable) {
      const artificialFeature = {
        type: 'Feature',
        properties: {
          ...selectedProjectUnitFromTable,
          bpin: selectedProjectUnitFromTable.bpin,
          nickname: selectedProjectUnitFromTable.name,
          estado_unidad_proyecto: selectedProjectUnitFromTable.status,
          usuarios_beneficiarios: selectedProjectUnitFromTable.beneficiaries,
        },
        geometry: {
          type: 'Point',
          coordinates: [selectedProjectUnitFromTable.lng || 0, selectedProjectUnitFromTable.lat || 0]
        }
      }
      
      setSelectedFeature(artificialFeature)
      setSelectedLayerType('unidad_proyecto_desde_tabla')
      setPropertiesPanelCollapsed(false)
    }
  }, [selectedProjectUnitFromTable])

  // Convertir configuración de capas a formato de UniversalMapCore
  const mapLayers: MapLayer[] = useMemo(() => {
    return layers.map(layer => {
      // Obtener datos filtrados
      const filteredData = getFilteredData(layer.id)
      
      return {
        id: layer.id,
        name: layer.name,
        data: filteredData || layer.data,
        visible: layer.visible,
        type: layer.type,
        color: layer.color,
        opacity: layer.opacity,
        representationMode: layer.representationMode,
        style: {
          weight: 2,
          opacity: layer.opacity,
          fillOpacity: layer.opacity * 0.7,
          color: layer.color,
          fillColor: layer.color
        }
      }
    })
  }, [layers, getFilteredData, mapKey, lastUpdateTimestamp])

  const openSymbologyModal = useCallback((layerId: string) => {
    setSelectedLayerForSymbology(layerId)
    setSymbologyModalOpen(true)
  }, [])

  const closeSymbologyModal = useCallback(() => {
    setSymbologyModalOpen(false)
    setSelectedLayerForSymbology('')
  }, [])

  // Manejar click en features del mapa
  const handleFeatureClick = useCallback((feature: any, layer: any) => {
    setSelectedFeature(feature)
    setSelectedLayerType(layer.options?.layerId || layer.id || 'unknown')
    setPropertiesPanelCollapsed(false)
    
    if (onFeatureClick) {
      onFeatureClick(feature, layer.options?.layerId || layer.id || 'unknown')
    }
  }, [onFeatureClick])

  // Aplicar cambios de simbología con re-render garantizado del mapa
  const handleApplySymbologyChanges = useCallback((layerId: string) => {
    console.log(`🎨 Aplicando cambios de simbología para: ${layerId}`)
    console.log('🔍 Estado actual de simbología:', symbologyState)
    
    // 1. Forzar re-render del mapa incrementando la key
    setMapKey(prev => {
      const newKey = prev + 1
      console.log(`🔄 Cambiando mapKey de ${prev} a ${newKey}`)
      return newKey
    })
    
    // 2. Actualizar la capa con timestamp
    const timestamp = Date.now()
    updateLayer(layerId, {
      lastUpdated: timestamp
    })
    console.log(`⏰ Actualizando capa con timestamp: ${timestamp}`)
    
    // 3. Refrescar datos de la capa para asegurar propagación
    const layerData = layers.find(l => l.id === layerId)?.data
    if (layerData) {
      updateLayerData(layerId, layerData)
    }
    
    console.log(`✅ Simbología aplicada y mapa completamente actualizado para: ${layerId}`)
    
    // 4. Cerrar modal automáticamente
    closeSymbologyModal()
  }, [updateLayer, updateLayerData, layers, closeSymbologyModal, symbologyState])

  if (finalLoading) {
    const stats = getUnidadesProyectoStats()
    
    return (
      <div className={`${className} relative`} style={{ height }}>
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando mapa y datos...</p>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-500">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 max-w-sm mx-auto">
                <div className="text-blue-700 dark:text-blue-400 font-medium mb-2">
                  ⚡ Sistema Mejorado
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>• Cache inteligente: {stats.cacheSize} archivos</div>
                  <div>• Carga sin duplicaciones</div>
                  <div>• Timeout de 30s por archivo</div>
                  <div>• Sistema de listeners reactivo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (finalError) {
    return (
      <div className={`${className} relative`} style={{ height }}>
        <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-800">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 mb-4">Error cargando datos del mapa</p>
            <p className="text-red-500 text-sm">{finalError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden`} style={{ height }}>
      <div className="flex h-full">
        {/* Panel Izquierdo - Gestión de Capas */}
        {enablePanels && (
          <AnimatePresence>
            {!layersPanelCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-r border-gray-200 dark:border-gray-700 flex flex-col"
              >
                {/* Header del Panel de Capas */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Gestión de Capas
                      </h3>
                    </div>
                    <button
                      onClick={() => setLayersPanelCollapsed(true)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Ocultar panel"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>



                {/* Control Avanzado de Capas */}
                <div className="flex-1 overflow-hidden">
                  <LayerControlAdvanced
                    layers={layers}
                    onLayerUpdate={updateLayer}
                    onToggleVisibility={toggleLayerVisibility}
                    onOpenSymbology={openSymbologyModal}
                    filters={layerFilters}
                    onFiltersChange={updateFilters}
                    onClearFilters={clearFilters}
                    stats={stats}
                    onResetLayers={resetLayersToDefault}
                    className="h-full border-0 rounded-none shadow-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Botón para mostrar panel de capas cuando está oculto */}
        {enablePanels && layersPanelCollapsed && (
          <div className="absolute top-4 left-4 z-[1001]">
            <button
              onClick={() => setLayersPanelCollapsed(false)}
              className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Mostrar gestión de capas"
            >
              <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* Área Central - Mapa con Key para forzar re-render */}
        <div className="flex-1 relative">
          <UniversalMapCore
            key={mapKey}
            layers={mapLayers}
            baseMapUrl={baseMapConfig.url}
            baseMapAttribution={baseMapConfig.attribution}
            height="100%"
            onFeatureClick={handleFeatureClick}
            enableFullscreen={true}
            enableCenterView={true}
            enableLayerControls={false}
          />
          
          {/* Indicador visual cuando se aplican cambios de simbología */}
          <AnimatePresence>
            {symbologyModalOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 right-4 z-[1002] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Configurando Simbología</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panel Derecho - Propiedades */}
        {enablePanels && (
          <AnimatePresence>
            {!propertiesPanelCollapsed && selectedFeature && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 350, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700"
              >
                <div className="h-full flex flex-col">
                  {/* Header del Panel de Propiedades */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          Propiedades
                        </h3>
                      </div>
                      <button
                        onClick={() => setPropertiesPanelCollapsed(true)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Ocultar propiedades"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido de Propiedades */}
                  <div className="flex-1 overflow-y-auto">
                    <PropertiesPanel
                      feature={selectedFeature}
                      layerType={selectedLayerType}
                      className="h-full"
                      onClose={() => setPropertiesPanelCollapsed(true)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Botón para mostrar propiedades cuando está oculto */}
        {enablePanels && propertiesPanelCollapsed && selectedFeature && (
          <div className="absolute top-4 right-4 z-[1001]">
            <button
              onClick={() => setPropertiesPanelCollapsed(false)}
              className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Mostrar propiedades"
            >
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Modal de Simbología */}
      {selectedLayerForSymbology && (
        <LayerSymbologyModal
          isOpen={symbologyModalOpen}
          onClose={closeSymbologyModal}
          layerId={selectedLayerForSymbology}
          layerName={layers.find(l => l.id === selectedLayerForSymbology)?.name || ''}
          layerData={layers.find(l => l.id === selectedLayerForSymbology)?.data}
          layerConfig={layers.find(l => l.id === selectedLayerForSymbology)}
          onApplyChanges={handleApplySymbologyChanges}
        />
      )}
    </div>
  )
}

export default UnifiedMapInterface

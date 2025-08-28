'use client'

import React, { useState, useCallback } from 'react'
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
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
}

export interface UnifiedMapInterfaceProps {
  className?: string
  height?: string
  selectedProjectUnitFromTable?: any
  onFeatureClick?: (feature: any, layerType: string) => void
  enablePanels?: boolean
  initialLayersPanelCollapsed?: boolean
  initialPropertiesPanelCollapsed?: boolean
}

export default function FixedMapInterface({
  className = '',
  height = '600px',
  selectedProjectUnitFromTable,
  onFeatureClick,
  enablePanels = true,
  initialLayersPanelCollapsed = false,
  initialPropertiesPanelCollapsed = true,
}: UnifiedMapInterfaceProps) {
  
  // Estados básicos del mapa
  const [currentBaseMap, setCurrentBaseMap] = useState('light')
  const [layersPanelOpen, setLayersPanelOpen] = useState(!initialLayersPanelCollapsed)
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(!initialPropertiesPanelCollapsed)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [mapCenter, setMapCenter] = useState(CALI_COORDINATES)
  const [mapZoom, setMapZoom] = useState(12)

  // Manejo de clics en features
  const handleFeatureClick = useCallback((feature: any, layerType: string) => {
    console.log('🗺️ FIXED MAP: Feature clicked:', feature, 'Layer:', layerType)
    setSelectedFeature(feature)
    setPropertiesPanelOpen(true)
    onFeatureClick?.(feature, layerType)
  }, [onFeatureClick])

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      {/* Mapa principal */}
      <div className="absolute inset-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <UniversalMapCore
          center={mapCenter}
          zoom={mapZoom}
          baseMapUrl={baseMaps[currentBaseMap as keyof typeof baseMaps].url}
          attribution={baseMaps[currentBaseMap as keyof typeof baseMaps].attribution}
          onFeatureClick={handleFeatureClick}
          height={height}
          // Este componente tiene su propia lógica de carga de datos
          directDataLoad={true}
        />
      </div>

      {/* Panel de Capas */}
      {enablePanels && (
        <AnimatePresence>
          {layersPanelOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-4 left-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Layers className="w-5 h-5 mr-2" />
                    Capas del Mapa
                  </h3>
                  <button
                    onClick={() => setLayersPanelOpen(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Control de mapa base */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mapa Base
                  </label>
                  <select
                    value={currentBaseMap}
                    onChange={(e) => setCurrentBaseMap(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {Object.entries(baseMaps).map(([key, map]) => (
                      <option key={key} value={key}>
                        {map.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    🔧 Mapa con carga directa de datos
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                    Este mapa omite los hooks problemáticos y carga los datos directamente.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Panel de Propiedades */}
      {enablePanels && (
        <AnimatePresence>
          {propertiesPanelOpen && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Propiedades
                  </h3>
                  <button
                    onClick={() => setPropertiesPanelOpen(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>

                {selectedFeature ? (
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {selectedFeature.properties?.name || selectedFeature.properties?.NOMBRE || 'Objeto seleccionado'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedFeature.properties || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                          <span className="text-gray-800 dark:text-gray-200">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Haz clic en un objeto del mapa para ver sus propiedades.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Controles flotantes */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        {enablePanels && (
          <>
            <button
              onClick={() => setLayersPanelOpen(!layersPanelOpen)}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Alternar panel de capas"
            >
              <Layers className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              onClick={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Alternar panel de propiedades"
            >
              <BarChart3 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

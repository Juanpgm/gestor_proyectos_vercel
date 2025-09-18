'use client'

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, useMap } from 'react-leaflet'
import { Layers, Eye, EyeOff, Target, Maximize2, Minimize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { CALI_COORDINATES } from '@/utils/coordinateUtils'
import { useMapData, type MapLayer, type MapFeature } from '@/hooks/useMapData'

/**
 * =============================================
 * MAPA DINÁMICO UNIFICADO
 * =============================================
 * 
 * Componente único que reemplaza todos los demás mapas.
 * Características:
 * - Programación funcional pura
 * - Controles React nativos (no DOM manipulation)
 * - Estado unificado con useMapData
 * - Interactividad mejorada
 * - Responsive y accesible
 */

// ===== TIPOS =====
export interface DynamicMapProps {
  height?: string
  className?: string
  onFeatureClick?: (feature: MapFeature, layer: MapLayer) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
  showControls?: boolean
  showLayerPanel?: boolean
  theme?: 'light' | 'dark' | 'auto'
  initialCenter?: [number, number]
  initialZoom?: number
  enableFiltering?: boolean
}

// ===== COMPONENTES AUXILIARES =====

/**
 * Hook para detectar el tema actual
 */
const useTheme = (themeProp?: 'light' | 'dark' | 'auto') => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    if (themeProp === 'light' || themeProp === 'dark') {
      console.log('🎨 Tema fijo configurado:', themeProp)
      setCurrentTheme(themeProp)
      return
    }

    // Auto detectar tema del sistema
    const detectTheme = () => {
      if (typeof window !== 'undefined') {
        const isDarkClass = document.documentElement.classList.contains('dark')
        const isDarkMedia = window.matchMedia('(prefers-color-scheme: dark)').matches
        const isDark = isDarkClass || isDarkMedia
        
        console.log('🎨 Detectando tema:', { 
          isDarkClass, 
          isDarkMedia, 
          isDark, 
          classList: Array.from(document.documentElement.classList) 
        })
        
        setCurrentTheme(isDark ? 'dark' : 'light')
      }
    }

    detectTheme()

    // Observar cambios en el tema
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          console.log('🎨 Cambio de clase detectado en html')
          detectTheme()
        }
      })
    })
    
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })
    }

    // Escuchar cambios en preferencias del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      console.log('🎨 Cambio en prefers-color-scheme detectado')
      detectTheme()
    }
    
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [themeProp])

  console.log('🎨 Hook useTheme - Tema actual:', currentTheme)
  return currentTheme
}

/**
 * Obtener configuración de tiles según el tema
 */
const getTileConfig = (theme: 'light' | 'dark') => {
  console.log('🗺️ Obteniendo configuración de tiles para tema:', theme)
  
  if (theme === 'dark') {
    return {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  }
  
  return {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
}

/**
 * Configuración del mapa
 */
const MapConfiguration: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
  const map = useMap()
  
  useEffect(() => {
    if (map) {
      // Configurar mapa para mejor performance
      map.options.preferCanvas = false // SVG para mejor interactividad
      map.options.maxZoom = 18
      map.options.minZoom = 8
      
      // Configurar iconos de Leaflet - No necesarios para puntos
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })
    }
  }, [map, theme])
  
  return null
}

/**
 * Controles flotantes del mapa
 */
const MapControls: React.FC<{
  onToggleFullscreen: () => void
  onCenterView: () => void
  onToggleLayerPanel: () => void
  isFullscreen: boolean
  layerPanelOpen: boolean
}> = ({ onToggleFullscreen, onCenterView, onToggleLayerPanel, isFullscreen, layerPanelOpen }) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Botón pantalla completa */}
      <motion.button
        onClick={onToggleFullscreen}
        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </motion.button>

      {/* Botón centrar vista */}
      <motion.button
        onClick={onCenterView}
        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Centrar vista en Cali"
      >
        <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </motion.button>

      {/* Botón panel de capas */}
      <motion.button
        onClick={onToggleLayerPanel}
        className={`w-10 h-10 rounded-lg shadow-lg border flex items-center justify-center transition-colors ${
          layerPanelOpen 
            ? 'bg-blue-500 border-blue-500 text-white' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Panel de capas"
      >
        <Layers className="w-5 h-5" />
      </motion.button>
    </div>
  )
}

/**
 * Panel de filtros simplificado para comunas y barrios
 */
const SimpleFiltersPanel: React.FC<{
  layer: MapLayer
  onFilterChange: (layerId: string, filters: Record<string, any>) => void
}> = ({ layer, onFilterChange }) => {
  const [selectedComuna, setSelectedComuna] = useState<string>('')
  const [selectedBarrio, setSelectedBarrio] = useState<string>('')

  // Obtener comunas y barrios únicos
  const { comunas, barrios } = useMemo(() => {
    if (!layer.data?.features.length) return { comunas: [], barrios: [] }
    
    const comunasSet = new Set<string>()
    const barriosSet = new Set<string>()
    
    layer.data.features.forEach(feature => {
      const props = feature.properties
      if (props) {
        // Buscar propiedades que contengan 'comuna' o 'barrio'
        Object.keys(props).forEach(key => {
          const lowerKey = key.toLowerCase()
          const value = props[key]
          
          if (value && typeof value === 'string') {
            if (lowerKey.includes('comuna')) {
              comunasSet.add(value)
            } else if (lowerKey.includes('barrio') || lowerKey.includes('neighborhood')) {
              barriosSet.add(value)
            }
          }
        })
      }
    })
    
    return {
      comunas: Array.from(comunasSet).sort(),
      barrios: Array.from(barriosSet).sort()
    }
  }, [layer.data])

  // Aplicar filtros cuando cambien los selectores
  useEffect(() => {
    const filters: Record<string, any> = {}
    
    if (selectedComuna) {
      // Buscar el campo de comuna en las propiedades
      const sampleFeature = layer.data?.features.find(f => f.properties)
      if (sampleFeature?.properties) {
        const comunaField = Object.keys(sampleFeature.properties).find(key => 
          key.toLowerCase().includes('comuna')
        )
        if (comunaField) {
          filters[comunaField] = selectedComuna
        }
      }
    }
    
    if (selectedBarrio) {
      // Buscar el campo de barrio en las propiedades
      const sampleFeature = layer.data?.features.find(f => f.properties)
      if (sampleFeature?.properties) {
        const barrioField = Object.keys(sampleFeature.properties).find(key => 
          key.toLowerCase().includes('barrio') || key.toLowerCase().includes('neighborhood')
        )
        if (barrioField) {
          filters[barrioField] = selectedBarrio
        }
      }
    }
    
    onFilterChange(layer.id, filters)
  }, [selectedComuna, selectedBarrio, layer.id, layer.data, onFilterChange])

  const handleReset = () => {
    setSelectedComuna('')
    setSelectedBarrio('')
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filtros por Ubicación
        </h4>
        {(selectedComuna || selectedBarrio) && (
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Selector de Comuna */}
        {comunas.length > 0 && (
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Comuna:
            </label>
            <select
              value={selectedComuna}
              onChange={(e) => setSelectedComuna(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="">Todas las comunas</option>
              {comunas.map(comuna => (
                <option key={comuna} value={comuna}>{comuna}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Selector de Barrio */}
        {barrios.length > 0 && (
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Barrio:
            </label>
            <select
              value={selectedBarrio}
              onChange={(e) => setSelectedBarrio(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="">Todos los barrios</option>
              {barrios.map(barrio => (
                <option key={barrio} value={barrio}>{barrio}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {comunas.length === 0 && barrios.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          No se encontraron campos de comuna o barrio en esta capa
        </p>
      )}
    </div>
  )
}

const LayerControlPanel: React.FC<{
  layers: MapLayer[]
  onToggleLayer: (layerId: string) => void
  onOpacityChange: (layerId: string, opacity: number) => void
  onFilterChange?: (layerId: string, filters: Record<string, any>) => void
  stats: { totalFeatures: number; loadedLayers: number; visibleLayers: number }
  enableFiltering?: boolean
}> = ({ layers, onToggleLayer, onOpacityChange, onFilterChange, stats, enableFiltering = false }) => {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="absolute top-4 left-4 z-[1000] w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Control de Capas
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.visibleLayers} de {stats.loadedLayers} capas visibles
            </p>
          </div>
        </div>
      </div>

      {/* Lista de capas */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              layer.visible
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
            }`}
          >
            {/* Control principal de la capa */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 transition-all duration-200"
                  style={{
                    backgroundColor: layer.visible ? layer.color : 'transparent',
                    borderColor: layer.color
                  }}
                />
                <div>
                  <span className={`font-medium text-sm ${
                    layer.visible 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {layer.name}
                  </span>
                  {layer.data && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {layer.data.features.length} elementos
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => onToggleLayer(layer.id)}
                className={`p-1 rounded transition-colors ${
                  layer.visible
                    ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'
                }`}
              >
                {layer.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Control de opacidad */}
            {layer.visible && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Opacidad
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={layer.opacity}
                  onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer opacity-slider"
                  style={{
                    background: `linear-gradient(to right, ${layer.color}20 0%, ${layer.color} 100%)`
                  }}
                />
              </div>
            )}

            {/* Estado de carga */}
            {layer.loading && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-600 dark:text-blue-400">Cargando...</span>
              </div>
            )}

            {/* Error */}
            {layer.error && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                ⚠️ {layer.error}
              </div>
            )}

            {/* Panel de filtros */}
            {layer.visible && enableFiltering && onFilterChange && (
              <SimpleFiltersPanel
                layer={layer}
                onFilterChange={onFilterChange}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer con estadísticas */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Total elementos:</span>
            <span className="font-medium">{stats.totalFeatures.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Capas cargadas:</span>
            <span className="font-medium">{stats.loadedLayers}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ===== COMPONENTE PRINCIPAL =====
const DynamicMap: React.FC<DynamicMapProps> = ({
  height = '600px',
  className = '',
  onFeatureClick,
  onLayerToggle,
  showControls = true,
  showLayerPanel = false,
  theme = 'auto',
  initialCenter = CALI_COORDINATES.CENTER_LAT_LNG,
  initialZoom = CALI_COORDINATES.DEFAULT_ZOOM,
  enableFiltering = false
}) => {
  // ===== ESTADO =====
  const mapRef = useRef<L.Map | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layerPanelOpen, setLayerPanelOpen] = useState(showLayerPanel)

  // ===== TEMA =====
  const currentTheme = useTheme(theme)
  const tileConfig = getTileConfig(currentTheme)

  // ===== DATOS DEL MAPA =====
  const {
    layers,
    visibleLayers,
    loading,
    error,
    stats,
    toggleLayerVisibility,
    setLayerOpacity
  } = useMapData()

  // ===== FUNCIONES DE CONTROL =====

  /**
   * Toggle pantalla completa
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const newState = !prev
      
      // Controlar scroll del body
      if (newState) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      
      // Invalidar tamaño del mapa
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)
      
      return newState
    })
  }, [])

  /**
   * Centrar vista en Cali
   */
  const centerView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo(initialCenter, initialZoom, {
        duration: 1.5
      })
    }
  }, [initialCenter, initialZoom])

  /**
   * Toggle panel de capas
   */
  const toggleLayerPanel = useCallback(() => {
    setLayerPanelOpen(prev => !prev)
  }, [])

  /**
   * Manejar toggle de capa
   */
  const handleLayerToggle = useCallback((layerId: string) => {
    toggleLayerVisibility(layerId)
    const layer = layers.find(l => l.id === layerId)
    if (layer && onLayerToggle) {
      onLayerToggle(layerId, !layer.visible)
    }
  }, [layers, toggleLayerVisibility, onLayerToggle])

  /**
   * Obtener estilo de feature
   */
  const getFeatureStyle = useCallback((feature: any, layer: MapLayer) => {
    const isInfrastructure = layer.id.includes('infraestructura') || layer.id.includes('vial')
    
    return {
      color: layer.color,
      weight: isInfrastructure ? 4 : 2,
      opacity: layer.opacity,
      fillColor: layer.color,
      fillOpacity: layer.opacity * 0.6,
      lineCap: 'round' as const,
      lineJoin: 'round' as const
    }
  }, [])

  /**
   * Manejar filtros de capa
   */
  const handleFilterChange = useCallback((layerId: string, filters: Record<string, any>) => {
    console.log(`🔍 Aplicando filtros a capa ${layerId}:`, filters)
    // Aquí se implementaría la lógica de filtrado en el hook useMapData
  }, [])

  const pointToLayer = useCallback((feature: any, latlng: L.LatLng, layer: MapLayer) => {
    return L.circleMarker(latlng, {
      radius: 6,
      fillColor: layer.color,
      color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      weight: 1,
      opacity: 0.8,
      fillOpacity: layer.opacity * 0.8
    })
  }, [currentTheme])

  /**
   * Manejar click en feature
   */
  const handleFeatureClick = useCallback((feature: MapFeature, layer: MapLayer, event: any) => {
    // Prevenir propagación
    if (event.originalEvent) {
      event.originalEvent.stopPropagation()
      event.originalEvent.preventDefault()
    }

    // Llamar callback si existe
    if (onFeatureClick) {
      onFeatureClick(feature, layer)
    }

    // Zoom al feature
    if (mapRef.current && event.target) {
      const target = event.target
      
      if (feature.geometry.type === 'Point') {
        const coords = feature.geometry.coordinates
        mapRef.current.flyTo([coords[1], coords[0]], 16, { duration: 1.5 })
      } else if (target.getBounds) {
        mapRef.current.fitBounds(target.getBounds(), {
          padding: [20, 20],
          maxZoom: 15,
          duration: 1.5
        })
      }
    }
  }, [onFeatureClick])

  // ===== EFECTOS =====

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // ===== RENDER =====

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Error cargando el mapa
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : `relative ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      <MapContainer
        ref={mapRef}
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        className={isFullscreen ? '' : 'rounded-xl'}
        maxBounds={[
          [3.0, -77.0], // Southwest - área ampliada alrededor de Cali
          [4.0, -76.0]  // Northeast
        ]}
        maxBoundsViscosity={0.5}
        whenReady={() => {
          console.log('🗺️ Mapa dinámico listo')
        }}
      >
        {/* Configuración del mapa */}
        <MapConfiguration theme={currentTheme} />

        {/* Capa base */}
        <TileLayer
          key={`tilemap-${currentTheme}`}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />

        {/* Capas GeoJSON */}
        {visibleLayers.map((layer) => (
          <GeoJSON
            key={`${layer.id}-${layer.opacity}-${layer.color}-${layer.data?.metadata.lastUpdate}`}
            data={layer.data!}
            style={(feature) => getFeatureStyle(feature, layer)}
            pointToLayer={(feature, latlng) => pointToLayer(feature, latlng, layer)}
            onEachFeature={(feature, leafletLayer) => {
              leafletLayer.on('click', (e) => {
                handleFeatureClick(feature as MapFeature, layer, e)
              })

              // Hover effects para infraestructura
              if (layer.id.includes('infraestructura') || layer.id.includes('vial')) {
                const pathLayer = leafletLayer as any
                
                leafletLayer.on('mouseover', () => {
                  if (pathLayer.setStyle) {
                    pathLayer.setStyle({
                      weight: 6,
                      color: '#FF6B35'
                    })
                  }
                })

                leafletLayer.on('mouseout', () => {
                  if (pathLayer.setStyle) {
                    pathLayer.setStyle(getFeatureStyle(feature, layer))
                  }
                })
              }
            }}
          />
        ))}

        {/* Controles del mapa */}
        {showControls && (
          <MapControls
            onToggleFullscreen={toggleFullscreen}
            onCenterView={centerView}
            onToggleLayerPanel={toggleLayerPanel}
            isFullscreen={isFullscreen}
            layerPanelOpen={layerPanelOpen}
          />
        )}
      </MapContainer>

      {/* Panel de control de capas */}
      <AnimatePresence>
        {layerPanelOpen && (
          <LayerControlPanel
            layers={layers}
            onToggleLayer={handleLayerToggle}
            onOpacityChange={setLayerOpacity}
            onFilterChange={enableFiltering ? handleFilterChange : undefined}
            enableFiltering={enableFiltering}
            stats={stats}
          />
        )}
      </AnimatePresence>

      {/* Estilos CSS */}
      <style jsx global>{`
        .opacity-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .opacity-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .leaflet-interactive {
          cursor: pointer !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  )
}

export default DynamicMap
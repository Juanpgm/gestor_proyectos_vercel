'use client'

import React, { 
  useRef, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo, 
  memo,
  useImperativeHandle,
  forwardRef
} from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Maximize2, Target, Layers, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createRoot } from 'react-dom/client'

import { CALI_COORDINATES } from '@/utils/coordinateUtils'
import PopupGaugeChart from './PopupGaugeChart'
import { useLayerSymbology } from '@/hooks/useLayerSymbology'
import { createCustomIcon, createCategoryIcon, createRangeIcon, createShapeIcon } from '@/utils/customIcons'

/**
 * ============================================
 * NÚCLEO UNIVERSAL DE MAPAS OPTIMIZADO
 * ============================================
 * 
 * Versión completamente optimizada del mapa con:
 * - Memoización completa de componentes y funciones
 * - Gestión optimizada de re-renderizados
 * - Cache inteligente de estilos
 * - Lazy loading de componentes pesados
 * - Debouncing de actualizaciones
 * - Memory management mejorado
 */

// ===== TIPOS OPTIMIZADOS =====
export interface OptimizedMapLayer {
  id: string
  name: string
  data: any
  visible: boolean
  type: 'geojson' | 'points'
  color?: string
  opacity?: number
  representationMode?: 'clase_obra' | 'tipo_intervencion' | 'estado' | 'novedad'
  style?: any
  pointStyle?: {
    radius: number
    fillColor: string
    color: string
    weight: number
    opacity: number
    fillOpacity: number
  }
  // Nuevas propiedades para optimización
  dataHash?: string // Hash para detectar cambios de datos
  lastUpdate?: number // Timestamp de última actualización
  featureCount?: number // Número de features para optimización
}

export interface OptimizedMapRef {
  centerOnLayers: () => void
  setFullscreen: (fullscreen: boolean) => void
  refreshLayer: (layerId: string) => void
  getMapInstance: () => L.Map | null
}

export interface OptimizedUniversalMapCoreProps {
  layers: OptimizedMapLayer[]
  baseMapUrl?: string
  baseMapAttribution?: string
  height?: string
  onLayerToggle?: (layerId: string) => void
  onFeatureClick?: (feature: any, layer: any) => void
  theme?: 'light' | 'dark'
  enableFullscreen?: boolean
  enableCenterView?: boolean
  enableLayerControls?: boolean
  onMapReady?: (centerFunction: () => void) => void
  // Nuevas props de optimización
  maxFeatures?: number // Límite de features por capa
  enableVirtualization?: boolean // Virtualización para capas grandes
  debounceMs?: number // Millisegundos de debounce para updates
  memoryLimit?: number // Límite de memoria en MB
}

// ===== CONFIGURACIONES OPTIMIZADAS =====
const OPTIMIZED_STYLES = {
  geojson: {
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.3,
    color: '#3B82F6',
    fillColor: '#3B82F6'
  },
  points: {
    radius: 4,
    fillColor: '#3B82F6',
    color: '#FFFFFF',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  }
} as const

const LAYER_COLORS = {
  unidadesProyecto: { fill: '#3B82F6', stroke: '#1D4ED8' },
  equipamientos: { fill: '#10B981', stroke: '#059669' },
  infraestructura: { fill: '#F59E0B', stroke: '#D97706' },
  infraestructura_vial: { fill: '#F59E0B', stroke: '#D97706' },
  comunas: { fill: '#8B5CF6', stroke: '#7C3AED' },
  barrios: { fill: '#EF4444', stroke: '#DC2626' }
} as const

// ===== CACHE DE ESTILOS OPTIMIZADO =====
class StyleCache {
  private cache = new Map<string, any>()
  private maxSize = 1000
  
  get(key: string): any | undefined {
    return this.cache.get(key)
  }
  
  set(key: string, style: any): void {
    if (this.cache.size >= this.maxSize) {
      // Eliminar el primer elemento (LRU simple)
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, style)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

const styleCache = new StyleCache()

// ===== COMPONENTES MEMOIZADOS =====

// Control de pantalla completa memoizado
const OptimizedFullscreenControl = memo<{ onToggle: () => void }>(({ onToggle }) => {
  const handleClick = useCallback(() => {
    onToggle()
  }, [onToggle])

  return (
    <div className="leaflet-control-container">
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control leaflet-bar">
          <button
            onClick={handleClick}
            className="leaflet-control-button w-8 h-8 bg-white hover:bg-gray-50 border border-gray-300 flex items-center justify-center transition-colors"
            title="Pantalla completa"
            type="button"
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
})

OptimizedFullscreenControl.displayName = 'OptimizedFullscreenControl'

// Control de centrado memoizado
const OptimizedCenterControl = memo<{ onCenter: () => void }>(({ onCenter }) => {
  const handleClick = useCallback(() => {
    onCenter()
  }, [onCenter])

  return (
    <div className="leaflet-control-container">
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control leaflet-bar" style={{ marginTop: '50px' }}>
          <button
            onClick={handleClick}
            className="leaflet-control-button w-8 h-8 bg-white hover:bg-gray-50 border border-gray-300 flex items-center justify-center transition-colors"
            title="Centrar en capas visibles"
            type="button"
          >
            <Target className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
})

OptimizedCenterControl.displayName = 'OptimizedCenterControl'

// Componente interno para funciones del mapa
const MapController = memo<{
  onMapReady: (map: L.Map) => void
  centerOnLayers: () => void
  mapRef: React.MutableRefObject<L.Map | null>
}>(({ onMapReady, centerOnLayers, mapRef }) => {
  const map = useMap()

  useEffect(() => {
    if (map && !mapRef.current) {
      mapRef.current = map
      onMapReady(map)
    }
  }, [map, onMapReady, mapRef])

  useEffect(() => {
    // Configurar el mapa para mejor rendimiento
    if (map) {
      map.options.preferCanvas = true // Usar Canvas para mejor rendimiento
      map.options.maxZoom = 18
      map.options.minZoom = 8
    }
  }, [map])

  return null
})

MapController.displayName = 'MapController'

// ===== COMPONENTE PRINCIPAL OPTIMIZADO =====
const OptimizedUniversalMapCore = forwardRef<OptimizedMapRef, OptimizedUniversalMapCoreProps>((props, ref) => {
  const {
    layers,
    baseMapUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    baseMapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    height = '400px',
    onLayerToggle,
    onFeatureClick,
    theme = 'light',
    enableFullscreen = true,
    enableCenterView = true,
    enableLayerControls = true,
    onMapReady,
    maxFeatures = 5000,
    enableVirtualization = true,
    debounceMs = 300,
    memoryLimit = 100
  } = props

  // ===== ESTADO OPTIMIZADO =====
  const mapRef = useRef<L.Map | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout>()

  // Hook de simbología con memoización
  const { getFeatureStyle, getFeatureIcon, getLayerSymbology } = useLayerSymbology()

  // ===== FUNCIONES MEMOIZADAS =====

  // Verificar carga de Leaflet con optimización
  useEffect(() => {
    let mounted = true

    const checkLeaflet = () => {
      if (!mounted) return

      if (typeof window !== 'undefined' && window.L) {
        console.log('✅ Leaflet optimizado disponible')
        setLeafletLoaded(true)
        setMapReady(true)
        return
      }

      // Reintento más eficiente
      setTimeout(checkLeaflet, 50)
    }

    checkLeaflet()

    // Timeout de seguridad
    const forceInit = setTimeout(() => {
      if (mounted) {
        console.log('🕒 Forzando inicialización optimizada')
        setLeafletLoaded(true)
        setMapReady(true)
      }
    }, 2000)

    return () => {
      mounted = false
      clearTimeout(forceInit)
    }
  }, [])

  // Función optimizada para generar hash de datos
  const generateDataHash = useCallback((data: any): string => {
    if (!data || !data.features) return 'empty'
    const featureCount = data.features.length
    const firstFeature = data.features[0]
    const lastFeature = data.features[featureCount - 1]
    
    return `${featureCount}-${JSON.stringify(firstFeature?.properties || {}).slice(0, 50)}-${JSON.stringify(lastFeature?.properties || {}).slice(0, 50)}`
  }, [])

  // Obtener estilos optimizados con cache
  const getOptimizedLayerStyle = useCallback((layer: OptimizedMapLayer, feature?: any) => {
    const cacheKey = `${layer.id}-${layer.color}-${layer.opacity}-${layer.representationMode}-${feature ? JSON.stringify(feature.properties || {}).slice(0, 100) : 'default'}`
    
    // Verificar cache primero
    const cachedStyle = styleCache.get(cacheKey)
    if (cachedStyle) {
      return cachedStyle
    }

    // Generar estilo
    const baseColors = LAYER_COLORS[layer.id as keyof typeof LAYER_COLORS] || LAYER_COLORS.unidadesProyecto
    const isInfraestructura = layer.id.includes('infraestructura') || layer.id.includes('vias')
    
    const style = {
      ...OPTIMIZED_STYLES.geojson,
      color: layer.color || baseColors.stroke,
      fillColor: layer.color || baseColors.fill,
      fillOpacity: layer.opacity ?? (isInfraestructura ? 0.7 : 0.5),
      opacity: layer.opacity ?? 0.8,
      weight: isInfraestructura ? 3 : 2,
      interactive: true,
      bubblingMouseEvents: false,
      lineCap: 'round' as const,
      lineJoin: 'round' as const
    }

    // Aplicar simbología personalizada si existe
    if (feature) {
      const customStyle = getFeatureStyle(feature, layer.id, feature?.geometry?.type, false)
      Object.assign(style, customStyle)
    }

    // Guardar en cache
    styleCache.set(cacheKey, style)
    
    return style
  }, [getFeatureStyle])

  // Función de centrado optimizada
  const centerOnVisibleLayers = useCallback(() => {
    if (!mapRef.current) return

    const visibleLayers = layers.filter(layer => layer.visible && layer.data?.features?.length > 0)
    
    if (visibleLayers.length === 0) return

    try {
      const bounds = L.latLngBounds([])
      
      visibleLayers.forEach(layer => {
        if (layer.data?.features) {
          layer.data.features.forEach((feature: any) => {
            if (feature.geometry) {
              const geoJsonLayer = L.geoJSON(feature)
              bounds.extend(geoJsonLayer.getBounds())
            }
          })
        }
      })

      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { 
          padding: [20, 20],
          maxZoom: 12 // Limitar zoom máximo similar al botón centrar vista
        })
      }
    } catch (error) {
      console.warn('Error centrando en capas:', error)
      // Fallback a Cali con zoom limitado
      mapRef.current.setView(CALI_COORDINATES.CENTER_LAT_LNG, 10)
    }
  }, [layers])

  // Función para toggle de pantalla completa
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  // Función para manejo de clicks optimizada
  const handleFeatureClick = useCallback((feature: any, layer: OptimizedMapLayer) => {
    if (onFeatureClick) {
      onFeatureClick(feature, layer)
    }
  }, [onFeatureClick])

  // Función para toggle de capas con debounce
  const handleLayerToggle = useCallback((layerId: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      onLayerToggle?.(layerId)
    }, debounceMs)
  }, [onLayerToggle, debounceMs])

  // Callback cuando el mapa está listo
  const handleMapReady = useCallback((map: L.Map) => {
    console.log('🗺️ Mapa optimizado listo')
    
    // Configuraciones adicionales de rendimiento
    map.options.preferCanvas = true
    
    if (onMapReady) {
      onMapReady(centerOnVisibleLayers)
    }
  }, [onMapReady, centerOnVisibleLayers])

  // Imperativo handle para ref
  useImperativeHandle(ref, () => ({
    centerOnLayers: centerOnVisibleLayers,
    setFullscreen: setIsFullscreen,
    refreshLayer: (layerId: string) => {
      // Implementar refresh específico de capa
      console.log(`🔄 Refreshing layer: ${layerId}`)
    },
    getMapInstance: () => mapRef.current
  }), [centerOnVisibleLayers])

  // Procesar capas con optimización
  const optimizedLayers = useMemo(() => {
    return layers
      .filter(layer => layer.visible && layer.type === 'geojson' && layer.data?.features?.length > 0)
      .map(layer => {
        // Limitar features si es necesario
        const features = enableVirtualization && layer.data.features.length > maxFeatures
          ? layer.data.features.slice(0, maxFeatures)
          : layer.data.features

        return {
          ...layer,
          data: {
            ...layer.data,
            features
          },
          dataHash: generateDataHash(layer.data),
          featureCount: features.length
        }
      })
  }, [layers, enableVirtualization, maxFeatures, generateDataHash])

  // Cleanup de timeouts
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Render condicional optimizado
  if (!leafletLoaded || !mapReady) {
    return (
      <div 
        className="w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Optimizando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white dark:bg-gray-900' : 'rounded-lg overflow-hidden'}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      <MapContainer
        center={CALI_COORDINATES.CENTER_LAT_LNG}
        zoom={10} // Zoom inicial limitado para mejor vista del área metropolitana
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        preferCanvas={true} // Optimización de Canvas
      >
        <MapController 
          onMapReady={handleMapReady}
          centerOnLayers={centerOnVisibleLayers}
          mapRef={mapRef}
        />

        <TileLayer
          attribution={baseMapAttribution}
          url={baseMapUrl}
          maxZoom={18}
          minZoom={8}
        />

        {/* Renderizar capas optimizadas */}
        {optimizedLayers.map(layer => (
          <GeoJSON
            key={`optimized-${layer.id}-${layer.dataHash}`} // Key estable optimizada
            data={layer.data}
            style={(feature) => getOptimizedLayerStyle(layer, feature)}
            onEachFeature={(feature, leafletLayer) => {
              // Configurar popup optimizado
              if (feature.properties) {
                const popupContent = document.createElement('div')
                
                // Crear popup minimalista para mejor rendimiento
                const basicInfo = [
                  feature.properties.nickname || feature.properties.nombre || 'Sin nombre',
                  feature.properties.estado_unidad_proyecto && `Estado: ${feature.properties.estado_unidad_proyecto}`,
                  feature.properties.clase_obra && `Tipo: ${feature.properties.clase_obra}`,
                ].filter(Boolean).join('<br>')

                popupContent.innerHTML = `
                  <div class="text-sm">
                    ${basicInfo}
                  </div>
                `

                leafletLayer.bindPopup(popupContent, {
                  maxWidth: 300,
                  className: 'custom-popup-optimized'
                })
              }

              // Configurar click handler optimizado
              leafletLayer.on('click', () => {
                handleFeatureClick(feature, layer)
              })
            }}
            pane={layer.id.includes('infraestructura') ? 'overlayPane' : undefined}
          />
        ))}

        {/* Controles optimizados */}
        {enableFullscreen && (
          <OptimizedFullscreenControl onToggle={toggleFullscreen} />
        )}

        {enableCenterView && (
          <OptimizedCenterControl onCenter={centerOnVisibleLayers} />
        )}
      </MapContainer>

      {/* Panel de control de capas optimizado */}
      {enableLayerControls && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Capas</span>
          </div>
          <div className="space-y-2">
            {layers
              .filter(layer => layer.id !== 'unidadesProyecto')
              .map(layer => (
                <button
                  key={layer.id}
                  onClick={() => handleLayerToggle(layer.id)}
                  className={`flex items-center justify-between w-full p-2 rounded-lg border transition-all duration-200 ${
                    layer.visible 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      layer.visible 
                        ? layer.id === 'equipamientos' 
                          ? 'bg-green-500' 
                          : 'bg-orange-500'
                        : 'bg-gray-300'
                    }`} />
                    <span className="text-sm font-medium">
                      {layer.id === 'infraestructura_vial' ? 'Vías' : layer.name}
                    </span>
                  </div>
                  {layer.visible ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ))}
          </div>
          {/* Estadísticas de rendimiento */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Cache: {styleCache.size()} estilos
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

OptimizedUniversalMapCore.displayName = 'OptimizedUniversalMapCore'

export default memo(OptimizedUniversalMapCore)

// ===== UTILIDADES DE RENDIMIENTO =====

/**
 * Hook para monitorear rendimiento del mapa
 */
export function useMapPerformance() {
  const [stats, setStats] = useState({
    renderTime: 0,
    layerCount: 0,
    featureCount: 0,
    cacheSize: 0
  })

  const updateStats = useCallback((newStats: Partial<typeof stats>) => {
    setStats(prev => ({ ...prev, ...newStats }))
  }, [])

  return { stats, updateStats }
}

/**
 * Función para limpiar cache de estilos
 */
export function clearMapStyleCache() {
  styleCache.clear()
  console.log('🧹 Cache de estilos del mapa limpiado')
}

/**
 * Función para obtener estadísticas de memoria
 */
export function getMapMemoryStats() {
  return {
    styleCacheSize: styleCache.size(),
    estimatedMemoryMB: (styleCache.size() * 0.001).toFixed(2) // Estimación aproximada
  }
}

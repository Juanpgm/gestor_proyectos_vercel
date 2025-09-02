'use client'

import React, { 
  useRef, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo, 
  memo,
  forwardRef,
  useImperativeHandle
} from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { Layers, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import L, { LatLngExpression, LeafletMouseEvent, Layer, PathOptions } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { CALI_COORDINATES } from '@/utils/coordinateUtils'
import { useLayerSymbology } from '@/hooks/useLayerSymbology'
import { useOptimizedMapData } from '@/hooks/useOptimizedMapData'

/**
 * ============================================
 * COMPONENTE UNIFICADO DE MAPA
 * ============================================
 * 
 * Único componente que concentra toda la funcionalidad:
 * - Carga optimizada de datos con cache
 * - Renderizado eficiente de capas GeoJSON
 * - Gestión de estilos y simbología
 * - Control de capas integrado
 * - Popups informativos
 * - Responsive y escalable
 */

// ===== TIPOS UNIFICADOS =====
export interface UnifiedMapLayer {
  id: string
  name: string
  data: any
  visible: boolean
  type: 'geojson' | 'points'
  color?: string
  opacity?: number
  representationMode?: 'clase_obra' | 'tipo_intervencion' | 'estado' | 'novedad'
  style?: any
  pointStyle?: any
  dataHash?: string
  lastUpdate?: number
  featureCount?: number
}

export interface UnifiedMapRef {
  centerOnLayers: () => void
  refreshLayer: (layerId: string) => void
  getMapInstance: () => L.Map | null
}

export interface UnifiedMapCoreProps {
  height?: string
  className?: string
  onFeatureClick?: (feature: any, layer: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
  theme?: 'light' | 'dark'
  enableLayerControls?: boolean
  maxFeatures?: number
  baseMapUrl?: string
  baseMapAttribution?: string
}

// ===== ESTILOS OPTIMIZADOS =====
const UNIFIED_STYLES = {
  geojson: {
    weight: 1.5,
    opacity: 0.8,
    fillOpacity: 0.3,
    color: '#3B82F6',
    fillColor: '#3B82F6',
    lineCap: 'round' as const,
    lineJoin: 'round' as const
  },
  points: {
    radius: 3,
    fillColor: '#3B82F6',
    color: '#FFFFFF',
    weight: 0.8,
    opacity: 1,
    fillOpacity: 0.8
  }
} as const

const LAYER_COLORS = {
  equipamientos: { fill: '#10B981', stroke: '#059669' },
  infraestructura_vial: { fill: '#F59E0B', stroke: '#D97706' },
  centros_gravedad_unificado: { fill: '#8B5CF6', stroke: '#7C3AED' },
  comunas: { fill: '#3B82F6', stroke: '#1D4ED8' },
  barrios: { fill: '#EF4444', stroke: '#DC2626' },
  corregimientos: { fill: '#6366F1', stroke: '#4F46E5' },
  veredas: { fill: '#EC4899', stroke: '#DB2777' }
} as const

// ===== CACHE DE ESTILOS =====
class StyleCache {
  private cache = new Map<string, any>()
  private maxSize = 1000
  
  get(key: string): any | undefined {
    return this.cache.get(key)
  }
  
  set(key: string, style: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
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

// ===== COMPONENTE DE CONFIGURACIÓN =====
const MapConfiguration = memo(() => {
  const map = useMap()
  
  useEffect(() => {
    if (map) {
      // Configurar opciones de rendimiento
      map.options.preferCanvas = true
      map.options.maxZoom = 18
      map.options.minZoom = 8
      
      // Configurar iconos por defecto de Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })
    }
  }, [map])
  
  return null
})

MapConfiguration.displayName = 'MapConfiguration'

// ===== COMPONENTE PRINCIPAL UNIFICADO =====
const UnifiedMapCore = forwardRef<UnifiedMapRef, UnifiedMapCoreProps>((props, ref) => {
  const {
    height = '500px',
    className = '',
    onFeatureClick,
    onLayerToggle,
    theme = 'light',
    enableLayerControls = true,
    maxFeatures = 3000,
    baseMapUrl,
    baseMapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  } = props

  // ===== ESTADO =====
  const mapRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({})
  const updateTimeoutRef = useRef<NodeJS.Timeout>()

  // ===== HOOKS =====
  const mapData = useOptimizedMapData()
  const { getFeatureStyle } = useLayerSymbology()

  // ===== CONFIGURACIÓN DE MAPA BASE =====
  const finalBaseMapUrl = useMemo(() => {
    if (baseMapUrl) return baseMapUrl
    return theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  }, [baseMapUrl, theme])

  // ===== INICIALIZACIÓN DE VISIBILIDAD =====
  useEffect(() => {
    if (mapData.allGeoJSONData && Object.keys(mapData.allGeoJSONData).length > 0) {
      const initialVisibility: Record<string, boolean> = {}
      
      Object.keys(mapData.allGeoJSONData).forEach(layerId => {
        // Capas principales visibles por defecto
        initialVisibility[layerId] = ['equipamientos', 'infraestructura_vial', 'centros_gravedad_unificado'].includes(layerId)
      })
      
      setLayerVisibility(prev => ({ ...initialVisibility, ...prev }))
    }
  }, [mapData.allGeoJSONData])

  // ===== FUNCIONES DE UTILIDAD =====
  const getLayerDisplayName = useCallback((layerId: string): string => {
    const displayNames: Record<string, string> = {
      equipamientos: 'Equipamientos',
      infraestructura_vial: 'Infraestructura Vial',
      centros_gravedad_unificado: 'Centros de Gravedad',
      comunas: 'Comunas',
      barrios: 'Barrios',
      corregimientos: 'Corregimientos',
      veredas: 'Veredas'
    }
    return displayNames[layerId] || layerId.charAt(0).toUpperCase() + layerId.slice(1)
  }, [])

  const getLayerColor = useCallback((layerId: string) => {
    return LAYER_COLORS[layerId as keyof typeof LAYER_COLORS] || LAYER_COLORS.equipamientos
  }, [])

  // ===== PROCESAMIENTO DE CAPAS =====
  const unifiedLayers = useMemo((): UnifiedMapLayer[] => {
    if (!mapData.allGeoJSONData || mapData.loading) return []

    return Object.entries(mapData.allGeoJSONData)
      .filter(([_, data]) => data && data.features.length > 0)
      .map(([layerId, data]) => {
        const isVisible = layerVisibility[layerId] ?? false
        const layerColors = getLayerColor(layerId)
        
        // Optimización: limitar features si es necesario
        const features = data.features.length > maxFeatures
          ? data.features.slice(0, maxFeatures)
          : data.features

        return {
          id: layerId,
          name: getLayerDisplayName(layerId),
          data: { ...data, features },
          visible: isVisible,
          type: 'geojson' as const,
          color: layerColors.fill,
          opacity: 0.7,
          dataHash: data.metadata?.hash || '',
          lastUpdate: Date.now(),
          featureCount: features.length
        }
      })
  }, [mapData.allGeoJSONData, mapData.loading, layerVisibility, maxFeatures, getLayerDisplayName, getLayerColor])

  // ===== ESTILOS OPTIMIZADOS =====
  const getOptimizedLayerStyle = useCallback((layer: UnifiedMapLayer, feature?: any) => {
    const cacheKey = `${layer.id}-${layer.color}-${layer.opacity}-${feature ? JSON.stringify(feature.properties || {}).slice(0, 100) : 'default'}`
    
    const cachedStyle = styleCache.get(cacheKey)
    if (cachedStyle) return cachedStyle

    const layerColors = getLayerColor(layer.id)
    const isInfraestructura = layer.id.includes('infraestructura') || layer.id.includes('vial')
    
    const style = {
      ...UNIFIED_STYLES.geojson,
      color: layer.color || layerColors.stroke,
      fillColor: layer.color || layerColors.fill,
      fillOpacity: layer.opacity ?? (isInfraestructura ? 0.7 : 0.5),
      opacity: layer.opacity ?? 0.8,
      weight: isInfraestructura ? 2 : 1.5,
      interactive: true,
      bubblingMouseEvents: false
    }

    // Aplicar simbología personalizada si existe
    if (feature) {
      const customStyle = getFeatureStyle(feature, layer.id, feature?.geometry?.type, false)
      Object.assign(style, customStyle)
    }

    styleCache.set(cacheKey, style)
    return style
  }, [getLayerColor, getFeatureStyle])

  // ===== CREACIÓN DE POPUPS =====
  const createFeaturePopup = useCallback((feature: any, layerType: string) => {
    const properties = feature.properties || {}
    
    const getName = () => {
      return properties.nombre || 
             properties.nickname || 
             properties.nombre_unidad_proyecto || 
             properties.descripcion || 
             properties.descripcion_proyecto ||
             'Sin nombre'
    }

    const formatValue = (value: any) => {
      if (value === null || value === undefined) return 'N/A'
      if (typeof value === 'number') return value.toLocaleString()
      if (typeof value === 'string' && value.length > 100) return value.substring(0, 97) + '...'
      return String(value)
    }

    const mainProps = Object.entries(properties)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .slice(0, 8) // Limitar a propiedades principales

    return `
      <div style="max-width: 350px; font-family: system-ui, sans-serif;">
        <div style="
          background: linear-gradient(135deg, 
            ${layerType.includes('equipamiento') ? '#D1FAE5, #A7F3D0' : 
              layerType.includes('infraestructura') || layerType.includes('vial') ? '#FEF3C7, #FDE68A' : 
              '#DBEAFE, #BFDBFE'});
          margin: -8px -12px 12px -12px;
          padding: 12px;
          border-radius: 8px 8px 0 0;
        ">
          <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937;">
            ${getName()}
          </h4>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
            ${getLayerDisplayName(layerType)}
          </p>
        </div>
        
        <div style="display: grid; gap: 8px;">
          ${mainProps.map(([key, value]) => `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 0; border-bottom: 1px solid #F3F4F6;">
              <span style="font-size: 12px; color: #6B7280; font-weight: 500; text-transform: capitalize; flex: 1; margin-right: 8px;">
                ${key.replace(/_/g, ' ')}:
              </span>
              <span style="font-size: 12px; color: #374151; font-weight: 400; text-align: right; flex: 1;">
                ${formatValue(value)}
              </span>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 12px; padding: 8px; background: #F9FAFB; border-radius: 6px; border-left: 3px solid #3B82F6;">
          <div style="font-size: 10px; color: #6B7280;">
            💡 Click para más detalles
          </div>
        </div>
      </div>
    `
  }, [getLayerDisplayName])

  // ===== MANEJO DE EVENTOS =====
  const handleLayerToggle = useCallback((layerId: string) => {
    setLayerVisibility(prev => {
      const newVisibility = { ...prev, [layerId]: !prev[layerId] }
      
      // Notificar cambio con debouncing
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        onLayerToggle?.(layerId, newVisibility[layerId])
      }, 200)
      
      return newVisibility
    })
  }, [onLayerToggle])

  const handleFeatureClick = useCallback((feature: any, layer: UnifiedMapLayer) => {
    onFeatureClick?.(feature, layer)
  }, [onFeatureClick])

  // ===== FUNCIONES DEL REF =====
  const centerOnVisibleLayers = useCallback(() => {
    if (!mapRef.current) return

    const visibleLayers = unifiedLayers.filter(layer => layer.visible && layer.data?.features?.length > 0)
    if (visibleLayers.length === 0) return

    try {
      const bounds = L.latLngBounds([])
      
      visibleLayers.forEach(layer => {
        layer.data.features.forEach((feature: any) => {
          if (feature.geometry) {
            const geoJsonLayer = L.geoJSON(feature)
            bounds.extend(geoJsonLayer.getBounds())
          }
        })
      })

      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 })
      }
    } catch (error) {
      console.warn('Error centrando en capas:', error)
      mapRef.current.setView(CALI_COORDINATES.CENTER_LAT_LNG, 10)
    }
  }, [unifiedLayers])

  // ===== CONFIGURACIÓN DEL REF =====
  useImperativeHandle(ref, () => ({
    centerOnLayers: centerOnVisibleLayers,
    refreshLayer: (layerId: string) => {
      console.log(`🔄 Refreshing layer: ${layerId}`)
      styleCache.clear()
    },
    getMapInstance: () => mapRef.current
  }), [centerOnVisibleLayers])

  // ===== CONFIGURACIÓN DEL MAPA =====
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
    setMapReady(true)
    console.log('🗺️ Mapa unificado listo')
  }, [])

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // ===== RENDERIZADO CONDICIONAL =====
  if (mapData.loading && mapData.progress < 100) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cargando datos del mapa...
          </p>
          <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${mapData.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mapData.progress}% completado
          </p>
        </div>
      </motion.div>
    )
  }

  if (mapData.error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <Layers className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            Error al cargar el mapa
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm">
            {mapData.error}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`relative w-full rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={CALI_COORDINATES.CENTER_LAT_LNG}
        zoom={10}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        preferCanvas={true}
        ref={(mapInstance: L.Map | null) => {
          if (mapInstance && !mapReady) {
            handleMapReady(mapInstance)
          }
        }}
      >
        <MapConfiguration />

        <TileLayer
          attribution={baseMapAttribution}
          url={finalBaseMapUrl}
          maxZoom={18}
          minZoom={8}
        />

        {/* Renderizar capas GeoJSON */}
        {unifiedLayers
          .filter(layer => layer.visible)
          .map(layer => (
            <GeoJSON
              key={`unified-${layer.id}-${layer.dataHash}`}
              data={layer.data}
              style={(feature: any) => getOptimizedLayerStyle(layer, feature)}
              onEachFeature={(feature: any, leafletLayer: Layer) => {
                // Popup
                if (feature.properties) {
                  leafletLayer.bindPopup(createFeaturePopup(feature, layer.id), {
                    maxWidth: 400,
                    className: 'custom-popup'
                  })
                }

                // Click handler
                if (onFeatureClick) {
                  leafletLayer.on('click', () => {
                    console.log(`🎯 Click en ${layer.id}:`, feature.properties)
                    handleFeatureClick(feature, layer)
                  })
                }

                // Hover effects
                leafletLayer.on('mouseover', () => {
                  const pathLayer = leafletLayer as any
                  if (pathLayer.setStyle) {
                    pathLayer.setStyle({
                      weight: pathLayer.options.weight * 1.5,
                      opacity: 1
                    })
                  }
                })
                
                leafletLayer.on('mouseout', () => {
                  const pathLayer = leafletLayer as any
                  if (pathLayer.setStyle) {
                    pathLayer.setStyle(getOptimizedLayerStyle(layer, feature))
                  }
                })
              }}
              pane={layer.id.includes('infraestructura') ? 'overlayPane' : undefined}
            />
          ))}
      </MapContainer>

      {/* Panel de control de capas */}
      {enableLayerControls && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-medium text-gray-800 dark:text-white">Capas</h3>
          </div>
          
          <div className="space-y-2">
            {unifiedLayers.map(layer => (
              <div key={layer.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {layer.name}
                  </span>
                </div>
                <button
                  onClick={() => handleLayerToggle(layer.id)}
                  className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
          
          {/* Estadísticas */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {mapData.performance.totalFeatures.toLocaleString()} elementos • Cache: {styleCache.size()}
            </div>
          </div>
        </div>
      )}

      {/* Información de estado */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 dark:text-gray-400">
              {unifiedLayers.filter(l => l.visible).length} capas activas
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

UnifiedMapCore.displayName = 'UnifiedMapCore'

export default memo(UnifiedMapCore)

// ===== TIPOS EXPORTADOS PARA COMPATIBILIDAD =====
export interface MapLayer extends UnifiedMapLayer {}
export interface OptimizedMapLayer extends UnifiedMapLayer {}
export interface ProjectMapData {
  allGeoJSONData: Record<string, any>
  unidadesProyecto?: any[]
}

// ===== UTILIDADES EXPORTADAS =====
export function clearUnifiedMapCache() {
  styleCache.clear()
  console.log('🧹 Cache del mapa unificado limpiado')
}

export function getUnifiedMapStats() {
  return {
    styleCacheSize: styleCache.size(),
    estimatedMemoryMB: (styleCache.size() * 0.001).toFixed(2)
  }
}

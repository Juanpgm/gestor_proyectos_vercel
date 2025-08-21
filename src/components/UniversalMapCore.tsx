'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Maximize2, Target, Layers, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { CALI_COORDINATES } from '@/utils/coordinateUtils'

/**
 * ============================================
 * NÚCLEO UNIVERSAL DE MAPAS MEJORADO
 * ============================================
 * 
 * Componente unificado con todas las funcionalidades:
 * - Control de pantalla completa
 * - Control de centrado en capas visibles
 * - CircleMarkers optimizados para puntos
 * - Carga eficiente y mantenible
 * - Código minimalista y escalable
 */

// Tipos unificados
export interface MapLayer {
  id: string
  name: string
  data: any
  visible: boolean
  type: 'geojson' | 'points'
  style?: any
  pointStyle?: {
    radius: number
    fillColor: string
    color: string
    weight: number
    opacity: number
    fillOpacity: number
  }
}

export interface UniversalMapCoreProps {
  layers: MapLayer[]
  baseMapUrl?: string
  baseMapAttribution?: string
  height?: string
  onLayerToggle?: (layerId: string) => void
  onFeatureClick?: (feature: any, layer: any) => void
  theme?: string
  enableFullscreen?: boolean
  enableCenterView?: boolean
  enableLayerControls?: boolean
}

// Configuraciones de estilo por defecto
const DEFAULT_STYLES = {
  geojson: {
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.3,
    color: '#3B82F6',
    fillColor: '#3B82F6'
  },
  points: {
    radius: 6,
    fillColor: '#3B82F6',
    color: '#FFFFFF',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
  }
}

// Configuraciones de colores por tipo
const LAYER_COLORS = {
  unidadesProyecto: { fill: '#3B82F6', stroke: '#1D4ED8' },
  equipamientos: { fill: '#10B981', stroke: '#059669' },
  infraestructura: { fill: '#F59E0B', stroke: '#D97706' },
  comunas: { fill: '#8B5CF6', stroke: '#7C3AED' },
  barrios: { fill: '#EF4444', stroke: '#DC2626' }
}

// Control de pantalla completa personalizado
const FullscreenControl: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  return (
    <div className="leaflet-control-container">
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control leaflet-bar">
          <button
            onClick={onToggle}
            className="leaflet-control-button w-8 h-8 bg-white hover:bg-gray-50 border border-gray-300 flex items-center justify-center transition-colors"
            title="Pantalla completa"
            style={{ border: 'none', borderRadius: '4px' }}
          >
            <Maximize2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Control de centrado en capas visibles
const CenterViewControl: React.FC<{ onCenter: () => void }> = ({ onCenter }) => {
  return (
    <div className="leaflet-control-container">
      <div className="leaflet-top leaflet-right" style={{ marginTop: '50px' }}>
        <div className="leaflet-control leaflet-bar">
          <button
            onClick={onCenter}
            className="leaflet-control-button w-8 h-8 bg-white hover:bg-gray-50 border border-gray-300 flex items-center justify-center transition-colors"
            title="Centrar vista en capas visibles"
            style={{ border: 'none', borderRadius: '4px' }}
          >
            <Target className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente para controles de mapa
const MapControls: React.FC<{
  map: L.Map
  layers: MapLayer[]
  enableFullscreen: boolean
  enableCenterView: boolean
  onFullscreen: () => void
}> = ({ map, layers, enableFullscreen, enableCenterView, onFullscreen }) => {
  
  // Función para centrar en capas visibles
  const centerOnVisibleLayers = useCallback(() => {
    const visibleLayers = layers.filter(layer => layer.visible && layer.data)
    
    if (visibleLayers.length === 0) return
    
    const bounds = L.latLngBounds([])
    let hasValidBounds = false
    
    visibleLayers.forEach(layer => {
      if (layer.type === 'geojson' && layer.data?.features) {
        try {
          const tempLayer = L.geoJSON(layer.data)
          const layerBounds = tempLayer.getBounds()
          if (layerBounds.isValid()) {
            bounds.extend(layerBounds)
            hasValidBounds = true
          }
        } catch (error) {
          console.warn('Error obteniendo bounds de capa:', error)
        }
      } else if (layer.type === 'points' && Array.isArray(layer.data)) {
        layer.data.forEach((point: any) => {
          if (point.lat && point.lng) {
            bounds.extend([point.lat, point.lng])
            hasValidBounds = true
          }
        })
      }
    })
    
    if (hasValidBounds) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, layers])
  
  useEffect(() => {
    const controlsContainer = document.createElement('div')
    controlsContainer.className = 'universal-map-controls'
    controlsContainer.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `
    
    map.getContainer().appendChild(controlsContainer)
    
    // Botón de pantalla completa
    if (enableFullscreen) {
      const fullscreenBtn = document.createElement('button')
      fullscreenBtn.className = 'map-control-btn'
      fullscreenBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `
      fullscreenBtn.title = 'Pantalla completa'
      fullscreenBtn.style.cssText = `
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        color: #475569;
        font-weight: 600;
      `
      fullscreenBtn.onmouseover = () => {
        fullscreenBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        fullscreenBtn.style.color = '#ffffff'
        fullscreenBtn.style.transform = 'scale(1.05)'
        fullscreenBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)'
      }
      fullscreenBtn.onmouseout = () => {
        fullscreenBtn.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        fullscreenBtn.style.color = '#475569'
        fullscreenBtn.style.transform = 'scale(1)'
        fullscreenBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
      }
      fullscreenBtn.onclick = onFullscreen
      controlsContainer.appendChild(fullscreenBtn)
    }
    
    // Botón de centrar vista
    if (enableCenterView) {
      const centerBtn = document.createElement('button')
      centerBtn.className = 'map-control-btn'
      centerBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 14v6m11-7h-6m-14 0h6"/>
        </svg>
      `
      centerBtn.title = 'Centrar vista en capas visibles'
      centerBtn.style.cssText = `
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        color: #475569;
        font-weight: 600;
      `
      centerBtn.onmouseover = () => {
        centerBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        centerBtn.style.color = '#ffffff'
        centerBtn.style.transform = 'scale(1.05)'
        centerBtn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
      }
      centerBtn.onmouseout = () => {
        centerBtn.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        centerBtn.style.color = '#475569'
        centerBtn.style.transform = 'scale(1)'
        centerBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
      }
      centerBtn.onclick = centerOnVisibleLayers
      controlsContainer.appendChild(centerBtn)
    }
    
    return () => {
      if (controlsContainer.parentNode) {
        controlsContainer.parentNode.removeChild(controlsContainer)
      }
    }
  }, [map, enableFullscreen, enableCenterView, onFullscreen, centerOnVisibleLayers])
  
  return null
}

// Componente principal
const UniversalMapCore: React.FC<UniversalMapCoreProps> = ({
  layers,
  baseMapUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  baseMapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  height = '600px',
  onLayerToggle,
  onFeatureClick,
  theme = 'light',
  enableFullscreen = true,
  enableCenterView = true,
  enableLayerControls = true
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Obtener estilos de capa
  const getLayerStyle = useCallback((layer: MapLayer) => {
    const baseColors = LAYER_COLORS[layer.id as keyof typeof LAYER_COLORS] || LAYER_COLORS.unidadesProyecto
    
    if (layer.style) return layer.style
    
    return {
      ...DEFAULT_STYLES.geojson,
      color: baseColors.stroke,
      fillColor: baseColors.fill
    }
  }, [])

  // Obtener estilo de puntos
  const getPointStyle = useCallback((layer: MapLayer) => {
    const baseColors = LAYER_COLORS[layer.id as keyof typeof LAYER_COLORS] || LAYER_COLORS.unidadesProyecto
    
    if (layer.pointStyle) return layer.pointStyle
    
    return {
      ...DEFAULT_STYLES.points,
      fillColor: baseColors.fill,
      color: baseColors.stroke
    }
  }, [])

  // Crear popup para features GeoJSON
  const createFeaturePopup = useCallback((feature: any, layerType: string) => {
    const properties = feature.properties || {}
    
    // Usar diferentes propiedades según el tipo de feature
    const getName = () => {
      return properties.NOMBRE || 
             properties.nombre || 
             properties.NAME || 
             properties.name ||
             properties.NOMCOMUNA ||
             properties.NOMBARRIO ||
             'Sin nombre'
    }
    
    const getType = () => {
      return properties.TIPO || 
             properties.tipo || 
             properties.TYPE || 
             properties.type || 
             ''
    }
    
    const getState = () => {
      return properties.ESTADO || 
             properties.estado || 
             properties.STATE || 
             properties.state || 
             ''
    }
    
    return `
      <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
        <h4 style="
          margin: 0 0 8px 0; 
          color: #1F2937; 
          font-size: 16px; 
          font-weight: 600;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 4px;
        ">
          ${getName()}
        </h4>
        
        <div style="font-size: 14px; display: grid; gap: 4px;">
          ${getType() ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280;">Tipo:</span>
              <span style="color: #1F2937; font-weight: 500;">${getType()}</span>
            </div>
          ` : ''}
          
          ${getState() ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280;">Estado:</span>
              <span style="color: #1F2937; font-weight: 500;">${getState()}</span>
            </div>
          ` : ''}
          
          <div style="
            margin-top: 8px; 
            padding: 4px 8px; 
            background-color: ${layerType.includes('equipamiento') ? '#D1FAE5' : layerType.includes('infraestructura') || layerType.includes('vias') ? '#FEF3C7' : '#DBEAFE'};
            border-radius: 4px;
            text-align: center;
          ">
            <span style="
              font-size: 12px; 
              color: ${layerType.includes('equipamiento') ? '#065F46' : layerType.includes('infraestructura') || layerType.includes('vias') ? '#92400E' : '#1E40AF'};
              font-weight: 500;
            ">
              ${layerType.includes('equipamiento') ? '🏢 Equipamiento' : 
                layerType.includes('infraestructura') || layerType.includes('vias') ? '🛣️ Vías' : 
                layerType.charAt(0).toUpperCase() + layerType.slice(1)}
            </span>
          </div>
        </div>
      </div>
    `
  }, [])

  // Crear popup para puntos (CircleMarkers)
  const createPointPopup = useCallback((point: any) => {
    const getName = () => {
      return point.NOMBRE || 
             point.nombre || 
             point.NAME || 
             point.name ||
             point.titulo ||
             point.proyecto ||
             'Proyecto sin nombre'
    }
    
    const getType = () => {
      return point.TIPO || 
             point.tipo || 
             point.TYPE || 
             point.type ||
             point.categoria ||
             ''
    }
    
    const getState = () => {
      return point.ESTADO || 
             point.estado || 
             point.STATE || 
             point.state ||
             point.status ||
             ''
    }
    
    const getBudget = () => {
      return point.presupuesto ||
             point.valor ||
             point.budget ||
             point.monto ||
             ''
    }
    
    return `
      <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
        <h4 style="
          margin: 0 0 8px 0; 
          color: #1F2937; 
          font-size: 16px; 
          font-weight: 600;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 4px;
        ">
          ${getName()}
        </h4>
        
        <div style="font-size: 14px; display: grid; gap: 4px;">
          ${getType() ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280;">Tipo:</span>
              <span style="color: #1F2937; font-weight: 500;">${getType()}</span>
            </div>
          ` : ''}
          
          ${getState() ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280;">Estado:</span>
              <span style="color: #1F2937; font-weight: 500;">${getState()}</span>
            </div>
          ` : ''}
          
          ${getBudget() ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280;">Presupuesto:</span>
              <span style="color: #059669; font-weight: 600;">${getBudget()}</span>
            </div>
          ` : ''}
          
          <div style="
            margin-top: 8px; 
            padding: 6px 10px; 
            background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
          ">
            <span style="
              font-size: 12px; 
              color: white;
              font-weight: 600;
              text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            ">
              📍 Unidad de Proyecto
            </span>
          </div>
        </div>
      </div>
    `
  }, [])

  // Manejar pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (!mapRef.current) return
    
    const container = mapRef.current.getContainer().parentElement
    if (!container) return
    
    if (!isFullscreen) {
      // Entrar en pantalla completa - con manejo de errores
      try {
        if (container.requestFullscreen) {
          container.requestFullscreen().catch(err => {
            console.warn('No se pudo activar pantalla completa:', err)
          })
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen()
        } else if ((container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen()
        } else {
          console.warn('Pantalla completa no soportada en este navegador')
        }
        setIsFullscreen(true)
      } catch (error) {
        console.warn('Error al activar pantalla completa:', error)
      }
    } else {
      // Salir de pantalla completa
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
            console.warn('Error al salir de pantalla completa:', err)
          })
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen()
        }
        setIsFullscreen(false)
      } catch (error) {
        console.warn('Error al salir de pantalla completa:', error)
        setIsFullscreen(false)
      }
    }
    
    // Invalidar tamaño del mapa después de un breve delay
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 100)
  }, [isFullscreen])

  // Escuchar eventos de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).msFullscreenElement)
      
      setIsFullscreen(isCurrentlyFullscreen)
      
      // Invalidar tamaño del mapa
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <div className={`relative w-full ${isFullscreen ? 'h-screen' : ''}`} style={{ height: isFullscreen ? '100vh' : height }}>
      <MapContainer
        ref={mapRef}
        center={CALI_COORDINATES.CENTER_LAT_LNG}
        zoom={CALI_COORDINATES.DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl"
        preferCanvas={true}
        whenReady={() => setMapReady(true)}
      >
        {/* Capa base */}
        <TileLayer
          attribution={baseMapAttribution}
          url={baseMapUrl}
        />

        {/* Renderizar capas GeoJSON */}
        {layers
          .filter(layer => layer.visible && layer.type === 'geojson' && layer.data)
          .map(layer => (
            <GeoJSON
              key={layer.id}
              data={layer.data}
              style={() => getLayerStyle(layer)}
              pointToLayer={(feature, latlng) => {
                // Usar CircleMarker para todos los puntos en lugar de marcadores estándar
                return L.circleMarker(latlng, {
                  radius: 8,
                  fillColor: '#3B82F6',
                  color: '#FFFFFF',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.8,
                  pane: 'markerPane'
                })
              }}
              onEachFeature={(feature, leafletLayer) => {
                leafletLayer.bindPopup(createFeaturePopup(feature, layer.id))
                
                if (onFeatureClick) {
                  leafletLayer.on('click', () => onFeatureClick(feature, layer))
                }
              }}
            />
          ))}

        {/* Renderizar capas de puntos como CircleMarkers */}
        {layers
          .filter(layer => layer.visible && layer.type === 'points' && Array.isArray(layer.data))
          .map(layer =>
            layer.data
              .filter((point: any) => point.lat && point.lng)
              .map((point: any, index: number) => (
                <CircleMarker
                  key={`${layer.id}-${index}`}
                  center={[point.lat, point.lng]}
                  {...getPointStyle(layer)}
                >
                  <Popup maxWidth={320} className="custom-point-popup">
                    <div dangerouslySetInnerHTML={{ __html: createPointPopup(point) }} />
                  </Popup>
                </CircleMarker>
              ))
          )}

        {/* Controles de mapa */}
        {mapReady && mapRef.current && (
          <MapControls
            map={mapRef.current}
            layers={layers}
            enableFullscreen={enableFullscreen}
            enableCenterView={enableCenterView}
            onFullscreen={toggleFullscreen}
          />
        )}
      </MapContainer>

      {/* Panel de controles de capas */}
      {enableLayerControls && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Capas del Mapa</span>
          </div>
          <div className="space-y-3">
            {layers
              .filter(layer => layer.id !== 'unidadesProyecto') // Excluir Unidades de Proyecto
              .map(layer => {
                const layerName = layer.id === 'infraestructura' ? 'Vías' : layer.name
                const iconColor = layer.visible ? 'text-green-500' : 'text-gray-400'
                const bgColor = layer.visible 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                
                return (
                  <div
                    key={layer.id}
                    onClick={() => onLayerToggle?.(layer.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${bgColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                        layer.visible 
                          ? layer.id === 'equipamientos' 
                            ? 'bg-green-500' 
                            : 'bg-orange-500'
                          : 'bg-gray-300'
                      }`} />
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        layer.visible 
                          ? 'text-gray-800 dark:text-gray-200' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {layerName}
                      </span>
                    </div>
                    <div className={`transition-colors duration-200 ${iconColor}`}>
                      {layer.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Estilos CSS */}
      <style jsx global>{`
        .custom-point-popup .leaflet-popup-content {
          margin: 8px 12px;
          line-height: 1.4;
        }
        .custom-point-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #E5E7EB;
        }
        .leaflet-popup-close-button {
          color: #6B7280 !important;
          font-size: 18px !important;
          padding: 4px 6px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #374151 !important;
        }
      `}</style>
    </div>
  )
}

export default UniversalMapCore

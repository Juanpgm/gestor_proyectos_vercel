'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { Maximize2, Target } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { configureLeafletIcons } from '@/utils/leafletConfig'
import { generateLayerStyle, getCategoryColor } from '@/utils/mapStyleUtils'

// Coordenadas de Cali
const CALI_CENTER: [number, number] = [3.4516, -76.5320]
const CALI_ZOOM = 10 // Zoom máximo limitado para mejor vista del área metropolitana

// Tipos para el mapa optimizado
interface LayerConfig {
  id: string
  name: string
  visible: boolean
  color: string
  opacity: number
  type: 'geojson' | 'points'
  categorization?: {
    type: string
    property: string
    config: any
  }
}

interface OptimizedMapCoreProps {
  data: Record<string, any>
  layerConfigs: LayerConfig[]
  onFeatureClick?: (feature: any, layerType: string) => void
  height: string
  className?: string
}

// Componente para controles del mapa
const MapControls: React.FC<{
  onFullscreen: () => void
  onCenter: () => void
}> = ({ onFullscreen, onCenter }) => {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer().parentElement
    if (!container) return

    // Crear controles
    const controlsDiv = document.createElement('div')
    controlsDiv.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `

    // Botón de pantalla completa
    const fullscreenBtn = document.createElement('button')
    fullscreenBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
    `
    fullscreenBtn.style.cssText = `
      width: 36px;
      height: 36px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      color: #475569;
      transition: all 0.2s;
    `
    fullscreenBtn.onmouseenter = () => {
      fullscreenBtn.style.background = '#3b82f6'
      fullscreenBtn.style.color = 'white'
    }
    fullscreenBtn.onmouseleave = () => {
      fullscreenBtn.style.background = 'white'
      fullscreenBtn.style.color = '#475569'
    }
    fullscreenBtn.onclick = onFullscreen

    // Botón de centrar
    const centerBtn = document.createElement('button')
    centerBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 14v6m11-7h-6m-14 0h6"/>
      </svg>
    `
    centerBtn.style.cssText = fullscreenBtn.style.cssText
    centerBtn.onmouseenter = () => {
      centerBtn.style.background = '#10b981'
      centerBtn.style.color = 'white'
    }
    centerBtn.onmouseleave = () => {
      centerBtn.style.background = 'white'
      centerBtn.style.color = '#475569'
    }
    centerBtn.onclick = onCenter

    controlsDiv.appendChild(fullscreenBtn)
    controlsDiv.appendChild(centerBtn)
    container.appendChild(controlsDiv)

    return () => {
      if (controlsDiv.parentNode) {
        controlsDiv.parentNode.removeChild(controlsDiv)
      }
    }
  }, [map, onFullscreen, onCenter])

  return null
}

const OptimizedMapCore: React.FC<OptimizedMapCoreProps> = ({
  data,
  layerConfigs,
  onFeatureClick,
  height
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Configurar iconos de Leaflet al inicializar
  useEffect(() => {
    configureLeafletIcons()
  }, [])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 100)
  }, [isFullscreen])

  // Center on Cali
  const centerOnCali = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setView(CALI_CENTER, CALI_ZOOM)
    }
  }, [])

  // Crear estilos para cada capa basado en su configuración y categorización
  const getLayerStyle = useCallback((layerId: string, feature?: any) => {
    const config = layerConfigs.find(c => c.id === layerId)
    if (!config) return {}

    // Si hay categorización, usar color dinámico
    if (config.categorization && feature) {
      const categoryColor = getCategoryColor(feature, config.categorization.config, config.color)
      return {
        color: categoryColor,
        fillColor: categoryColor,
        weight: layerId.includes('infraestructura') ? 4 : 2,
        opacity: config.opacity,
        fillOpacity: config.opacity * 0.6,
        lineCap: 'round' as const,
        lineJoin: 'round' as const
      }
    }

    // Estilo por defecto
    return {
      color: config.color,
      fillColor: config.color,
      weight: layerId.includes('infraestructura') ? 4 : 2,
      opacity: config.opacity,
      fillOpacity: config.opacity * 0.6,
      lineCap: 'round' as const,
      lineJoin: 'round' as const
    }
  }, [layerConfigs])

  console.log('🗺️ OptimizedMapCore render:', {
    dataKeys: Object.keys(data),
    layerConfigs: layerConfigs.map(c => ({ id: c.id, visible: c.visible }))
  })

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative w-full'} style={{ height: isFullscreen ? '100vh' : height }}>
      <MapContainer
        ref={mapRef}
        center={CALI_CENTER}
        zoom={CALI_ZOOM}
        minZoom={9} // Zoom mínimo para evitar salirse demasiado del área de interés
        maxZoom={18} // Zoom máximo para permitir ver detalles
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl"
      >
        {/* Capa base */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Renderizar capas GeoJSON */}
        {Object.entries(data).map(([layerId, geoJSONData]) => {
          const config = layerConfigs.find(c => c.id === layerId)
          if (!config?.visible || !geoJSONData?.features) return null

          console.log(`🎨 Renderizando capa: ${layerId}`, {
            features: geoJSONData.features.length,
            visible: config.visible,
            color: config.color
          })

          return (
            <GeoJSON
              key={`${layerId}-${config.color}-${config.opacity}-${config.visible}-${config.categorization?.type || 'none'}`}
              data={geoJSONData}
              style={(feature) => getLayerStyle(layerId, feature)}
              onEachFeature={(feature, layer) => {
                if (onFeatureClick) {
                  layer.on('click', () => {
                    console.log(`🎯 Click en ${layerId}:`, feature.properties)
                    onFeatureClick(feature, layerId)
                  })
                  
                  // Mejora visual al hacer hover
                  layer.on('mouseover', () => {
                    const pathLayer = layer as any
                    if (pathLayer.setStyle) {
                      pathLayer.setStyle({
                        weight: 6,
                        opacity: 1
                      })
                    }
                  })
                  
                  layer.on('mouseout', () => {
                    const pathLayer = layer as any
                    if (pathLayer.setStyle) {
                      pathLayer.setStyle(getLayerStyle(layerId, feature))
                    }
                  })
                }
              }}
            />
          )
        })}

        {/* Controles del mapa */}
        <MapControls
          onFullscreen={toggleFullscreen}
          onCenter={centerOnCali}
        />
      </MapContainer>

      {/* Indicador de capas visibles */}
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg shadow-lg p-2 text-xs">
        <div className="font-medium text-gray-700 mb-1">Capas Activas:</div>
        {layerConfigs.filter(c => c.visible).map(config => (
          <div key={config.id} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: config.color }}
            />
            <span className="text-gray-600">{config.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OptimizedMapCore

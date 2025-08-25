'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Maximize2, Target, Layers, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createRoot } from 'react-dom/client'

import { CALI_COORDINATES } from '@/utils/coordinateUtils'
import PopupGaugeChart from './PopupGaugeChart'

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
    weight: 4,
    opacity: 1,
    fillOpacity: 0.4,
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
    
    if (visibleLayers.length === 0) {
      // Si no hay capas visibles, centrar en Cali
      map.setView(CALI_COORDINATES.CENTER_LAT_LNG, CALI_COORDINATES.DEFAULT_ZOOM)
      return
    }
    
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
      // Verificar si los bounds están dentro del área de Cali
      const caliBounds = L.latLngBounds([
        [3.2, -76.8], // Southwest corner
        [3.7, -76.3]  // Northeast corner
      ])
      
      // Si los bounds están completamente fuera de Cali, centrar en Cali
      if (!caliBounds.intersects(bounds)) {
        map.setView(CALI_COORDINATES.CENTER_LAT_LNG, CALI_COORDINATES.DEFAULT_ZOOM)
      } else {
        // Expandir los bounds para incluir el centro de Cali
        bounds.extend(CALI_COORDINATES.CENTER_LAT_LNG)
        map.fitBounds(bounds, { 
          padding: [30, 30],
          maxZoom: 15 // Evitar zoom demasiado cercano
        })
      }
    } else {
      // Fallback: centrar en Cali
      map.setView(CALI_COORDINATES.CENTER_LAT_LNG, CALI_COORDINATES.DEFAULT_ZOOM)
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
      fullscreenBtn.className = 'map-control-btn fullscreen-btn'
      fullscreenBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `
      fullscreenBtn.title = 'Pantalla completa'
      fullscreenBtn.setAttribute('aria-label', 'Activar pantalla completa')
      fullscreenBtn.style.cssText = `
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
        color: #475569;
        font-weight: 600;
        position: relative;
        overflow: hidden;
      `
      
      // Efecto hover mejorado - sin transiciones conflictivas
      fullscreenBtn.addEventListener('mouseenter', () => {
        fullscreenBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        fullscreenBtn.style.color = '#ffffff'
        fullscreenBtn.style.transform = 'scale(1.05) translateY(-1px)'
        fullscreenBtn.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.35), 0 4px 12px rgba(0,0,0,0.1)'
        fullscreenBtn.style.borderColor = '#3b82f6'
      })
      
      fullscreenBtn.addEventListener('mouseleave', () => {
        fullscreenBtn.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        fullscreenBtn.style.color = '#475569'
        fullscreenBtn.style.transform = 'scale(1) translateY(0)'
        fullscreenBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
        fullscreenBtn.style.borderColor = '#e2e8f0'
      })
      
      // Efecto click
      fullscreenBtn.addEventListener('mousedown', () => {
        fullscreenBtn.style.transform = 'scale(0.98) translateY(0)'
      })
      
      fullscreenBtn.addEventListener('mouseup', () => {
        fullscreenBtn.style.transform = 'scale(1.05) translateY(-1px)'
      })
      
      fullscreenBtn.onclick = onFullscreen
      controlsContainer.appendChild(fullscreenBtn)
    }
    
    // Botón de centrar vista
    if (enableCenterView) {
      const centerBtn = document.createElement('button')
      centerBtn.className = 'map-control-btn center-btn'
      centerBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 14v6m11-7h-6m-14 0h6"/>
        </svg>
      `
      centerBtn.title = 'Centrar vista en Cali'
      centerBtn.setAttribute('aria-label', 'Centrar vista en la ciudad de Cali')
      centerBtn.style.cssText = `
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
        color: #475569;
        font-weight: 600;
        position: relative;
        overflow: hidden;
      `
      
      // Efecto hover mejorado para el botón de centrar - sin transiciones conflictivas
      centerBtn.addEventListener('mouseenter', () => {
        centerBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        centerBtn.style.color = '#ffffff'
        centerBtn.style.transform = 'scale(1.05) translateY(-1px)'
        centerBtn.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.35), 0 4px 12px rgba(0,0,0,0.1)'
        centerBtn.style.borderColor = '#10b981'
      })
      
      centerBtn.addEventListener('mouseleave', () => {
        centerBtn.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        centerBtn.style.color = '#475569'
        centerBtn.style.transform = 'scale(1) translateY(0)'
        centerBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
        centerBtn.style.borderColor = '#e2e8f0'
      })
      
      // Efecto click
      centerBtn.addEventListener('mousedown', () => {
        centerBtn.style.transform = 'scale(0.98) translateY(0)'
      })
      
      centerBtn.addEventListener('mouseup', () => {
        centerBtn.style.transform = 'scale(1.05) translateY(-1px)'
      })
      
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
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Verificar que Leaflet esté cargado
  useEffect(() => {
    if (typeof window !== 'undefined' && window.L) {
      console.log('✅ Leaflet ya está disponible')
      setLeafletLoaded(true)
      setMapReady(true) // Inicializar inmediatamente si Leaflet está listo
    } else {
      // Esperar a que Leaflet se cargue
      const checkLeaflet = setInterval(() => {
        if (typeof window !== 'undefined' && window.L) {
          console.log('✅ Leaflet cargado dinámicamente')
          setLeafletLoaded(true)
          setMapReady(true) // Inicializar inmediatamente cuando se cargue
          clearInterval(checkLeaflet)
        }
      }, 100)

      // Timeout más agresivo para forzar inicialización
      const forceInit = setTimeout(() => {
        console.log('🕒 Forzando inicialización del mapa por timeout')
        setLeafletLoaded(true)
        setMapReady(true)
        clearInterval(checkLeaflet)
      }, 1000) // 1 segundo máximo

      return () => {
        clearInterval(checkLeaflet)
        clearTimeout(forceInit)
      }
    }
  }, [])

  // Obtener estilos de capa
  const getLayerStyle = useCallback((layer: MapLayer) => {
    // Si la capa tiene estilo personalizado, usarlo
    if (layer.style) return layer.style
    
    // Colores base por defecto
    const baseColors = LAYER_COLORS[layer.id as keyof typeof LAYER_COLORS] || LAYER_COLORS.unidadesProyecto
    
    return {
      ...DEFAULT_STYLES.geojson,
      color: baseColors.stroke,
      fillColor: baseColors.fill
    }
  }, [])

  // Obtener estilo de puntos
  const getPointStyle = useCallback((layer: MapLayer) => {
    // Si la capa tiene estilo de puntos personalizado, usarlo
    if (layer.pointStyle) return layer.pointStyle
    
    // Colores base por defecto
    const baseColors = LAYER_COLORS[layer.id as keyof typeof LAYER_COLORS] || LAYER_COLORS.unidadesProyecto
    
    return {
      ...DEFAULT_STYLES.points,
      fillColor: baseColors.fill,
      color: baseColors.stroke
    }
  }, [])

  // Función helper para crear gauge chart HTML
  const createGaugeChartHTML = useCallback((progress: number) => {
    // Normalizar progreso
    const normalizedProgress = Math.max(0, Math.min(100, progress || 0))
    
    // Función para obtener el color del progreso
    const getProgressColor = (progress: number) => {
      if (progress >= 75) return '#059669' // Verde oscuro
      if (progress >= 50) return '#10B981' // Verde
      if (progress >= 25) return '#F59E0B' // Amarillo
      return '#EF4444' // Rojo
    }
    
    const progressColor = getProgressColor(normalizedProgress)
    const pendingAngle = ((100 - normalizedProgress) / 100) * 180
    const progressAngle = (normalizedProgress / 100) * 180
    
    return `
      <div style="display: inline-block; position: relative; width: 80px; height: 50px; margin: 8px 0;">
        <svg width="80" height="50" viewBox="0 0 80 50">
          <!-- Fondo del gauge -->
          <path 
            d="M 10 40 A 30 30 0 0 1 70 40" 
            fill="none" 
            stroke="#E5E7EB" 
            stroke-width="6"
            stroke-linecap="round"
          />
          <!-- Progreso del gauge -->
          <path 
            d="M 10 40 A 30 30 0 ${progressAngle > 90 ? 1 : 0} 1 ${10 + 60 * Math.cos(Math.PI - (progressAngle * Math.PI / 180))} ${40 - 30 * Math.sin(Math.PI - (progressAngle * Math.PI / 180))}" 
            fill="none" 
            stroke="${progressColor}" 
            stroke-width="6"
            stroke-linecap="round"
          />
        </svg>
        <!-- Texto central -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -20%);
          text-align: center;
        ">
          <div style="
            font-size: 14px;
            font-weight: bold;
            color: ${progressColor};
            line-height: 1;
          ">${normalizedProgress}%</div>
          <div style="
            font-size: 10px;
            color: #6B7280;
            line-height: 1;
          ">progreso</div>
        </div>
      </div>
    `
  }, [])

  // Crear popup para features GeoJSON con todas las propiedades
  const createFeaturePopup = useCallback((feature: any, layerType: string) => {
    const properties = feature.properties || {}
    
    // Función para obtener el nombre principal
    const getName = () => {
      return properties.NOMBRE || 
             properties.nombre || 
             properties.NAME || 
             properties.name ||
             properties.NOMCOMUNA ||
             properties.NOMBARRIO ||
             properties.nickname ||
             properties.identificador ||
             properties.seccion_via ||
             properties.barrio ||
             properties.comuna ||
             'Sin nombre'
    }
    
    // Obtener datos de progreso si están disponibles
    const getProgressData = () => {
      // Buscar campos de progreso en diferentes formatos
      const progressFields = [
        'avance_físico_obra',
        'avance_fisico_obra',
        'avance_fisico',
        'progreso',
        'progress',
        'porcentaje_avance',
        'avance'
      ]
      
      for (const field of progressFields) {
        if (properties[field] !== undefined && properties[field] !== null) {
          let progress = parseFloat(properties[field])
          // Si el valor está entre 0 y 1, convertir a porcentaje
          if (progress >= 0 && progress <= 1) {
            progress = progress * 100
          }
          return Math.max(0, Math.min(100, progress))
        }
      }
      
      return null
    }
    
    const progressValue = getProgressData()
    
    // Función para formatear valores
    const formatValue = (value: any) => {
      if (value === null || value === undefined || value === '') {
        return '<span style="color: #9CA3AF; font-style: italic;">No especificado</span>'
      }
      
      if (typeof value === 'number') {
        // Formatear números grandes como moneda si parecen presupuestos
        if (value > 10000) {
          return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP',
            minimumFractionDigits: 0 
          }).format(value)
        }
        return value.toLocaleString('es-CO')
      }
      
      if (typeof value === 'string' && value.length > 100) {
        return `${value.substring(0, 100)}...`
      }
      
      return value.toString()
    }
    
    // Función para categorizar propiedades
    const categorizeProperty = (key: string) => {
      const keyLower = key.toLowerCase()
      
      if (keyLower.includes('bpin') || keyLower.includes('identificador') || keyLower.includes('id')) {
        return 'identification'
      }
      if (keyLower.includes('comuna') || keyLower.includes('barrio') || keyLower.includes('corregimiento') || keyLower.includes('vereda')) {
        return 'location'
      }
      if (keyLower.includes('presupuesto') || keyLower.includes('valor') || keyLower.includes('ppto') || keyLower.includes('pagos')) {
        return 'financial'
      }
      if (keyLower.includes('fecha') || keyLower.includes('date')) {
        return 'dates'
      }
      if (keyLower.includes('estado') || keyLower.includes('avance') || keyLower.includes('progreso')) {
        return 'status'
      }
      return 'general'
    }
    
    // Agrupar propiedades por categoría
    const categorizedProps = Object.entries(properties).reduce((acc, [key, value]) => {
      const category = categorizeProperty(key)
      if (!acc[category]) acc[category] = []
      acc[category].push([key, value])
      return acc
    }, {} as Record<string, [string, any][]>)
    
    // Orden de categorías
    const categoryOrder = ['identification', 'location', 'financial', 'status', 'dates', 'general']
    const categoryIcons = {
      identification: '🆔',
      location: '📍',
      financial: '💰',
      status: '📊',
      dates: '📅',
      general: '📋'
    }
    const categoryNames = {
      identification: 'Identificación',
      location: 'Ubicación',
      financial: 'Financiero',
      status: 'Estado',
      dates: 'Fechas',
      general: 'General'
    }
    
    // Generar secciones por categoría
    const renderCategory = (category: string, props: [string, any][]) => {
      if (!props || props.length === 0) return ''
      
      return `
        <div style="margin-top: 12px;">
          <h5 style="
            margin: 0 0 6px 0;
            color: #374151;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 2px;
          ">
            ${categoryIcons[category as keyof typeof categoryIcons]} ${categoryNames[category as keyof typeof categoryNames]}
          </h5>
          <div style="display: grid; gap: 3px; margin-left: 8px;">
            ${props.map(([key, value]) => `
              <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px; align-items: start;">
                <span style="
                  color: #6B7280; 
                  font-size: 12px; 
                  font-weight: 500;
                  text-transform: capitalize;
                  word-break: break-word;
                ">${key.replace(/_/g, ' ')}:</span>
                <span style="
                  color: #1F2937; 
                  font-size: 12px; 
                  font-weight: 400;
                  word-break: break-word;
                ">${formatValue(value)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }
    
    return `
      <div style="
        min-width: 300px; 
        max-width: 400px;
        font-family: system-ui, -apple-system, sans-serif;
        max-height: 400px;
        overflow-y: auto;
      ">
        <div style="
          background: linear-gradient(135deg, 
            ${layerType.includes('equipamiento') ? '#D1FAE5, #A7F3D0' : 
              layerType.includes('infraestructura') || layerType.includes('vias') ? '#FEF3C7, #FDE68A' : 
              '#DBEAFE, #BFDBFE'});
          margin: -8px -12px 12px -12px;
          padding: 12px;
          border-radius: 8px 8px 0 0;
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div style="flex: 1;">
              <h4 style="
                margin: 0; 
                color: #1F2937; 
                font-size: 16px; 
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(255,255,255,0.8);
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                ${layerType.includes('equipamiento') ? '🏢' : 
                  layerType.includes('infraestructura') || layerType.includes('vias') ? '🛣️' : '📍'}
                ${getName()}
              </h4>
              <div style="
                margin-top: 4px; 
                padding: 4px 8px; 
                background: rgba(255,255,255,0.7);
                border-radius: 4px;
                display: inline-block;
              ">
                <span style="
                  font-size: 11px; 
                  color: ${layerType.includes('equipamiento') ? '#065F46' : 
                          layerType.includes('infraestructura') || layerType.includes('vias') ? '#92400E' : '#1E40AF'};
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">
                  ${layerType.includes('equipamiento') ? 'Equipamiento' : 
                    layerType.includes('infraestructura') || layerType.includes('vias') ? 'Infraestructura Vial' : 
                    layerType.charAt(0).toUpperCase() + layerType.slice(1)}
                </span>
              </div>
            </div>
            ${progressValue !== null ? `
              <div style="flex-shrink: 0;">
                ${createGaugeChartHTML(progressValue)}
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="font-size: 13px;">
          ${categoryOrder
            .filter(category => categorizedProps[category])
            .map(category => renderCategory(category, categorizedProps[category]))
            .join('')}
        </div>
        
        <div style="
          margin-top: 12px;
          padding: 8px;
          background-color: #F9FAFB;
          border-radius: 6px;
          border-left: 3px solid #3B82F6;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #6B7280; font-weight: 500;">
              Total propiedades: ${Object.keys(properties).length}
            </span>
            <span style="font-size: 11px; color: #3B82F6; font-weight: 600;">
              GeoJSON Feature
            </span>
          </div>
        </div>
      </div>
    `
  }, [createGaugeChartHTML])

  // Crear popup para puntos (CircleMarkers) con todas las propiedades
  const createPointPopup = useCallback((point: any) => {
    // Función para obtener el nombre principal
    const getName = () => {
      return point.name ||
             point.NOMBRE || 
             point.nombre || 
             point.NAME ||
             point.titulo ||
             point.proyecto ||
             point.nickname ||
             point.identificador ||
             'Proyecto sin nombre'
    }
    
    // Obtener datos de progreso
    const getProgressData = () => {
      // Buscar campos de progreso
      if (point.progress !== undefined && point.progress !== null) {
        return Math.max(0, Math.min(100, point.progress))
      }
      
      // Buscar otros campos posibles
      const progressFields = [
        'avance_físico_obra',
        'avance_fisico_obra', 
        'avance_fisico',
        'progreso',
        'porcentaje_avance',
        'avance'
      ]
      
      for (const field of progressFields) {
        if (point[field] !== undefined && point[field] !== null) {
          let progress = parseFloat(point[field])
          // Si el valor está entre 0 y 1, convertir a porcentaje
          if (progress >= 0 && progress <= 1) {
            progress = progress * 100
          }
          return Math.max(0, Math.min(100, progress))
        }
      }
      
      return null
    }
    
    const progressValue = getProgressData()
    
    // Función para formatear valores (reutilizar la lógica de createFeaturePopup)
    const formatValue = (value: any) => {
      if (value === null || value === undefined || value === '') {
        return '<span style="color: #9CA3AF; font-style: italic;">No especificado</span>'
      }
      
      if (typeof value === 'number') {
        // Formatear números grandes como moneda si parecen presupuestos
        if (value > 10000) {
          return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP',
            minimumFractionDigits: 0 
          }).format(value)
        }
        return value.toLocaleString('es-CO')
      }
      
      if (typeof value === 'string' && value.length > 100) {
        return `${value.substring(0, 100)}...`
      }
      
      return value.toString()
    }
    
    // Función para categorizar propiedades
    const categorizeProperty = (key: string) => {
      const keyLower = key.toLowerCase()
      
      if (keyLower.includes('bpin') || keyLower.includes('identificador') || keyLower.includes('id')) {
        return 'identification'
      }
      if (keyLower.includes('comuna') || keyLower.includes('barrio') || keyLower.includes('corregimiento') || keyLower.includes('vereda') || keyLower.includes('direccion')) {
        return 'location'
      }
      if (keyLower.includes('presupuesto') || keyLower.includes('valor') || keyLower.includes('budget') || keyLower.includes('pagos') || keyLower.includes('executed')) {
        return 'financial'
      }
      if (keyLower.includes('fecha') || keyLower.includes('date') || keyLower.includes('start') || keyLower.includes('end')) {
        return 'dates'
      }
      if (keyLower.includes('estado') || keyLower.includes('status') || keyLower.includes('progress') || keyLower.includes('avance')) {
        return 'status'
      }
      if (keyLower.includes('tipo') || keyLower.includes('clase') || keyLower.includes('intervencion') || keyLower.includes('descripcion')) {
        return 'project'
      }
      return 'general'
    }
    
    // Agrupar propiedades por categoría
    const categorizedProps = Object.entries(point).reduce((acc, [key, value]) => {
      // Filtrar propiedades internas o geométricas
      if (key.startsWith('_') || key === 'geometry' || key === 'lat' || key === 'lng') {
        return acc
      }
      
      const category = categorizeProperty(key)
      if (!acc[category]) acc[category] = []
      acc[category].push([key, value])
      return acc
    }, {} as Record<string, [string, any][]>)
    
    // Orden de categorías para unidades de proyecto
    const categoryOrder = ['identification', 'project', 'location', 'financial', 'status', 'dates', 'general']
    const categoryIcons = {
      identification: '🆔',
      project: '🏗️',
      location: '📍',
      financial: '💰',
      status: '📊',
      dates: '📅',
      general: '📋'
    }
    const categoryNames = {
      identification: 'Identificación',
      project: 'Proyecto',
      location: 'Ubicación',
      financial: 'Financiero',
      status: 'Estado',
      dates: 'Fechas',
      general: 'General'
    }
    
    // Generar secciones por categoría
    const renderCategory = (category: string, props: [string, any][]) => {
      if (!props || props.length === 0) return ''
      
      return `
        <div style="margin-top: 12px;">
          <h5 style="
            margin: 0 0 6px 0;
            color: #374151;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 2px;
          ">
            ${categoryIcons[category as keyof typeof categoryIcons]} ${categoryNames[category as keyof typeof categoryNames]}
          </h5>
          <div style="display: grid; gap: 3px; margin-left: 8px;">
            ${props.map(([key, value]) => `
              <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px; align-items: start;">
                <span style="
                  color: #6B7280; 
                  font-size: 12px; 
                  font-weight: 500;
                  text-transform: capitalize;
                  word-break: break-word;
                ">${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()}:</span>
                <span style="
                  color: #1F2937; 
                  font-size: 12px; 
                  font-weight: 400;
                  word-break: break-word;
                ">${formatValue(value)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }
    
    return `
      <div style="
        min-width: 320px; 
        max-width: 420px;
        font-family: system-ui, -apple-system, sans-serif;
        max-height: 450px;
        overflow-y: auto;
      ">
        <div style="
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          margin: -8px -12px 12px -12px;
          padding: 14px;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div style="flex: 1;">
              <h4 style="
                margin: 0; 
                color: white; 
                font-size: 16px; 
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                📍 ${getName()}
              </h4>
              <div style="
                margin-top: 6px; 
                padding: 4px 8px; 
                background: rgba(255,255,255,0.2);
                border-radius: 4px;
                display: inline-block;
              ">
                <span style="
                  font-size: 11px; 
                  color: white;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">
                  Unidad de Proyecto
                </span>
              </div>
            </div>
            ${progressValue !== null ? `
              <div style="flex-shrink: 0;">
                <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 8px;">
                  ${createGaugeChartHTML(progressValue)}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="font-size: 13px;">
          ${categoryOrder
            .filter(category => categorizedProps[category])
            .map(category => renderCategory(category, categorizedProps[category]))
            .join('')}
        </div>
        
        <div style="
          margin-top: 12px;
          padding: 8px;
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
          border-radius: 6px;
          border-left: 3px solid #3B82F6;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #6B7280; font-weight: 500;">
              Total propiedades: ${Object.keys(point).filter(k => !k.startsWith('_') && k !== 'geometry' && k !== 'lat' && k !== 'lng').length}
            </span>
            <span style="font-size: 11px; color: #3B82F6; font-weight: 600;">
              Punto GeoJSON
            </span>
          </div>
        </div>
      </div>
    `
  }, [createGaugeChartHTML])

  // Manejar pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (!mapRef.current) return
    
    const container = mapRef.current.getContainer().parentElement
    if (!container) return
    
    if (!isFullscreen) {
      // Entrar en pantalla completa
      try {
        const fullscreenPromise = container.requestFullscreen?.() || 
                                  (container as any).webkitRequestFullscreen?.() || 
                                  (container as any).msRequestFullscreen?.() || 
                                  Promise.resolve()
        
        fullscreenPromise
          .then(() => {
            setIsFullscreen(true)
            // Invalidar tamaño del mapa después del cambio
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.invalidateSize()
              }
            }, 150)
          })
          .catch(err => {
            console.warn('No se pudo activar pantalla completa:', err)
            // Fallback: simular pantalla completa con CSS
            container.style.position = 'fixed'
            container.style.top = '0'
            container.style.left = '0'
            container.style.width = '100vw'
            container.style.height = '100vh'
            container.style.zIndex = '9999'
            container.style.background = 'white'
            setIsFullscreen(true)
          })
      } catch (error) {
        console.warn('Error al activar pantalla completa:', error)
      }
    } else {
      // Salir de pantalla completa
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen?.()
            .then(() => {
              setIsFullscreen(false)
            })
            .catch(err => {
              console.warn('Error al salir de pantalla completa:', err)
              setIsFullscreen(false)
            })
        } else {
          // Salir del modo simulado
          container.style.position = ''
          container.style.top = ''
          container.style.left = ''
          container.style.width = ''
          container.style.height = ''
          container.style.zIndex = ''
          container.style.background = ''
          setIsFullscreen(false)
        }
        
        // Invalidar tamaño del mapa
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize()
          }
        }, 150)
      } catch (error) {
        console.warn('Error al salir de pantalla completa:', error)
        setIsFullscreen(false)
      }
    }
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

  // Mostrar loader solo si realmente necesario
  if (!leafletLoaded || !mapReady) {
    // Forzar inicialización después de un tiempo muy corto
    setTimeout(() => {
      if (!leafletLoaded) setLeafletLoaded(true)
      if (!mapReady) setMapReady(true)
    }, 500)
    
    return (
      <div className="relative w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Inicializando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full ${isFullscreen ? 'h-screen' : ''}`} style={{ height: isFullscreen ? '100vh' : height }}>
      <MapContainer
        ref={mapRef}
        center={CALI_COORDINATES.CENTER_LAT_LNG}
        zoom={CALI_COORDINATES.DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl"
        preferCanvas={true}
        whenReady={() => {
          console.log('🗺️ Mapa listo - whenReady ejecutado')
          setMapReady(true)
          // Asegurar que el mapa esté centrado en Cali al inicializar
          if (mapRef.current) {
            mapRef.current.setView(CALI_COORDINATES.CENTER_LAT_LNG, CALI_COORDINATES.DEFAULT_ZOOM)
            console.log('🎯 Mapa centrado en Cali')
          }
        }}
        maxBounds={[
          [3.0, -77.0], // Southwest corner - área ampliada alrededor de Cali
          [4.0, -76.0]  // Northeast corner
        ]}
        maxBoundsViscosity={0.5} // Permite un poco de movimiento fuera de los límites
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
                // Solo agregar evento de click, sin popup
                if (onFeatureClick) {
                  leafletLayer.on('click', (e) => {
                    // Llamar al handler de click
                    onFeatureClick(feature, layer)
                    
                    // Zoom al feature clickeado
                    if (mapRef.current) {
                      if (feature.geometry.type === 'Point') {
                        // Para puntos, hacer zoom con flyTo
                        const coords = feature.geometry.coordinates
                        mapRef.current.flyTo([coords[1], coords[0]], 16, {
                          duration: 1.5
                        })
                      } else {
                        // Para polígonos/líneas, hacer fitBounds
                        const featureLayer = e.target
                        if (featureLayer.getBounds) {
                          mapRef.current.fitBounds(featureLayer.getBounds(), {
                            padding: [20, 20],
                            maxZoom: 16,
                            duration: 1.5
                          })
                        }
                      }
                    }
                  })
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
                  eventHandlers={onFeatureClick ? {
                    click: () => {
                      // Llamar al handler de click
                      onFeatureClick(point, layer)
                      
                      // Zoom al punto clickeado
                      if (mapRef.current) {
                        mapRef.current.flyTo([point.lat, point.lng], 16, {
                          duration: 1.5
                        })
                      }
                    }
                  } : {}}
                >
                  {/* Popup removido - las propiedades se muestran en el panel lateral */}
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
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 max-w-xs">
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

      {/* Estilos CSS mejorados para popups expandidos */}
      <style jsx global>{`
        .custom-point-popup .leaflet-popup-content {
          margin: 8px 12px;
          line-height: 1.4;
          max-height: 450px;
          overflow-y: auto;
        }
        .custom-point-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #E5E7EB;
          max-width: 450px;
          min-width: 320px;
        }
        
        /* Estilos para popups de features GeoJSON */
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #E5E7EB;
          max-width: 450px;
          min-width: 300px;
        }
        
        .leaflet-popup-content {
          margin: 8px 12px;
          line-height: 1.4;
          max-height: 450px;
          overflow-y: auto;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        /* Scrollbar personalizado para webkit */
        .leaflet-popup-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .leaflet-popup-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .leaflet-popup-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .leaflet-popup-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .leaflet-popup-close-button {
          color: #6B7280 !important;
          font-size: 18px !important;
          padding: 4px 6px !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 50% !important;
          margin: 4px !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
        }
        
        .leaflet-popup-close-button:hover {
          color: #374151 !important;
          background: rgba(255, 255, 255, 1) !important;
          transform: scale(1.1) !important;
        }
        
        /* Tip del popup */
        .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Animación suave para abrir popup */
        .leaflet-popup {
          animation: popupFadeIn 0.3s ease-out;
        }
        
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default UniversalMapCore

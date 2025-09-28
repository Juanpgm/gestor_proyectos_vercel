'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Layers, Map, Satellite, Sun, Moon } from 'lucide-react'
import type { UnidadProyectoMock } from '../data/mockUnidadesProyecto'
import dynamic from 'next/dynamic'

// Tipos para el mapa
type MapType = 'street' | 'satellite' | 'hybrid'
type MapTheme = 'light' | 'dark'

// Interfaz para el componente del mapa
interface LeafletMapComponentProps {
  id: string
  className: string
  center: { lat: number; lng: number }
  zoom: number
  mapType: MapType
  onMapReady: (map: any) => void
}

// Componente del mapa dinámico mejorado
const LeafletMapComponent = dynamic(() => Promise.resolve(
  React.forwardRef<HTMLDivElement, LeafletMapComponentProps>((props, ref) => {
    const mapRef = useRef<any>(null)
    const divRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      let L: any = null
      let map: any = null
      let tileLayer: any = null

      const initMap = async () => {
        if (typeof window !== 'undefined' && !mapRef.current && divRef.current) {
          try {
            // Importar Leaflet dinámicamente
            L = await import('leaflet')
            
            // Fix para los iconos de Leaflet
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: '/leaflet/marker-icon-2x.png',
              iconUrl: '/leaflet/marker-icon.png',
              shadowUrl: '/leaflet/marker-shadow.png',
            })
            
            map = L.map(props.id).setView([props.center.lat, props.center.lng], props.zoom)
            
            // Agregar capa base
            tileLayer = props.mapType === 'satellite' 
              ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                  attribution: 'Tiles &copy; Esri',
                  maxZoom: 18
                })
              : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                  maxZoom: 18
                })
            
            tileLayer.addTo(map)
            mapRef.current = { map, tileLayer, L }
            
            if (props.onMapReady) {
              props.onMapReady(map)
            }
          } catch (error) {
            console.error('Error inicializando el mapa:', error)
          }
        }
      }

      // Pequeño delay para asegurar que el DOM esté listo
      const timer = setTimeout(initMap, 100)
      
      return () => {
        clearTimeout(timer)
        if (mapRef.current?.map) {
          try {
            mapRef.current.map.remove()
          } catch (error) {
            console.error('Error al limpiar el mapa:', error)
          }
          mapRef.current = null
        }
      }
    }, [props.id, props.center.lat, props.center.lng, props.zoom])

    // Actualizar tipo de mapa
    useEffect(() => {
      if (mapRef.current?.tileLayer && mapRef.current?.map && mapRef.current?.L) {
        try {
          mapRef.current.map.removeLayer(mapRef.current.tileLayer)
          
          const newTileLayer = props.mapType === 'satellite' 
            ? mapRef.current.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 18
              })
            : mapRef.current.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
              })
          
          newTileLayer.addTo(mapRef.current.map)
          mapRef.current.tileLayer = newTileLayer
        } catch (error) {
          console.error('Error actualizando tipo de mapa:', error)
        }
      }
    }, [props.mapType])

    return <div ref={divRef} id={props.id} className={props.className} />
  })
), { ssr: false })

// Tipos para configuración de visualización
interface MapVisualizationConfig {
  variable: string
  label: string
  type: 'progress' | 'budget' | 'category'
  getColor: (value: any) => string
  getValue: (item: any) => any
  formatValue: (value: any) => string
}

interface UnidadesProyectoMapViewProps {
  data: (UnidadProyectoMock & {
    visualizationColor?: string
    visualizationValue?: any
    visualizationLabel?: string
  })[]
  loading: boolean
  onPointClick?: (item: UnidadProyectoMock) => void
  visualizationConfig?: MapVisualizationConfig
}

// Configuración de límites de Santiago de Cali
const CALI_BOUNDS = {
  north: 3.5844,
  south: 3.3137,
  east: -76.4556,
  west: -76.6644
}

// Centro de Santiago de Cali
const CALI_CENTER = {
  lat: 3.4516,
  lng: -76.5320
}

// Componente de mapa mejorado para Santiago de Cali
export default function UnidadesProyectoMapView({ 
  data, 
  loading, 
  onPointClick,
  visualizationConfig
}: UnidadesProyectoMapViewProps) {
  // Estados del mapa
  const [mapType, setMapType] = useState<MapType>('street')
  const [mapTheme, setMapTheme] = useState<MapTheme>('light')
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detectar tema del sistema
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
      setMapTheme(isDark ? 'dark' : 'light')
    }

    checkDarkMode()
    
    // Observar cambios en el tema
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // Filtrar datos con coordenadas válidas dentro de los límites de Cali
  const dataWithCoordinates = useMemo(() => {
    return data.filter(item => {
      // Verificar múltiples fuentes de coordenadas
      let coordinates: [number, number] | null = null
      
      if (item.geometry?.coordinates && item.geometry.coordinates.length === 2) {
        coordinates = item.geometry.coordinates as [number, number]
      } else if (item.coordinates?.lat && item.coordinates?.lng) {
        // Convertir de {lat, lng} a [lng, lat] para compatibilidad GeoJSON
        coordinates = [item.coordinates.lng, item.coordinates.lat]
      }
      
      if (!coordinates) return false
      
      const [lng, lat] = coordinates
      if (isNaN(lng) || isNaN(lat)) return false

      // Verificar que las coordenadas estén dentro de los límites de Cali
      return lat >= CALI_BOUNDS.south && lat <= CALI_BOUNDS.north &&
             lng >= CALI_BOUNDS.west && lng <= CALI_BOUNDS.east
    })
  }, [data])

  // Función para normalizar coordenadas de Cali a porcentajes del mapa
  const normalizeCoordinate = (lng: number, lat: number) => {
    const x = ((lng - CALI_BOUNDS.west) / (CALI_BOUNDS.east - CALI_BOUNDS.west)) * 100
    const y = ((lat - CALI_BOUNDS.south) / (CALI_BOUNDS.north - CALI_BOUNDS.south)) * 100
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  }

  // Agrupar puntos por proximidad para evitar superposición
  const clusteredPoints = useMemo(() => {
    if (dataWithCoordinates.length === 0) return []

    const gridSize = 3 // Tamaño más pequeño para mejor precisión en Cali
    const clusters: Record<string, UnidadProyectoMock[]> = {}

    dataWithCoordinates.forEach(item => {
      // Obtener coordenadas de múltiples fuentes
      let coordinates: [number, number] | null = null
      
      if (item.geometry?.coordinates && item.geometry.coordinates.length === 2) {
        coordinates = item.geometry.coordinates as [number, number]
      } else if (item.coordinates?.lat && item.coordinates?.lng) {
        coordinates = [item.coordinates.lng, item.coordinates.lat]
      }
      
      if (!coordinates) return
      
      const [lng, lat] = coordinates
      const { x, y } = normalizeCoordinate(lng, lat)
      
      // Crear clave de cluster basada en grilla
      const clusterX = Math.floor(x / gridSize) * gridSize
      const clusterY = Math.floor(y / gridSize) * gridSize
      const clusterKey = `${clusterX},${clusterY}`

      if (!clusters[clusterKey]) {
        clusters[clusterKey] = []
      }
      clusters[clusterKey].push(item)
    })

    // Convertir clusters a array con información de posición
    return Object.entries(clusters).map(([key, items]) => {
      const [x, y] = key.split(',').map(Number)
      const totalPresupuesto = items.reduce((sum, item) => sum + (item.properties?.presupuesto_base || item.presupuesto_base || 0), 0)
      const avgAvance = items.reduce((sum, item) => sum + (item.properties?.avance_obra || item.avance_obra || 0), 0) / items.length

      return {
        x: x + gridSize / 2, // Centro del cluster
        y: y + gridSize / 2,
        items,
        count: items.length,
        totalPresupuesto,
        avgAvance,
        representative: items[0]
      }
    })
  }, [dataWithCoordinates])

  // Función para obtener color basado en el avance
  const getPointColor = (avance: number) => {
    if (avance >= 1) return '#10b981' // Verde - Completado
    if (avance >= 0.7) return '#3b82f6' // Azul - Avanzado
    if (avance >= 0.3) return '#f59e0b' // Amarillo - En progreso
    return '#ef4444' // Rojo - Poco avance
  }

  // Función para obtener tamaño del punto basado en presupuesto
  const getPointSize = (presupuesto: number, count: number) => {
    const baseSize = Math.max(6, Math.min(20, Math.log10(presupuesto + 1) * 2))
    const clusterMultiplier = Math.max(1, Math.min(2, Math.log10(count + 1) * 0.5))
    return baseSize * clusterMultiplier
  }

  // Función para obtener el estilo del mapa de fondo
  const getMapBackground = () => {
    if (mapType === 'satellite') {
      return isDarkMode 
        ? 'linear-gradient(45deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        : 'linear-gradient(45deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)'
    }
    
    return isDarkMode
      ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 25%, #1a202c 50%, #2d3748 75%, #4a5568 100%)'
      : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 25%, #e2e8f0 50%, #cbd5e0 75%, #a0aec0 100%)'
  }

  // Función para obtener el color de las calles/grid
  const getGridColor = () => {
    if (mapType === 'satellite') {
      return isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'
    }
    return isDarkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(156, 163, 175, 0.2)'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    )
  }

  if (dataWithCoordinates.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vista Geográfica
          </h3>
        </div>
        <div className="text-center py-12">
          <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos con coordenadas geográficas disponibles
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mapa de Santiago de Cali
          </h3>
        </div>
        
        {/* Controles del mapa */}
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dataWithCoordinates.length} proyectos
          </div>
          
          {/* Selector de tipo de mapa */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setMapType('street')}
              className={`px-3 py-1 text-xs ${
                mapType === 'street'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Vista de calles"
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1 text-xs ${
                mapType === 'satellite'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Vista satelital"
            >
              <Satellite className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mapa de Leaflet */}
      <div className="relative rounded-lg h-[500px] overflow-hidden border border-gray-200 dark:border-gray-700">
        <LeafletMapComponent 
          id="cali-map"
          className="w-full h-full rounded-lg"
          center={CALI_CENTER}
          zoom={12}
          mapType={mapType}
          onMapReady={async (map: any) => {
            try {
              // Agregar marcadores para cada proyecto
              const L = await import('leaflet')
              
              dataWithCoordinates.forEach(item => {
              // Obtener coordenadas de múltiples fuentes
              let coordinates: [number, number] | null = null
              
              if (item.geometry?.coordinates && item.geometry.coordinates.length === 2) {
                coordinates = item.geometry.coordinates as [number, number]
              } else if (item.coordinates?.lat && item.coordinates?.lng) {
                coordinates = [item.coordinates.lng, item.coordinates.lat]
              }
              
              if (!coordinates) return
              
              const [lng, lat] = coordinates
              
              if (lat && lng && lat >= CALI_BOUNDS.south && lat <= CALI_BOUNDS.north && 
                  lng >= CALI_BOUNDS.west && lng <= CALI_BOUNDS.east) {
                
                // Usar configuración de visualización o fallback basado en avance
                const avance = item.properties?.avance_obra || item.avance_obra || 0
                const defaultColor = getPointColor(avance)
                const color = item.visualizationColor || defaultColor
                const value = item.visualizationValue
                const label = item.visualizationLabel
                
                // Tamaño más pequeño y refinado
                const size = Math.max(6, Math.min(12, 8))
                
                // Crear icono personalizado más pequeño
                const customIcon = L.divIcon({
                  className: 'custom-marker-refined',
                  html: `
                    <div style="
                      width: ${size}px;
                      height: ${size}px;
                      background-color: ${color};
                      border: 1px solid ${isDarkMode ? '#1f2937' : '#ffffff'};
                      border-radius: 50%;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                      opacity: 0.9;
                    "></div>
                  `,
                  iconSize: [size, size],
                  iconAnchor: [size/2, size/2]
                })
                
                const marker = L.marker([lat, lng], { icon: customIcon })
                
                // Popup con información del proyecto mejorado
                const avanceFormatted = (((item.properties?.avance_obra || item.avance_obra) || 0) * 100).toFixed(1)
                const presupuestoBase = item.properties?.presupuesto_base || item.presupuesto_base || 0
                const presupuestoFormatted = presupuestoBase >= 1e9
                  ? `$${(presupuestoBase / 1e9).toFixed(1)} mil M`
                  : `$${(presupuestoBase / 1e6).toFixed(1)} M`
                
                const popupContent = `
                  <div class="p-3 max-w-sm">
                    <h3 class="font-bold text-sm mb-2 text-gray-900">${item.properties?.nombre_up || item.nombre_up || 'Proyecto sin nombre'}</h3>
                    <div class="text-xs space-y-1.5">
                      <p><strong>BPIN:</strong> ${item.properties?.bpin || item.bpin}</p>
                      <p><strong>${visualizationConfig?.label || 'Avance'}:</strong> ${label || avanceFormatted + '%'}</p>
                      <p><strong>Presupuesto:</strong> ${presupuestoFormatted}</p>
                      <p><strong>Tipo:</strong> ${item.properties?.tipo_intervencion || item.tipo_intervencion || 'N/A'}</p>
                      <p><strong>Estado:</strong> ${item.properties?.estado || item.estado || 'N/A'}</p>
                      <p><strong>Comuna:</strong> ${item.properties?.comuna_corregimiento || item.comuna_corregimiento || 'N/A'}</p>
                      <div class="mt-2 pt-2 border-t border-gray-200">
                        <p class="text-gray-600"><strong>Coordenadas WGS84:</strong></p>
                        <p class="font-mono">Lat: ${lat.toFixed(6)}°</p>
                        <p class="font-mono">Lng: ${lng.toFixed(6)}°</p>
                      </div>
                    </div>
                  </div>
                `
                
                marker.bindPopup(popupContent)
                
                marker.on('click', () => {
                  if (onPointClick) {
                    onPointClick(item)
                  }
                })
                
                marker.addTo(map)
              }
            })
            
            // Ajustar vista a los límites de Cali
            map.fitBounds([
              [CALI_BOUNDS.south, CALI_BOUNDS.west],
              [CALI_BOUNDS.north, CALI_BOUNDS.east]
            ], { padding: [20, 20] })
            } catch (error) {
              console.error('Error agregando marcadores al mapa:', error)
            }
          }}
        />
        
        {/* Información de coordenadas */}
        <div className="absolute top-2 left-2 text-xs text-gray-600 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm backdrop-blur-sm z-[1000]">
          Santiago de Cali - WGS84 Datum ({CALI_CENTER.lat.toFixed(4)}°N, {CALI_CENTER.lng.toFixed(4)}°W)
        </div>
        
        {/* Escala y estadísticas */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm backdrop-blur-sm z-[1000]">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-8 h-0.5 bg-gray-800 dark:bg-gray-200"></div>
              <span>5km</span>
            </div>
            <span>{dataWithCoordinates.length} proyectos</span>
          </div>
        </div>
      </div>

      {/* Leyenda dinámica */}
      <div className="mt-6 space-y-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
            Leyenda: {visualizationConfig?.label || 'Avance de Obra'}
          </h4>
          
          {visualizationConfig?.type === 'progress' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white dark:border-gray-700"></div>
                <span className="text-gray-700 dark:text-gray-300">0-10%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 border border-white dark:border-gray-700"></div>
                <span className="text-gray-700 dark:text-gray-300">10-40%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white dark:border-gray-700"></div>
                <span className="text-gray-700 dark:text-gray-300">40-70%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white dark:border-gray-700"></div>
                <span className="text-gray-700 dark:text-gray-300">70-90%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-white dark:border-gray-700"></div>
                <span className="text-gray-700 dark:text-gray-300">90-100%</span>
              </div>
            </div>
          )}

          {visualizationConfig?.type === 'budget' && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <span className="text-gray-700 dark:text-gray-300">&lt;100M</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-700 dark:text-gray-300">100M-1mil M</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-gray-700 dark:text-gray-300">1-5mil M</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-gray-700 dark:text-gray-300">5-10mil M</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-700 dark:text-gray-300">10-50mil M</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-gray-700 dark:text-gray-300">&gt;50mil M</span>
              </div>
            </div>
          )}

          {visualizationConfig?.type === 'category' && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p>Cada categoría tiene un color único. Haz clic en los puntos para ver detalles.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
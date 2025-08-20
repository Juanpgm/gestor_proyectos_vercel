'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Map as MapIcon } from 'lucide-react'

// Configurar iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
})

interface ProjectMarker {
  id: string
  name: string
  lat: number
  lng: number
  status: string
  budget: number
  progress: number
  community: string
  neighborhood: string
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | 'GeometryCollection'
    coordinates: any
  }
  properties: {
    [key: string]: any
  }
}

interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface DynamicMapContentProps {
  markers?: ProjectMarker[]
  center?: [number, number]
  zoom?: number
  selectedMarker?: string | null
  onMarkerClick?: (markerId: string) => void
  tileLayerUrl?: string
  tileLayerAttribution?: string
}

const DynamicMapContent: React.FC<DynamicMapContentProps> = ({
  markers = [],
  center = [3.4516, -76.5320], // Cali, Colombia
  zoom = 12,
  selectedMarker = null,
  onMarkerClick = () => {},
  tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileLayerAttribution = '© OpenStreetMap contributors'
}) => {
  const [isClient, setIsClient] = useState(false)
  const [equipamientosData, setEquipamientosData] = useState<GeoJSONData | null>(null)
  const [infraestructuraData, setInfraestructuraData] = useState<GeoJSONData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    console.log('🚀 useEffect ejecutado, isClient:', isClient)
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      console.log('🔄 Cliente listo, iniciando carga de datos...')
      loadGeoJSONData()
    }
  }, [isClient])

  useEffect(() => {
    console.log('📊 Estados actualizados:', {
      isClient,
      isLoading,
      hasError,
      equipamientosData: equipamientosData?.features?.length || 0,
      infraestructuraData: infraestructuraData?.features?.length || 0
    })
  }, [isClient, isLoading, hasError, equipamientosData, infraestructuraData])

  const loadGeoJSONData = async () => {
    console.log('🔄 Iniciando carga de archivos GeoJSON...')
    setIsLoading(true)
    setHasError(false)
    
    try {
      // Cargar equipamientos
      console.log('📡 Cargando equipamientos...')
      const equipamientosResponse = await fetch('/data/unidades_proyecto/equipamientos.geojson')
      console.log('📡 Respuesta equipamientos:', equipamientosResponse.status, equipamientosResponse.ok)
      
      if (equipamientosResponse.ok) {
        const rawEquipamientos = await equipamientosResponse.json()
        console.log('✅ Equipamientos parseados:', rawEquipamientos?.features?.length || 0, 'features')
        
        if (rawEquipamientos && rawEquipamientos.type === 'FeatureCollection' && rawEquipamientos.features) {
          // Procesar coordenadas para que estén en formato [lng, lat]
          const processedEquipamientos = {
            ...rawEquipamientos,
            features: rawEquipamientos.features.map((feature: any) => {
              if (feature.geometry && feature.geometry.type === 'Point' && feature.geometry.coordinates) {
                // Convertir [lat, lng] a [lng, lat]
                const [lat, lng] = feature.geometry.coordinates
                return {
                  ...feature,
                  geometry: {
                    ...feature.geometry,
                    coordinates: [lng, lat]
                  }
                }
              }
              return feature
            })
          }
          
          console.log('🎯 Equipamientos procesados correctamente')
          setEquipamientosData(processedEquipamientos)
        }
      } else {
        console.error('❌ Error HTTP cargando equipamientos:', equipamientosResponse.status)
      }

      // Cargar infraestructura
      console.log('📡 Cargando infraestructura...')
      const infraestructuraResponse = await fetch('/data/unidades_proyecto/infraestructura_vial.geojson')
      console.log('📡 Respuesta infraestructura:', infraestructuraResponse.status, infraestructuraResponse.ok)
      
      if (infraestructuraResponse.ok) {
        const infraestructura = await infraestructuraResponse.json()
        console.log('✅ Infraestructura parseada:', infraestructura?.features?.length || 0, 'features')
        
        if (infraestructura && infraestructura.type === 'FeatureCollection' && infraestructura.features) {
          console.log('🎯 Infraestructura procesada correctamente')
          setInfraestructuraData(infraestructura)
        }
      } else {
        console.error('❌ Error HTTP cargando infraestructura:', infraestructuraResponse.status)
      }

      console.log('🎯 Carga completada')
    } catch (error) {
      console.error('💥 Error durante la carga:', error)
      setHasError(true)
    } finally {
      console.log('🏁 Estableciendo isLoading = false')
      setIsLoading(false)
    }
  }

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return '#3B82F6'
      case 'completed': return '#10B981'
      case 'planned': return '#F59E0B'
      case 'suspended': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'En Ejecución'
      case 'completed': return 'Completado'
      case 'planned': return 'Planificado'
      case 'suspended': return 'Suspendido'
      default: return 'Desconocido'
    }
  }

  const getProjectStatus = (estado: string, avanceFisico: number) => {
    if (estado === 'Terminado' || avanceFisico === 100) return 'completed'
    if (estado === 'En ejecución' || avanceFisico > 0) return 'active'
    if (estado === 'Suspendido') return 'suspended'
    return 'planned'
  }

  const getInterventionColor = (tipoIntervencion: string) => {
    switch (tipoIntervencion?.toLowerCase()) {
      case 'construcción':
      case 'construccion':
        return '#10B981' // Verde
      case 'mejoramiento':
        return '#3B82F6' // Azul
      case 'rehabilitación':
      case 'rehabilitacion':
        return '#F59E0B' // Amarillo
      case 'mantenimiento':
        return '#EF4444' // Rojo
      case 'adecuación':
      default:
        return '#6B7280' // Gris
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${value.toLocaleString('de-DE')}`
  }

  // Estilo para equipamientos (puntos)
  const equipamientoPointToLayer = (feature: any, latlng: any) => {
    const tipoIntervencion = feature.properties?.tipo_intervencion || 'Desconocido'
    const estado = feature.properties?.estado_unidad_proyecto || 'Planificado'
    const avanceFisico = feature.properties?.avance_físico_obra || 0
    
    // Debug de coordenadas
    console.log('🎯 Renderizando punto:', {
      latlng: latlng,
      originalCoords: feature.geometry.coordinates,
      nombre: feature.properties?.nickname
    })
    
    const status = getProjectStatus(estado, avanceFisico)
    const color = getInterventionColor(tipoIntervencion)
    
    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    })
  }

  // Estilo para infraestructura vial (líneas)
  const infraestructuraStyle = (feature: any) => {
    const tipoIntervencion = feature.properties?.tipo_intervencion || 'Desconocido'
    const color = getInterventionColor(tipoIntervencion)
    
    return {
      color: color,
      weight: 4,
      opacity: 0.8
    }
  }

  // Popup para features GeoJSON
  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties
    const isEquipamiento = feature.geometry.type === 'Point'
    
    const popupContent = document.createElement('div')
    
    const title = props.nickname || props.identificador || 'Proyecto sin nombre'
    const tipoIntervencion = props.tipo_intervencion || 'No especificado'
    const claseObra = props.clase_obra || 'No especificado'
    const estado = props.estado_unidad_proyecto || 'Planificado'
    const presupuesto = props.ppto_base || 0
    const avanceFisico = props.avance_físico_obra || 0
    const comuna = props.comuna_corregimiento || 'No especificado'
    const barrio = props.barrio_vereda || 'No especificado'
    const centroGestor = props.nombre_centro_gestor || 'No especificado'
    
    popupContent.innerHTML = `
      <div class="p-3 min-w-[280px]">
        <h3 class="font-semibold text-gray-900 mb-2 text-sm leading-tight">${title}</h3>
        
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-600">Tipo de Intervención:</span>
            <span class="font-medium text-gray-900">${tipoIntervencion}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-600">Clase de Obra:</span>
            <span class="font-medium text-gray-900">${claseObra}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-600">Estado:</span>
            <span class="font-medium text-gray-900">${estado}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-600">Presupuesto:</span>
            <span class="font-medium text-green-700">${formatCurrency(presupuesto)}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-600">Avance Físico:</span>
            <span class="font-medium text-blue-700">${avanceFisico}%</span>
          </div>
          
          <div class="border-t pt-2 mt-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Comuna/Corregimiento:</span>
              <span class="font-medium text-gray-900">${comuna}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Barrio/Vereda:</span>
              <span class="font-medium text-gray-900">${barrio}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Centro Gestor:</span>
              <span class="font-medium text-gray-900">${centroGestor}</span>
            </div>
          </div>
        </div>
        
        ${avanceFisico > 0 ? `
          <div class="mt-3">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-gray-600">Progreso</span>
              <span class="font-medium">${avanceFisico}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-500 h-2 rounded-full" style="width: ${avanceFisico}%"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `
    
    layer.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'custom-popup'
    })
  }

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <MapIcon className="w-8 h-8 animate-pulse text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Inicializando mapa...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center space-y-4">
          <MapIcon className="w-12 h-12 animate-pulse text-blue-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Cargando datos del mapa
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Obteniendo información de proyectos...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center space-y-4">
          <MapIcon className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error al cargar datos
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">
              Hubo un problema cargando los datos del mapa
            </p>
            <button
              onClick={loadGeoJSONData}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="h-full w-full rounded-lg"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution={tileLayerAttribution}
        url={tileLayerUrl}
      />
      
      {/* Capa de equipamientos (puntos) */}
      {equipamientosData && (
        <GeoJSON
          key="equipamientos"
          data={equipamientosData}
          pointToLayer={equipamientoPointToLayer}
          onEachFeature={onEachFeature}
        />
      )}
      
      {/* Capa de infraestructura vial (líneas) */}
      {infraestructuraData && (
        <GeoJSON
          key="infraestructura"
          data={infraestructuraData}
          style={infraestructuraStyle}
          onEachFeature={onEachFeature}
        />
      )}
      
      {/* Panel de información de debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-xs font-mono">
          <div className="flex items-center mb-2">
            <MapIcon className="w-4 h-4 text-blue-500 mr-2" />
            <span className="font-semibold">Debug Info</span>
          </div>
          <div className="space-y-1 text-gray-700 dark:text-gray-300">
            <div>Equipamientos: <span className="font-semibold text-green-600">{equipamientosData?.features?.length || 0}</span></div>
            <div>Infraestructura: <span className="font-semibold text-blue-600">{infraestructuraData?.features?.length || 0}</span></div>
            <div>Total Features: <span className="font-semibold text-purple-600">{(equipamientosData?.features?.length || 0) + (infraestructuraData?.features?.length || 0)}</span></div>
            <div>Estado: <span className="font-semibold text-emerald-600">Cargado</span></div>
          </div>
        </div>
      )}
    </MapContainer>
  )
}

export default DynamicMapContent

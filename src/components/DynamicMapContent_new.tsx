'use client'

import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import { MapIcon, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'

// Configurar iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
})

interface GeoJSONData {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: string
      coordinates: any
    }
    properties: Record<string, any>
  }>
}

interface DynamicMapContentProps {
  markers?: any[]
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
  const [equipamientosData, setEquipamientosData] = useState<GeoJSONData | null>(null)
  const [infraestructuraData, setInfraestructuraData] = useState<GeoJSONData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [dataStats, setDataStats] = useState({
    equipamientos: 0,
    infraestructura: 0,
    totalFeatures: 0
  })

  // Verificar que estamos en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Cargar datos cuando el componente esté montado en el cliente
  useEffect(() => {
    if (isClient) {
      loadGeoJSONData()
    }
  }, [isClient])

  const loadGeoJSONData = async () => {
    console.log('🔄 Iniciando carga de datos GeoJSON...')
    setIsLoading(true)
    setError(null)

    try {
      // Cargar equipamientos
      console.log('📡 Cargando equipamientos...')
      const equipamientosResponse = await fetch('/data/unidades_proyecto/equipamientos.geojson')
      
      if (!equipamientosResponse.ok) {
        throw new Error(`Error cargando equipamientos: ${equipamientosResponse.status}`)
      }
      
      const equipamientosRawData = await equipamientosResponse.json()
      console.log('✅ Equipamientos cargados:', equipamientosRawData.features?.length || 0, 'features')
      
      // Procesar equipamientos (convertir coordenadas [lat, lng] a [lng, lat])
      const equipamientosProcessed = {
        ...equipamientosRawData,
        features: equipamientosRawData.features?.map((feature: any) => {
          if (feature.geometry?.type === 'Point' && feature.geometry.coordinates) {
            // Las coordenadas vienen como [lat, lng] pero GeoJSON requiere [lng, lat]
            const [lat, lng] = feature.geometry.coordinates
            return {
              ...feature,
              geometry: {
                ...feature.geometry,
                coordinates: [lng, lat] // Invertir coordenadas
              }
            }
          }
          return feature
        }) || []
      }
      
      setEquipamientosData(equipamientosProcessed)
      console.log('🎯 Equipamientos procesados con coordenadas corregidas')

      // Cargar infraestructura vial
      console.log('📡 Cargando infraestructura vial...')
      const infraestructuraResponse = await fetch('/data/unidades_proyecto/infraestructura_vial.geojson')
      
      if (!infraestructuraResponse.ok) {
        throw new Error(`Error cargando infraestructura: ${infraestructuraResponse.status}`)
      }
      
      const infraestructuraRawData = await infraestructuraResponse.json()
      console.log('✅ Infraestructura cargada:', infraestructuraRawData.features?.length || 0, 'features')
      
      setInfraestructuraData(infraestructuraRawData)

      // Actualizar estadísticas
      const equipCount = equipamientosProcessed.features?.length || 0
      const infraCount = infraestructuraRawData.features?.length || 0
      
      setDataStats({
        equipamientos: equipCount,
        infraestructura: infraCount,
        totalFeatures: equipCount + infraCount
      })

      console.log('🎉 Carga de datos completada exitosamente')
      console.log('📊 Estadísticas:', {
        equipamientos: equipCount,
        infraestructura: infraCount,
        total: equipCount + infraCount
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('💥 Error cargando datos:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener color según tipo de intervención
  const getInterventionColor = (tipoIntervencion: string): string => {
    const tipo = tipoIntervencion?.toLowerCase() || ''
    
    if (tipo.includes('construcción') || tipo.includes('construccion')) {
      return '#10B981' // Verde - Construcción
    }
    if (tipo.includes('mejoramiento')) {
      return '#3B82F6' // Azul - Mejoramiento
    }
    if (tipo.includes('rehabilitación') || tipo.includes('rehabilitacion')) {
      return '#F59E0B' // Amarillo - Rehabilitación
    }
    if (tipo.includes('mantenimiento')) {
      return '#EF4444' // Rojo - Mantenimiento
    }
    if (tipo.includes('adecuación') || tipo.includes('adecuacion')) {
      return '#8B5CF6' // Morado - Adecuación
    }
    
    return '#6B7280' // Gris por defecto
  }

  // Obtener estado del proyecto
  const getProjectStatus = (estado: string, avanceFisico: number): string => {
    if (estado === 'Terminado' || avanceFisico === 100) return 'completed'
    if (estado === 'En ejecución' || avanceFisico > 0) return 'active'
    if (estado === 'Suspendido') return 'suspended'
    return 'planned'
  }

  // Formatear moneda
  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${value.toLocaleString('es-CO')}`
  }

  // Estilo para puntos de equipamientos
  const equipamientoPointToLayer = (feature: any, latlng: L.LatLng) => {
    const tipoIntervencion = feature.properties?.tipo_intervencion || 'Desconocido'
    const estado = feature.properties?.estado_unidad_proyecto || 'Planificado'
    const avanceFisico = feature.properties?.avance_físico_obra || 0
    
    const status = getProjectStatus(estado, avanceFisico)
    const color = getInterventionColor(tipoIntervencion)
    
    console.log('🎯 Renderizando equipamiento:', {
      nombre: feature.properties?.nickname,
      latlng: [latlng.lat, latlng.lng],
      tipo: tipoIntervencion,
      estado: estado,
      color: color
    })
    
    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    })
  }

  // Estilo para líneas de infraestructura
  const infraestructuraStyle = (feature: any) => {
    const tipoIntervencion = feature.properties?.tipo_intervencion || 'Desconocido'
    const color = getInterventionColor(tipoIntervencion)
    
    console.log('🛣️ Renderizando infraestructura:', {
      nickname: feature.properties?.nickname,
      tipo: tipoIntervencion,
      color: color
    })
    
    return {
      color: color,
      weight: 4,
      opacity: 0.8,
      lineCap: 'round' as const,
      lineJoin: 'round' as const
    }
  }

  // Configurar popup para cada feature
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties || {}
    
    const nombre = props.nickname || props.identificador || 'Proyecto sin nombre'
    const tipoIntervencion = props.tipo_intervencion || 'No especificado'
    const claseObra = props.clase_obra || 'No especificado'
    const estado = props.estado_unidad_proyecto || 'Planificado'
    const presupuesto = props.ppto_base || 0
    const avanceFisico = props.avance_físico_obra || 0
    const comuna = props.comuna_corregimiento || 'No especificado'
    const barrio = props.barrio_vereda || 'No especificado'
    const centroGestor = props.nombre_centro_gestor || 'No especificado'
    const descripcion = props.descripcion_intervencion || 'Sin descripción'
    
    const popupContent = `
      <div class="p-4 min-w-[300px] max-w-[350px]">
        <h3 class="font-bold text-gray-900 mb-3 text-sm leading-tight border-b pb-2">
          ${nombre}
        </h3>
        
        <div class="space-y-2 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <span class="text-gray-600 font-medium">Tipo:</span>
            <span class="text-gray-900">${tipoIntervencion}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <span class="text-gray-600 font-medium">Clase de Obra:</span>
            <span class="text-gray-900">${claseObra}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <span class="text-gray-600 font-medium">Estado:</span>
            <span class="text-gray-900 font-semibold">${estado}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <span class="text-gray-600 font-medium">Presupuesto:</span>
            <span class="text-green-700 font-bold">${formatCurrency(presupuesto)}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <span class="text-gray-600 font-medium">Avance:</span>
            <span class="text-blue-700 font-bold">${avanceFisico}%</span>
          </div>
          
          ${descripcion !== 'Sin descripción' ? `
            <div class="mt-3 pt-2 border-t">
              <p class="text-gray-600 font-medium mb-1">Descripción:</p>
              <p class="text-gray-900 text-xs">${descripcion}</p>
            </div>
          ` : ''}
          
          <div class="mt-3 pt-2 border-t space-y-1">
            <div class="grid grid-cols-2 gap-2">
              <span class="text-gray-600 font-medium">Comuna:</span>
              <span class="text-gray-900">${comuna}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <span class="text-gray-600 font-medium">Barrio:</span>
              <span class="text-gray-900">${barrio}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <span class="text-gray-600 font-medium">Centro Gestor:</span>
              <span class="text-gray-900">${centroGestor}</span>
            </div>
          </div>
          
          ${avanceFisico > 0 ? `
            <div class="mt-3 pt-2">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-600 font-medium">Progreso de Obra</span>
                <span class="font-bold text-blue-700">${avanceFisico}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-blue-500 h-3 rounded-full transition-all duration-300" style="width: ${avanceFisico}%"></div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `
    
    layer.bindPopup(popupContent, {
      maxWidth: 400,
      className: 'custom-popup'
    })
  }

  // Componente de estado de carga
  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Inicializando mapa...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
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

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error al cargar datos
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
            <button
              onClick={loadGeoJSONData}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
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
            key={`equipamientos-${equipamientosData.features.length}`}
            data={equipamientosData}
            pointToLayer={equipamientoPointToLayer}
            onEachFeature={onEachFeature}
          />
        )}
        
        {/* Capa de infraestructura vial (líneas) */}
        {infraestructuraData && (
          <GeoJSON
            key={`infraestructura-${infraestructuraData.features.length}`}
            data={infraestructuraData}
            style={infraestructuraStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Panel de información de debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-xs font-mono">
          <div className="flex items-center mb-2">
            <MapIcon className="w-4 h-4 text-blue-500 mr-2" />
            <span className="font-semibold">Debug Info</span>
          </div>
          <div className="space-y-1 text-gray-700 dark:text-gray-300">
            <div>Equipamientos: <span className="font-semibold text-green-600">{dataStats.equipamientos}</span></div>
            <div>Infraestructura: <span className="font-semibold text-blue-600">{dataStats.infraestructura}</span></div>
            <div>Total Features: <span className="font-semibold text-purple-600">{dataStats.totalFeatures}</span></div>
            <div>Estado: <span className="font-semibold text-emerald-600">Cargado</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicMapContent

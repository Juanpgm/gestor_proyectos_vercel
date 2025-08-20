'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Map as MapIcon } from 'lucide-react'

// Configurar iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

interface DynamicMapContentProps {
  markers?: any[]
  center: [number, number]
  zoom: number
  selectedMarker?: string | null
  onMarkerClick?: (id: string) => void
  tileLayerUrl: string
  tileLayerAttribution: string
}

interface GeoJSONData {
  type: 'FeatureCollection'
  features: any[]
}

// Componente para configurar las capas del mapa
const MapLayerSetup = () => {
  const map = useMap()
  
  useEffect(() => {
    // Crear panes personalizados para controlar el orden de las capas
    if (!map.getPane('vectorLayers')) {
      map.createPane('vectorLayers')
      map.getPane('vectorLayers')!.style.zIndex = '650' // Por encima de tiles (200) y markers (600)
    }
  }, [map])
  
  return null
}

const DynamicMapContent: React.FC<DynamicMapContentProps> = ({
  markers,
  center,
  zoom,
  selectedMarker,
  onMarkerClick,
  tileLayerUrl,
  tileLayerAttribution
}) => {
  const [isClient, setIsClient] = useState(false)
  const [equipamientosData, setEquipamientosData] = useState<GeoJSONData | null>(null)
  const [infraestructuraData, setInfraestructuraData] = useState<GeoJSONData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showLayers, setShowLayers] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      loadGeoJSONData()
    }
  }, [isClient])

  // CHECKPOINT 1 LOGIC: Efecto para controlar cuándo mostrar las capas
  useEffect(() => {
    console.log('🔍 CHECKPOINT 1: Verificando condiciones para mostrar capas:', {
      isLoading,
      hasError,
      equipamientosData: !!equipamientosData,
      infraestructuraData: !!infraestructuraData
    })
    
    if (!isLoading && !hasError && (equipamientosData || infraestructuraData)) {
      console.log('🎯 CHECKPOINT 1: Activando visualización de capas...')
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        setShowLayers(true)
        console.log('✅ CHECKPOINT 1: showLayers = true')
      }, 100)
    }
  }, [isLoading, hasError, equipamientosData, infraestructuraData])

  // Función para obtener color por clase_obra
  const getClaseObraColor = (claseObra: string) => {
    switch (claseObra?.toLowerCase()) {
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
      case 'adecuacion':
        return '#8B5CF6' // Púrpura
      case 'dotación':
      case 'dotacion':
        return '#06B6D4' // Cian
      case 'ampliación':
      case 'ampliacion':
        return '#F97316' // Naranja
      default:
        return '#6B7280' // Gris
    }
  }

  const loadGeoJSONData = async () => {
    console.log('🔄 CHECKPOINT 1 LOGIC: Iniciando carga de datos...')
    setIsLoading(true)
    setHasError(false)
    
    try {
      // Cargar equipamientos
      const equipamientosResponse = await fetch('/data/unidades_proyecto/equipamientos.geojson')
      console.log('📡 Equipamientos response:', equipamientosResponse.status)
      
      if (equipamientosResponse.ok) {
        const rawEquipamientos = await equipamientosResponse.json()
        console.log('✅ Equipamientos cargados:', rawEquipamientos?.features?.length || 0)
        
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
          
          setEquipamientosData(processedEquipamientos)
          console.log('✅ Equipamientos establecidos en estado')
        }
      }

      // Cargar infraestructura
      const infraestructuraResponse = await fetch('/data/unidades_proyecto/infraestructura_vial.geojson')
      console.log('📡 Infraestructura response:', infraestructuraResponse.status)
      
      if (infraestructuraResponse.ok) {
        const infraestructura = await infraestructuraResponse.json()
        console.log('✅ Infraestructura cargada:', infraestructura?.features?.length || 0)
        
        if (infraestructura && infraestructura.type === 'FeatureCollection' && infraestructura.features) {
          setInfraestructuraData(infraestructura)
          console.log('✅ Infraestructura establecida en estado')
        }
      }

      console.log('🎯 CHECKPOINT 1: Carga completada exitosamente')
    } catch (error) {
      console.error('💥 Error durante la carga:', error)
      setHasError(true)
    } finally {
      setIsLoading(false)
      console.log('🏁 isLoading establecido a false')
    }
  }

  // Estilo para equipamientos (puntos) - Usando CircleMarker
  const equipamientoPointToLayer = (feature: any, latlng: any) => {
    const claseObra = feature.properties?.clase_obra || 'Desconocido'
    const color = getClaseObraColor(claseObra)
    
    return L.circleMarker(latlng, {
      radius: 12,
      fillColor: color,
      color: '#FFFFFF',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    })
  }

  // Estilo para infraestructura vial (líneas) - Usando Polyline
  const infraestructuraStyle = (feature: any) => {
    const claseObra = feature.properties?.clase_obra || 'Desconocido'
    const color = getClaseObraColor(claseObra)
    
    return {
      color: color,
      weight: 5,
      opacity: 0.9
    }
  }

  // Popup para features GeoJSON
  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      const props = feature.properties
      const popup = `
        <div class="p-3">
          <h4 class="font-bold text-lg mb-2">${props.nickname || 'Sin nombre'}</h4>
          <p><strong>Clase de Obra:</strong> ${props.clase_obra || 'N/A'}</p>
          <p><strong>Estado:</strong> ${props.estado_unidad_proyecto || 'N/A'}</p>
        </div>
      `
      layer.bindPopup(popup)
    }
  }

  // CHECKPOINT 1 LOGIC: Mostrar loading mientras se inicializa
  if (!isClient || isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <MapIcon className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-sm text-gray-500">Cargando datos del mapa...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center">
          <MapIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">Error al cargar los datos del mapa</p>
          <button
            onClick={loadGeoJSONData}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Reintentar
          </button>
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
      {/* Configurar capas del mapa */}
      <MapLayerSetup />
      
      {/* Capa base - tiles */}
      <TileLayer
        attribution={tileLayerAttribution}
        url={tileLayerUrl}
      />
      
      {/* Capa de equipamientos (puntos) - CHECKPOINT 1 LOGIC */}
      {showLayers && equipamientosData && (
        <GeoJSON
          key={`equipamientos-${equipamientosData.features.length}`}
          data={equipamientosData}
          pointToLayer={equipamientoPointToLayer}
          onEachFeature={onEachFeature}
          pane="vectorLayers"
        />
      )}
      
      {/* Capa de infraestructura vial (líneas) - CHECKPOINT 1 LOGIC */}
      {showLayers && infraestructuraData && (
        <GeoJSON
          key={`infraestructura-${infraestructuraData.features.length}`}
          data={infraestructuraData}
          style={infraestructuraStyle}
          onEachFeature={onEachFeature}
          pane="vectorLayers"
        />
      )}
      
      {/* Panel de información de debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control leaflet-bar">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs font-mono">
              <div className="flex items-center mb-2">
                <MapIcon className="w-4 h-4 text-blue-500 mr-2" />
                <span className="font-semibold">Debug Info</span>
              </div>
              <div className="space-y-1 text-gray-700">
                <div>Equipamientos: <span className="font-semibold text-green-600">{equipamientosData?.features?.length || 0}</span></div>
                <div>Infraestructura: <span className="font-semibold text-blue-600">{infraestructuraData?.features?.length || 0}</span></div>
                <div>ShowLayers: <span className="font-semibold text-purple-600">{showLayers ? 'true' : 'false'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MapContainer>
  )
}

export default DynamicMapContent

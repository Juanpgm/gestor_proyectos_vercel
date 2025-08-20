'use client'

import React, { useEffect, useState } from 'react'
import { processGeoJSONCoordinates, CALI_COORDINATES } from '@/utils/coordinateUtils'

interface SimpleMapProps {
  center?: [number, number]
  zoom?: number
  tileLayerUrl: string
  tileLayerAttribution: string
  equipamientos?: any
  infraestructura?: any
}

const SimpleMap: React.FC<SimpleMapProps> = ({
  center = CALI_COORDINATES.CENTER_LAT_LNG,
  zoom = CALI_COORDINATES.DEFAULT_ZOOM,
  tileLayerUrl,
  tileLayerAttribution,
  equipamientos,
  infraestructura
}) => {
  const [mapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMap = async () => {
      try {
        console.log('🗺️ === INICIANDO CARGA DE MAPA SIMPLE ===')
        console.log('🔍 Datos recibidos:', {
          equipamientos: equipamientos?.features?.length || 0,
          infraestructura: infraestructura?.features?.length || 0,
          centerProvided: center,
          zoomProvided: zoom
        })
        
        // Cargar dinámicamente los componentes de react-leaflet
        const { MapContainer, TileLayer, GeoJSON } = await import('react-leaflet')
        const L = await import('leaflet')
        
        // Configurar iconos de Leaflet para evitar problemas de importación
        // @ts-ignore
        delete L.default.Icon.Default.prototype._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        })
        
        console.log('✅ Leaflet configurado correctamente')

        // Procesar datos GeoJSON con la utilidad centralizada
        const correctedEquipamientos = equipamientos ? processGeoJSONCoordinates(equipamientos) : null
        const correctedInfraestructura = infraestructura ? processGeoJSONCoordinates(infraestructura) : null

        console.log('🎯 Datos procesados con utilidad centralizada:', {
          equipamientosOriginales: equipamientos?.features?.length || 0,
          equipamientosProcesados: correctedEquipamientos?.features?.length || 0,
          infraestructuraOriginal: infraestructura?.features?.length || 0,
          infraestructuraProcesada: correctedInfraestructura?.features?.length || 0
        })

        // Crear el componente del mapa
        const MapComponent = () => {
          console.log('🗺️ === RENDERIZANDO MAPA ===')
          
          return (
            <MapContainer
              center={center}
              zoom={zoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
              whenReady={() => {
                console.log('🗺️ Mapa listo para interacción')
              }}
            >
              <TileLayer
                url={tileLayerUrl}
                attribution={tileLayerAttribution}
                maxZoom={18}
              />

              {/* Equipamientos con coordenadas corregidas */}
              {correctedEquipamientos && correctedEquipamientos.features && correctedEquipamientos.features.length > 0 && (
                <GeoJSON
                  key={`equipamientos-corrected-${correctedEquipamientos.features.length}-${Date.now()}`}
                  data={correctedEquipamientos}
                  pointToLayer={(feature, latlng) => {
                    console.log('🎯 Creando marker equipamiento en:', {
                      latlng: latlng.toString(),
                      featureId: feature.properties?.identificador || 'sin_id',
                      coordinates: (feature.geometry as any)?.coordinates
                    })
                    
                    return L.default.circleMarker(latlng, {
                      radius: 8,
                      color: '#ffffff',
                      weight: 2,
                      fillColor: '#10B981', // Verde
                      fillOpacity: 0.8
                    })
                  }}
                  onEachFeature={(feature, layer) => {
                    if (feature.properties) {
                      const name = feature.properties.nickname || feature.properties.identificador || 'Equipamiento'
                      const clase = feature.properties.clase_obra || 'N/A'
                      const comuna = feature.properties.comuna_corregimiento || 'N/A'
                      const coords = (feature.geometry as any)?.coordinates
                      
                      layer.bindPopup(`
                        <div style="font-family: system-ui; min-width: 200px;">
                          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                            ${name}
                          </h4>
                          <p style="margin: 4px 0; font-size: 12px;"><strong>Clase:</strong> ${clase}</p>
                          <p style="margin: 4px 0; font-size: 12px;"><strong>Comuna:</strong> ${comuna}</p>
                          <p style="margin: 4px 0; font-size: 11px; color: #666;">
                            <strong>Coords:</strong> [${coords?.[0]?.toFixed(6)}, ${coords?.[1]?.toFixed(6)}]
                          </p>
                        </div>
                      `, {
                        maxWidth: 300
                      })
                    }
                  }}
                />
              )}

              {/* Infraestructura como líneas (procesada con utilidad) */}
              {correctedInfraestructura && correctedInfraestructura.features && correctedInfraestructura.features.length > 0 && (
                <GeoJSON
                  key={`infraestructura-${correctedInfraestructura.features.length}-${Date.now()}`}
                  data={correctedInfraestructura}
                  style={(feature) => {
                    const featureId = feature?.properties?.id_via || feature?.properties?.seccion_via || 'sin_id'
                    console.log('🛣️ Creando línea infraestructura para:', featureId)
                    
                    return {
                      color: '#F59E0B', // Amarillo/Naranja
                      weight: 4,
                      opacity: 0.8
                    }
                  }}
                  onEachFeature={(feature, layer) => {
                    if (feature.properties) {
                      const name = feature.properties.id_via || feature.properties.seccion_via || 'Infraestructura'
                      const tipo = feature.properties.tipo_intervencion || 'N/A'
                      
                      layer.bindPopup(`
                        <div style="font-family: system-ui; min-width: 200px;">
                          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                            ${name}
                          </h4>
                          <p style="margin: 4px 0; font-size: 12px;"><strong>Tipo:</strong> ${tipo}</p>
                        </div>
                      `, {
                        maxWidth: 300
                      })
                    }
                  }}
                />
              )}
            </MapContainer>
          )
        }

        setMapComponent(() => MapComponent)
        setLoading(false)
        console.log('✅ === MAPA CARGADO EXITOSAMENTE ===')
        
      } catch (err: any) {
        console.error('❌ === ERROR CARGANDO MAPA ===:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadMap()
  }, [center, zoom, tileLayerUrl, tileLayerAttribution, equipamientos, infraestructura])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 text-red-500">⚠️</div>
          <p className="text-sm text-red-500">Error: {error}</p>
          <p className="text-xs text-gray-500 mt-2">Revisa la consola para más detalles</p>
        </div>
      </div>
    )
  }

  if (!mapComponent) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 text-gray-400">🗺️</div>
          <p className="text-sm text-gray-500">Mapa no disponible</p>
        </div>
      </div>
    )
  }

  const MapComponent = mapComponent

  return <MapComponent />
}

export default SimpleMap

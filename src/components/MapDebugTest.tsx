'use client'

import React, { useEffect, useState } from 'react'

const MapDebugTest: React.FC = () => {
  const [mapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null)
  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMapAndData = async () => {
      try {
        console.log('🚀 Iniciando carga de mapa de prueba...')
        
        // Cargar datos GeoJSON
        const equipRes = await fetch('/data/unidades_proyecto/equipamientos.geojson')
        const equipData = await equipRes.json()
        
        console.log('📊 Datos cargados:', {
          type: equipData.type,
          features: equipData.features?.length || 0,
          firstFeature: equipData.features?.[0]
        })
        
        setGeoData(equipData)
        
        // Cargar componentes de react-leaflet
        const { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } = await import('react-leaflet')
        const L = await import('leaflet')
        
        // Configurar iconos
        // @ts-ignore
        delete L.default.Icon.Default.prototype._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        })
        
        // Crear componente simple de prueba
        const TestMapComponent = () => {
          console.log('🗺️ Renderizando mapa de prueba...')
          
          // Extraer algunas coordenadas de muestra
          const samplePoints = equipData.features?.slice(0, 5).map((feature: any, index: number) => {
            const coords = feature.geometry?.coordinates
            if (coords && coords.length === 2) {
              return {
                id: index,
                lat: coords[1], // GeoJSON es [lng, lat]
                lng: coords[0],
                name: feature.properties?.nickname || `Punto ${index + 1}`
              }
            }
            return null
          }).filter(Boolean) || []
          
          console.log('📍 Puntos de muestra:', samplePoints)
          
          return (
            <MapContainer
              center={[3.4516, -76.5320]}
              zoom={11}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={18}
              />
              
              {/* Markers manuales para test */}
              {samplePoints.map((point: any) => (
                <CircleMarker
                  key={point.id}
                  center={[point.lat, point.lng]}
                  radius={10}
                  color="#ff0000"
                  fillColor="#ff0000"
                  fillOpacity={0.8}
                >
                  <Popup>
                    <div>
                      <h4>{point.name}</h4>
                      <p>Lat: {point.lat}</p>
                      <p>Lng: {point.lng}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              
              {/* GeoJSON completo */}
              {equipData && (
                <GeoJSON
                  key="equipamientos-test"
                  data={equipData}
                  pointToLayer={(feature, latlng) => {
                    console.log('🎯 Creando GeoJSON marker en:', latlng)
                    return L.default.circleMarker(latlng, {
                      radius: 6,
                      color: '#0000ff',
                      fillColor: '#0000ff',
                      fillOpacity: 0.6
                    })
                  }}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`
                      <div>
                        <h4>${feature.properties?.nickname || 'Sin nombre'}</h4>
                        <p>Tipo: ${feature.geometry?.type}</p>
                      </div>
                    `)
                  }}
                />
              )}
            </MapContainer>
          )
        }
        
        setMapComponent(() => TestMapComponent)
        setLoading(false)
        
      } catch (error: any) {
        console.error('❌ Error en mapa de prueba:', error)
        setLoading(false)
      }
    }
    
    loadMapAndData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          🔍 Cargando Mapa de Prueba...
        </h3>
        <div className="animate-pulse">Preparando visualización...</div>
      </div>
    )
  }

  if (!mapComponent) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          ❌ Error en Mapa de Prueba
        </h3>
        <p>No se pudo cargar el componente de mapa</p>
      </div>
    )
  }

  const TestMapComponent = mapComponent

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          ✅ Mapa de Prueba Cargado
        </h3>
        <p>Datos: {geoData?.features?.length || 0} features</p>
      </div>
      
      <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
        <TestMapComponent />
      </div>
    </div>
  )
}

export default MapDebugTest

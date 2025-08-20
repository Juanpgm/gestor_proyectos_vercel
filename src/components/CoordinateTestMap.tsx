'use client'

import React, { useEffect, useState } from 'react'

const CoordinateTestMap: React.FC = () => {
  const [mapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [testData, setTestData] = useState<any>(null)

  useEffect(() => {
    const loadMapAndTest = async () => {
      try {
        console.log('🧪 Iniciando prueba de coordenadas...')
        
        // Cargar datos de prueba
        const response = await fetch('/data/unidades_proyecto/equipamientos.geojson')
        const data = await response.json()
        setTestData(data)
        
        // Mostrar muestra de datos originales
        if (data.features && data.features.length > 0) {
          const sample = data.features[0]
          console.log('📊 Datos originales - Muestra:')
          console.log('  - Coordenadas:', sample.geometry?.coordinates)
          console.log('  - Properties:', Object.keys(sample.properties || {}))
          console.log('  - Total features:', data.features.length)
        }
        
        // Cargar componentes de mapa
        const { MapContainer, TileLayer, GeoJSON, CircleMarker } = await import('react-leaflet')
        const L = await import('leaflet')
        
        // Configurar iconos
        // @ts-ignore
        delete L.default.Icon.Default.prototype._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        })

        // Función de corrección mejorada
        const fixCoordinates = (coords: any): [number, number] => {
          if (!coords || coords.length !== 2) {
            console.warn('⚠️ Coordenadas inválidas:', coords)
            return [-76.5320, 3.4516] // Fallback para Cali
          }
          
          const [first, second] = coords
          
          // Detectar si está en formato [lat, lng] (típico de Cali)
          // Latitud de Cali: ~3.4
          // Longitud de Cali: ~-76.5
          if (first > 2 && first < 5 && second > -78 && second < -75) {
            console.log(`🔄 Corrigiendo coordenadas: [${first}, ${second}] -> [${second}, ${first}]`)
            return [second, first] // Convertir a [lng, lat] para GeoJSON
          }
          
          console.log(`✅ Coordenadas ya correctas: [${first}, ${second}]`)
          return [first, second] // Ya está en formato [lng, lat]
        }

        const MapComponent = () => {
          const center: [number, number] = [3.4516, -76.5320] // [lat, lng] para React Leaflet
          
          // Crear datos corregidos
          const correctedData = data ? {
            ...data,
            features: data.features.slice(0, 10).map((feature: any) => ({ // Solo primeros 10 para prueba
              ...feature,
              geometry: {
                ...feature.geometry,
                coordinates: fixCoordinates(feature.geometry?.coordinates)
              }
            }))
          } : null

          console.log('🗺️ Renderizando mapa de prueba con datos corregidos...')
          console.log('📍 Centro del mapa:', center)
          console.log('🎯 Features corregidos:', correctedData?.features?.length || 0)

          return (
            <div className="w-full h-96 border-2 border-blue-500 rounded-lg overflow-hidden">
              <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Marcador manual en el centro como referencia */}
                <CircleMarker
                  center={center}
                  radius={10}
                  pathOptions={{
                    color: '#FF0000',
                    fillColor: '#FF0000',
                    fillOpacity: 0.8,
                    weight: 3
                  }}
                />

                {/* Datos GeoJSON corregidos */}
                {correctedData && (
                  <GeoJSON
                    key={`test-${Date.now()}`}
                    data={correctedData}
                    pointToLayer={(feature, latlng) => {
                      console.log('🎯 Creando marker en:', latlng.toString())
                      console.log('   - Feature ID:', feature.properties?.identificador || 'sin_id')
                      return L.default.circleMarker(latlng, {
                        radius: 6,
                        color: '#ffffff',
                        weight: 2,
                        fillColor: '#10B981',
                        fillOpacity: 0.9
                      })
                    }}
                    onEachFeature={(feature, layer) => {
                      const name = feature.properties?.nickname || feature.properties?.identificador || 'Equipamiento'
                      const coords = (feature.geometry as any)?.coordinates
                      layer.bindPopup(`
                        <div style="font-family: system-ui; min-width: 200px;">
                          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">
                            ${name}
                          </h4>
                          <p style="margin: 4px 0; font-size: 12px;">
                            <strong>Coords GeoJSON:</strong> [${coords?.[0]?.toFixed(4)}, ${coords?.[1]?.toFixed(4)}]
                          </p>
                        </div>
                      `)
                    }}
                  />
                )}
              </MapContainer>
            </div>
          )
        }

        setMapComponent(() => MapComponent)
        setLoading(false)
        
      } catch (error: any) {
        console.error('❌ Error en prueba de coordenadas:', error)
        setLoading(false)
      }
    }

    loadMapAndTest()
  }, [])

  if (loading) {
    return (
      <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Prueba de Coordenadas</h3>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-600">Cargando prueba...</span>
        </div>
      </div>
    )
  }

  const MapComponent = mapComponent

  return (
    <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Prueba de Coordenadas</h3>
      
      {testData && (
        <div className="mb-4 p-3 bg-white rounded border">
          <h4 className="font-medium text-gray-800 mb-2">📊 Información de Datos:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Total features: {testData.features?.length || 0}</li>
            <li>• Mostrando: {Math.min(10, testData.features?.length || 0)} features (primeros 10)</li>
            <li>• Coordenadas de muestra: {JSON.stringify(testData.features?.[0]?.geometry?.coordinates)}</li>
          </ul>
        </div>
      )}
      
      {MapComponent && <MapComponent />}
      
      <div className="mt-2 text-xs text-blue-600">
        ℹ️ Revisa la consola del navegador para ver los logs de corrección de coordenadas
      </div>
    </div>
  )
}

export default CoordinateTestMap

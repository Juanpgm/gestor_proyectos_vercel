'use client'

import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet'
import { loadGeoJSON } from '@/utils/geoJSONLoader'

interface MapClickDiagnosticsProps {
  height?: string
}

const MapClickDiagnostics: React.FC<MapClickDiagnosticsProps> = ({ 
  height = '600px' 
}) => {
  const [geoData, setGeoData] = useState<any>(null)
  const [clickInfo, setClickInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Componente para capturar clicks del mapa
  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        setClickInfo({
          type: 'map',
          latlng: e.latlng,
          timestamp: new Date().toISOString()
        })
      },
    })
    return null
  }

  // Cargar datos de vías
  useEffect(() => {
    const loadViasData = async () => {
      try {
        setLoading(true)
        const data = await loadGeoJSON('infraestructura_vial')
        setGeoData(data)
        console.log('🔍 Datos de vías cargados para diagnóstico:', {
          features: data?.features?.length || 0,
          sampleFeature: data?.features?.[0]
        })
      } catch (error) {
        console.error('❌ Error cargando datos de vías:', error)
      } finally {
        setLoading(false)
      }
    }

    loadViasData()
  }, [])

  // Handler para clicks en features
  const handleFeatureClick = (feature: any, e: any) => {
    console.log('🎯 Feature clickeada:', feature)
    console.log('🎯 Evento click:', e)
    
    setClickInfo({
      type: 'feature',
      feature: feature,
      properties: feature.properties,
      geometry: feature.geometry.type,
      timestamp: new Date().toISOString()
    })
  }

  if (loading) {
    return (
      <div className="w-full bg-gray-100 rounded-lg p-8 text-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Cargando datos de diagnóstico...</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="bg-white rounded-lg shadow-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Diagnóstico de Clicks en Vías</h3>
        
        {/* Información de carga */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-medium">Features Cargadas</div>
            <div className="text-xl font-bold text-blue-600">
              {geoData?.features?.length || 0}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="font-medium">Tipo de Geometría</div>
            <div className="text-xl font-bold text-green-600">
              {geoData?.features?.[0]?.geometry?.type || 'N/A'}
            </div>
          </div>
        </div>

        {/* Información del último click */}
        {clickInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Último Click Detectado:</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Tipo:</strong> {clickInfo.type}</div>
              <div><strong>Hora:</strong> {clickInfo.timestamp}</div>
              
              {clickInfo.type === 'feature' && (
                <>
                  <div><strong>Geometría:</strong> {clickInfo.geometry}</div>
                  <div><strong>Propiedades:</strong></div>
                  <div className="bg-white rounded p-2 text-xs max-h-40 overflow-y-auto">
                    <pre>{JSON.stringify(clickInfo.properties, null, 2)}</pre>
                  </div>
                </>
              )}
              
              {clickInfo.type === 'map' && (
                <div><strong>Coordenadas:</strong> {clickInfo.latlng.lat.toFixed(6)}, {clickInfo.latlng.lng.toFixed(6)}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mapa de diagnóstico */}
      <div className="bg-white rounded-lg shadow-lg border overflow-hidden" style={{ height }}>
        <MapContainer
          center={[3.4516, -76.5320]} // Centro de Cali
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler />

          {geoData && (
            <GeoJSON
              data={geoData}
              style={() => ({
                color: '#ff0000',
                weight: 8,
                opacity: 0.8,
                stroke: true
              })}
              onEachFeature={(feature, layer) => {
                console.log('🔧 Configurando feature:', feature.properties?.nickname || feature.properties?.id_via)
                
                // Agregar evento de click
                layer.on('click', (e) => {
                  console.log('🔥 Click detectado en feature!')
                  e.originalEvent.stopPropagation()
                  handleFeatureClick(feature, e)
                })

                // Agregar eventos de hover para debugging
                layer.on('mouseover', () => {
                  console.log('🐭 Mouse over en:', feature.properties?.nickname || feature.properties?.id_via)
                  const pathLayer = layer as any
                  if (pathLayer.setStyle) {
                    pathLayer.setStyle({
                      color: '#00ff00',
                      weight: 10
                    })
                  }
                })

                layer.on('mouseout', () => {
                  const pathLayer = layer as any
                  if (pathLayer.setStyle) {
                    pathLayer.setStyle({
                      color: '#ff0000',
                      weight: 8
                    })
                  }
                })
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Instrucciones */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm">
        <h4 className="font-semibold mb-2">Instrucciones de Diagnóstico:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Las vías aparecen en <span className="text-red-600 font-medium">color rojo</span></li>
          <li>Al pasar el mouse sobre una vía, debe cambiar a <span className="text-green-600 font-medium">color verde</span></li>
          <li>Al hacer click en una vía, la información debe aparecer arriba</li>
          <li>Si no funciona, revise la consola del navegador para errores</li>
        </ol>
      </div>
    </div>
  )
}

export default MapClickDiagnostics

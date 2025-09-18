'use client'

import React, { useEffect, useState } from 'react'

function ClientOnlyMapComponent() {
  const [isClient, setIsClient] = useState(false)
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    console.log('🌐 ClientOnlyMapComponent: useEffect ejecutándose')
    setIsClient(true)
    
    // Import manual de react-leaflet solo en el cliente
    import('react-leaflet').then((mod) => {
      console.log('📦 react-leaflet importado exitosamente')
      const { MapContainer, TileLayer } = mod
      
      const SimpleMap = () => {
        console.log('🗺️ SimpleMap: ¡COMPONENTE RENDERIZADO!')
        
        return (
          <div className="w-full h-96 border-4 border-green-500">
            <MapContainer
              center={[3.4516, -76.5320]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
            </MapContainer>
          </div>
        )
      }
      
      setMapComponent(() => SimpleMap)
    }).catch((error) => {
      console.error('❌ Error importando react-leaflet:', error)
    })
  }, [])

  console.log('🔍 ClientOnlyMapComponent: Renderizando, isClient:', isClient, 'MapComponent:', !!MapComponent)

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-blue-200 border-4 border-blue-500 flex items-center justify-center">
        <div className="text-black font-bold text-xl">DETECTANDO CLIENTE...</div>
      </div>
    )
  }

  if (!MapComponent) {
    return (
      <div className="w-full h-96 bg-orange-200 border-4 border-orange-500 flex items-center justify-center">
        <div className="text-black font-bold text-xl">CARGANDO LEAFLET...</div>
      </div>
    )
  }

  return <MapComponent />
}

export default function ManualClientTestPage() {
  console.log('🧪 ManualClientTestPage: Renderizando página de test manual')
  
  return (
    <div className="min-h-screen bg-green-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 bg-green-300 p-4 text-center">
          TEST MANUAL DE CLIENT-SIDE RENDERING
        </h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center bg-yellow-200 p-2">
            Sin dynamic import - Solo useEffect + useState
          </h2>
          
          <ClientOnlyMapComponent />
          
          <div className="mt-4 p-4 bg-gray-100 text-sm">
            <p><strong>¿Qué debería ver?</strong></p>
            <ul className="list-disc pl-5 mt-2">
              <li>Primero: "DETECTANDO CLIENTE..." (azul)</li>
              <li>Después: "CARGANDO LEAFLET..." (naranja)</li>
              <li>Finalmente: Mapa con borde verde</li>
              <li>Si se queda en algún paso, ese es donde falla</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
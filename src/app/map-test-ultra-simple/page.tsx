'use client'

import dynamic from 'next/dynamic'

const UltraSimpleMap = dynamic(
  () => {
    return import('react-leaflet').then((mod) => {
      const { MapContainer, TileLayer } = mod
      
      function SimpleMapComponent() {
        console.log('🗺️ UltraSimpleMap: ¡COMPONENTE MONTADO!')
        
        return (
          <div className="w-full h-96 border-4 border-red-500">
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
      
      return SimpleMapComponent
    })
  },
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-yellow-200 border-4 border-orange-500 flex items-center justify-center">
        <div className="text-black font-bold text-xl">CARGANDO MAPA ULTRA SIMPLE...</div>
      </div>
    )
  }
)

export default function MapTestUltraSimplePage() {
  console.log('🧪 MapTestUltraSimplePage: Renderizando página ultra simple')
  
  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 bg-yellow-300 p-4 text-center">
          TEST ULTRA SIMPLE DE MAPA
        </h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center bg-green-200 p-2">
            Mapa con bordes visibles para debugging
          </h2>
          
          <UltraSimpleMap />
          
          <div className="mt-4 p-4 bg-gray-100 text-sm">
            <p><strong>¿Qué debería ver?</strong></p>
            <ul className="list-disc pl-5 mt-2">
              <li>Un borde rojo alrededor del mapa</li>
              <li>Un mapa de OpenStreetMap de Cali</li>
              <li>Si solo ve el borde rojo vacío, hay problema con Leaflet</li>
              <li>Si ve "CARGANDO..." permanentemente, hay problema con dynamic import</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
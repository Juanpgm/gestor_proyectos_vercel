'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// Cargar con dynamic import directo
const DynamicBasicMap = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { MapContainer, TileLayer } = mod
    
    const BasicMapComponent = () => {
      console.log('🗺️ BasicMapComponent: Montando mapa básico')
      
      return (
        <div style={{ height: '400px', width: '100%' }}>
          <MapContainer
            center={[3.4516, -76.5320]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </MapContainer>
        </div>
      )
    }
    
    return BasicMapComponent
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Cargando mapa básico...</p>
        </div>
      </div>
    )
  }
)

export default function MapTestBasicPage() {
  console.log('🧪 MapTestBasicPage: Renderizando página de test básico')
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Test Básico de Leaflet
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Mapa Básico (Solo Leaflet)
          </h2>
          
          <div className="border-2 border-blue-200 rounded-lg" style={{ height: '400px' }}>
            <DynamicBasicMap />
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Este es un test con solo Leaflet MapContainer y TileLayer, sin useMapData ni componentes complejos.
          </div>
        </div>
      </div>
    </div>
  )
}
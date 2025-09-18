'use client'

import React from 'react'

// Componente que solo renderiza en el cliente sin useEffect
function DirectClientMapComponent() {
  console.log('🗺️ DirectClientMapComponent: Renderizando, window exists:', typeof window !== 'undefined')
  
  // Si no estamos en el cliente, mostrar loading
  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-96 bg-gray-200 border-4 border-gray-500 flex items-center justify-center">
        <div className="text-black font-bold text-xl">SERVER SIDE - NO WINDOW</div>
      </div>
    )
  }
  
  // Estamos en el cliente, cargar Leaflet directamente
  try {
    const React = require('react')
    const { MapContainer, TileLayer } = require('react-leaflet')
    
    console.log('🗺️ DirectClientMapComponent: react-leaflet cargado exitosamente')
    
    return (
      <div className="w-full h-96 border-4 border-purple-500">
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
  } catch (error) {
    console.error('❌ Error cargando react-leaflet:', error)
    return (
      <div className="w-full h-96 bg-red-200 border-4 border-red-500 flex items-center justify-center">
        <div className="text-black font-bold text-xl">ERROR CARGANDO LEAFLET</div>
      </div>
    )
  }
}

export default function DirectClientTestPage() {
  console.log('🧪 DirectClientTestPage: Renderizando página de test directo')
  
  return (
    <div className="min-h-screen bg-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 bg-purple-300 p-4 text-center">
          TEST DIRECTO SIN USEEFFECT
        </h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center bg-pink-200 p-2">
            Render directo con typeof window check
          </h2>
          
          <DirectClientMapComponent />
          
          <div className="mt-4 p-4 bg-gray-100 text-sm">
            <p><strong>¿Qué debería ver?</strong></p>
            <ul className="list-disc pl-5 mt-2">
              <li>En servidor: "SERVER SIDE - NO WINDOW" (gris)</li>
              <li>En cliente: Mapa con borde morado</li>
              <li>Si ve rojo: Error cargando Leaflet</li>
              <li>Este test evita useEffect completamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
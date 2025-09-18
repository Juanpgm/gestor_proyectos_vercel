'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Eye, EyeOff, Target, Maximize2, Minimize2 } from 'lucide-react'

// Coordenadas de Cali
const CALI_COORDINATES = {
  CENTER_LAT_LNG: [3.4516, -76.5320] as [number, number],
  DEFAULT_ZOOM: 12
}

interface SimpleMapProps {
  className?: string
  height?: string
  onError?: (error: any) => void
}

function SimpleWorkingMap({ className = 'w-full h-96', height = '400px', onError }: SimpleMapProps) {
  console.log('🗺️ SimpleWorkingMap: Iniciando renderizado')
  
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<any>(null)
  const [MapComponents, setMapComponents] = useState<any>(null)
  
  useEffect(() => {
    console.log('🔄 SimpleWorkingMap: useEffect ejecutándose')
    
    async function loadLeaflet() {
      try {
        console.log('📦 Intentando cargar react-leaflet...')
        
        // Importar Leaflet primero
        const leaflet = await import('leaflet')
        console.log('✅ Leaflet base cargado')
        
        // Importar react-leaflet
        const reactLeaflet = await import('react-leaflet')
        console.log('✅ react-leaflet cargado')
        
        setMapComponents({
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          L: leaflet.default
        })
        
        setMapLoaded(true)
        console.log('✅ Todos los componentes de mapa cargados exitosamente')
        
      } catch (error) {
        console.error('❌ Error cargando Leaflet:', error)
        setMapError(error)
        if (onError) onError(error)
      }
    }
    
    loadLeaflet()
  }, [onError])
  
  console.log('� SimpleWorkingMap: Estado actual - mapLoaded:', mapLoaded, 'mapError:', !!mapError)
  
  if (mapError) {
    return (
      <div className={`${className} bg-red-100 border-2 border-red-300 flex items-center justify-center`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-600 font-bold">❌ Error</div>
          <div className="text-red-500 text-sm">No se pudo cargar el mapa</div>
        </div>
      </div>
    )
  }
  
  if (!mapLoaded || !MapComponents) {
    return (
      <div className={`${className} bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center`} style={{ height }}>
        <div className="text-center">
          <div className="text-yellow-600 font-bold">⏳ Cargando...</div>
          <div className="text-yellow-500 text-sm">Descargando componentes del mapa</div>
        </div>
      </div>
    )
  }
  
  try {
    console.log('🗺️ SimpleWorkingMap: Renderizando MapContainer con componentes cargados')
    
    const { MapContainer, TileLayer } = MapComponents
    
    return (
      <div className={className} style={{ height }}>
        <MapContainer
          center={CALI_COORDINATES.CENTER_LAT_LNG}
          zoom={CALI_COORDINATES.DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
      </div>
    )
  } catch (error) {
    console.error('❌ Error renderizando mapa:', error)
    if (onError) onError(error)
    
    return (
      <div className={`${className} bg-red-100 border-2 border-red-300 flex items-center justify-center`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-600 font-bold">❌ Error</div>
          <div className="text-red-500 text-sm">Error en renderizado</div>
        </div>
      </div>
    )
  }
}

export default function SimpleMapTestPage() {
  console.log('🧪 SimpleMapTestPage: Renderizando página con mapa simple')
  
  const [error, setError] = useState<any>(null)
  
  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 bg-green-300 p-4 text-center">
          MAPA SIMPLE - CON ASYNC IMPORTS
        </h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center bg-green-200 p-2">
            Mapa con carga asíncrona en useEffect
          </h2>
          
          <SimpleWorkingMap 
            className="w-full border-4 border-green-500"
            height="500px"
            onError={setError}
          />
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded">
              <h3 className="font-bold text-red-600">Error detectado:</h3>
              <pre className="text-sm text-red-500 mt-2">{JSON.stringify(error, null, 2)}</pre>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-gray-100 text-sm">
            <p><strong>¿Qué debería ver?</strong></p>
            <ul className="list-disc pl-5 mt-2">
              <li>� Borde amarillo: "Cargando..." (temporal)</li>
              <li>� Borde verde: Mapa cargado exitosamente</li>
              <li>🔴 Borde rojo: Error cargando mapa</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
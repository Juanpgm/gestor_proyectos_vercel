'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Cargar MapClickDiagnostics de forma dinámica solo en el cliente
const MapClickDiagnostics = dynamic(
  () => import('./MapClickDiagnostics'),
  {
    ssr: false, // Deshabilitar renderizado en servidor
    loading: () => (
      <div className="w-full bg-gray-100 rounded-lg p-8 text-center" style={{ height: '600px' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Cargando mapa de diagnóstico...</p>
      </div>
    )
  }
)

interface MapClickDiagnosticsWrapperProps {
  height?: string
}

const MapClickDiagnosticsWrapper: React.FC<MapClickDiagnosticsWrapperProps> = ({ height = '600px' }) => {
  return <MapClickDiagnostics height={height} />
}

export default MapClickDiagnosticsWrapper

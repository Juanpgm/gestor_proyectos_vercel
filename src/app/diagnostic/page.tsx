'use client'

import React from 'react'
import MapClickDiagnostics from '@/components/MapClickDiagnostics'

export default function DiagnosticPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Diagnóstico de Clicks en Vías
        </h1>
        
        <MapClickDiagnostics height="600px" />
      </div>
    </div>
  )
}

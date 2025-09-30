'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'

// Importar dinámicamente los componentes de diagnóstico
const DataDiagnostic = dynamic(
  () => import('@/components/DataDiagnostic'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }
)

type DiagnosticTab = 'health'

export default function DiagnosticPage() {
  const [activeTab, setActiveTab] = useState<DiagnosticTab>('health')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🔍</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Panel de Diagnósticos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Herramientas avanzadas para monitoreo y análisis de datos
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('health')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'health'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>🏥</span>
              <span>Estado de Salud GeoJSON</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'health' && (
            <div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🏥 Monitoreo de Salud de Datos
                </h2>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-sm">
                  <li>• Verifica la integridad de todos los archivos GeoJSON</li>
                  <li>• Detecta problemas de coordenadas y formatos inválidos</li>
                  <li>• Proporciona soluciones automáticas para errores comunes</li>
                  <li>• Genera reportes detallados descargables</li>
                  <li>• Monitorea estadísticas de features y geometrías</li>
                </ul>
              </div>
              <DataDiagnostic />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

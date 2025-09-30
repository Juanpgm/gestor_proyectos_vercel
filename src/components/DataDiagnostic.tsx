'use client'

import React from 'react'
// Removed imports of Unidades de Proyecto hooks as section was deleted
// import { useUnidadesProyecto } from '../hooks/useUnidadesProyecto'
// import { useUnidadesProyectoWithSmartCache } from '../hooks/useUnidadesProyectoWithSmartCache'
import SmartCacheReport from './SmartCacheReport'

/**
 * Componente de diagnóstico para entender qué está pasando con los datos
 */
export default function DataDiagnosticComponent() {
  // Commented out as hooks were removed
  // const apiData = useUnidadesProyecto()
  // const smartCacheData = useUnidadesProyectoWithSmartCache()
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE
  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🔍 Diagnóstico de Datos
      </h2>
      
      {/* Configuración de entorno */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">📋 Configuración</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>API URL:</strong> {apiUrl || 'No configurada'}
          </div>
          <div>
            <strong>Data Mode:</strong> {dataMode || 'No configurado'}
          </div>
          <div>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </div>
          <div>
            <strong>Window Available:</strong> {typeof window !== 'undefined' ? 'Sí' : 'No'}
          </div>
        </div>
      </div>

      {/* Datos API */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">🌐 Datos API</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Estado:</strong> No disponible (hooks removidos)
          </div>
          <div>
            <strong>Registros:</strong> N/A
          </div>
          <div>
            <strong>Error:</strong> N/A
          </div>
          <div className="md:col-span-3">
            <strong>Archivos GeoJSON:</strong> N/A
          </div>
          <div className="md:col-span-3">
            <strong>Archivos cargados:</strong> N/A
          </div>
        </div>
      </div>

      {/* Datos Smart Cache */}
      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-cyan-800 dark:text-cyan-200 mb-2">🧠 Cache Inteligente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Estado:</strong> No disponible (hooks removidos)
          </div>
          <div>
            <strong>Registros:</strong> N/A
          </div>
          <div>
            <strong>Fuente:</strong> N/A
          </div>
          <div>
            <strong>Desde cache:</strong> N/A
          </div>
          <div>
            <strong>Horario permitido:</strong> N/A
          </div>
          <div>
            <strong>Error:</strong> N/A
          </div>
          <div className="md:col-span-3">
            <strong>Próxima actualización:</strong> N/A
          </div>
          <div className="md:col-span-3">
            <strong>Cache timestamp:</strong> N/A
          </div>
        </div>
      </div>

      {/* Muestra de datos */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🌐 Muestra de Datos API</h3>
        <div className="text-xs overflow-x-auto">
          <p className="text-gray-600 dark:text-gray-400">
            No hay datos disponibles (hooks removidos)
          </p>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">💡 Recomendaciones</h3>
        <ul className="text-sm space-y-1">
          {!apiUrl && (
            <li>• Configura NEXT_PUBLIC_API_URL en .env.local para conectar con la API</li>
          )}
          <li>• Los hooks de Unidades de Proyecto han sido removidos</li>
          <li>• Este componente necesita ser actualizado o removido</li>
        </ul>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Recargar Página
        </button>
      </div>

      {/* Reporte del Smart Cache */}
      <div className="mt-8">
        <SmartCacheReport />
      </div>
    </div>
  )
}
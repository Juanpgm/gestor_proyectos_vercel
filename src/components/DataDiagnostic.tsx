'use client'

import React from 'react'
// Removed imports of Unidades de Proyecto hooks as section was deleted
// import { useUnidadesProyecto } from '../hooks/useUnidadesProyecto'
// import { useUnidadesProyectoWithSmartCache } from '../hooks/useUnidadesProyectoWithSmartCache'
// import SmartCacheReport from './SmartCacheReport'

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
    <main className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🔍 Diagnóstico de Datos
      </h2>
      
      {/* Configuración de entorno */}
      <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">📋 Configuración</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <span>
            <strong>API URL:</strong> {apiUrl || 'No configurada'}
          </span>
          <span>
            <strong>Data Mode:</strong> {dataMode || 'No configurado'}
          </span>
          <span>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </span>
          <span>
            <strong>Window Available:</strong> {typeof window !== 'undefined' ? 'Sí' : 'No'}
          </span>
        </dl>
      </section>

      {/* Datos API */}
      <section className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">🌐 Datos API</h3>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <span>
            <strong>Estado:</strong> No disponible (hooks removidos)
          </span>
          <span>
            <strong>Registros:</strong> N/A
          </span>
          <span>
            <strong>Error:</strong> N/A
          </span>
          <span className="md:col-span-3">
            <strong>Archivos GeoJSON:</strong> N/A
          </span>
          <span className="md:col-span-3">
            <strong>Archivos cargados:</strong> N/A
          </span>
        </dl>
      </section>

      {/* Datos Smart Cache */}
      <section className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-cyan-800 dark:text-cyan-200 mb-2">🧠 Cache Inteligente</h3>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <span>
            <strong>Estado:</strong> No disponible (hooks removidos)
          </span>
          <span>
            <strong>Registros:</strong> N/A
          </span>
          <span>
            <strong>Fuente:</strong> N/A
          </span>
          <span>
            <strong>Desde cache:</strong> N/A
          </span>
          <span>
            <strong>Horario permitido:</strong> N/A
          </span>
          <span>
            <strong>Error:</strong> N/A
          </span>
          <span className="md:col-span-3">
            <strong>Próxima actualización:</strong> N/A
          </span>
          <span className="md:col-span-3">
            <strong>Cache timestamp:</strong> N/A
          </span>
        </dl>
      </section>

      {/* Muestra de datos */}
      <section className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🌐 Muestra de Datos API</h3>
        <pre className="text-xs overflow-x-auto">
          <p className="text-gray-600 dark:text-gray-400">
            No hay datos disponibles (hooks removidos)
          </p>
        </pre>
      </section>

      {/* Recomendaciones */}
      <section className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">💡 Recomendaciones</h3>
        <ul className="text-sm space-y-1">
          {!apiUrl && (
            <li>• Configura NEXT_PUBLIC_API_URL en .env.local para conectar con la API</li>
          )}
          <li>• Los hooks de Unidades de Proyecto han sido removidos</li>
          <li>• Este componente necesita ser actualizado o removido</li>
        </ul>
      </section>

      {/* Botones de acción */}
      <nav className="flex flex-wrap gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Recargar Página
        </button>
      </nav>

      {/* Reporte del Smart Cache */}
      <section className="mt-8">
        {/* SmartCacheReport temporalmente deshabilitado */}
      </section>
    </main>
  )
}
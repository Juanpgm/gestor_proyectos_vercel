'use client'

import React from 'react'
import { useUnidadesProyectoOffline } from '../hooks/useUnidadesProyectoOffline'
import { useUnidadesProyecto } from '../hooks/useUnidadesProyecto'
import { useUnidadesProyectoWithSmartCache } from '../hooks/useUnidadesProyectoWithSmartCache'
import SmartCacheReport from './SmartCacheReport'

/**
 * Componente de diagnóstico para entender qué está pasando con los datos
 */
export default function DataDiagnosticComponent() {
  const offlineData = useUnidadesProyectoOffline()
  const apiData = useUnidadesProyecto()
  const smartCacheData = useUnidadesProyectoWithSmartCache()
  
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

      {/* Datos Offline */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">💾 Datos Offline (Mock)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Estado:</strong> {offlineData.loading ? '⏳ Cargando' : '✅ Cargado'}
          </div>
          <div>
            <strong>Registros:</strong> {offlineData.data.length}
          </div>
          <div>
            <strong>Error:</strong> {offlineData.error || 'Ninguno'}
          </div>
          <div className="md:col-span-3">
            <strong>Métricas:</strong> {offlineData.metrics ? 'Disponibles' : 'No disponibles'}
          </div>
          <div className="md:col-span-3">
            <strong>Última actualización:</strong> {offlineData.lastUpdated || 'N/A'}
          </div>
        </div>
      </div>

      {/* Datos API */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">🌐 Datos API</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Estado:</strong> {apiData.loading ? '⏳ Cargando' : '✅ Cargado'}
          </div>
          <div>
            <strong>Registros:</strong> {apiData.unidadesProyecto.length}
          </div>
          <div>
            <strong>Error:</strong> {apiData.error || 'Ninguno'}
          </div>
          <div className="md:col-span-3">
            <strong>Archivos GeoJSON:</strong> {Object.keys(apiData.allGeoJSONData || {}).length}
          </div>
          <div className="md:col-span-3">
            <strong>Archivos cargados:</strong> {Object.keys(apiData.allGeoJSONData || {}).join(', ') || 'Ninguno'}
          </div>
        </div>
      </div>

      {/* Datos Smart Cache */}
      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-cyan-800 dark:text-cyan-200 mb-2">🧠 Cache Inteligente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Estado:</strong> {smartCacheData.loading ? '⏳ Cargando' : '✅ Cargado'}
          </div>
          <div>
            <strong>Registros:</strong> {smartCacheData.data.length}
          </div>
          <div>
            <strong>Fuente:</strong> {smartCacheData.source}
          </div>
          <div>
            <strong>Desde cache:</strong> {smartCacheData.isFromCache ? 'Sí' : 'No'}
          </div>
          <div>
            <strong>Horario permitido:</strong> {smartCacheData.isWithinAllowedHours ? '✅ Sí' : '🚫 No'}
          </div>
          <div>
            <strong>Error:</strong> {smartCacheData.error || 'Ninguno'}
          </div>
          <div className="md:col-span-3">
            <strong>Próxima actualización:</strong> {
              smartCacheData.nextUpdateTime 
                ? new Date(smartCacheData.nextUpdateTime).toLocaleString()
                : 'N/A'
            }
          </div>
          <div className="md:col-span-3">
            <strong>Cache timestamp:</strong> {
              smartCacheData.cacheTimestamp 
                ? new Date(smartCacheData.cacheTimestamp).toLocaleString()
                : 'N/A'
            }
          </div>
        </div>
      </div>

      {/* Muestra de datos */}
      {offlineData.data.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">📊 Muestra de Datos Offline</h3>
          <div className="text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(offlineData.data.slice(0, 3), null, 2)}
            </pre>
          </div>
        </div>
      )}

      {apiData.unidadesProyecto.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🌐 Muestra de Datos API</h3>
          <div className="text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(apiData.unidadesProyecto.slice(0, 3), null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">💡 Recomendaciones</h3>
        <ul className="text-sm space-y-1">
          {!apiUrl && (
            <li>• Configura NEXT_PUBLIC_API_URL en .env.local para conectar con la API</li>
          )}
          {apiData.error && (
            <li>• Hay un error en la carga de datos API: {apiData.error}</li>
          )}
          {offlineData.data.length < 100 && (
            <li>• Los datos offline tienen menos de 100 registros</li>
          )}
          {apiData.unidadesProyecto.length > 0 && offlineData.data.length > 0 && (
            <li>• ✅ Ambas fuentes de datos están funcionando</li>
          )}
        </ul>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => offlineData.refresh()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          🔄 Refrescar Offline
        </button>
        
        <button
          onClick={() => smartCacheData.refresh()}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          🧠 Refrescar Smart Cache
        </button>
        
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
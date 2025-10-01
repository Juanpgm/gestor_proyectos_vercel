'use client'

import React, { useState, useEffect } from 'react'
// Removed import of useSmartCacheStats as Unidades de Proyecto section was deleted
// import { useSmartCacheStats } from '../hooks/useUnidadesProyectoWithSmartCache'
import { clearCache } from '../utils/smartCache'

/**
 * Componente de Reporte del Sistema de Cache Inteligente
 * Muestra estadísticas, rendimiento y optimización de llamadas API
 */
export default function SmartCacheReport() {
  // Commented out as hook was removed
  // const { stats, refreshStats } = useSmartCacheStats()
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Mock data since hook was removed
  const stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    totalSavings: 0,
    lastUpdate: null,
    performance: {
      estimatedDailyCalls: 4,
      actualDailyCalls: 0,
      cacheDurationHours: 4
    },
    schedule: {
      currentHour: new Date().getHours(),
      isAllowedHour: true,
      nextAllowedTime: null,
      nextUpdateTime: 'N/A',
      hoursUntilNextUpdate: 0,
      allowedHours: [5, 12, 16, 20]
    },
    cache: {
      size: 0,
      maxSize: 100,
      hitRate: 0,
      validEntries: 0,
      staleEntries: 0
    },
    api: {
      successRate: 0,
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastCallTime: 'N/A',
      callsByHour: {} as { [key: number]: number }
    }
  }
  
  const refreshStats = () => {
    // No-op since hook was removed
  }
  
  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(refreshStats, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshStats])
  
  // Función para limpiar cache
  const handleClearCache = () => {
    const cleared = clearCache()
    refreshStats()
    alert(`Cache limpiado: ${cleared} entradas eliminadas`)
  }
  
  // Calcular ahorros
  const estimatedMonthlyCalls = 30 * 24 // Sin cache: una llamada por hora
  const actualMonthlyCalls = 30 * stats.performance.estimatedDailyCalls // Con cache: 4 llamadas por día
  const callReduction = ((estimatedMonthlyCalls - actualMonthlyCalls) / estimatedMonthlyCalls) * 100
  
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Reporte del Sistema de Cache Inteligente
        </h2>
        <nav className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh</span>
          </label>
          <button
            onClick={refreshStats}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            🔄 Actualizar
          </button>
          <button
            onClick={handleClearCache}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            🗑️ Limpiar Cache
          </button>
        </nav>
      </header>
      
      {/* Estado Actual */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">🕐 Estado Actual</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="inline"><strong>Hora actual:</strong></dt> <dd className="inline">{stats.schedule.currentHour}:00</dd></div>
            <div>
              <dt className="inline"><strong>Estado:</strong></dt>{' '}
              <dd className={`inline ${stats.schedule.isAllowedHour ? 'text-green-600' : 'text-red-600'}`}>
                {stats.schedule.isAllowedHour ? '✅ Permitido API' : '🚫 Solo Cache'}
              </dd>
            </div>
            <div><dt className="inline"><strong>Próxima actualización:</strong></dt> <dd className="inline">{stats.schedule.nextUpdateTime}</dd></div>
            <div><dt className="inline"><strong>Horas hasta actualización:</strong></dt> <dd className="inline">{stats.schedule.hoursUntilNextUpdate}h</dd></div>
          </dl>
        </article>
        
        <article className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">📈 Rendimiento</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="inline"><strong>Hit Rate:</strong></dt> <dd className="inline">{(stats.cache.hitRate * 100).toFixed(1)}%</dd></div>
            <div><dt className="inline"><strong>Entradas válidas:</strong></dt> <dd className="inline">{stats.cache.validEntries}</dd></div>
            <div><dt className="inline"><strong>Entradas obsoletas:</strong></dt> <dd className="inline">{stats.cache.staleEntries}</dd></div>
            <div><dt className="inline"><strong>Tasa de éxito API:</strong></dt> <dd className="inline">{(stats.api.successRate * 100).toFixed(1)}%</dd></div>
          </dl>
        </article>
        
        <article className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">💰 Optimización</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="inline"><strong>Reducción de llamadas:</strong></dt> <dd className="inline">{callReduction.toFixed(1)}%</dd></div>
            <div><dt className="inline"><strong>Llamadas estimadas/mes:</strong></dt> <dd className="inline">{estimatedMonthlyCalls}</dd></div>
            <div><dt className="inline"><strong>Llamadas reales/mes:</strong></dt> <dd className="inline">{actualMonthlyCalls}</dd></div>
            <div><dt className="inline"><strong>Ahorro mensual:</strong></dt> <dd className="inline">{estimatedMonthlyCalls - actualMonthlyCalls} llamadas</dd></div>
          </dl>
        </article>
      </section>
      
      {/* Horarios Configurados */}
      <section className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-3">⏰ Horarios de API Configurados</h3>
        <section className="grid grid-cols-4 gap-4">
          {stats.schedule.allowedHours.map(hour => {
            const callsInHour = stats.api.callsByHour[hour] || 0
            const isCurrentHour = stats.schedule.currentHour === hour
            
            return (
              <article
                key={hour}
                className={`p-3 rounded-lg text-center ${
                  isCurrentHour 
                    ? 'bg-green-200 dark:bg-green-800 border-2 border-green-500' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <p className="font-bold text-lg">{hour}:00</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {callsInHour} llamadas
                </p>
                {isCurrentHour && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    Actual
                  </p>
                )}
              </article>
            )
          })}
        </section>
      </section>
      
      {/* Estadísticas de API */}
      <section className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">🌐 Estadísticas de API</h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="inline"><strong>Total de llamadas:</strong></dt> <dd className="inline">{stats.api.totalCalls}</dd>
          </div>
          <div>
            <dt className="inline"><strong>Cache hits:</strong></dt> <dd className="inline">{stats.api.cacheHits}</dd>
          </div>
          <div>
            <dt className="inline"><strong>Cache misses:</strong></dt> <dd className="inline">{stats.api.cacheMisses}</dd>
          </div>
          <div>
            <dt className="inline"><strong>Última llamada:</strong></dt> <dd className="inline">{stats.api.lastCallTime}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="inline"><strong>Llamadas hoy:</strong></dt> <dd className="inline">{stats.performance.actualDailyCalls} / {stats.performance.estimatedDailyCalls} estimadas</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="inline"><strong>Duración del cache:</strong></dt> <dd className="inline">{stats.performance.cacheDurationHours}h</dd>
          </div>
        </dl>
      </section>
      
      {/* Configuración y Beneficios */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-3">⚙️ Configuración</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Horarios API:</strong> 5:00, 12:00, 16:00, 20:00</li>
            <li>• <strong>Duración cache:</strong> 4 horas</li>
            <li>• <strong>Reintentos máximos:</strong> 3</li>
            <li>• <strong>Timeout:</strong> 30 segundos</li>
            <li>• <strong>Fallback:</strong> Datos offline</li>
          </ul>
        </article>
        
        <article className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3">✨ Beneficios</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Reducción de costos:</strong> {callReduction.toFixed(1)}% menos llamadas</li>
            <li>• <strong>Mejor rendimiento:</strong> Respuesta instantánea desde cache</li>
            <li>• <strong>Disponibilidad:</strong> Datos disponibles 24/7</li>
            <li>• <strong>Tolerancia a fallos:</strong> Fallback automático</li>
            <li>• <strong>Optimización horaria:</strong> Solo 4 llamadas/día vs 24</li>
          </ul>
        </article>
      </section>
      
      {/* Recomendaciones */}
      <section className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-3">💡 Recomendaciones</h3>
        <section className="text-sm space-y-2">
          {stats.cache.hitRate < 0.7 && (
            <p className="text-orange-600">
              • Hit rate bajo ({(stats.cache.hitRate * 100).toFixed(1)}%). Considera aumentar la duración del cache.
            </p>
          )}
          {stats.api.successRate < 0.9 && (
            <p className="text-red-600">
              • Tasa de éxito API baja ({(stats.api.successRate * 100).toFixed(1)}%). Revisa la conectividad.
            </p>
          )}
          {stats.cache.staleEntries > 5 && (
            <p className="text-yellow-600">
              • Muchas entradas obsoletas ({stats.cache.staleEntries}). Considera limpiar el cache.
            </p>
          )}
          {stats.performance.actualDailyCalls > stats.performance.estimatedDailyCalls && (
            <p className="text-orange-600">
              • Más llamadas de las esperadas. Revisa la lógica de cache.
            </p>
          )}
        </section>
      </section>
      
      <footer className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Última actualización: {new Date().toLocaleString()}
      </footer>
    </article>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { useSmartCacheStats } from '../hooks/useUnidadesProyectoWithSmartCache'
import { clearCache } from '../utils/smartCache'

/**
 * Componente de Reporte del Sistema de Cache Inteligente
 * Muestra estadísticas, rendimiento y optimización de llamadas API
 */
export default function SmartCacheReport() {
  const { stats, refreshStats } = useSmartCacheStats()
  const [autoRefresh, setAutoRefresh] = useState(true)
  
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Reporte del Sistema de Cache Inteligente
        </h2>
        <div className="flex items-center space-x-3">
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
        </div>
      </div>
      
      {/* Estado Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">🕐 Estado Actual</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Hora actual:</strong> {stats.schedule.currentHour}:00</div>
            <div>
              <strong>Estado:</strong>{' '}
              <span className={stats.schedule.isAllowedHour ? 'text-green-600' : 'text-red-600'}>
                {stats.schedule.isAllowedHour ? '✅ Permitido API' : '🚫 Solo Cache'}
              </span>
            </div>
            <div><strong>Próxima actualización:</strong> {stats.schedule.nextUpdateTime}</div>
            <div><strong>Horas hasta actualización:</strong> {stats.schedule.hoursUntilNextUpdate}h</div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">📈 Rendimiento</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Hit Rate:</strong> {(stats.cache.hitRate * 100).toFixed(1)}%</div>
            <div><strong>Entradas válidas:</strong> {stats.cache.validEntries}</div>
            <div><strong>Entradas obsoletas:</strong> {stats.cache.staleEntries}</div>
            <div><strong>Tasa de éxito API:</strong> {(stats.api.successRate * 100).toFixed(1)}%</div>
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">💰 Optimización</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Reducción de llamadas:</strong> {callReduction.toFixed(1)}%</div>
            <div><strong>Llamadas estimadas/mes:</strong> {estimatedMonthlyCalls}</div>
            <div><strong>Llamadas reales/mes:</strong> {actualMonthlyCalls}</div>
            <div><strong>Ahorro mensual:</strong> {estimatedMonthlyCalls - actualMonthlyCalls} llamadas</div>
          </div>
        </div>
      </div>
      
      {/* Horarios Configurados */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-3">⏰ Horarios de API Configurados</h3>
        <div className="grid grid-cols-4 gap-4">
          {stats.schedule.allowedHours.map(hour => {
            const callsInHour = stats.api.callsByHour[hour] || 0
            const isCurrentHour = stats.schedule.currentHour === hour
            
            return (
              <div
                key={hour}
                className={`p-3 rounded-lg text-center ${
                  isCurrentHour 
                    ? 'bg-green-200 dark:bg-green-800 border-2 border-green-500' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <div className="font-bold text-lg">{hour}:00</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {callsInHour} llamadas
                </div>
                {isCurrentHour && (
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    Actual
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Estadísticas de API */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">🌐 Estadísticas de API</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong>Total de llamadas:</strong> {stats.api.totalCalls}
          </div>
          <div>
            <strong>Cache hits:</strong> {stats.api.cacheHits}
          </div>
          <div>
            <strong>Cache misses:</strong> {stats.api.cacheMisses}
          </div>
          <div>
            <strong>Última llamada:</strong> {stats.api.lastCallTime}
          </div>
          <div className="md:col-span-2">
            <strong>Llamadas hoy:</strong> {stats.performance.actualDailyCalls} / {stats.performance.estimatedDailyCalls} estimadas
          </div>
          <div className="md:col-span-2">
            <strong>Duración del cache:</strong> {stats.performance.cacheDurationHours}h
          </div>
        </div>
      </div>
      
      {/* Configuración y Beneficios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-3">⚙️ Configuración</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Horarios API:</strong> 5:00, 12:00, 16:00, 20:00</li>
            <li>• <strong>Duración cache:</strong> 4 horas</li>
            <li>• <strong>Reintentos máximos:</strong> 3</li>
            <li>• <strong>Timeout:</strong> 30 segundos</li>
            <li>• <strong>Fallback:</strong> Datos offline</li>
          </ul>
        </div>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3">✨ Beneficios</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Reducción de costos:</strong> {callReduction.toFixed(1)}% menos llamadas</li>
            <li>• <strong>Mejor rendimiento:</strong> Respuesta instantánea desde cache</li>
            <li>• <strong>Disponibilidad:</strong> Datos disponibles 24/7</li>
            <li>• <strong>Tolerancia a fallos:</strong> Fallback automático</li>
            <li>• <strong>Optimización horaria:</strong> Solo 4 llamadas/día vs 24</li>
          </ul>
        </div>
      </div>
      
      {/* Recomendaciones */}
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-3">💡 Recomendaciones</h3>
        <div className="text-sm space-y-2">
          {stats.cache.hitRate < 0.7 && (
            <div className="text-orange-600">
              • Hit rate bajo ({(stats.cache.hitRate * 100).toFixed(1)}%). Considera aumentar la duración del cache.
            </div>
          )}
          {stats.api.successRate < 0.9 && (
            <div className="text-red-600">
              • Tasa de éxito API baja ({(stats.api.successRate * 100).toFixed(1)}%). Revisa la conectividad.
            </div>
          )}
          {stats.cache.staleEntries > 5 && (
            <div className="text-yellow-600">
              • Muchas entradas obsoletas ({stats.cache.staleEntries}). Considera limpiar el cache.
            </div>
          )}
          {stats.performance.actualDailyCalls > stats.performance.estimatedDailyCalls && (
            <div className="text-orange-600">
              • Más llamadas de las esperadas. Revisa la lógica de cache.
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Última actualización: {new Date().toLocaleString()}
      </div>
    </div>
  )
}
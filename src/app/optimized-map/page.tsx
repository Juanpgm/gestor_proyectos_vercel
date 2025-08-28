'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Activity, 
  Database, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic imports para evitar problemas de SSR
const OptimizedMapInterface = dynamic(
  () => import('@/components/OptimizedMapInterface'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Cargando mapa optimizado...
          </p>
        </div>
      </div>
    )
  }
)

// Dynamic imports para hooks que usan window
const useOptimizedMapHooks = () => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const clearOptimizedMapCache = useCallback(() => {
    if (mounted && typeof window !== 'undefined') {
      import('@/hooks/useOptimizedMapData').then(module => {
        module.clearOptimizedMapCache()
        console.log('🧹 Cache limpiado completamente')
      })
    }
  }, [mounted])

  const getOptimizedMapStats = useCallback(() => {
    if (mounted && typeof window !== 'undefined') {
      import('@/hooks/useOptimizedMapData').then(module => {
        const stats = module.getOptimizedMapStats()
        console.log('📊 Estadísticas actuales:', stats)
      })
    }
  }, [mounted])

  const configureMapCache = useCallback((maxSize: number, maxAge: number) => {
    if (mounted && typeof window !== 'undefined') {
      import('@/hooks/useOptimizedMapData').then(module => {
        module.configureMapCache(maxSize, maxAge)
        console.log(`⚙️ Cache reconfigurado: ${maxSize} entries, ${maxAge}ms TTL`)
      })
    }
  }, [mounted])

  const clearMapStyleCache = useCallback(() => {
    if (mounted && typeof window !== 'undefined') {
      import('@/components/OptimizedUniversalMapCore').then(module => {
        module.clearMapStyleCache()
        console.log('🧹 Style cache limpiado')
      })
    }
  }, [mounted])

  return {
    mounted,
    clearOptimizedMapCache,
    getOptimizedMapStats,
    configureMapCache,
    clearMapStyleCache
  }
}

/**
 * ===============================================
 * DEMO DE MAPA OPTIMIZADO
 * ===============================================
 * 
 * Página de demostración que muestra:
 * - Implementación del nuevo sistema optimizado
 * - Métricas de rendimiento en tiempo real
 * - Controles de configuración avanzada
 * - Comparación con sistema anterior
 */

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  cacheEfficiency: number
  responsiveness: number
}

const OptimizedMapDemo: React.FC = () => {
  // ===== HOOKS =====
  const {
    mounted,
    clearOptimizedMapCache,
    getOptimizedMapStats,
    configureMapCache,
    clearMapStyleCache
  } = useOptimizedMapHooks()

  // ===== ESTADO =====
  const [enablePerformanceMonitor, setEnablePerformanceMonitor] = useState(true)
  const [mapConfig, setMapConfig] = useState({
    maxFeatures: 3000,
    debounceMs: 200,
    enableVirtualization: true,
    theme: 'light' as 'light' | 'dark'
  })
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheEfficiency: 0,
    responsiveness: 0
  })
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  // ===== FUNCIONES =====

  // Handle feature click optimizado
  const handleFeatureClick = useCallback((feature: any, layer: any) => {
    console.log('🎯 Feature clicked:', {
      layerId: layer.id,
      featureName: feature.properties?.nickname || feature.properties?.nombre || 'Sin nombre',
      properties: feature.properties
    })
    
    // Aquí podrías mostrar un modal, panel lateral, etc.
  }, [])

  // Handle layer change optimizado
  const handleLayerChange = useCallback((layerId: string, visible: boolean) => {
    console.log(`🔄 Layer ${layerId} ${visible ? 'enabled' : 'disabled'}`)
  }, [])

  // Función para limpiar cache
  const handleClearCache = useCallback(() => {
    clearOptimizedMapCache()
    clearMapStyleCache()
  }, [clearOptimizedMapCache, clearMapStyleCache])

  // Función para reconfigurar cache
  const handleConfigureCache = useCallback((maxSize: number, maxAge: number) => {
    configureMapCache(maxSize, maxAge)
  }, [configureMapCache])

  // Función para obtener estadísticas actuales
  const refreshStats = useCallback(() => {
    getOptimizedMapStats()
  }, [getOptimizedMapStats])

  // Actualizar configuración de mapa
  const updateMapConfig = useCallback((updates: Partial<typeof mapConfig>) => {
    setMapConfig(prev => ({ ...prev, ...updates }))
  }, [])

  // No renderizar hasta que el componente esté montado
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Inicializando sistema optimizado...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Mapa Optimizado v2.0
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sistema de mapas con rendimiento mejorado y cache inteligente
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Configuración avanzada"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={refreshStats}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Actualizar estadísticas"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración avanzada */}
      {showAdvancedSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Max Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Máximo de features
                </label>
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="500"
                  value={mapConfig.maxFeatures}
                  onChange={(e) => updateMapConfig({ maxFeatures: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                />
              </div>

              {/* Debounce */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Debounce (ms)
                </label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={mapConfig.debounceMs}
                  onChange={(e) => updateMapConfig({ debounceMs: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                />
              </div>

              {/* Tema */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tema del mapa
                </label>
                <select
                  value={mapConfig.theme}
                  onChange={(e) => {
                    const theme = e.target.value as 'light' | 'dark'
                    updateMapConfig({ theme })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleClearCache}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                >
                  Limpiar Cache
                </button>
                <button
                  onClick={() => handleConfigureCache(100, 60000)}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  Reconfigurar Cache
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Panel de métricas */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Métricas de rendimiento */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rendimiento
                </h3>
              </div>
              
              <div className="space-y-4">
                {/* Tiempo de carga */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Carga</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {metrics.loadTime}ms
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (3000 - metrics.loadTime) / 30)}%` }}
                    />
                  </div>
                </div>

                {/* Memoria */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Memoria</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {metrics.memoryUsage.toFixed(1)}MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, metrics.memoryUsage * 2)}%` }}
                    />
                  </div>
                </div>

                {/* Eficiencia de cache */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Cache</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      {metrics.cacheEfficiency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.cacheEfficiency}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información del sistema */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sistema
                </h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Versión:</span>
                  <span className="font-mono">v2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cache activo:</span>
                  <span className="text-green-600 dark:text-green-400">Sí</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Virtualización:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {mapConfig.enableVirtualization ? 'Activada' : 'Desactivada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Memoización:</span>
                  <span className="text-green-600 dark:text-green-400">Completa</span>
                </div>
              </div>
            </div>

            {/* Mejoras implementadas */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Optimizaciones
                </h3>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Cache inteligente con LRU</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Memoización React completa</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Virtualización de features</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Lazy loading dinámico</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Debouncing de updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Memory management</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mapa principal */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Mapa Interactivo Optimizado
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sistema de alta performance con cache inteligente y rendering optimizado
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={enablePerformanceMonitor}
                        onChange={(e) => setEnablePerformanceMonitor(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-600 dark:text-gray-400">Monitor</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <OptimizedMapInterface
                height="600px"
                className="w-full"
                enableFullscreen={true}
                enableLayerControls={true}
                enablePerformanceMonitor={enablePerformanceMonitor}
                onFeatureClick={handleFeatureClick}
                onLayerChange={handleLayerChange}
                theme={mapConfig.theme}
                maxFeatures={mapConfig.maxFeatures}
                debounceMs={mapConfig.debounceMs}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimizedMapDemo

'use client'

import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback, 
  useRef,
  memo
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Layers, Settings, Activity, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'

import { useOptimizedMapData } from '@/hooks/useOptimizedMapData'
import type { OptimizedMapLayer } from './OptimizedUniversalMapCore'

// Lazy loading optimizado de componentes pesados
const OptimizedUniversalMapCore = dynamic(
  () => import('./OptimizedUniversalMapCore'),
  { 
    loading: () => (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando mapa optimizado...</p>
        </div>
      </div>
    ),
    ssr: false 
  }
)

// Componente de control de capas optimizado
const LayerControlPanel = dynamic(
  () => import('./NewLayerManagementPanel'),
  { 
    loading: () => (
      <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
    ),
    ssr: false 
  }
)

/**
 * ===============================================
 * INTERFAZ OPTIMIZADA PARA MAPAS
 * ===============================================
 * 
 * Componente principal que integra:
 * - Datos optimizados con cache inteligente
 * - Mapa con renderizado mejorado
 * - Controles de capas reactivos
 * - Gestión de estado unificada
 * - Métricas de rendimiento en tiempo real
 */

export interface OptimizedMapInterfaceProps {
  height?: string
  className?: string
  enableFullscreen?: boolean
  enableLayerControls?: boolean
  enablePerformanceMonitor?: boolean
  onFeatureClick?: (feature: any, layer: any) => void
  onLayerChange?: (layerId: string, visible: boolean) => void
  theme?: 'light' | 'dark'
  maxFeatures?: number
  debounceMs?: number
}

// ===== CONFIGURACIONES POR DEFECTO =====
const DEFAULT_CONFIG = {
  height: '500px',
  enableFullscreen: true,
  enableLayerControls: true,
  enablePerformanceMonitor: false,
  theme: 'light' as const,
  maxFeatures: 3000,
  debounceMs: 200
}

// ===== BASE MAPS OPTIMIZADOS =====
const OPTIMIZED_BASE_MAPS = {
  light: {
    name: 'CartoDB Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  dark: {
    name: 'CartoDB Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  satellite: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  }
} as const

// ===== COMPONENTE PRINCIPAL OPTIMIZADO =====
const OptimizedMapInterface: React.FC<OptimizedMapInterfaceProps> = memo((props) => {
  const config = { ...DEFAULT_CONFIG, ...props }
  
  // ===== HOOKS OPTIMIZADOS =====
  const mapData = useOptimizedMapData()
  const [selectedBaseMap, setSelectedBaseMap] = useState<keyof typeof OPTIMIZED_BASE_MAPS>('light')
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({})
  const [showPerformancePanel, setShowPerformancePanel] = useState(config.enablePerformanceMonitor)
  const updateTimeoutRef = useRef<NodeJS.Timeout>()

  // ===== EFECTOS OPTIMIZADOS =====

  // Inicializar visibilidad de capas cuando se cargan los datos
  useEffect(() => {
    if (mapData.allGeoJSONData && Object.keys(mapData.allGeoJSONData).length > 0) {
      const initialVisibility: Record<string, boolean> = {}
      
      Object.keys(mapData.allGeoJSONData).forEach(layerId => {
        // Capas principales visibles por defecto
        initialVisibility[layerId] = ['equipamientos', 'infraestructura_vial'].includes(layerId)
      })
      
      setLayerVisibility(prev => ({ ...initialVisibility, ...prev }))
    }
  }, [mapData.allGeoJSONData])

  // ===== FUNCIONES MEMOIZADAS =====

  // Función para obtener nombre de display de la capa
  const getLayerDisplayName = useCallback((layerId: string): string => {
    const displayNames: Record<string, string> = {
      equipamientos: 'Equipamientos',
      infraestructura_vial: 'Infraestructura Vial',
      comunas: 'Comunas',
      barrios: 'Barrios',
      corregimientos: 'Corregimientos'
    }
    return displayNames[layerId] || layerId.charAt(0).toUpperCase() + layerId.slice(1)
  }, [])

  // Función para obtener modo de representación
  const getRepresentationMode = useCallback((layerId: string) => {
    const modes: Record<string, any> = {
      equipamientos: 'clase_obra',
      infraestructura_vial: 'tipo_intervencion',
      default: undefined
    }
    return modes[layerId] || modes.default
  }, [])

  // Convertir datos optimizados a capas del mapa
  const optimizedLayers = useMemo((): OptimizedMapLayer[] => {
    if (!mapData.allGeoJSONData) return []

    return Object.entries(mapData.allGeoJSONData)
      .filter(([layerId, data]) => data && data.features.length > 0)
      .map(([layerId, data]) => {
        const isVisible = layerVisibility[layerId] ?? false
        
        // Configuración de colores por capa
        const getLayerColor = (id: string) => {
          switch (id) {
            case 'equipamientos': return '#10B981'
            case 'infraestructura_vial': return '#F59E0B'
            case 'comunas': return '#8B5CF6'
            case 'barrios': return '#EF4444'
            default: return '#3B82F6'
          }
        }

        // Optimización: limitar features si es necesario
        const features = data.features.length > config.maxFeatures
          ? data.features.slice(0, config.maxFeatures)
          : data.features

        return {
          id: layerId,
          name: getLayerDisplayName(layerId),
          data: {
            ...data,
            features
          },
          visible: isVisible,
          type: 'geojson' as const,
          color: getLayerColor(layerId),
          opacity: 0.7,
          representationMode: getRepresentationMode(layerId),
          dataHash: data.metadata?.hash || '',
          lastUpdate: Date.now(),
          featureCount: features.length
        }
      })
  }, [mapData.allGeoJSONData, layerVisibility, config.maxFeatures, getLayerDisplayName, getRepresentationMode])

  // Handle layer toggle con debouncing optimizado
  const handleLayerToggle = useCallback((layerId: string) => {
    // Actualizar estado inmediatamente para UI responsiva
    setLayerVisibility(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }))

    // Notificar cambio con debouncing
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      const newVisibility = !layerVisibility[layerId]
      config.onLayerChange?.(layerId, newVisibility)
      console.log(`🔄 Capa ${layerId} ${newVisibility ? 'activada' : 'desactivada'}`)
    }, config.debounceMs)
  }, [layerVisibility, config])

  // Handle feature click optimizado
  const handleFeatureClick = useCallback((feature: any, layer: any) => {
    config.onFeatureClick?.(feature, layer)
  }, [config])

  // Handle base map change
  const handleBaseMapChange = useCallback((mapType: keyof typeof OPTIMIZED_BASE_MAPS) => {
    setSelectedBaseMap(mapType)
  }, [])

  // Toggle performance panel
  const togglePerformancePanel = useCallback(() => {
    setShowPerformancePanel(prev => !prev)
  }, [])

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // ===== RENDER CONDICIONAL =====
  if (mapData.loading && mapData.progress < 100) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center ${config.className || ''}`}
        style={{ height: config.height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Optimizando datos del mapa...
          </p>
          <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${mapData.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mapData.progress}% completado
          </p>
          {mapData.performance.totalFeatures > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {mapData.performance.totalFeatures} elementos cargados
            </p>
          )}
        </div>
      </motion.div>
    )
  }

  if (mapData.error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center ${config.className || ''}`}
        style={{ height: config.height }}
      >
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <Map className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            Error al cargar el mapa
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm">
            {mapData.error}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`relative w-full ${config.className || ''}`} style={{ height: config.height }}>
      {/* Mapa principal optimizado */}
      <OptimizedUniversalMapCore
        layers={optimizedLayers}
        baseMapUrl={OPTIMIZED_BASE_MAPS[selectedBaseMap].url}
        baseMapAttribution={OPTIMIZED_BASE_MAPS[selectedBaseMap].attribution}
        height="100%"
        onLayerToggle={handleLayerToggle}
        onFeatureClick={handleFeatureClick}
        theme={config.theme}
        enableFullscreen={config.enableFullscreen}
        enableCenterView={true}
        enableLayerControls={config.enableLayerControls}
        maxFeatures={config.maxFeatures}
        enableVirtualization={true}
        debounceMs={config.debounceMs}
      />

      {/* Panel de control superior */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        {/* Selector de mapa base */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2">
          <select
            value={selectedBaseMap}
            onChange={(e) => handleBaseMapChange(e.target.value as keyof typeof OPTIMIZED_BASE_MAPS)}
            className="text-sm bg-transparent border-none outline-none cursor-pointer"
          >
            {Object.entries(OPTIMIZED_BASE_MAPS).map(([key, map]) => (
              <option key={key} value={key}>
                {map.name}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle performance monitor */}
        {config.enablePerformanceMonitor && (
          <button
            onClick={togglePerformancePanel}
            className={`p-2 rounded-lg backdrop-blur-sm border transition-colors ${
              showPerformancePanel
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-white/95 dark:bg-gray-800/95 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50'
            }`}
            title="Monitor de rendimiento"
          >
            <Activity className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Panel de métricas de rendimiento */}
      <AnimatePresence>
        {showPerformancePanel && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="absolute top-16 left-4 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 w-72"
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Rendimiento del Mapa
              </span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tiempo de carga:</span>
                <span className="font-mono">{mapData.performance.loadTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total features:</span>
                <span className="font-mono">{mapData.performance.totalFeatures.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cache hits:</span>
                <span className="font-mono text-green-600">{mapData.performance.cacheHits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cache misses:</span>
                <span className="font-mono text-orange-600">{mapData.performance.cacheMisses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Memoria estimada:</span>
                <span className="font-mono">{mapData.performance.memoryUsage.toFixed(1)}MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Capas visibles:</span>
                <span className="font-mono">{optimizedLayers.filter(l => l.visible).length}/{optimizedLayers.length}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Información de estado en la esquina inferior derecha */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 dark:text-gray-400">
              {mapData.unidadesProyecto.length} unidades
            </span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 dark:text-gray-400">
            {Object.keys(mapData.allGeoJSONData).length} capas
          </span>
        </div>
      </div>
    </div>
  )
})

OptimizedMapInterface.displayName = 'OptimizedMapInterface'

export default OptimizedMapInterface

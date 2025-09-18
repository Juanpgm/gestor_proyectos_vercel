'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { processGeoJSONCoordinates } from '@/utils/coordinateUtils'

/**
 * =============================================
 * HOOK UNIFICADO PARA DATOS DE MAPA
 * =============================================
 * 
 * Hook único que gestiona todos los datos del mapa usando:
 * - Programación funcional pura
 * - Cache inteligente y persistente  
 * - Error handling robusto
 * - Estados derivados automáticos
 * - Performance optimizado
 */

// ===== TIPOS UNIFICADOS =====
export interface MapFeature {
  type: 'Feature'
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'
    coordinates: any
  }
  properties: Record<string, any>
  id?: string | number
}

export interface MapLayerData {
  type: 'FeatureCollection'
  features: MapFeature[]
  metadata: {
    loadTime: number
    featureCount: number
    lastUpdate: number
    source: string
  }
}

export interface MapLayer {
  id: string
  name: string
  data: MapLayerData | null
  visible: boolean
  opacity: number
  color: string
  type: 'geojson' | 'points'
  loading: boolean
  error: string | null
}

export interface MapState {
  layers: MapLayer[]
  loading: boolean
  error: string | null
  stats: {
    totalFeatures: number
    loadedLayers: number
    visibleLayers: number
  }
}

// ===== CONFIGURACIÓN DE CAPAS =====
const LAYER_CONFIGS = [
  {
    id: 'equipamientos',
    name: 'Equipamientos',
    path: '/data/geodata/unidades_proyecto/equipamientos.geojson',
    color: '#10B981',
    visible: true,
    opacity: 0.8,
    type: 'geojson' as const,
    priority: 1
  },
  {
    id: 'infraestructura_vial',
    name: 'Infraestructura Vial',
    path: '/data/geodata/unidades_proyecto/infraestructura_vial.geojson',
    color: '#F59E0B',
    visible: true,
    opacity: 0.8,
    type: 'geojson' as const,
    priority: 1
  },
  {
    id: 'centros_gravedad_unificado',
    name: 'Centros de Gravedad',
    path: '/data/geodata/centros_gravedad/centros_gravedad_unificado.geojson',
    color: '#8B5CF6',
    visible: true,
    opacity: 0.8,
    type: 'geojson' as const,
    priority: 2
  },
  {
    id: 'comunas',
    name: 'Comunas',
    path: '/data/geodata/cartografia_base/comunas.geojson',
    color: '#3B82F6',
    visible: false,
    opacity: 0.6,
    type: 'geojson' as const,
    priority: 3
  },
  {
    id: 'barrios',
    name: 'Barrios',
    path: '/data/geodata/cartografia_base/barrios.geojson',
    color: '#EF4444',
    visible: false,
    opacity: 0.6,
    type: 'geojson' as const,
    priority: 3
  },
  {
    id: 'corregimientos',
    name: 'Corregimientos',
    path: '/data/geodata/cartografia_base/corregimientos.geojson',
    color: '#6366F1',
    visible: false,
    opacity: 0.5,
    type: 'geojson' as const,
    priority: 4
  },
  {
    id: 'veredas',
    name: 'Veredas',
    path: '/data/geodata/cartografia_base/veredas.geojson',
    color: '#EC4899',
    visible: false,
    opacity: 0.5,
    type: 'geojson' as const,
    priority: 4
  }
] as const

// ===== CACHE FUNCIONAL =====
class MapDataCache {
  private cache = new Map<string, MapLayerData>()
  private readonly maxAge = 30 * 60 * 1000 // 30 minutos

  get(key: string): MapLayerData | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    // Verificar edad del cache
    if (Date.now() - cached.metadata.lastUpdate > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  set(key: string, data: MapLayerData): void {
    this.cache.set(key, data)
  }

  clear(): void {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Instancia global del cache
const cache = new MapDataCache()

// ===== FUNCIONES PURAS =====

/**
 * Carga datos GeoJSON con error handling robusto
 */
const loadGeoJSONData = async (path: string, layerId: string): Promise<MapLayerData> => {
  const startTime = Date.now()
  
  try {
    console.log(`📡 Cargando ${layerId} desde: ${path}`)
    
    const response = await fetch(path, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const rawData = await response.json()

    // Validar estructura GeoJSON
    if (!rawData || rawData.type !== 'FeatureCollection' || !Array.isArray(rawData.features)) {
      throw new Error(`GeoJSON inválido en ${path}`)
    }

    // Procesar coordenadas
    const processedData = processGeoJSONCoordinates(rawData)

    const result: MapLayerData = {
      type: 'FeatureCollection',
      features: processedData.features.map((feature: any, index: number) => ({
        ...feature,
        id: feature.id || feature.properties?.id || `${layerId}-${index}`
      })),
      metadata: {
        loadTime: Date.now() - startTime,
        featureCount: processedData.features.length,
        lastUpdate: Date.now(),
        source: path
      }
    }

    console.log(`✅ ${layerId} cargado: ${result.features.length} features en ${result.metadata.loadTime}ms`)
    return result

  } catch (error: any) {
    console.error(`❌ Error cargando ${layerId}:`, error)
    
    // Retornar datos vacíos válidos en caso de error
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        loadTime: Date.now() - startTime,
        featureCount: 0,
        lastUpdate: Date.now(),
        source: path
      }
    }
  }
}

/**
 * Crea el estado inicial de las capas
 */
const createInitialLayers = (): MapLayer[] => {
  return LAYER_CONFIGS.map(config => ({
    id: config.id,
    name: config.name,
    data: null,
    visible: config.visible,
    opacity: config.opacity,
    color: config.color,
    type: config.type,
    loading: false,
    error: null
  }))
}

/**
 * Calcula estadísticas derivadas del estado
 */
const calculateStats = (layers: MapLayer[]) => {
  return {
    totalFeatures: layers.reduce((sum, layer) => sum + (layer.data?.features.length || 0), 0),
    loadedLayers: layers.filter(layer => layer.data !== null).length,
    visibleLayers: layers.filter(layer => layer.visible).length
  }
}

// ===== HOOK PRINCIPAL =====
export function useMapData() {
  // Estado principal
  const [layers, setLayers] = useState<MapLayer[]>(createInitialLayers)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados derivados (memoizados)
  const stats = useMemo(() => calculateStats(layers), [layers])
  
  const visibleLayers = useMemo(() => 
    layers.filter(layer => layer.visible && layer.data !== null), 
    [layers]
  )

  const state: MapState = useMemo(() => ({
    layers,
    loading,
    error,
    stats
  }), [layers, loading, error, stats])

  // ===== FUNCIONES DE MUTACIÓN =====

  /**
   * Actualiza una capa específica
   */
  const updateLayer = useCallback((layerId: string, updates: Partial<MapLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ))
  }, [])

  /**
   * Toggle visibilidad de capa
   */
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ))
  }, [])

  /**
   * Actualiza opacidad de capa
   */
  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity))
    updateLayer(layerId, { opacity: clampedOpacity })
  }, [updateLayer])

  /**
   * Actualiza color de capa
   */
  const setLayerColor = useCallback((layerId: string, color: string) => {
    updateLayer(layerId, { color })
  }, [updateLayer])

  /**
   * Carga datos de una capa específica
   */
  const loadLayerData = useCallback(async (layerId: string) => {
    const config = LAYER_CONFIGS.find(c => c.id === layerId)
    if (!config) {
      console.warn(`⚠️ Configuración no encontrada para capa: ${layerId}`)
      return
    }

    // Verificar cache primero
    const cachedData = cache.get(layerId)
    if (cachedData) {
      console.log(`💾 Cache hit para ${layerId}`)
      updateLayer(layerId, { data: cachedData, loading: false, error: null })
      return
    }

    // Iniciar carga
    updateLayer(layerId, { loading: true, error: null })

    try {
      const data = await loadGeoJSONData(config.path, layerId)
      
      // Guardar en cache
      cache.set(layerId, data)
      
      // Actualizar estado
      updateLayer(layerId, { 
        data, 
        loading: false, 
        error: data.features.length === 0 ? 'No se encontraron datos' : null 
      })

    } catch (error: any) {
      console.error(`❌ Error cargando ${layerId}:`, error)
      updateLayer(layerId, { 
        loading: false, 
        error: error.message || 'Error desconocido' 
      })
    }
  }, [updateLayer])

  /**
   * Recarga datos de todas las capas
   */
  const reloadAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    cache.clear()

    try {
      // Cargar capas por prioridad
      const prioritizedConfigs = [...LAYER_CONFIGS].sort((a, b) => a.priority - b.priority)
      
      for (const config of prioritizedConfigs) {
        await loadLayerData(config.id)
      }

    } catch (error: any) {
      console.error('❌ Error en carga masiva:', error)
      setError(error.message || 'Error cargando datos del mapa')
    } finally {
      setLoading(false)
    }
  }, [loadLayerData])

  // ===== EFECTOS =====

  /**
   * Carga inicial de datos
   */
  useEffect(() => {
    let mounted = true

    const initialLoad = async () => {
      if (!mounted) return
      
      console.log('🚀 Iniciando carga de datos del mapa')
      await reloadAllData()
    }

    initialLoad()

    return () => {
      mounted = false
    }
  }, [reloadAllData])

  // ===== UTILIDADES =====

  /**
   * Obtiene una capa por ID
   */
  const getLayer = useCallback((layerId: string) => {
    return layers.find(layer => layer.id === layerId) || null
  }, [layers])

  /**
   * Filtra features por texto de búsqueda
   */
  const searchFeatures = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return []

    const results: Array<{ layerId: string; feature: MapFeature; match: string }> = []
    const term = searchTerm.toLowerCase()

    visibleLayers.forEach(layer => {
      layer.data?.features.forEach(feature => {
        const properties = feature.properties || {}
        const searchableText = Object.values(properties).join(' ').toLowerCase()
        
        if (searchableText.includes(term)) {
          const matchField = Object.entries(properties).find(([key, value]) => 
            String(value).toLowerCase().includes(term)
          )
          
          results.push({
            layerId: layer.id,
            feature,
            match: matchField ? `${matchField[0]}: ${matchField[1]}` : 'Coincidencia encontrada'
          })
        }
      })
    })

    return results
  }, [visibleLayers])

  // ===== RETURN =====
  return {
    // Estado
    ...state,
    visibleLayers,
    
    // Acciones
    toggleLayerVisibility,
    setLayerOpacity,
    setLayerColor,
    loadLayerData,
    reloadAllData,
    
    // Utilidades
    getLayer,
    searchFeatures,
    
    // Información del cache
    cacheStats: cache.getStats()
  }
}

export default useMapData
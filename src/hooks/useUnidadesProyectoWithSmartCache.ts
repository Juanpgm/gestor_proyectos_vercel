'use client'

import { useState, useEffect, useCallback } from 'react'
import { cachedApiCall, getCacheStats, useSmartCache } from '../utils/smartCache'
import { useUnidadesProyectoOffline, type UnidadProyectoFilters } from './useUnidadesProyectoOffline'
import type { UnidadProyecto } from './useUnidadesProyecto'

/**
 * Hook inteligente para Unidades de Proyecto con cache programado
 * Hace llamadas a la API solo en horarios específicos: 5:00, 12:00, 16:00, 20:00
 * Usa programación funcional para optimizar las llamadas
 */

interface UnidadesProyectoApiResponse {
  data: UnidadProyecto[]
  total: number
  page: number
  limit: number
}

interface SmartHookState {
  data: any[]
  loading: boolean
  error: string | null
  isFromCache: boolean
  cacheTimestamp: number | null
  nextUpdateTime: number | null
  source: 'api' | 'cache' | 'offline'
}

// Función para hacer la llamada real a la API
const fetchUnidadesProyectoFromApi = async (): Promise<UnidadProyecto[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (!apiUrl) {
    throw new Error('API URL no configurada')
  }
  
  console.log('🌐 Realizando llamada a API:', apiUrl)
  
  const response = await fetch(`${apiUrl}/api/unidades-proyecto`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    // Timeout de 30 segundos
    signal: AbortSignal.timeout(30000)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const result: UnidadesProyectoApiResponse = await response.json()
  
  console.log(`✅ API Response: ${result.data.length} unidades recibidas`)
  return result.data
}

export function useUnidadesProyectoWithSmartCache(filters?: UnidadProyectoFilters) {
  const [state, setState] = useState<SmartHookState>({
    data: [],
    loading: true,
    error: null,
    isFromCache: false,
    cacheTimestamp: null,
    nextUpdateTime: null,
    source: 'offline'
  })
  
  // Hook offline como fallback
  const offlineData = useUnidadesProyectoOffline(filters)
  const { isWithinAllowedHours, getNextUpdateTime } = useSmartCache()
  
  // Función para cargar datos con cache inteligente
  const loadDataWithSmartCache = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log('🧠 Iniciando carga con cache inteligente...')
      
      // Intentar obtener datos de API con cache
      const cacheResult = await cachedApiCall(
        'unidades-proyecto-main',
        fetchUnidadesProyectoFromApi,
        offlineData.data as any // Usar datos offline como fallback
      )
      
      console.log('📊 Resultado del cache:', {
        source: cacheResult.source,
        dataLength: cacheResult.data.length,
        isStale: cacheResult.isStale,
        timestamp: new Date(cacheResult.timestamp).toLocaleString()
      })
      
      setState({
        data: cacheResult.data,
        loading: false,
        error: null,
        isFromCache: cacheResult.source === 'cache',
        cacheTimestamp: cacheResult.timestamp,
        nextUpdateTime: cacheResult.nextUpdate,
        source: cacheResult.source
      })
      
    } catch (error: any) {
      console.error('❌ Error en carga con cache inteligente:', error)
      
      // Fallback a datos offline en caso de error
      console.log('🔄 Usando datos offline como fallback')
      setState({
        data: offlineData.data,
        loading: false,
        error: `Error API: ${error.message}. Usando datos offline.`,
        isFromCache: false,
        cacheTimestamp: null,
        nextUpdateTime: getNextUpdateTime(),
        source: 'offline'
      })
    }
  }, [offlineData.data, getNextUpdateTime])
  
  // Efecto principal para cargar datos
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const dataMode = process.env.NEXT_PUBLIC_DATA_MODE
    
    // Solo usar cache inteligente si hay API configurada y modo no es offline
    if (apiUrl && dataMode !== 'offline') {
      loadDataWithSmartCache()
    } else {
      // Usar solo datos offline
      setState({
        data: offlineData.data,
        loading: offlineData.loading,
        error: offlineData.error,
        isFromCache: false,
        cacheTimestamp: null,
        nextUpdateTime: null,
        source: 'offline'
      })
    }
  }, [loadDataWithSmartCache, offlineData])
  
  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const dataMode = process.env.NEXT_PUBLIC_DATA_MODE
    
    if (apiUrl && dataMode !== 'offline') {
      loadDataWithSmartCache()
    } else {
      offlineData.refresh()
    }
  }, [loadDataWithSmartCache, offlineData])
  
  // Aplicar filtros
  const applyFilters = useCallback((newFilters: UnidadProyectoFilters) => {
    // Los filtros se aplicarán sobre los datos cacheados localmente
    console.log('🔍 Aplicando filtros localmente:', newFilters)
    // Por ahora, simplemente refrescar - en una implementación completa,
    // filtrarías los datos existentes localmente
    refresh()
  }, [refresh])
  
  // Datos procesados para compatibilidad con componentes existentes
  const processedData = state.data.map((item: any) => ({
    type: 'Feature' as const,
    geometry: item.geometry || (item.lat && item.lng ? {
      type: 'Point' as const,
      coordinates: [item.lng, item.lat]
    } : null),
    has_geometry: !!(item.geometry || (item.lat && item.lng)),
    geometry_type: item.geometry?.type || 'Point',
    properties: {
      // Mapear a formato esperado por componentes
      id: item.id,
      bpin: item.bpin || item.id,
      upid: item.upid || item.bpin || item.id,
      nombre_up: item.name || item.nombre_up,
      descripcion_intervencion: item.descripcion || item.descripcion_intervencion,
      direccion: item.direccion,
      comuna_corregimiento: item.comuna || item.corregimiento || item.comuna_corregimiento,
      barrio_vereda: item.barrio || item.vereda || item.barrio_vereda,
      tipo_intervencion: item.tipoIntervencion || item.tipo_intervencion,
      clase_obra: item.claseObra || item.clase_obra,
      estado: item.status || item.estado,
      avance_obra: typeof item.progress === 'number' ? item.progress / 100 : item.avance_obra,
      presupuesto_base: item.budget || item.presupuesto_base,
      fecha_inicio: item.startDate || item.fecha_inicio,
      fecha_fin: item.endDate || item.fecha_fin,
      nombre_centro_gestor: item.responsible || item.nombre_centro_gestor,
      fuente_financiacion: item.fuente_financiacion || 'No especificado',
      ano: item.ano || (item.startDate ? new Date(item.startDate).getFullYear().toString() : '2024'),
      coordinates: item.coordinates || (item.lat && item.lng ? { lat: item.lat, lng: item.lng } : undefined),
      ...item
    },
    updated_at: new Date().toISOString(),
    id: item.id,
    _metadata: {
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    }
  }))
  
  return {
    // Datos principales
    data: state.data,
    processedData,
    loading: state.loading,
    error: state.error,
    totalCount: state.data.length,
    
    // Información del cache
    isFromCache: state.isFromCache,
    cacheTimestamp: state.cacheTimestamp,
    nextUpdateTime: state.nextUpdateTime,
    source: state.source,
    
    // Estado del sistema
    isWithinAllowedHours: isWithinAllowedHours(),
    
    // Acciones
    refresh,
    applyFilters,
    
    // Para compatibilidad con hook offline
    metrics: 'metrics' in offlineData ? offlineData.metrics : null,
    lastUpdated: state.cacheTimestamp ? new Date(state.cacheTimestamp).toISOString() : null,
    
    // Identificación
    dataSource: state.source,
    isOffline: state.source === 'offline'
  }
}

/**
 * Hook para obtener estadísticas detalladas del sistema de cache
 */
export function useSmartCacheStats() {
  const [stats, setStats] = useState(getCacheStats())
  
  const refreshStats = useCallback(() => {
    setStats(getCacheStats())
  }, [])
  
  // Actualizar estadísticas cada minuto
  useEffect(() => {
    const interval = setInterval(refreshStats, 60000)
    return () => clearInterval(interval)
  }, [refreshStats])
  
  return {
    stats,
    refreshStats
  }
}

export default useUnidadesProyectoWithSmartCache
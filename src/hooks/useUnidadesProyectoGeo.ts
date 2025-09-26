'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllUnidadesProyecto, 
  getFilteredUnidadesProyecto, 
  getDashboardSummary,
  type UnidadProyectoGeo, 
  type DashboardSummary, 
  type UnidadProyectoFilters 
} from '@/services/unidadesProyectoApi'

// Estado del hook
interface UseUnidadesProyectoGeoState {
  unidades: UnidadProyectoGeo[]
  dashboardSummary: DashboardSummary | null
  loading: boolean
  error: string | null
  filters: UnidadProyectoFilters
  filteredCount: number
}

// Acciones del hook
interface UseUnidadesProyectoGeoActions {
  setFilters: (filters: Partial<UnidadProyectoFilters>) => void
  clearFilters: () => void
  refreshData: () => Promise<void>
  clearCache: () => void
  getUnidadById: (id: string) => UnidadProyectoGeo | undefined
}

// Estado global para evitar múltiples llamadas a la API
let globalState: UseUnidadesProyectoGeoState | null = null
let globalListeners: Set<(state: UseUnidadesProyectoGeoState) => void> = new Set()

// Función para cargar datos desde la API
async function loadUnidadesProyectoGeo(): Promise<UseUnidadesProyectoGeoState> {
  try {
    console.log('🌍 Loading unidades proyecto geo data...')
    
    // Cargar datos en paralelo para mejor performance
    const [unidades, summary] = await Promise.all([
      getAllUnidadesProyecto(),
      getDashboardSummary()
    ])
    
    console.log('✅ Loaded', unidades.length, 'unidades proyecto geo')
    
    const newState: UseUnidadesProyectoGeoState = {
      unidades,
      dashboardSummary: summary,
      loading: false,
      error: null,
      filters: {},
      filteredCount: unidades.length
    }
    
    // Actualizar estado global
    globalState = newState
    
    // Notificar a todos los listeners
    globalListeners.forEach(listener => listener(newState))
    
    return newState
  } catch (error) {
    console.error('❌ Error loading unidades proyecto geo:', error)
    
    const errorState: UseUnidadesProyectoGeoState = {
      unidades: [],
      dashboardSummary: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      filters: {},
      filteredCount: 0
    }
    
    globalState = errorState
    globalListeners.forEach(listener => listener(errorState))
    
    return errorState
  }
}

// Función para suscribirse a cambios del estado global
function subscribeToGlobalState(
  listener: (state: UseUnidadesProyectoGeoState) => void
): () => void {
  globalListeners.add(listener)
  
  return () => {
    globalListeners.delete(listener)
  }
}

// Hook principal para las unidades de proyecto geográficas
export function useUnidadesProyectoGeo(): UseUnidadesProyectoGeoState & UseUnidadesProyectoGeoActions {
  console.log('🚀 useUnidadesProyectoGeo: Hook initialized')
  
  // Estado local que se sincroniza con el global
  const [state, setState] = useState<UseUnidadesProyectoGeoState>(() => {
    if (globalState) {
      console.log('📦 Using cached global state')
      return globalState
    }
    
    return {
      unidades: [],
      dashboardSummary: null,
      loading: true,
      error: null,
      filters: {},
      filteredCount: 0
    }
  })
  
  // Suscribirse a cambios del estado global
  useEffect(() => {
    console.log('🔗 Subscribing to global state changes')
    return subscribeToGlobalState(setState)
  }, [])
  
  // Cargar datos si no existen
  useEffect(() => {
    if (!globalState) {
      console.log('🔄 No global state found, loading data...')
      loadUnidadesProyectoGeo()
    }
  }, [])
  
  // Función para aplicar filtros
  const setFilters = useCallback(async (newFilters: Partial<UnidadProyectoFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters }
    
    console.log('🔍 Applying filters:', updatedFilters)
    
    try {
      // Si no hay filtros, usar datos completos
      if (Object.keys(updatedFilters).length === 0 || Object.values(updatedFilters).every(v => !v)) {
        const newState: UseUnidadesProyectoGeoState = {
          ...globalState!,
          filters: {},
          filteredCount: globalState!.unidades.length
        }
        
        globalState = newState
        globalListeners.forEach(listener => listener(newState))
        return
      }
      
      // Aplicar filtros usando la API
      const filteredUnidades = await getFilteredUnidadesProyecto(updatedFilters)
      
      const newState: UseUnidadesProyectoGeoState = {
        ...globalState!,
        unidades: filteredUnidades,
        filters: updatedFilters,
        filteredCount: filteredUnidades.length
      }
      
      globalState = newState
      globalListeners.forEach(listener => listener(newState))
      
    } catch (error) {
      console.error('❌ Error applying filters:', error)
      
      const errorState: UseUnidadesProyectoGeoState = {
        ...state,
        error: error instanceof Error ? error.message : 'Error aplicando filtros',
        loading: false
      }
      
      globalState = errorState
      globalListeners.forEach(listener => listener(errorState))
    }
  }, [state.filters])
  
  // Función para limpiar filtros
  const clearFilters = useCallback(async () => {
    console.log('🧹 Clearing filters')
    
    try {
      const allUnidades = await getAllUnidadesProyecto()
      
      const newState: UseUnidadesProyectoGeoState = {
        ...globalState!,
        unidades: allUnidades,
        filters: {},
        filteredCount: allUnidades.length,
        error: null
      }
      
      globalState = newState
      globalListeners.forEach(listener => listener(newState))
    } catch (error) {
      console.error('❌ Error clearing filters:', error)
    }
  }, [])
  
  // Función para refrescar datos
  const refreshData = useCallback(async () => {
    console.log('🔄 Refreshing unidades proyecto geo data')
    
    const newState: UseUnidadesProyectoGeoState = {
      ...state,
      loading: true,
      error: null
    }
    
    globalState = newState
    globalListeners.forEach(listener => listener(newState))
    
    await loadUnidadesProyectoGeo()
  }, [state])
  
  // Función para limpiar caché
  const clearCache = useCallback(() => {
    console.log('🧹 Clearing API cache')
    // clearApiCache() // Función no disponible
  }, [])
  
  // Función para obtener una unidad por ID
  const getUnidadById = useCallback((id: string): UnidadProyectoGeo | undefined => {
    return state.unidades.find(unidad => unidad.id === id)
  }, [state.unidades])
  
  return {
    ...state,
    setFilters,
    clearFilters,
    refreshData,
    clearCache,
    getUnidadById
  }
}

// Hook optimizado solo para métricas del dashboard
export function useUnidadesProyectoDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let mounted = true
    
    const loadDashboard = async () => {
      try {
        console.log('📊 Loading dashboard summary only')
        const data = await getDashboardSummary()
        
        if (mounted) {
          setSummary(data)
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        console.error('❌ Error loading dashboard:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
          setLoading(false)
        }
      }
    }
    
    loadDashboard()
    
    return () => {
      mounted = false
    }
  }, [])
  
  return { summary, loading, error }
}

// Export del tipo para uso externo
export type { UnidadProyectoGeo, DashboardSummary, UnidadProyectoFilters }
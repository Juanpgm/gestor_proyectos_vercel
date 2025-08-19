'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { FilterState } from '@/components/UnifiedFilters'
import { useProjectData, type ProjectStats } from '@/hooks/useProjectData'

// Estado global del dashboard
interface DashboardState {
  filters: FilterState
  stats: ProjectStats | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// Acciones para el reducer
type DashboardAction =
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'SET_STATS'; payload: ProjectStats }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FILTERS' }
  | { type: 'UPDATE_TIMESTAMP' }

// Filtros por defecto
const defaultFilters: FilterState = {
  search: '',
  estado: 'all',
  centroGestor: [],
  comunas: [],
  barrios: [],
  corregimientos: [],
  veredas: [],
  fuentesFinanciamiento: [],
  filtrosPersonalizados: [],
  subfiltrosPersonalizados: [],
  periodos: []
}

// Estado inicial del dashboard
const initialState: DashboardState = {
  filters: defaultFilters,
  stats: null,
  loading: true,
  error: null,
  lastUpdated: null
}

// Reducer para manejar el estado
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
        lastUpdated: new Date()
      }
    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
        loading: false,
        error: null
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: defaultFilters,
        lastUpdated: new Date()
      }
    case 'UPDATE_TIMESTAMP':
      return {
        ...state,
        lastUpdated: new Date()
      }
    default:
      return state
  }
}

// Contexto del dashboard
interface DashboardContextType {
  state: DashboardState
  updateFilters: (filters: FilterState) => void
  resetFilters: () => void
  refreshData: () => void
  getFilteredCount: () => number
  exportData: (format: 'csv' | 'json') => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// Provider del contexto
interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  const { data, applyFilters, calculateStats } = useProjectData()

  // Efecto para actualizar estadísticas cuando cambian los filtros o datos
  useEffect(() => {
    if (data.loading) {
      dispatch({ type: 'SET_LOADING', payload: true })
      return
    }

    if (data.error) {
      dispatch({ type: 'SET_ERROR', payload: data.error })
      return
    }

    try {
      // Aplicar filtros a los datos
      const filteredData = applyFilters(state.filters)
      
      // Calcular estadísticas
      const stats = calculateStats(filteredData)
      
      dispatch({ type: 'SET_STATS', payload: stats })
    } catch (error) {
      console.error('Error procesando datos:', error)
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Error procesando datos' 
      })
    }
  }, [data, state.filters, applyFilters, calculateStats])

  // Función para actualizar filtros
  const updateFilters = (filters: FilterState) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }

  // Función para resetear filtros
  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' })
  }

  // Función para refrescar datos
  const refreshData = () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'UPDATE_TIMESTAMP' })
  }

  // Función para obtener el conteo de elementos filtrados
  const getFilteredCount = () => {
    if (!state.stats) return 0
    return state.stats.totalProyectos
  }

  // Función para exportar datos
  const exportData = (format: 'csv' | 'json') => {
    try {
      const filteredData = applyFilters(state.filters)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `proyectos_${timestamp}.${format}`
      
      if (format === 'csv') {
        // Crear CSV
        const headers = [
          'BPIN', 'Nombre Proyecto', 'Centro Gestor', 'Clasificación Fondo',
          'Dimensión', 'Línea Estratégica', 'Programa', 'Año', 'Tipo Gasto'
        ]
        
        const rows = filteredData.proyectos.map(proyecto => [
          proyecto.bpin,
          `"${proyecto.nombre_proyecto.replace(/"/g, '""')}"`,
          `"${proyecto.nombre_centro_gestor.replace(/"/g, '""')}"`,
          `"${proyecto.clasificacion_fondo.replace(/"/g, '""')}"`,
          `"${proyecto.nombre_dimension.replace(/"/g, '""')}"`,
          `"${proyecto.nombre_linea_estrategica.replace(/"/g, '""')}"`,
          `"${proyecto.nombre_programa.replace(/"/g, '""')}"`,
          proyecto.anio,
          `"${proyecto.tipo_gasto.replace(/"/g, '""')}"`
        ])

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        downloadFile(csvContent, filename, 'text/csv')
      } else {
        // Crear JSON
        const jsonContent = JSON.stringify({
          filtros_aplicados: state.filters,
          estadisticas: state.stats,
          datos: filteredData,
          fecha_exportacion: new Date().toISOString(),
          total_registros: filteredData.proyectos.length
        }, null, 2)
        downloadFile(jsonContent, filename, 'application/json')
      }
    } catch (error) {
      console.error('Error exportando datos:', error)
    }
  }

  // Función auxiliar para descargar archivos
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const contextValue: DashboardContextType = {
    state,
    updateFilters,
    resetFilters,
    refreshData,
    getFilteredCount,
    exportData
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}

// Hook para usar el contexto del dashboard
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard debe ser usado dentro de un DashboardProvider')
  }
  return context
}

// Hook personalizado para obtener estadísticas específicas
export function useDashboardStats() {
  const { state } = useDashboard()
  
  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated
  }
}

// Hook para manejar filtros con funciones auxiliares
export function useDashboardFilters() {
  const { state, updateFilters, resetFilters } = useDashboard()
  
  // Función para agregar un filtro específico sin sobrescribir otros
  const addFilter = (key: keyof FilterState, value: any) => {
    const currentValue = state.filters[key]
    
    if (Array.isArray(currentValue) && Array.isArray(value)) {
      // Agregar a un array existente
      const updatedValue = Array.from(new Set([...currentValue, ...value]))
      updateFilters({ ...state.filters, [key]: updatedValue })
    } else if (Array.isArray(currentValue)) {
      // Agregar un elemento a un array
      const updatedValue = Array.from(new Set([...currentValue, value]))
      updateFilters({ ...state.filters, [key]: updatedValue })
    } else {
      // Reemplazar valor simple
      updateFilters({ ...state.filters, [key]: value })
    }
  }
  
  // Función para remover un filtro específico
  const removeFilter = (key: keyof FilterState, value?: any) => {
    const currentValue = state.filters[key]
    
    if (Array.isArray(currentValue) && value !== undefined) {
      // Remover elemento específico del array
      const updatedValue = currentValue.filter(item => item !== value)
      updateFilters({ ...state.filters, [key]: updatedValue })
    } else {
      // Resetear el filtro completo
      const defaultValue = Array.isArray(currentValue) ? [] : ''
      updateFilters({ ...state.filters, [key]: defaultValue })
    }
  }
  
  // Función para obtener el conteo de filtros activos
  const getActiveFiltersCount = () => {
    let count = 0
    const filters = state.filters
    
    if (filters.search) count++
    if (filters.estado !== 'all') count++
    if (filters.centroGestor?.length > 0) count++
    if (filters.comunas?.length > 0) count++
    if (filters.barrios?.length > 0) count++
    if (filters.corregimientos?.length > 0) count++
    if (filters.veredas?.length > 0) count++
    if (filters.fuentesFinanciamiento?.length > 0) count++
    if (filters.filtrosPersonalizados?.length > 0) count++
    if (filters.subfiltrosPersonalizados?.length > 0) count++
    if (filters.periodos && filters.periodos.length > 0) count += filters.periodos.length
    
    return count
  }
  
  return {
    filters: state.filters,
    updateFilters,
    resetFilters,
    addFilter,
    removeFilter,
    activeFiltersCount: getActiveFiltersCount()
  }
}

// Exportar tipos para uso en otros componentes
export type { DashboardState, FilterState }

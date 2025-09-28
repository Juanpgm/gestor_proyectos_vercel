'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { allMockUnidadesProyecto, mockMetrics, type UnidadProyectoMock } from '../data/mockUnidadesProyecto'

// Interfaces para filtros (manteniendo compatibilidad)
export interface UnidadProyectoFilters {
  search?: string
  bpin?: string
  upid?: string
  tipo_intervencion?: string
  clase_obra?: string
  estado?: string
  comuna_corregimiento?: string
  barrio_vereda?: string
  nombre_centro_gestor?: string
  fuente_financiacion?: string
  ano?: string
}

// Interface para métricas (manteniendo compatibilidad con el componente)
export interface UnidadesProyectoMetrics {
  totalUnidades: number
  bpinsUnicos: number
  valorTotalProyectos: number
  valorPromedioPorProyecto: number
  avancePromedioObra: number
  distribuciones: {
    porEstado: Record<string, number>
    porTipoIntervencion: Record<string, number>
    porClaseObra: Record<string, number>
    porComuna: Record<string, number>
    porCentroGestor: Record<string, number>
  }
  rangosPresupuesto: {
    bajo: number
    medio: number
    alto: number
  }
  rangosAvance: {
    sinIniciar: number
    enProceso: number
    completado: number
  }
}

// Estado del hook (manteniendo compatibilidad)
interface UnidadesProyectoOfflineState {
  data: UnidadProyectoMock[]
  metrics: UnidadesProyectoMetrics | null
  loading: boolean
  error: string | null
  totalCount: number
  lastUpdated: string | null
}

/**
 * Hook OFFLINE para Unidades de Proyecto - SIN API
 * Usa datos mock locales para desarrollo y edición
 * NO hace llamadas HTTP ni usa caché
 */
export function useUnidadesProyectoOffline(filters?: UnidadProyectoFilters) {
  const [state, setState] = useState<UnidadesProyectoOfflineState>({
    data: [],
    metrics: null,
    loading: true,
    error: null,
    totalCount: 0,
    lastUpdated: null
  })

  // Función para filtrar datos localmente
  const filterData = useCallback((data: UnidadProyectoMock[], filters?: UnidadProyectoFilters): UnidadProyectoMock[] => {
    if (!filters) return data

    return data.filter(item => {
      // Filtro por búsqueda de texto
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          item.nombre_up,
          item.bpin,
          item.upid,
          item.descripcion_intervencion,
          item.direccion,
          item.nombre_centro_gestor,
          item.comuna_corregimiento,
          item.barrio_vereda
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) return false
      }

      // Filtros específicos
      if (filters.bpin && !item.bpin.includes(filters.bpin)) return false
      if (filters.upid && !item.upid.includes(filters.upid)) return false
      if (filters.tipo_intervencion && item.tipo_intervencion !== filters.tipo_intervencion) return false
      if (filters.clase_obra && item.clase_obra !== filters.clase_obra) return false
      if (filters.estado && item.estado !== filters.estado) return false
      if (filters.comuna_corregimiento && item.comuna_corregimiento !== filters.comuna_corregimiento) return false
      if (filters.barrio_vereda && item.barrio_vereda !== filters.barrio_vereda) return false
      if (filters.nombre_centro_gestor && item.nombre_centro_gestor !== filters.nombre_centro_gestor) return false
      if (filters.fuente_financiacion && item.fuente_financiacion !== filters.fuente_financiacion) return false
      if (filters.ano && item.ano !== filters.ano) return false

      return true
    })
  }, [])

  // Función para calcular métricas de datos filtrados
  const calculateMetrics = useCallback((data: UnidadProyectoMock[]): UnidadesProyectoMetrics => {
    const totalUnidades = data.length
    const bpinsUnicos = new Set(data.map(u => u.bpin)).size
    const valorTotalProyectos = data.reduce((sum, u) => sum + u.presupuesto_base, 0)
    const valorPromedioPorProyecto = totalUnidades > 0 ? valorTotalProyectos / totalUnidades : 0
    const avancePromedioObra = totalUnidades > 0 ? data.reduce((sum, u) => sum + u.avance_obra, 0) / totalUnidades : 0

    // Distribuciones
    const distribuciones = {
      porEstado: data.reduce((acc, u) => {
        const estado = u.estado || 'Sin estado'
        acc[estado] = (acc[estado] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      porTipoIntervencion: data.reduce((acc, u) => {
        acc[u.tipo_intervencion] = (acc[u.tipo_intervencion] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      porClaseObra: data.reduce((acc, u) => {
        acc[u.clase_obra] = (acc[u.clase_obra] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      porComuna: data.reduce((acc, u) => {
        acc[u.comuna_corregimiento] = (acc[u.comuna_corregimiento] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      porCentroGestor: data.reduce((acc, u) => {
        acc[u.nombre_centro_gestor] = (acc[u.nombre_centro_gestor] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Rangos de presupuesto
    const rangosPresupuesto = data.reduce((acc, u) => {
      const presupuesto = u.presupuesto_base
      if (presupuesto < 100000000) {
        acc.bajo++
      } else if (presupuesto < 1000000000) {
        acc.medio++
      } else {
        acc.alto++
      }
      return acc
    }, { bajo: 0, medio: 0, alto: 0 })

    // Rangos de avance
    const rangosAvance = data.reduce((acc, u) => {
      const avance = u.avance_obra
      if (avance === 0) {
        acc.sinIniciar++
      } else if (avance < 1) {
        acc.enProceso++
      } else {
        acc.completado++
      }
      return acc
    }, { sinIniciar: 0, enProceso: 0, completado: 0 })

    return {
      totalUnidades,
      bpinsUnicos,
      valorTotalProyectos,
      valorPromedioPorProyecto,
      avancePromedioObra,
      distribuciones,
      rangosPresupuesto,
      rangosAvance
    }
  }, [])

  // Simular carga de datos (sin API)
  const loadData = useCallback(async (currentFilters?: UnidadProyectoFilters) => {
    console.log('🔄 Cargando datos OFFLINE (sin API)...')
    
    setState(prev => ({ ...prev, loading: true, error: null }))

    // Simular delay de red para realismo
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      // Filtrar datos localmente
      const filteredData = filterData(allMockUnidadesProyecto, currentFilters)
      
      // Calcular métricas
      const metrics = calculateMetrics(filteredData)

      setState({
        data: filteredData,
        metrics,
        loading: false,
        error: null,
        totalCount: filteredData.length,
        lastUpdated: new Date().toISOString()
      })

      console.log(`✅ Datos cargados OFFLINE: ${filteredData.length} registros`)
    } catch (error) {
      console.error('❌ Error procesando datos offline:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error procesando datos locales'
      }))
    }
  }, [filterData, calculateMetrics])

  // Cargar datos al montar o cambiar filtros
  useEffect(() => {
    loadData(filters)
  }, [filters, loadData])

  // Función para refrescar datos
  const refresh = useCallback(() => {
    loadData(filters)
  }, [loadData, filters])

  // Función para aplicar filtros
  const applyFilters = useCallback((newFilters: UnidadProyectoFilters) => {
    loadData(newFilters)
  }, [loadData])

  // Memoizar datos procesados para el mapa
  const processedData = useMemo(() => {
    return state.data.map(item => ({
      type: 'Feature' as const,
      geometry: item.coordinates ? {
        type: 'Point' as const,
        coordinates: [item.coordinates.lng, item.coordinates.lat]
      } : null,
      has_geometry: item.has_geometry,
      geometry_type: item.geometry_type,
      properties: {
        ...item,
        // Mapear campos para compatibilidad con componentes existentes
        avance_obra: item.avance_obra,
        presupuesto_base: item.presupuesto_base,
        nombre_up: item.nombre_up,
        tipo_intervencion: item.tipo_intervencion,
        estado: item.estado
      },
      updated_at: item.updated_at,
      id: item.id,
      _metadata: {
        create_time: item.updated_at,
        update_time: item.updated_at
      }
    }))
  }, [state.data])

  return {
    // Datos principales
    data: state.data,
    processedData,
    metrics: state.metrics,
    
    // Estados
    loading: state.loading,
    error: state.error,
    totalCount: state.totalCount,
    lastUpdated: state.lastUpdated,
    
    // Acciones
    refresh,
    applyFilters,
    
    // Metadata
    isOffline: true, // Indicador de que está en modo offline
    dataSource: 'local-mock' // Indicar fuente de datos
  }
}

// Hook específico para métricas (manteniendo compatibilidad)
export function useUnidadesProyectoMetricsOffline(filters?: UnidadProyectoFilters) {
  const { metrics, loading, error } = useUnidadesProyectoOffline(filters)
  
  return {
    metrics,
    loading,
    error,
    isOffline: true
  }
}

// Alias para el hook principal (para reemplazo fácil)
export const useUnidadesProyectoAPI = useUnidadesProyectoOffline
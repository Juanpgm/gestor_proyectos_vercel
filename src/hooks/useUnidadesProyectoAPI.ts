'use client'

import { useState, useEffect, useCallback } from 'react'

// Configuración de la API
const API_BASE_URL = 'https://gestorproyectoapi-production.up.railway.app'
const DEFAULT_TIMEOUT = 30000 // 30 segundos

// Interfaces para los datos de la API
export interface UnidadProyectoAPI {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  has_geometry: boolean
  geometry_type: string
  properties: {
    processed_timestamp: string
    descripcion_intervencion?: string
    microtio?: string
    bpin: string
    centros_gravedad: boolean
    url_proceso?: string
    clase_obra: string
    tipo_intervencion: string
    upid: string
    referencia_contrato?: string
    identificador?: string
    unidad: string
    fecha_inicio?: string
    fecha_fin?: string
    estado?: string
    plataforma?: string
    nombre_up_detalle?: string
    nombre_centro_gestor: string
    avance_obra: number
    geometry_bounds?: any
    direccion?: string
    ano: string
    geometry_type?: string
    dataframe: string
    comuna_corregimiento: string
    nombre_up: string
    referencia_proceso?: string
    fuente_financiacion?: string
    barrio_vereda?: string
    cantidad: string
    presupuesto_base: number
  }
  updated_at: string
  id: string
  _metadata: {
    create_time: string
    update_time: string
  }
}

export interface UnidadesProyectoAPIResponse {
  data: UnidadProyectoAPI[]
  count: number
  timestamp: string
  collection: string
}

// Interface para filtros
export interface UnidadProyectoFilters {
  comuna_corregimiento?: string
  barrio_vereda?: string
  tipo_intervencion?: string
  estado?: string
  ano?: string
  nombre_centro_gestor?: string
  fuente_financiacion?: string
  search?: string
  bpin?: string
  upid?: string
  limit?: number
  offset?: number
}

// Interface para métricas calculadas
export interface UnidadesProyectoMetrics {
  totalUnidades: number
  bpinsUnicos: number
  valorTotalProyectos: number
  valorPromedioPorProyecto: number
  avancePromedioObra: number
  distribuciones: {
    porEstado: Record<string, number>
    porAno: Record<string, number>
    porTipoIntervencion: Record<string, number>
    porCentroGestor: Record<string, number>
    porFuenteFinanciacion: Record<string, number>
    porComunaCorregimiento: Record<string, number>
    porBarrioVereda: Record<string, number>
  }
  rangosPresupuesto: {
    bajo: number // 0 - 100M
    medio: number // 100M - 1B
    alto: number // > 1B
  }
  rangosAvance: {
    sinIniciar: number // 0%
    enProceso: number // 1-99%
    completado: number // 100%
  }
}

// Estado del hook
interface UnidadesProyectoAPIState {
  data: UnidadProyectoAPI[]
  metrics: UnidadesProyectoMetrics | null
  loading: boolean
  error: string | null
  totalCount: number
  lastUpdated: string | null
}

/**
 * Función utilitaria para realizar peticiones con timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Calcula métricas a partir de los datos de unidades de proyecto
 */
function calculateMetrics(unidades: UnidadProyectoAPI[]): UnidadesProyectoMetrics {
  if (unidades.length === 0) {
    return {
      totalUnidades: 0,
      bpinsUnicos: 0,
      valorTotalProyectos: 0,
      valorPromedioPorProyecto: 0,
      avancePromedioObra: 0,
      distribuciones: {
        porEstado: {},
        porAno: {},
        porTipoIntervencion: {},
        porCentroGestor: {},
        porFuenteFinanciacion: {},
        porComunaCorregimiento: {},
        porBarrioVereda: {}
      },
      rangosPresupuesto: { bajo: 0, medio: 0, alto: 0 },
      rangosAvance: { sinIniciar: 0, enProceso: 0, completado: 0 }
    }
  }

  // Calcular métricas básicas
  const bpinsUnicos = new Set(unidades.map(u => u.properties.bpin)).size
  const valorTotalProyectos = unidades.reduce((sum, u) => sum + (u.properties.presupuesto_base || 0), 0)
  const valorPromedioPorProyecto = valorTotalProyectos / unidades.length
  const avancePromedioObra = unidades.reduce((sum, u) => sum + (u.properties.avance_obra || 0), 0) / unidades.length

  // Distribuciones
  const distribuciones = {
    porEstado: {},
    porAno: {},
    porTipoIntervencion: {},
    porCentroGestor: {},
    porFuenteFinanciacion: {},
    porComunaCorregimiento: {},
    porBarrioVereda: {}
  } as any

  // Rangos de presupuesto (en pesos colombianos)
  const rangosPresupuesto = { bajo: 0, medio: 0, alto: 0 }
  const rangosAvance = { sinIniciar: 0, enProceso: 0, completado: 0 }

  unidades.forEach(unidad => {
    const props = unidad.properties

    // Distribuciones
    distribuciones.porEstado[props.estado || 'Sin Estado'] = (distribuciones.porEstado[props.estado || 'Sin Estado'] || 0) + 1
    distribuciones.porAno[props.ano] = (distribuciones.porAno[props.ano] || 0) + 1
    distribuciones.porTipoIntervencion[props.tipo_intervencion] = (distribuciones.porTipoIntervencion[props.tipo_intervencion] || 0) + 1

    distribuciones.porCentroGestor[props.nombre_centro_gestor] = (distribuciones.porCentroGestor[props.nombre_centro_gestor] || 0) + 1
    
    if (props.fuente_financiacion) {
      distribuciones.porFuenteFinanciacion[props.fuente_financiacion] = (distribuciones.porFuenteFinanciacion[props.fuente_financiacion] || 0) + 1
    }
    
    distribuciones.porComunaCorregimiento[props.comuna_corregimiento] = (distribuciones.porComunaCorregimiento[props.comuna_corregimiento] || 0) + 1
    
    if (props.barrio_vereda) {
      distribuciones.porBarrioVereda[props.barrio_vereda] = (distribuciones.porBarrioVereda[props.barrio_vereda] || 0) + 1
    }

    // Rangos de presupuesto
    const presupuesto = props.presupuesto_base || 0
    if (presupuesto === 0) {
      // No contar proyectos sin presupuesto
    } else if (presupuesto < 100000000) { // Menos de 100 millones
      rangosPresupuesto.bajo++
    } else if (presupuesto < 1000000000) { // Entre 100 millones y 1 billón
      rangosPresupuesto.medio++
    } else { // Más de 1 billón
      rangosPresupuesto.alto++
    }

    // Rangos de avance
    const avance = props.avance_obra || 0
    if (avance === 0) {
      rangosAvance.sinIniciar++
    } else if (avance < 1) {
      rangosAvance.enProceso++
    } else {
      rangosAvance.completado++
    }
  })

  return {
    totalUnidades: unidades.length,
    bpinsUnicos,
    valorTotalProyectos,
    valorPromedioPorProyecto,
    avancePromedioObra,
    distribuciones,
    rangosPresupuesto,
    rangosAvance
  }
}

/**
 * Hook principal para consumir la API de Unidades de Proyecto
 */
export function useUnidadesProyectoAPI(filters?: UnidadProyectoFilters) {
  const [state, setState] = useState<UnidadesProyectoAPIState>({
    data: [],
    metrics: null,
    loading: true,
    error: null,
    totalCount: 0,
    lastUpdated: null
  })

  // Función para cargar datos con filtros
  const fetchData = useCallback(async (currentFilters?: UnidadProyectoFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Construir URL con filtros
      const params = new URLSearchParams()
      
      if (currentFilters) {
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString())
          }
        })
      }

      const endpoint = currentFilters && Object.keys(currentFilters).length > 0
        ? `/unidades-proyecto/filter?${params.toString()}`
        : '/unidades-proyecto'

      console.log('🔍 Cargando unidades de proyecto desde API:', `${API_BASE_URL}${endpoint}`)
      console.log('📋 Parámetros de filtro:', currentFilters)

      const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
      }

      const result: UnidadesProyectoAPIResponse = await response.json()

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Formato de datos inválido recibido de la API')
      }

      // Calcular métricas
      const metrics = calculateMetrics(result.data)

      setState({
        data: result.data,
        metrics,
        loading: false,
        error: null,
        totalCount: result.count,
        lastUpdated: result.timestamp
      })

      console.log(`✅ Cargadas ${result.data.length} unidades de proyecto desde API`)

    } catch (error: any) {
      console.error('❌ Error cargando unidades de proyecto desde API:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error desconocido al cargar datos'
      }))
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    fetchData(filters)
  }, [fetchData, filters])

  // Función para refrescar datos
  const refresh = useCallback(() => {
    fetchData(filters)
  }, [fetchData, filters])

  // Función para aplicar nuevos filtros
  const applyFilters = useCallback((newFilters: UnidadProyectoFilters) => {
    fetchData(newFilters)
  }, [fetchData])

  return {
    ...state,
    refresh,
    applyFilters
  }
}

// Hook específico para obtener solo las métricas
export function useUnidadesProyectoMetrics(filters?: UnidadProyectoFilters) {
  const { metrics, loading, error } = useUnidadesProyectoAPI(filters)
  
  return {
    metrics,
    loading,
    error
  }
}
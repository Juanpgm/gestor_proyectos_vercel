'use client'

import { useState, useEffect } from 'react'

// Tipos simplificados
export interface UnidadProyecto {
  id: string
  bpin: string
  name: string
  status: 'En Ejecución' | 'Planificación' | 'Completado' | 'Suspendido' | 'En Evaluación'
  comuna?: string
  barrio?: string
  corregimiento?: string
  vereda?: string
  budget: number
  executed: number
  pagado: number
  beneficiaries: number
  startDate: string
  endDate: string
  responsible: string
  progress: number
  tipoIntervencion?: string
  claseObra?: string
  descripcion?: string
  direccion?: string
  lat?: number
  lng?: number
  geometry?: any
  source?: 'equipamientos' | 'infraestructura'
}

interface OptimizedDataState {
  geoJSONData: Record<string, any>
  unidades: UnidadProyecto[]
  loading: boolean
  error: string | null
}

// Cache global simple
let globalCache: OptimizedDataState | null = null
let loadingPromise: Promise<OptimizedDataState> | null = null

// Función de carga simplificada
async function loadData(): Promise<OptimizedDataState> {
  console.log('🔄 Cargando datos optimizado...')
  
  try {
    // Cargar archivos GeoJSON
    const [equipamientos, infraestructura] = await Promise.all([
      Promise.resolve({ features: [] }), // equipamientos eliminado
      Promise.resolve({ features: [] })  // infraestructura_vial eliminado
    ])

    const geoJSONData = {
      equipamientos,
      infraestructura_vial: infraestructura
    }

    // Convertir features a UnidadProyecto simplificado
    const unidades: UnidadProyecto[] = []
    
    // Procesar equipamientos
    if (equipamientos?.features) {
      equipamientos.features.forEach((feature: any) => {
        const props = feature.properties || {}
        unidades.push({
          id: props.identificador?.toString() || `eq-${Math.random()}`,
          bpin: props.bpin?.toString() || '0',
          name: props.nickname || props.nombre || 'Sin nombre',
          status: mapStatus(props.estado_unidad_proyecto),
          comuna: props.comuna_corregimiento?.includes('Comuna') ? props.comuna_corregimiento : undefined,
          barrio: props.barrio_vereda,
          budget: props.ppto_base || 0,
          executed: props.pagos_realizados || 0,
          pagado: props.pagos_realizados || 0,
          beneficiaries: props.usuarios_beneficiarios || 0,
          startDate: props.fecha_inicio_planeado || '2024-01-01',
          endDate: props.fecha_fin_planeado || '2024-12-31',
          responsible: props.nombre_centro_gestor || 'No especificado',
          progress: (props.avance_físico_obra || 0) * 100,
          tipoIntervencion: props.tipo_intervencion,
          claseObra: props.clase_obra,
          source: 'equipamientos'
        })
      })
    }

    // Procesar infraestructura
    if (infraestructura?.features) {
      infraestructura.features.forEach((feature: any) => {
        const props = feature.properties || {}
        unidades.push({
          id: props.id_via?.toString() || `inf-${Math.random()}`,
          bpin: props.bpin?.toString() || '0',
          name: props.seccion_via || props.nickname || 'Vía sin nombre',
          status: mapStatus(props.estado_unidad_proyecto),
          budget: props.ppto_base || 0,
          executed: props.pagos_realizados || 0,
          pagado: props.pagos_realizados || 0,
          beneficiaries: 0,
          startDate: props.fecha_inicio_planeado || '2024-01-01',
          endDate: props.fecha_fin_planeado || '2024-12-31',
          responsible: props.nombre_centro_gestor || 'No especificado',
          progress: (props.avance_físico_obra || 0) * 100,
          tipoIntervencion: props.tipo_intervencion,
          claseObra: props.clase_obra,
          source: 'infraestructura'
        })
      })
    }

    console.log(`✅ Datos cargados: ${unidades.length} unidades`)
    
    return {
      geoJSONData,
      unidades,
      loading: false,
      error: null
    }

  } catch (error: any) {
    console.error('❌ Error cargando datos:', error)
    return {
      geoJSONData: {},
      unidades: [],
      loading: false,
      error: error.message
    }
  }
}

function mapStatus(estado?: string): UnidadProyecto['status'] {
  if (!estado) return 'En Ejecución'
  const lower = estado.toLowerCase()
  if (lower.includes('completado')) return 'Completado'
  if (lower.includes('suspendido')) return 'Suspendido'
  if (lower.includes('evaluación')) return 'En Evaluación'
  if (lower.includes('planificación')) return 'Planificación'
  return 'En Ejecución'
}

export function useOptimizedProjectData() {
  const [state, setState] = useState<OptimizedDataState>(() => {
    if (globalCache) return globalCache
    return {
      geoJSONData: {},
      unidades: [],
      loading: true,
      error: null
    }
  })

  useEffect(() => {
    if (globalCache) {
      setState(globalCache)
      return
    }

    if (loadingPromise) {
      loadingPromise.then(setState)
      return
    }

    loadingPromise = loadData()
    loadingPromise.then(result => {
      globalCache = result
      setState(result)
      loadingPromise = null
    })
  }, [])

  return state
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getCentroGestorAccessFromSession,
  buildAllowedBpinsSet,
  toBpinKey
} from '@/utils/centroGestorAccess'

// Interfaces para los datos de procesos
export interface Proceso {
  entidad: string
  entidad_centralizada: string
  id_proceso: string
  referencia_proceso: string
  pci: number
  proceso_compra: string
  nombre_procedimiento: string
  descripción_procedimiento: string
  fase: string
  fecha_publicacion_proceso: string
  fecha_ultima_publicación: string
  fecha_publicacion_fase_planeacion_precalificacion: string | null
  fecha_publicacion_fase_seleccion_precalificacion: string | null
  fecha_publicacion_manifestacion_interes: string | null
  fecha_publicacion_fase_borrador: string | null
  fecha_publicacion_fase_seleccion: string | null
  precio_base: number
  modalidad_contratacion: string
  justificación_modalidad_contratación: string
  duracion: string
  unidad_duracion: string
  fecha_recepcion_respuestas: string | null
  fecha_apertura_respuesta: string | null
  fecha_apertura_efectiva: string | null
  ciudad_unidad_contratación: string
  nombre_unidad_contratación: string
  proveedores_invitados: string
  proveedores_invitacion_directa: number
  visualizaciones_procedimiento: number
  proveedores_que_manifestaron_interes: number
  respuestas_al_procedimiento: number
  respuestas_externas: number
  conteo_respuestas_ofertas: number
  proveedores_unicos_respuestas: number
  numero_lotes: number
  estado_procedimiento: string
  id_estado_procedimiento: number
  adjudicado: string
  id_adjudicacion: string
  codigoproveedor: string
  departamento_proveedor: string
  ciudad_proveedor: string
  fecha_adjudicacion: string | null
  valor_total_adjudicacion: number
  nombre_adjudicador: string
  nombre_proveedor_adjudicado: string
  nit_proveedor_adjudicado: string
  codigo_principal_categoria: string
  estado_apertura_proceso: string
}

export interface ProcesoIndex {
  bpin: number
  total_procesos: number
  procesos: {
    referencia_proceso: string
    proceso_compra: string
    urlproceso: string
  }[]
}

export interface ProcesosData {
  procesos: Proceso[]
  index: Record<string, ProcesoIndex>
}

export interface ProcesosMetrics {
  totalProcesos: number
  procesosPorEstado: Record<string, number>
  procesosPorFase: Record<string, number>
  procesosPorModalidad: Record<string, number>
  procesosPorEntidad: Record<string, number>
  procesosAdjudicados: number
  procesosNoAdjudicados: number
  valorTotalProcesos: number
  valorTotalAdjudicado: number
  promedioVisualizaciones: number
  promedioProveedoresInteres: number
  procesosPorMes: Record<string, number>
  entidades: string[]
  modalidades: string[]
  fases: string[]
  estados: string[]
  distribucíonDuracion: Record<string, number>
}

interface ProcesosState {
  data: ProcesosData
  loading: boolean
  error: string | null
  metrics: ProcesosMetrics
}

const initialMetrics: ProcesosMetrics = {
  totalProcesos: 0,
  procesosPorEstado: {},
  procesosPorFase: {},
  procesosPorModalidad: {},
  procesosPorEntidad: {},
  procesosAdjudicados: 0,
  procesosNoAdjudicados: 0,
  valorTotalProcesos: 0,
  valorTotalAdjudicado: 0,
  promedioVisualizaciones: 0,
  promedioProveedoresInteres: 0,
  procesosPorMes: {},
  entidades: [],
  modalidades: [],
  fases: [],
  estados: [],
  distribucíonDuracion: {},
}

export function useProcesos() {
  const [state, setState] = useState<ProcesosState>({
    data: { procesos: [], index: {} },
    loading: true,
    error: null,
    metrics: initialMetrics
  })

  useEffect(() => {
    const loadProcesosData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        // Cargar los datos de procesos y el índice en paralelo
        const [procesosResponse, indexResponse] = await Promise.all([
          fetch('/data/procesos/procesos_secop.json'),
          fetch('/data/procesos/procesos_proyectos_index.json')
        ])

        if (!procesosResponse.ok || !indexResponse.ok) {
          throw new Error('Error al cargar los datos de procesos')
        }

        const [procesosData, indexData] = await Promise.all([
          procesosResponse.json(),
          indexResponse.json()
        ])

        const procesosTyped = (procesosData || []) as Proceso[]
        const indexTyped = (indexData || {}) as Record<string, ProcesoIndex>

        const centroGestorAccess = getCentroGestorAccessFromSession()
        const proyectosResponse = await fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json')
        const proyectosData = proyectosResponse.ok ? await proyectosResponse.json() : []
        const allowedBpins = buildAllowedBpinsSet(
          proyectosData || [],
          centroGestorAccess,
          ['nombre_centro_gestor', 'responsible', 'centro_gestor']
        )

        const indexFiltrado = allowedBpins
          ? Object.entries(indexTyped).reduce((acc, [key, value]) => {
              const bpinValue = toBpinKey(value?.bpin ?? key)
              if (bpinValue && allowedBpins.has(bpinValue)) {
                acc[key] = value
              }
              return acc
            }, {} as Record<string, ProcesoIndex>)
          : indexTyped

        const allowedReferences = allowedBpins
          ? new Set(
              Object.values(indexFiltrado)
                .flatMap((entry) => entry.procesos || [])
                .map((entry) => [entry.referencia_proceso, entry.proceso_compra])
                .flat()
                .map((value) => String(value || '').trim().toLowerCase())
                .filter((value) => value.length > 0)
            )
          : null

        const procesosFiltrados = allowedReferences
          ? procesosTyped.filter((proceso: Proceso) => {
              const referenciaProceso = String(proceso.referencia_proceso || '').trim().toLowerCase()
              const procesoCompra = String(proceso.proceso_compra || '').trim().toLowerCase()
              const idProceso = String(proceso.id_proceso || '').trim().toLowerCase()

              return (
                allowedReferences.has(referenciaProceso) ||
                allowedReferences.has(procesoCompra) ||
                allowedReferences.has(idProceso)
              )
            })
          : procesosTyped

        const data: ProcesosData = {
          procesos: procesosFiltrados,
          index: indexFiltrado
        }

        // Calcular métricas
        const metrics = calculateMetrics(data.procesos)

        setState({
          data,
          loading: false,
          error: null,
          metrics
        })

      } catch (error) {
        console.error('Error cargando datos de procesos:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      }
    }

    loadProcesosData()
  }, [])

  return state
}

// Función para calcular métricas de procesos
function calculateMetrics(procesos: Proceso[]): ProcesosMetrics {
  if (procesos.length === 0) return initialMetrics

  // Contadores básicos
  const totalProcesos = procesos.length
  const valorTotalProcesos = procesos.reduce((sum, p) => sum + (p.precio_base || 0), 0)
  const valorTotalAdjudicado = procesos.reduce((sum, p) => sum + (p.valor_total_adjudicacion || 0), 0)

  // Agrupaciones por categorías
  const procesosPorEstado = procesos.reduce((acc, p) => {
    const estado = p.estado_procedimiento || 'Sin Estado'
    acc[estado] = (acc[estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const procesosPorFase = procesos.reduce((acc, p) => {
    const fase = p.fase || 'Sin Fase'
    acc[fase] = (acc[fase] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const procesosPorModalidad = procesos.reduce((acc, p) => {
    const modalidad = p.modalidad_contratacion || 'Sin Modalidad'
    acc[modalidad] = (acc[modalidad] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const procesosPorEntidad = procesos.reduce((acc, p) => {
    const entidad = p.entidad || 'Sin Entidad'
    acc[entidad] = (acc[entidad] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Distribución por duración
  const distribucíonDuracion = procesos.reduce((acc, p) => {
    const duracion = `${p.duracion} ${p.unidad_duracion}` || 'Sin Duración'
    acc[duracion] = (acc[duracion] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Procesos por mes basado en fecha de publicación
  const procesosPorMes = procesos.reduce((acc, p) => {
    if (p.fecha_publicacion_proceso) {
      const fecha = new Date(p.fecha_publicacion_proceso)
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      acc[mes] = (acc[mes] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Métricas específicas
  const procesosAdjudicados = procesos.filter(p => p.adjudicado === 'Sí' || p.adjudicado === 'Si').length
  const procesosNoAdjudicados = totalProcesos - procesosAdjudicados

  // Promedios
  const totalVisualizaciones = procesos.reduce((sum, p) => sum + (p.visualizaciones_procedimiento || 0), 0)
  const promedioVisualizaciones = totalProcesos > 0 ? totalVisualizaciones / totalProcesos : 0

  const totalProveedoresInteres = procesos.reduce((sum, p) => sum + (p.proveedores_que_manifestaron_interes || 0), 0)
  const promedioProveedoresInteres = totalProcesos > 0 ? totalProveedoresInteres / totalProcesos : 0

  // Listas únicas
  const entidades = Array.from(new Set(procesos.map(p => p.entidad).filter(Boolean)))
  const modalidades = Array.from(new Set(procesos.map(p => p.modalidad_contratacion).filter(Boolean)))
  const fases = Array.from(new Set(procesos.map(p => p.fase).filter(Boolean)))
  const estados = Array.from(new Set(procesos.map(p => p.estado_procedimiento).filter(Boolean)))

  return {
    totalProcesos,
    procesosPorEstado,
    procesosPorFase,
    procesosPorModalidad,
    procesosPorEntidad,
    procesosAdjudicados,
    procesosNoAdjudicados,
    valorTotalProcesos,
    valorTotalAdjudicado,
    promedioVisualizaciones,
    promedioProveedoresInteres,
    procesosPorMes,
    entidades,
    modalidades,
    fases,
    estados,
    distribucíonDuracion,
  }
}

// Hook para métricas filtradas
export function useProcesosMetrics(procesos: Proceso[]) {
  return useMemo(() => calculateMetrics(procesos), [procesos])
}

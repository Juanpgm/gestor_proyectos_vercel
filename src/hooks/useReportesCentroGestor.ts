'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ReporteContrato } from '@/types/avances-emprestito'

const API_BASE = '/api/proxy'

export interface CentroGestorResumen {
  nombre_centro_gestor: string
  total_reportes: number
  reportes_ultimos_10_dias: number
  ultimo_reporte: string | null
  primer_reporte: string | null
  contratos_reportados: string[]
  ultimo_avance_fisico: number
  ultimo_avance_financiero: number
  tiene_alertas: boolean
}

export interface ReportesCentroGestorData {
  todos: ReporteContrato[]
  resumenPorCentroGestor: CentroGestorResumen[]
  centrosConReportes: string[]
  centrosSinReportes: string[]
  totalReportes: number
  loading: boolean
  error: string | null
}

function calcularDiasAtras(dias: number): Date {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  fecha.setHours(0, 0, 0, 0)
  return fecha
}

function parseFechaReporte(fecha: string | null | undefined): Date | null {
  if (!fecha) return null
  const d = new Date(fecha)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Hook para obtener todos los reportes de contratos y agrupar por centro gestor
 */
export function useReportesCentroGestor() {
  const [reportes, setReportes] = useState<ReporteContrato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/reportes_contratos/`)
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      const data = await res.json()
      const raw = data.data || data
      const lista: ReporteContrato[] = Array.isArray(raw) ? raw : []
      lista.sort((a, b) => {
        const da = new Date(a.fecha_reporte || 0).getTime()
        const db = new Date(b.fecha_reporte || 0).getTime()
        return db - da
      })
      setReportes(lista)
    } catch (err) {
      console.error('Error fetching reportes centro gestor:', err)
      setError(err instanceof Error ? err.message : 'Error cargando reportes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  return { reportes, loading, error, refetch: fetchTodos }
}

/**
 * Hook para obtener la lista de centros gestores desde contratos empréstito
 */
export function useCentrosGestorFromContratos() {
  const [centrosGestor, setCentrosGestor] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}/emprestito/obtener-contratos-bp`)
        if (!res.ok) return
        const payload = await res.json()
        const raw = payload?.data || payload
        const contratos = Array.isArray(raw) ? raw : []
        const centros = new Set<string>()
        for (const c of contratos) {
          const cg = (c.nombre_centro_gestor || '').trim()
          if (cg.length > 0) centros.add(cg)
        }
        setCentrosGestor(Array.from(centros).sort((a, b) => a.localeCompare(b, 'es')))
      } catch {
        // silently fail - centros list is supplementary
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  return { centrosGestor, loading }
}

/**
 * Hook compuesto: combina reportes + lista de centros gestores para el dashboard
 */
export function useReportesCentroGestorDashboard() {
  const { reportes, loading: loadingReportes, error, refetch } = useReportesCentroGestor()
  const { centrosGestor: todosLosCentros, loading: loadingCentros } = useCentrosGestorFromContratos()

  const resumenPorCentroGestor = useMemo((): CentroGestorResumen[] => {
    if (!reportes.length) return []

    const limite10Dias = calcularDiasAtras(10)
    const mapa = new Map<string, CentroGestorResumen>()

    for (const r of reportes) {
      const cg = (r.nombre_centro_gestor || 'Sin centro gestor').trim()
      if (!mapa.has(cg)) {
        mapa.set(cg, {
          nombre_centro_gestor: cg,
          total_reportes: 0,
          reportes_ultimos_10_dias: 0,
          ultimo_reporte: null,
          primer_reporte: null,
          contratos_reportados: [],
          ultimo_avance_fisico: 0,
          ultimo_avance_financiero: 0,
          tiene_alertas: false,
        })
      }
      const resumen = mapa.get(cg)!
      resumen.total_reportes++

      const fecha = parseFechaReporte(r.fecha_reporte)
      if (fecha) {
        if (!resumen.ultimo_reporte || fecha > new Date(resumen.ultimo_reporte)) {
          resumen.ultimo_reporte = r.fecha_reporte
          resumen.ultimo_avance_fisico = r.avance_fisico || 0
          resumen.ultimo_avance_financiero = r.avance_financiero || 0
        }
        if (!resumen.primer_reporte || fecha < new Date(resumen.primer_reporte)) {
          resumen.primer_reporte = r.fecha_reporte
        }
        if (fecha >= limite10Dias) {
          resumen.reportes_ultimos_10_dias++
        }
      }

      const ref = r.referencia_contrato
      if (ref && !resumen.contratos_reportados.includes(ref)) {
        resumen.contratos_reportados.push(ref)
      }

      if (r.alertas?.es_alerta) resumen.tiene_alertas = true
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre_centro_gestor.localeCompare(b.nombre_centro_gestor, 'es')
    )
  }, [reportes])

  const centrosConReportes = useMemo(
    () => resumenPorCentroGestor.map(r => r.nombre_centro_gestor),
    [resumenPorCentroGestor]
  )

  const centrosSinReportes = useMemo(() => {
    if (!todosLosCentros.length) return []
    const conReportesSet = new Set(centrosConReportes.map(c => c.toLowerCase().trim()))
    return todosLosCentros.filter(c => !conReportesSet.has(c.toLowerCase().trim()))
  }, [todosLosCentros, centrosConReportes])

  return {
    reportes,
    resumenPorCentroGestor,
    centrosConReportes,
    centrosSinReportes,
    totalReportes: reportes.length,
    loading: loadingReportes || loadingCentros,
    error,
    refetch,
  }
}

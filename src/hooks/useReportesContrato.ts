'use client'

import { useState, useEffect, useCallback } from 'react'
import type { 
  ReporteContrato, 
  ReporteContratoFormData, 
  ResumenReportesContrato 
} from '@/types/avances-emprestito'

const API_BASE = '/api/proxy'

/**
 * Hook para gestionar reportes de contratos de empréstito
 * Usa endpoints reales del backend (Firebase + Google Drive)
 */
export function useReportesContrato(referenciaContrato?: string) {
  const [reportes, setReportes] = useState<ReporteContrato[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Cargar reportes por referencia de contrato
  const fetchReportes = useCallback(async () => {
    if (!referenciaContrato) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${API_BASE}/reportes_contratos/referencia/${encodeURIComponent(referenciaContrato)}`
      )
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      const reportesList: ReporteContrato[] = data.data || []
      
      // Ordenar por fecha descendente
      reportesList.sort((a, b) => {
        const dateA = new Date(a.fecha_reporte || 0).getTime()
        const dateB = new Date(b.fecha_reporte || 0).getTime()
        return dateB - dateA
      })

      setReportes(reportesList)
    } catch (err) {
      console.error('Error fetching reportes:', err)
      setError(err instanceof Error ? err.message : 'Error cargando reportes')
    } finally {
      setLoading(false)
    }
  }, [referenciaContrato])

  // Crear reporte de avance (usa FormData para subir archivos)
  const crearReporte = useCallback(async (formData: ReporteContratoFormData): Promise<boolean> => {
    setSubmitting(true)
    setError(null)

    try {
      const body = new FormData()
      body.append('referencia_contrato', formData.referencia_contrato)
      body.append('observaciones', formData.observaciones)
      body.append('avance_fisico', String(formData.avance_fisico))
      body.append('avance_financiero', String(formData.avance_financiero))
      body.append('alertas_descripcion', formData.alertas_descripcion)
      body.append('alertas_es_alerta', String(formData.alertas_es_alerta))
      
      if (formData.alertas_tipo_alerta) {
        body.append('alertas_tipo_alerta', formData.alertas_tipo_alerta)
      }

      // Adjuntar archivos
      formData.archivos_evidencia.forEach((file) => {
        body.append('archivos_evidencia', file)
      })

      // POST directo al backend (no a través del proxy JSON)
      const res = await fetch('/api/reportes-contratos', {
        method: 'POST',
        body,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`)
      }

      // Recargar reportes después de crear
      await fetchReportes()
      return true
    } catch (err) {
      console.error('Error creando reporte:', err)
      setError(err instanceof Error ? err.message : 'Error creando reporte')
      return false
    } finally {
      setSubmitting(false)
    }
  }, [fetchReportes])

  // Cargar reportes al montar y cuando cambie la referencia
  useEffect(() => {
    fetchReportes()
  }, [fetchReportes])

  return {
    reportes,
    loading,
    error,
    submitting,
    crearReporte,
    refetch: fetchReportes
  }
}

/**
 * Hook para calcular resumen de reportes de un contrato
 */
export function useResumenReportes(reportes: ReporteContrato[]): ResumenReportesContrato {
  if (reportes.length === 0) {
    return {
      total_reportes: 0,
      ultimo_avance_fisico: 0,
      ultimo_avance_financiero: 0,
      ultima_fecha_reporte: null,
      tiene_alertas_activas: false,
      tendencia_fisica: 'sin_datos',
      tendencia_financiera: 'sin_datos'
    }
  }

  // Los reportes ya vienen ordenados desc por fecha
  const ultimo = reportes[0]
  const penultimo = reportes.length > 1 ? reportes[1] : null

  const calcTendencia = (actual: number, anterior: number | null): 'subiendo' | 'bajando' | 'estable' | 'sin_datos' => {
    if (anterior === null) return 'sin_datos'
    if (actual > anterior) return 'subiendo'
    if (actual < anterior) return 'bajando'
    return 'estable'
  }

  return {
    total_reportes: reportes.length,
    ultimo_avance_fisico: ultimo.avance_fisico || 0,
    ultimo_avance_financiero: ultimo.avance_financiero || 0,
    ultima_fecha_reporte: ultimo.fecha_reporte || null,
    tiene_alertas_activas: reportes.some(r => r.alertas?.es_alerta),
    tendencia_fisica: calcTendencia(
      ultimo.avance_fisico || 0,
      penultimo ? (penultimo.avance_fisico || 0) : null
    ),
    tendencia_financiera: calcTendencia(
      ultimo.avance_financiero || 0,
      penultimo ? (penultimo.avance_financiero || 0) : null
    )
  }
}

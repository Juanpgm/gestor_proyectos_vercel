'use client'

import { useState, useEffect, useMemo } from 'react'

// Tipos para los datos de los endpoints
export interface ProcesoBP {
  bp: string
  banco: string
  nombre_centro_gestor: string
  nombre_resumido_proceso: string
  tipo_contrato: string
  urlproceso: {
    url: string
  }
  valor_publicacion: number
}

export interface ContratoBP {
  bp: string
  banco: string
  nombre_centro_gestor: string
  nombre_resumido_proceso: string
  tipo_contrato: string
  urlproceso: {
    url: string
  }
  valor_contrato: number
  fecha_inicio_contrato: string | null
  fecha_fin_contrato: string | null
  sector: string
}

export interface AsignacionBP {
  id: string
  nombre_centro_gestor: string
  bp: string
  anio: number
  monto_programado_banco: number | null
  banco: string
  created_at: string
  updated_at: string
}

// Tipos para análisis agregado
export interface AnalisisPorBP {
  bp: string
  nombre_centro_gestor: string
  monto_programado: number
  monto_adjudicado: number
  brecha: number
  porcentaje_ejecucion: number
  participacion_bancos: {
    banco: string
    monto: number
    porcentaje: number
  }[]
  presupuesto_organismos: {
    organismo: string
    monto: number
    porcentaje: number
  }[]
  procesos: ProcesoBP[]
  contratos: ContratoBP[]
}

// Hook principal
export const useEmprestitoBP = () => {
  const [procesos, setProcesos] = useState<ProcesoBP[]>([])
  const [contratos, setContratos] = useState<ContratoBP[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionBP[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener datos de los 3 endpoints en paralelo
        const [procesosRes, contratosRes, asignacionesRes] = await Promise.all([
          fetch('/api/proxy/emprestito/obtener-procesos-bp'),
          fetch('/api/proxy/emprestito/obtener-contratos-bp'),
          fetch('/api/proxy/asignaciones-emprestito-banco-centro-gestor')
        ])

        if (!procesosRes.ok || !contratosRes.ok || !asignacionesRes.ok) {
          throw new Error('Error al obtener datos de empréstito BP')
        }

        const [procesosData, contratosData, asignacionesData] = await Promise.all([
          procesosRes.json(),
          contratosRes.json(),
          asignacionesRes.json()
        ])

        setProcesos(procesosData.data || [])
        setContratos(contratosData.data || [])
        setAsignaciones(asignacionesData.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        console.error('Error al cargar datos de empréstito BP:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return {
    procesos,
    contratos,
    asignaciones,
    loading,
    error
  }
}

// Hook para análisis agregado por BP - Optimizado con useMemo
export const useAnalisisPorBP = (
  procesos: ProcesoBP[],
  contratos: ContratoBP[],
  asignaciones: AsignacionBP[],
  filtroAnio?: number | 'all'
): AnalisisPorBP[] => {
  // Usar useMemo en lugar de useState + useEffect para evitar re-renders
  return useMemo(() => {
    if (!procesos.length && !contratos.length && !asignaciones.length) {
      return []
    }

    // Filtrar asignaciones por año si se especifica
    const asignacionesFiltradas = filtroAnio && filtroAnio !== 'all'
      ? asignaciones.filter(a => a.anio === filtroAnio)
      : asignaciones

    // Obtener todos los BPs únicos (de datos filtrados)
    const bpsSet = new Set<string>()
    procesos.forEach(p => bpsSet.add(p.bp))
    contratos.forEach(c => bpsSet.add(c.bp))
    asignacionesFiltradas.forEach(a => bpsSet.add(a.bp))

    const analisisPorBP: AnalisisPorBP[] = Array.from(bpsSet).map(bp => {
      // Filtrar datos por BP
      const procesosDelBP = procesos.filter(p => p.bp === bp)
      const contratosDelBP = contratos.filter(c => c.bp === bp)
      const asignacionesDelBP = asignacionesFiltradas.filter(a => a.bp === bp)

      // Calcular monto programado (suma de asignaciones)
      const montoProgramado = asignacionesDelBP.reduce((sum, a) => 
        sum + (a.monto_programado_banco || 0), 0
      )

      // Calcular monto adjudicado (suma de contratos)
      const montoAdjudicado = contratosDelBP.reduce((sum, c) => 
        sum + (c.valor_contrato || 0), 0
      )

      // Calcular brecha
      const brecha = montoProgramado - montoAdjudicado
      const porcentajeEjecucion = montoProgramado > 0 
        ? (montoAdjudicado / montoProgramado) * 100 
        : 0

      // Participación por bancos
      const montosPorBanco = new Map<string, number>()
      asignacionesDelBP.forEach(a => {
        const actual = montosPorBanco.get(a.banco) || 0
        montosPorBanco.set(a.banco, actual + (a.monto_programado_banco || 0))
      })

      const participacionBancos = Array.from(montosPorBanco.entries())
        .map(([banco, monto]) => ({
          banco,
          monto,
          porcentaje: montoProgramado > 0 ? (monto / montoProgramado) * 100 : 0
        }))
        .sort((a, b) => b.monto - a.monto)

      // Presupuesto por organismos
      const montosPorOrganismo = new Map<string, number>()
      asignacionesDelBP.forEach(a => {
        const actual = montosPorOrganismo.get(a.nombre_centro_gestor) || 0
        montosPorOrganismo.set(a.nombre_centro_gestor, actual + (a.monto_programado_banco || 0))
      })

      const presupuestoOrganismos = Array.from(montosPorOrganismo.entries())
        .map(([organismo, monto]) => ({
          organismo,
          monto,
          porcentaje: montoProgramado > 0 ? (monto / montoProgramado) * 100 : 0
        }))
        .sort((a, b) => b.monto - a.monto)

      // Obtener nombre del centro gestor (del primer registro)
      const nombreCentroGestor = asignacionesDelBP[0]?.nombre_centro_gestor || 
                                 contratosDelBP[0]?.nombre_centro_gestor || 
                                 procesosDelBP[0]?.nombre_centro_gestor || 
                                 'Sin información'

      return {
        bp,
        nombre_centro_gestor: nombreCentroGestor,
        monto_programado: montoProgramado,
        monto_adjudicado: montoAdjudicado,
        brecha,
        porcentaje_ejecucion: porcentajeEjecucion,
        participacion_bancos: participacionBancos,
        presupuesto_organismos: presupuestoOrganismos,
        procesos: procesosDelBP,
        contratos: contratosDelBP
      }
    })

    // Ordenar por monto programado descendente
    return analisisPorBP.sort((a, b) => 
      b.monto_programado - a.monto_programado
    )
  }, [procesos, contratos, asignaciones, filtroAnio])
}

// Hook para totales generales
export const useTotalesGenerales = (analisis: AnalisisPorBP[]) => {
  const totalProgramado = analisis.reduce((sum, a) => sum + a.monto_programado, 0)
  const totalAdjudicado = analisis.reduce((sum, a) => sum + a.monto_adjudicado, 0)
  const brechaTotal = totalProgramado - totalAdjudicado
  const porcentajeEjecucionTotal = totalProgramado > 0 
    ? (totalAdjudicado / totalProgramado) * 100 
    : 0

  return {
    totalProgramado,
    totalAdjudicado,
    brechaTotal,
    porcentajeEjecucionTotal,
    cantidadBPs: analisis.length
  }
}

// Tipo para pagos de empréstito (endpoint /pagos_emprestito_all)
export interface PagoEmprestitoBP {
  id: string
  bp: string
  numero_rpc: string
  valor_pago: number
  fecha_transaccion: string
  referencia_contrato: string
  nombre_centro_gestor: string
  estado: string
  tipo: string
  tiene_documentos_soporte: boolean
  documentos_s3: Array<{
    filename: string
    s3_url: string
    upload_date: string
    size: number
    bucket: string
    s3_key: string
    content_type: string
    success: boolean
  }>
  fecha_registro: string
  fecha_creacion: string
  fecha_actualizacion: string
}

// Tipo para pagos
export interface PagoBP {
  id: string
  bp: string
  numero_rpc: string
  valor_pago: number
  fecha_transaccion: string
  referencia_contrato: string
  nombre_centro_gestor: string
  estado: string
  tiene_documentos_soporte: boolean
  documentos_s3: Array<{
    filename: string
    s3_url: string
    upload_date: string
  }>
}

// Hook para obtener pagos de empréstito
export const useEmprestitoPagosAll = () => {
  const [pagos, setPagos] = useState<PagoEmprestitoBP[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          'https://gestorproyectoapi-production.up.railway.app/pagos_emprestito_all'
        )

        if (!response.ok) {
          throw new Error('Error al obtener pagos de empréstito')
        }

        const data = await response.json()
        setPagos(data.data || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setError(message)
        console.error('Error fetching pagos empréstito:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPagos()
  }, [])

  return { pagos, loading, error }
}

// Hook para obtener pagos (contratos_pagos_all)
export const useEmprestitoPagos = () => {
  const [pagos, setPagos] = useState<PagoBP[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          '/api/proxy/contratos_pagos_all'
        )

        if (!response.ok) {
          throw new Error('Error al obtener pagos')
        }

        const data = await response.json()
        setPagos(data.data || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setError(message)
        console.error('Error fetching pagos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPagos()
  }, [])

  return { pagos, loading, error }
}


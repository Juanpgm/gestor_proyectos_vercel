'use client'

import { useState, useEffect } from 'react'

export interface EmprestitoContrato {
  bpin: string
  centro_gestor?: string
  valor_contrato: number
  banco: string
  cdp?: string
  rpc?: string
  link_secop?: string
  fecha_publicacion_proceso?: string | null
  fecha_adjudicacion?: string | null
  observaciones?: string
  descripcion_bp?: string
  nombre_comercial?: string
}

export interface EmprestitoProyecto {
  bpin: string
  centro_gestor: string
  banco: string
  descripcion_bp: string
  nombre_comercial: string
  valor_contrato?: number
}

export interface EmprestitoDimension {
  bpin: number
  centro_gestor: string
  banco: string
  bp: string
  descripcion_bp: string
  nombre_comercial: string
  proyectos_contratos: string
  valor_contrato: number
  tipo_contratacion: string
  pliego_tipo: string | null
  vig_futura: string
  deleg: string
  fecha_inicio: number
  fecha_terminacion: number
  numero_contrato: string | null
  cdp: string | null
  rpc: string | null
  link_secop: string | null
  fecha_publicacion_proceso: number
  fecha_adjudicacion: number
  observaciones: string
}

export interface EmprestitoFact {
  [bpin: string]: {
    [periodo: string]: {
      desembolso: number
      avance: number
      desembolso_real: number
      avance_real: number
    }
  }
}

export interface EmprestitoData {
  contratos: EmprestitoContrato[]
  proyectos: EmprestitoProyecto[]
  dimensiones: EmprestitoDimension[]
  hechos: EmprestitoFact
}

export interface EmprestitoState {
  data: EmprestitoData
  loading: boolean
  error: string | null
}

export const useEmprestito = (): EmprestitoState => {
  const [state, setState] = useState<EmprestitoState>({
    data: {
      contratos: [],
      proyectos: [],
      dimensiones: [],
      hechos: {}
    },
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        // Cargar archivos que realmente existen
        const [dimensionesRes, hechosRes] = await Promise.all([
          fetch('/data/emprestito/foundational_dims.json'),
          fetch('/data/emprestito/foundational_facts.json')
        ])

        // Verificar que las respuestas sean exitosas
        if (!dimensionesRes.ok || !hechosRes.ok) {
          throw new Error('Error al cargar archivos de empréstito')
        }

        // Parsear los datos
        const [dimensiones, hechos] = await Promise.all([
          dimensionesRes.json(),
          hechosRes.json()
        ])

        // Transformar dimensiones en contratos y proyectos
        const contratos: EmprestitoContrato[] = dimensiones.map((dim: EmprestitoDimension) => ({
          bpin: dim.bpin.toString(),
          centro_gestor: dim.centro_gestor,
          valor_contrato: dim.valor_contrato || 0,
          banco: dim.banco,
          cdp: dim.cdp,
          rpc: dim.rpc,
          link_secop: dim.link_secop,
          fecha_publicacion_proceso: dim.fecha_publicacion_proceso ? new Date(dim.fecha_publicacion_proceso).toISOString() : null,
          fecha_adjudicacion: dim.fecha_adjudicacion ? new Date(dim.fecha_adjudicacion).toISOString() : null,
          observaciones: dim.observaciones,
          descripcion_bp: dim.descripcion_bp,
          nombre_comercial: dim.nombre_comercial
        }))

        const proyectos: EmprestitoProyecto[] = dimensiones.map((dim: EmprestitoDimension) => ({
          bpin: dim.bpin.toString(),
          centro_gestor: dim.centro_gestor,
          banco: dim.banco,
          descripcion_bp: dim.descripcion_bp,
          nombre_comercial: dim.nombre_comercial,
          valor_contrato: dim.valor_contrato
        }))

        setState({
          data: {
            contratos,
            proyectos,
            dimensiones,
            hechos
          },
          loading: false,
          error: null
        })

        console.log('✅ Datos de empréstito cargados:', {
          contratos: contratos.length,
          proyectos: proyectos.length,
          dimensiones: dimensiones.length,
          hechos: Object.keys(hechos).length
        })

      } catch (error) {
        console.error('❌ Error cargando datos de empréstito:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      }
    }

    fetchData()
  }, [])

  return state
}

// Hook para métricas derivadas
export const useEmprestitoMetrics = (data: EmprestitoData) => {
  return {
    totalProyectos: data.proyectos.length,
    totalContratos: data.contratos.length,
    bancos: Array.from(new Set(data.proyectos.map(p => p.banco))),
    centrosGestor: Array.from(new Set(data.proyectos.map(p => p.centro_gestor))),
    valorTotalContratos: data.contratos.reduce((sum, c) => sum + c.valor_contrato, 0),
    contratosPorBanco: data.contratos.reduce((acc, contrato) => {
      acc[contrato.banco] = (acc[contrato.banco] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    valorPorBanco: data.contratos.reduce((acc, contrato) => {
      acc[contrato.banco] = (acc[contrato.banco] || 0) + contrato.valor_contrato
      return acc
    }, {} as Record<string, number>),
    proyectosPorCentroGestor: data.proyectos.reduce((acc, proyecto) => {
      acc[proyecto.centro_gestor] = (acc[proyecto.centro_gestor] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

'use client'

import { useState, useEffect } from 'react'

export interface EmprestitoContrato {
  bpin: string
  bp: string
  centro_gestor: string
  valor_contrato: number
  banco: string
  cdp: string
  rpc: string
  link_secop: string
  fecha_publicacion_proceso: string | null
  fecha_adjudicacion: string | null
  observaciones: string
}

export interface EmprestitoProyecto {
  bpin: string
  bp: string
  centro_gestor: string
  descripcion_bp: string
  nombre_comercial: string
  banco: string
}

export interface EmprestitoDimension {
  bpin: string
  centro_gestor: string
  banco: string
  bp: string
  descripcion_bp: string
  nombre_comercial: string
  proyectos_contratos: string
  valor_contrato: number
  tipo_contratacion: string
  pliego_tipo: string
  vig_futura: string
  deleg: string
  fecha_inicio: string
  fecha_terminacion: string
  cod_contrato: string
  cdp: string
  rpc: string
  link_secop: string
  fecha_publicacion_proceso: string
  fecha_adjudicacion: string
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

        // Cargar todos los archivos en paralelo
        const [contratosRes, proyectosRes, dimensionesRes, hechosRes] = await Promise.all([
          fetch('/data/emprestito/emp_contratos.json'),
          fetch('/data/emprestito/emp_proyectos.json'),
          fetch('/data/emprestito/foundational_dims.json'),
          fetch('/data/emprestito/foundational_facts.json')
        ])

        // Verificar que todas las respuestas sean exitosas
        if (!contratosRes.ok || !proyectosRes.ok || !dimensionesRes.ok || !hechosRes.ok) {
          throw new Error('Error al cargar uno o más archivos de empréstito')
        }

        // Parsear los datos
        const [contratos, proyectos, dimensiones, hechos] = await Promise.all([
          contratosRes.json(),
          proyectosRes.json(),
          dimensionesRes.json(),
          hechosRes.json()
        ])

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

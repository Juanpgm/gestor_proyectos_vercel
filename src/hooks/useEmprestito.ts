'use client'

import { useState, useEffect } from 'react'

export interface EmprestitoContrato {
  nombre_entidad: string;
  sector: string;
  entidad_centralizada: string;
  proceso_compra: string;
  id_contrato: string;
  referencia_contrato: string;
  estado_contrato: string;
  codigo_categoria_principal: string;
  descripcion_proceso: string;
  tipo_contrato: string;
  modalidad_contratacion: string;
  justificacion_modalidad_contratacion: string;
  fecha_firma: string;
  fecha_inicio_contrato: string;
  fecha_fin_contrato: string;
  fecha_inicio_ejecucion: string;
  fecha_fin_ejecucion: string;
  tipodocproveedor: string;
  documento_proveedor: string;
  proveedor_adjudicado: string;
  es_grupo: string;
  es_pyme: string;
  habilita_pago_adelantado: string;
  liquidación: string;
  obligación_ambiental: string;
  obligaciones_postconsumo: string;
  reversion: string;
  origen_recursos: string;
  destino_gasto: string;
  valor_contrato: number;
  valor_pago_adelantado: number;
  valor_facturado: number;
  valor_pendiente_pago: number;
  valor_pagado: number;
  valor_amortizado: number;
  valor_pendiente_amortizacion: number;
  valor_pendiente_ejecucion: number;
  estado_bpin: string;
  bpin: string;
  anno_bpin: number;
  saldo_cdp: number;
  saldo_vigencia: number;
  espostconflicto: string;
  dias_adicionados: number;
  puntos_acuerdo: string;
  pilares_acuerdo: string;
  urlproceso: string;
  objeto_contrato: string;
  duración_contrato: number;
}

export interface EmprestitoProyecto {
  bpin: string;
  bp: string;
  nombre_proyecto: string;
  nombre_actividad: string;
  programa_presupuestal: string;
  nombre_centro_gestor: string;
  nombre_area_funcional: string;
  nombre_fondo: string;
  clasificacion_fondo: string;
  nombre_pospre: string;
  nombre_dimension: string;
  nombre_linea_estrategica: string;
  nombre_programa: string;
  comuna: string;
  origen: string;
  anio: number;
  tipo_gasto: string;
  cod_sector: string;
  cod_producto: string;
  validador_cuipo: string;
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

        // Cargar los nuevos archivos de empréstito
        const [proyectosRes, contratosRes, dimensionesRes] = await Promise.all([
          fetch('/data/emprestito/emp_proyectos.json'),
          fetch('/data/emprestito/emp_contratos.json'),
          fetch('/data/emprestito/emp_foundational_dims.json')
        ])

        // Verificar que las respuestas sean exitosas
        if (!proyectosRes.ok || !contratosRes.ok || !dimensionesRes.ok) {
          throw new Error('Error al cargar archivos de empréstito')
        }

        // Parsear los datos
        const [proyectosData, contratosData, dimensionesData] = await Promise.all([
          proyectosRes.json(),
          contratosRes.json(),
          dimensionesRes.json()
        ])

        // Transformar los datos en el formato esperado
        const contratos: EmprestitoContrato[] = contratosData.map((contrato: any) => ({
          bpin: contrato.bpin.toString(),
          centro_gestor: contrato.nombre_entidad || 'No especificado',
          valor_contrato: contrato.valor_contrato || 0,
          banco: 'Banco empréstito', // Valor por defecto ya que no está en los datos
          cdp: contrato.referencia_contrato || '',
          rpc: contrato.id_contrato || '',
          link_secop: contrato.urlproceso || '',
          fecha_publicacion_proceso: contrato.fecha_firma || null,
          fecha_adjudicacion: contrato.fecha_firma || null,
          observaciones: contrato.descripcion_proceso || '',
          descripcion_bp: contrato.objeto_contrato || '',
          nombre_comercial: contrato.proveedor_adjudicado || ''
        }))

        const proyectos: EmprestitoProyecto[] = proyectosData.map((proyecto: any) => ({
          bpin: proyecto.bpin.toString(),
          centro_gestor: proyecto.nombre_centro_gestor || 'No especificado',
          banco: 'Banco empréstito',
          descripcion_bp: proyecto.descripcion_proyecto || proyecto.nombre_programa || '',
          nombre_comercial: proyecto.nombre_proyecto || '',
          valor_contrato: proyecto.valor_actual || proyecto.valor_inicial || 0
        }))

        setState({
          data: {
            contratos,
            proyectos,
            dimensiones: dimensionesData.data || [],
            hechos: {}
          },
          loading: false,
          error: null
        })

        console.log('✅ Datos de empréstito cargados:', {
          contratos: contratos.length,
          proyectos: proyectos.length,
          dimensiones: dimensionesData.data?.length || 0
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
    centrosGestor: Array.from(new Set(data.proyectos.map(p => p.nombre_centro_gestor))),
    entidades: Array.from(new Set(data.contratos.map(c => c.nombre_entidad))),
    valorTotalContratos: data.contratos.reduce((sum, c) => sum + (c.valor_contrato || 0), 0),
    contratosPorEntidad: data.contratos.reduce((acc, contrato) => {
      acc[contrato.nombre_entidad] = (acc[contrato.nombre_entidad] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    valorPorEntidad: data.contratos.reduce((acc, contrato) => {
      acc[contrato.nombre_entidad] = (acc[contrato.nombre_entidad] || 0) + (contrato.valor_contrato || 0)
      return acc
    }, {} as Record<string, number>),
    proyectosPorCentroGestor: data.proyectos.reduce((acc, proyecto) => {
      acc[proyecto.nombre_centro_gestor] = (acc[proyecto.nombre_centro_gestor] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    contratosPorEstado: data.contratos.reduce((acc, contrato) => {
      acc[contrato.estado_contrato] = (acc[contrato.estado_contrato] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    contratosPorTipo: data.contratos.reduce((acc, contrato) => {
      acc[contrato.tipo_contrato] = (acc[contrato.tipo_contrato] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    valorEjecutado: data.contratos.reduce((sum, c) => sum + (c.valor_pagado || 0), 0),
    valorPendiente: data.contratos.reduce((sum, c) => sum + (c.valor_pendiente_ejecucion || 0), 0)
  }
}

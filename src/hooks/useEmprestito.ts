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

        // Cargar solo el archivo disponible de empréstito
        const proyectosRes = await fetch('/data/emprestito/emp_proyectos.json')

        // Verificar que la respuesta sea exitosa
        if (!proyectosRes.ok) {
          throw new Error('Error al cargar archivo de proyectos de empréstito')
        }

        // Parsear los datos
        const proyectosData = await proyectosRes.json()

        // Transformar los datos en el formato esperado
        const proyectos: EmprestitoProyecto[] = proyectosData.map((proyecto: any) => ({
          bpin: proyecto.bpin?.toString() || '',
          bp: proyecto.bp?.toString() || '',
          nombre_proyecto: proyecto.nombre_proyecto || '',
          nombre_actividad: proyecto.nombre_actividad || '',
          programa_presupuestal: proyecto.programa_presupuestal || '',
          nombre_centro_gestor: proyecto.nombre_centro_gestor || 'No especificado',
          nombre_area_funcional: proyecto.nombre_area_funcional || '',
          nombre_fondo: proyecto.nombre_fondo || '',
          clasificacion_fondo: proyecto.clasificacion_fondo || '',
          nombre_pospre: proyecto.nombre_pospre || '',
          nombre_dimension: proyecto.nombre_dimension || '',
          nombre_linea_estrategica: proyecto.nombre_linea_estrategica || '',
          nombre_programa: proyecto.nombre_programa || '',
          comuna: proyecto.comuna || '',
          origen: proyecto.origen || '',
          anio: proyecto.anio || new Date().getFullYear(),
          tipo_gasto: proyecto.tipo_gasto || '',
          cod_sector: proyecto.cod_sector || '',
          cod_producto: proyecto.cod_producto || '',
          validador_cuipo: proyecto.validador_cuipo || ''
        }))

        // Generar contratos sintéticos basados en los proyectos para mantener compatibilidad
        const contratos: EmprestitoContrato[] = proyectos.map((proyecto, index) => ({
          nombre_entidad: proyecto.nombre_centro_gestor,
          sector: proyecto.cod_sector || 'No especificado',
          entidad_centralizada: 'Si',
          proceso_compra: `PROCESO-${proyecto.bpin}`,
          id_contrato: `CONT-${proyecto.bpin}-${index + 1}`,
          referencia_contrato: `REF-${proyecto.bpin}`,
          estado_contrato: 'En Ejecución',
          codigo_categoria_principal: proyecto.cod_producto || '',
          descripcion_proceso: proyecto.nombre_proyecto || '',
          tipo_contrato: 'Contrato de Obra',
          modalidad_contratacion: 'Licitación Pública',
          justificacion_modalidad_contratacion: '',
          fecha_firma: '2024-01-01',
          fecha_inicio_contrato: '2024-01-01',
          fecha_fin_contrato: '2024-12-31',
          fecha_inicio_ejecucion: '2024-01-01',
          fecha_fin_ejecucion: '2024-12-31',
          tipodocproveedor: 'NIT',
          documento_proveedor: '900000000',
          proveedor_adjudicado: 'Contratista Adjudicado',
          es_grupo: 'No',
          es_pyme: 'No',
          habilita_pago_adelantado: 'No',
          liquidación: 'No',
          obligación_ambiental: 'No',
          obligaciones_postconsumo: 'No',
          reversion: 'No',
          origen_recursos: proyecto.nombre_fondo || 'Empréstito',
          destino_gasto: 'Inversión',
          valor_contrato: 1000000000, // Valor por defecto
          valor_pago_adelantado: 0,
          valor_facturado: 500000000,
          valor_pendiente_pago: 100000000,
          valor_pagado: 400000000,
          valor_amortizado: 0,
          valor_pendiente_amortizacion: 0,
          valor_pendiente_ejecucion: 500000000,
          estado_bpin: 'Aprobado',
          bpin: proyecto.bpin,
          anno_bpin: proyecto.anio,
          saldo_cdp: 500000000,
          saldo_vigencia: 500000000,
          espostconflicto: 'No',
          dias_adicionados: 0,
          puntos_acuerdo: '',
          pilares_acuerdo: '',
          urlproceso: '',
          objeto_contrato: proyecto.nombre_proyecto || '',
          duración_contrato: 365
        }))

        setState({
          data: {
            contratos,
            proyectos,
            dimensiones: [], // Array vacío ya que no tenemos este archivo
            hechos: {} // Objeto vacío ya que no tenemos este archivo
          },
          loading: false,
          error: null
        })

        console.log('✅ Datos de empréstito cargados:', {
          proyectos: proyectos.length,
          contratos: contratos.length,
          dimensiones: 0
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

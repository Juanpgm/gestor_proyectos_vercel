'use client'

import { useState, useEffect } from 'react'

export interface EmprestitoContrato {
  nombre_entidad: string;
  nit_entidad: string;
  departamento: string;
  ciudad: string;
  localizaci_n: string;
  orden: string;
  sector: string;
  rama: string;
  entidad_centralizada: string;
  proceso_de_compra: string;
  id_contrato: string;
  referencia_del_contrato: string;
  estado_contrato: string;
  codigo_de_categoria_principal: string;
  descripcion_del_proceso: string;
  tipo_de_contrato: string;
  modalidad_de_contratacion: string;
  justificacion_modalidad_de: string;
  fecha_de_firma: string;
  fecha_de_fin_del_contrato: string;
  condiciones_de_entrega: string;
  tipodocproveedor: string;
  documento_proveedor: string;
  proveedor_adjudicado: string;
  es_grupo: string;
  es_pyme: string;
  habilita_pago_adelantado: string;
  liquidaci_n: string;
  obligaci_n_ambiental: string;
  obligaciones_postconsumo: string;
  reversion: string;
  origen_de_los_recursos: string;
  destino_gasto: string;
  valor_del_contrato: number;
  valor_de_pago_adelantado: number;
  valor_facturado: number;
  valor_pendiente_de_pago: number;
  valor_pagado: number;
  valor_amortizado: number;
  valor_pendiente_de: number;
  valor_pendiente_de_ejecucion: number;
  estado_bpin: string;
  anno_bpin: string;
  saldo_cdp: string;
  saldo_vigencia: string;
  espostconflicto: string;
  dias_adicionados: string;
  puntos_del_acuerdo: string;
  pilares_del_acuerdo: string;
  urlproceso: {
    url: string;
  };
  nombre_representante_legal: string;
  nacionalidad_representante_legal: string;
  domicilio_representante_legal: string;
  tipo_de_identificaci_n_representante_legal: string;
  identificaci_n_representante_legal: string;
  g_nero_representante_legal: string;
  presupuesto_general_de_la_nacion_pgn: string;
  sistema_general_de_participaciones: string;
  sistema_general_de_regal_as: string;
  recursos_propios_alcald_as_gobernaciones_y_resguardos_ind_genas_: string;
  recursos_de_credito: string;
  recursos_propios: string;
  codigo_entidad: string;
  codigo_proveedor: string;
  fecha_inicio_liquidacion: string;
  fecha_fin_liquidacion: string;
  objeto_del_contrato: string;
  duraci_n_del_contrato: string;
  nombre_del_banco: string;
  banco: string; // Campo agregado para almacenar el banco de forma directa
  tipo_de_cuenta: string;
  n_mero_de_cuenta: string;
  el_contrato_puede_ser_prorrogado: string;
  nombre_ordenador_del_gasto: string;
  tipo_de_documento_ordenador_del_gasto: string;
  n_mero_de_documento_ordenador_del_gasto: string;
  nombre_supervisor: string;
  tipo_de_documento_supervisor: string;
  n_mero_de_documento_supervisor: string;
  nombre_ordenador_de_pago: string;
  tipo_de_documento_ordenador_de_pago: string;
  n_mero_de_documento_ordenador_de_pago: string;
  _dataset_source: string;
  _search_field: string;
  _referencia_buscada: string;
  _search_type: string;
  _total_campos: number;
  bpin: string | null;
  _registro_origen: {
    banco: string;
    id_origen: number;
    referencia_proceso: string;
    fecha_extraccion: string;
    multiple_refs: boolean;
    refs_originales: string;
    referencia_original: string;
  };
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

        // Cargar contratos directamente desde emp_contratos.json
        const contratosRes = await fetch('/data/emprestito/emp_contratos.json')
        
        // Verificar que la respuesta sea exitosa
        if (!contratosRes.ok) {
          throw new Error('Error al cargar archivo de contratos de empréstito')
        }

        // Parsear los datos
        let contratosData
        try {
          contratosData = await contratosRes.json()
        } catch (jsonError) {
          throw new Error(`Error al parsear JSON: ${jsonError instanceof Error ? jsonError.message : 'JSON inválido'}`)
        }
        
        // Los contratos pueden venir como array directo o envueltos en contratos_encontrados
        const contratosArray = contratosData.contratos_encontrados || (Array.isArray(contratosData) ? contratosData : [])
        const contratos: EmprestitoContrato[] = contratosArray.map((contrato: any) => {
          const banco = contrato.registro_origen?.banco || contrato._registro_origen?.banco || contrato.banco || contrato.nombre_del_banco || 'No definido'
          return {
            ...contrato,
            // Asegurar que el campo banco esté disponible directamente
            banco: banco
          }
        })

        // Generar proyectos sintéticos basados en los contratos para mantener compatibilidad
        const proyectos: EmprestitoProyecto[] = contratos.map((contrato, index) => ({
          bpin: contrato.bpin || contrato.id_contrato,
          bp: contrato.id_contrato || '',
          nombre_proyecto: contrato.objeto_del_contrato || contrato.descripcion_del_proceso || '',
          nombre_actividad: contrato.descripcion_del_proceso || '',
          programa_presupuestal: '',
          nombre_centro_gestor: contrato.nombre_entidad || 'No especificado',
          nombre_area_funcional: contrato.sector || '',
          nombre_fondo: 'Empréstito',
          clasificacion_fondo: 'Empréstito',
          nombre_pospre: '',
          nombre_dimension: contrato._registro_origen?.banco || 'Bancolombia',
          nombre_linea_estrategica: '',
          nombre_programa: '',
          comuna: contrato.ciudad || '',
          origen: contrato.origen_de_los_recursos || 'Empréstito',
          anio: parseInt(contrato.anno_bpin) || new Date().getFullYear(),
          tipo_gasto: contrato.destino_gasto || '',
          cod_sector: contrato.sector || '',
          cod_producto: contrato.codigo_de_categoria_principal || '',
          validador_cuipo: ''
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

        console.log('✅ Datos de empréstito cargados desde emp_contratos.json:', {
          contratos: contratos.length,
          proyectos: proyectos.length,
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
    valorTotalContratos: data.contratos.reduce((sum, c) => sum + (c.valor_del_contrato || 0), 0),
    contratosPorEntidad: data.contratos.reduce((acc, contrato) => {
      acc[contrato.nombre_entidad] = (acc[contrato.nombre_entidad] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    valorPorEntidad: data.contratos.reduce((acc, contrato) => {
      acc[contrato.nombre_entidad] = (acc[contrato.nombre_entidad] || 0) + (contrato.valor_del_contrato || 0)
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
      acc[contrato.tipo_de_contrato] = (acc[contrato.tipo_de_contrato] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    valorEjecutado: data.contratos.reduce((sum, c) => sum + (c.valor_pagado || 0), 0),
    valorPendiente: data.contratos.reduce((sum, c) => sum + (c.valor_pendiente_de_ejecucion || 0), 0)
  }
}

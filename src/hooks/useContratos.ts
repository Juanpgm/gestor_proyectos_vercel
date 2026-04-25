'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getCentroGestorAccessFromSession,
  buildAllowedBpinsSet,
  filterByAllowedBpins,
  toBpinKey
} from '@/utils/centroGestorAccess'

// Interfaces para los datos de contratos
export interface Contrato {
  nombre_entidad: string
  sector: string
  entidad_centralizada: string
  proceso_compra: string
  id_contrato: string
  referencia_contrato: string
  estado_contrato: string
  codigo_categoria_principal: string
  descripcion_proceso: string
  tipo_contrato: string
  modalidad_contratacion: string
  justificacion_modalidad_contratacion: string
  fecha_firma: string | null
  fecha_inicio_contrato: string | null
  fecha_fin_contrato: string | null
  fecha_inicio_ejecucion: string | null
  fecha_fin_ejecucion: string | null
  fecha_inicio_liquidacion?: string | null
  fecha_fin_liquidacion?: string | null
  tipodocproveedor: string
  documento_proveedor: string
  proveedor_adjudicado: string
  es_grupo: string
  es_pyme: string
  habilita_pago_adelantado: number
  liquidación: string
  obligación_ambiental: string
  obligaciones_postconsumo: string
  reversion: string
  origen_recursos: string
  destino_gasto: string
  valor_contrato: number
  valor_pago_adelantado: number
  valor_facturado: number
  valor_pendiente_pago: number
  valor_pagado: number
  valor_amortizado: number
  valor_pendiente_amortizacion: number
  valor_pendiente_ejecucion: number
  estado_bpin: string
  bpin: number
  anno_bpin: string
  saldo_cdp: number
  saldo_vigencia: number
  espostconflicto: string
  dias_adicionados: string
  puntos_acuerdo: string
  pilares_acuerdo: string
  urlproceso: string
  nombre_representante_legal: string
  nacionalidad_representante_legal: string
}

export interface ContratoIndex {
  bpin: number
  total_contratos: number
  contratos: {
    referencia_contrato: string
    proceso_compra: string
    id_contrato: string
    urlproceso: string
  }[]
}

export interface ContratosData {
  contratos: Contrato[]
  index: Record<string, ContratoIndex>
}

export interface ContratosMetrics {
  totalContratos: number
  totalValorContratos: number
  contratosPorEstado: Record<string, number>
  contratosPorSector: Record<string, number>
  contratosPorTipo: Record<string, number>
  contratosPorModalidad: Record<string, number>
  contratosConPagoAdelantado: number
  valorPromedio: number
  valorMediano: number
  valorPendientePago: number
  valorPagado: number
  valorPendienteEjecucion: number
  contratosPorMes: Record<string, number>
  entidades: string[]
  proveedores: string[]
  sectores: string[]
  contratosLiquidados: number
  contratosModificados: number
}

interface ContratosState {
  data: ContratosData
  loading: boolean
  error: string | null
  metrics: ContratosMetrics
}

const initialMetrics: ContratosMetrics = {
  totalContratos: 0,
  totalValorContratos: 0,
  contratosPorEstado: {},
  contratosPorSector: {},
  contratosPorTipo: {},
  contratosPorModalidad: {},
  contratosConPagoAdelantado: 0,
  valorPromedio: 0,
  valorMediano: 0,
  valorPendientePago: 0,
  valorPagado: 0,
  valorPendienteEjecucion: 0,
  contratosPorMes: {},
  entidades: [],
  proveedores: [],
  sectores: [],
  contratosLiquidados: 0,
  contratosModificados: 0,
}

export function useContratos() {
  const [state, setState] = useState<ContratosState>({
    data: { contratos: [], index: {} },
    loading: true,
    error: null,
    metrics: initialMetrics
  })

  useEffect(() => {
    const loadContratosData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        // Cargar los datos de contratos y el índice en paralelo
        const [contratosResponse, indexResponse] = await Promise.all([
          fetch('/data/contratos/contratos_proyectos.json'),
          fetch('/data/contratos/contratos_proyectos_index.json')
        ])

        if (!contratosResponse.ok || !indexResponse.ok) {
          throw new Error('Error al cargar los datos de contratos')
        }

        const [contratosData, indexData] = await Promise.all([
          contratosResponse.json(),
          indexResponse.json()
        ])

        const contratosTyped = (contratosData || []) as Contrato[]
        const indexTyped = (indexData || {}) as Record<string, ContratoIndex>

        const centroGestorAccess = getCentroGestorAccessFromSession()
        const proyectosResponse = await fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json')
        const proyectosData = proyectosResponse.ok ? await proyectosResponse.json() : []
        const allowedBpins = buildAllowedBpinsSet(
          proyectosData || [],
          centroGestorAccess,
          ['nombre_centro_gestor', 'responsible', 'centro_gestor']
        )

        const contratosFiltrados = filterByAllowedBpins(contratosTyped, allowedBpins)

        const indexFiltrado = allowedBpins
          ? Object.entries(indexTyped).reduce((acc, [key, value]) => {
              const bpinValue = toBpinKey(value?.bpin ?? key)
              if (bpinValue && allowedBpins?.has(bpinValue)) {
                acc[key] = value
              }
              return acc
            }, {} as Record<string, ContratoIndex>)
          : indexTyped

        const data: ContratosData = {
          contratos: contratosFiltrados,
          index: indexFiltrado
        }

        // Calcular métricas
        const metrics = calculateMetrics(data.contratos)

        setState({
          data,
          loading: false,
          error: null,
          metrics
        })

      } catch (error) {
        console.error('Error cargando datos de contratos:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      }
    }

    loadContratosData()
  }, [])

  return state
}

// Función para calcular métricas de contratos
function calculateMetrics(contratos: Contrato[]): ContratosMetrics {
  if (contratos.length === 0) return initialMetrics

  // Filtrar datos problemáticos: valores pendientes irrealmente altos
  const contratosLimpios = contratos.filter(c => {
    // Excluir contratos con valores pendientes que excedan 10 veces el valor del contrato
    // o que tengan valores pendientes mayores a 1 billón (indicativo de error de datos)
    const valorContrato = c.valor_contrato || 0
    const valorPendiente = c.valor_pendiente_pago || 0
    
    if (valorPendiente > 1e12) return false // Mayor a 1 billón = error de datos
    if (valorContrato > 0 && valorPendiente > valorContrato * 10) return false // 10x valor contrato = sospechoso
    
    return true
  })

  // Contadores básicos usando datos limpios
  const totalContratos = contratos.length // Mantener total original para conteo
  const totalValorContratos = contratosLimpios.reduce((sum, c) => sum + (c.valor_contrato || 0), 0)
  const valorPendientePago = contratosLimpios.reduce((sum, c) => sum + (c.valor_pendiente_pago || 0), 0)
  const valorPagado = contratosLimpios.reduce((sum, c) => sum + (c.valor_pagado || 0), 0)
  const valorPendienteEjecucion = contratosLimpios.reduce((sum, c) => sum + (c.valor_pendiente_ejecucion || 0), 0)

  // Agrupaciones por categorías
  const contratosPorEstado = contratos.reduce((acc, c) => {
    const estado = c.estado_contrato || 'Sin Estado'
    acc[estado] = (acc[estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const contratosPorSector = contratos.reduce((acc, c) => {
    const sector = c.sector || 'Sin Sector'
    acc[sector] = (acc[sector] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const contratosPorTipo = contratos.reduce((acc, c) => {
    const tipo = c.tipo_contrato || 'Sin Tipo'
    acc[tipo] = (acc[tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const contratosPorModalidad = contratos.reduce((acc, c) => {
    const modalidad = c.modalidad_contratacion || 'Sin Modalidad'
    acc[modalidad] = (acc[modalidad] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Contratos por mes basado en fecha de firma
  const contratosPorMes = contratos.reduce((acc, c) => {
    if (c.fecha_firma) {
      const fecha = new Date(c.fecha_firma)
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      acc[mes] = (acc[mes] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Métricas específicas (solo las que se mantienen)
  const contratosConPagoAdelantado = contratos.filter(c => c.habilita_pago_adelantado > 0).length
  
  // Valores estadísticos
  const valores = contratos.map(c => c.valor_contrato || 0).filter(v => v > 0).sort((a, b) => a - b)
  const valorPromedio = valores.length > 0 ? valores.reduce((sum, v) => sum + v, 0) / valores.length : 0
  const valorMediano = valores.length > 0 ? valores[Math.floor(valores.length / 2)] : 0

  // Listas únicas
  const entidades = Array.from(new Set(contratos.map(c => c.nombre_entidad).filter(Boolean)))
  const proveedores = Array.from(new Set(contratos.map(c => c.proveedor_adjudicado).filter(Boolean)))
  const sectores = Array.from(new Set(contratos.map(c => c.sector).filter(Boolean)))

  // Estados específicos con lógica mejorada
  const contratosModificados = contratos.filter(c => 
    c.estado_contrato === 'Modificado'
  ).length

  // Contratos liquidados basados en fecha de liquidación actual
  const fechaActual = new Date()
  const contratosLiquidados = contratos.filter(c => {
    // Si tiene fecha_fin_liquidacion y es anterior a hoy
    if (c.fecha_fin_liquidacion) {
      const fechaLiquidacion = new Date(c.fecha_fin_liquidacion)
      return fechaLiquidacion <= fechaActual
    }
    // Si no tiene fecha pero el estado es "Liquidado"
    return c.estado_contrato === 'Liquidado' || c.liquidación === 'Sí'
  }).length

  return {
    totalContratos,
    totalValorContratos,
    contratosPorEstado,
    contratosPorSector,
    contratosPorTipo,
    contratosPorModalidad,
    contratosConPagoAdelantado,
    valorPromedio,
    valorMediano,
    valorPendientePago,
    valorPagado,
    valorPendienteEjecucion,
    contratosPorMes,
    entidades,
    proveedores,
    sectores,
    contratosLiquidados,
    contratosModificados,
  }
}

// Hook para métricas filtradas
export function useContratosMetrics(contratos: Contrato[]) {
  return useMemo(() => calculateMetrics(contratos), [contratos])
}

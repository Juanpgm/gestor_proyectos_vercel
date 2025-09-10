'use client'

import { useState, useEffect } from 'react'

export interface ContratoCompleto {
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
  fecha_firma: string
  fecha_inicio_contrato: string
  fecha_fin_contrato: string
  fecha_inicio_ejecucion: string
  fecha_fin_ejecucion: string
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
  objeto_contrato: string
  duración_contrato: string
  nombre_banco: string
  tipo_cuenta: string
  número_cuenta: string
  contrato_puede_ser_prorrogado: string
  fecha_notificación_prorrogación: string
  nombre_ordenador_gasto: string
  tipo_documento_ordenador_gasto: string
  número_documento_ordenador_gasto: string
  nombre_supervisor: string
  tipo_documento_supervisor: string
  número_documento_supervisor: string
  nombre_ordenador_pago: string | number
  tipo_documento_ordenador_pago: string | number
  número_documento_ordenador_pago: string | number
}

export const useContratosCompletos = () => {
  const [contratos, setContratos] = useState<ContratoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContratos = async () => {
      try {
        setLoading(true)
        console.log('🔄 Cargando contratos completos...')
        
        const response = await fetch('/data/contratos/contratos_proyectos.json')
        
        if (!response.ok) {
          throw new Error(`Error al cargar contratos: ${response.status}`)
        }

        const data: ContratoCompleto[] = await response.json()
        
        // Filtrar contratos válidos (que tengan BPIN y no sean solo número_documento_ordenador_pago)
        const contratosValidos = data.filter(contrato => 
          contrato && 
          contrato.bpin && 
          contrato.bpin > 0 &&
          contrato.referencia_contrato &&
          contrato.referencia_contrato.trim() !== ''
        )
        
        console.log('✅ Contratos completos cargados:', {
          total: data.length,
          validos: contratosValidos.length,
          conReferencia: contratosValidos.filter(c => c.referencia_contrato).length,
          conObjeto: contratosValidos.filter(c => c.objeto_contrato).length
        })
        
        setContratos(contratosValidos)
        setError(null)
      } catch (err) {
        console.error('❌ Error cargando contratos completos:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setContratos([])
      } finally {
        setLoading(false)
      }
    }

    loadContratos()
  }, [])

  return {
    contratos,
    loading,
    error
  }
}

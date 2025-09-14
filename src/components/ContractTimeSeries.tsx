'use client'

import React from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ContractTimeSeriesProps {
  contrato: any
}

const ContractTimeSeries: React.FC<ContractTimeSeriesProps> = ({ contrato }) => {
  // Procesar datos del contrato específico para crear serie temporal
  const timeSeriesData = React.useMemo(() => {
    if (!contrato) return []

    const fechaInicio = contrato.fecha_de_inicio ? new Date(contrato.fecha_de_inicio) : null
    const fechaFinalizacion = contrato.fecha_de_finalizacion ? new Date(contrato.fecha_de_finalizacion) : null
    
    if (!fechaInicio || !fechaFinalizacion) return []

    const data = []
    const valorContrato = contrato.valor_del_contrato || 0
    const valorFacturado = contrato.valor_facturado || 0
    const valorPagado = contrato.valor_pagado || 0
    
    // Crear puntos de datos desde inicio hasta fin del contrato
    const duracionMeses = Math.ceil((fechaFinalizacion.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const mesesAMostrar = Math.min(duracionMeses, 12) // Máximo 12 puntos
    
    for (let i = 0; i <= mesesAMostrar; i++) {
      const fecha = new Date(fechaInicio)
      fecha.setMonth(fecha.getMonth() + i)
      
      const progreso = i / mesesAMostrar
      const valorAcumulado = valorContrato
      const facturadoProgresivo = valorFacturado * progreso
      const pagadoProgresivo = valorPagado * progreso
      
      data.push({
        periodo: fecha.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
        valorContrato: valorAcumulado,
        valorFacturado: facturadoProgresivo,
        valorPagado: pagadoProgresivo,
        ejecucion: (facturadoProgresivo / valorAcumulado) * 100
      })
    }
    
    return data
  }, [contrato])

  if (timeSeriesData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
        No hay datos temporales disponibles
      </div>
    )
  }

  const formatValue = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={timeSeriesData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="periodo" 
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            tickFormatter={formatValue}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatValue(value),
              name === 'valorContrato' ? 'Valor Contrato' :
              name === 'valorFacturado' ? 'Facturado' :
              name === 'valorPagado' ? 'Pagado' : name
            ]}
            labelStyle={{ fontSize: '11px' }}
            contentStyle={{ 
              fontSize: '11px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          
          <Bar 
            dataKey="valorContrato" 
            fill="#e5e7eb" 
            opacity={0.4}
            name="Valor Contrato"
          />
          <Line 
            type="monotone" 
            dataKey="valorFacturado" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Facturado"
          />
          <Line 
            type="monotone" 
            dataKey="valorPagado" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Pagado"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ContractTimeSeries
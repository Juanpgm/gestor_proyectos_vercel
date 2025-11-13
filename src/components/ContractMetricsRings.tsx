'use client'

import React from 'react'

interface ContractMetricsRingsProps {
  contrato: any
  pagosContrato?: number // Total de pagos realizados para este contrato
}

interface RingChartProps {
  percentage: number
  label: string
  color: string
  size?: number
}

const RingChart: React.FC<RingChartProps> = ({ 
  percentage, 
  label, 
  color, 
  size = 120 
}) => {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Percentage text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
      
      {/* Label only */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </div>
      </div>
    </div>
  )
}

// Función para determinar el color basado en el tipo de métrica (igual que la gráfica de evolución temporal)
const getColorByMetricType = (metricType: 'fisico' | 'financiero' | 'pagos'): string => {
  switch (metricType) {
    case 'fisico':
      return '#10b981' // Verde (igual que la gráfica de evolución temporal)
    case 'financiero':
      return '#3b82f6' // Azul (igual que la gráfica de evolución temporal)
    case 'pagos':
      return '#f97316' // Naranja (igual que la gráfica de evolución temporal)
    default:
      return '#6b7280' // Gris por defecto
  }
}

const ContractMetricsRings: React.FC<ContractMetricsRingsProps> = ({ contrato, pagosContrato = 0 }) => {
  // Usar datos del endpoint reportes-contratos cuando estén disponibles
  // Si vienen del endpoint contratos_emprestito_all, usar esos
  const valorContrato = contrato.valor_contrato || contrato.valor_del_contrato || 0
  const valorFacturado = contrato.valor_facturado || 0
  const valorPagado = contrato.valor_pagado || 0
  const valorPendienteEjecucion = contrato.valor_pendiente_de_ejecucion

  // Usar avances directamente del endpoint reportes-contratos si están disponibles
  const avanceFisicoReporte = contrato.avance_fisico || contrato.ejecucion_fisica || 0
  const avanceFinancieroReporte = contrato.avance_financiero || contrato.ejecucion_financiera || 0

  // Ejecución Física - priorizar datos del reporte, sino calcular
  const ejecucionFisica = avanceFisicoReporte > 0 
    ? avanceFisicoReporte 
    : (valorPendienteEjecucion !== undefined && valorContrato > 0 ? ((valorContrato - valorPendienteEjecucion) / valorContrato) * 100 : 0)

  // Ejecución Financiera/Presupuestal - priorizar datos del reporte, sino calcular
  const ejecucionPresupuestal = avanceFinancieroReporte > 0 
    ? avanceFinancieroReporte 
    : (valorContrato > 0 ? (valorFacturado / valorContrato) * 100 : 0)

  // Pagos - calcular desde los pagos reales si están disponibles, sino usar valor_pagado del contrato
  const totalPagado = pagosContrato > 0 ? pagosContrato : valorPagado
  const pagosPercentage = valorContrato > 0 ? (totalPagado / valorContrato) * 100 : 0

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
        <RingChart
          percentage={Math.max(0, Math.min(100, ejecucionFisica))}
          label="Avance Físico"
          color={getColorByMetricType('fisico')}
        />
        
        <RingChart
          percentage={Math.max(0, Math.min(100, ejecucionPresupuestal))}
          label="Avance Financiero"
          color={getColorByMetricType('financiero')}
        />
        
        <RingChart
          percentage={Math.max(0, Math.min(100, pagosPercentage))}
          label="Pagos Realizados"
          color={getColorByMetricType('pagos')}
        />
      </div>
    </div>
  )
}

export default ContractMetricsRings
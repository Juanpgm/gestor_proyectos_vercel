'use client'

import React from 'react'

interface ContractMetricsRingsProps {
  contrato: any
}

interface RingChartProps {
  percentage: number
  label: string
  value: string
  color: string
  size?: number
}

const RingChart: React.FC<RingChartProps> = ({ 
  percentage, 
  label, 
  value, 
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
      
      {/* Label and value */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          {label}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {value}
        </div>
      </div>
    </div>
  )
}

// Función para determinar el color basado en el porcentaje
const getColorByPercentage = (percentage: number): string => {
  if (percentage >= 100) return '#10b981' // Verde (green-500) solo al 100%
  if (percentage >= 80) return '#84cc16'  // Verde claro (lime-500)
  if (percentage >= 60) return '#eab308'  // Amarillo (yellow-500)
  if (percentage >= 40) return '#f97316'  // Naranja (orange-500)
  if (percentage >= 20) return '#ef4444'  // Rojo claro (red-500)
  return '#dc2626'                        // Rojo oscuro (red-600)
}

const ContractMetricsRings: React.FC<ContractMetricsRingsProps> = ({ contrato }) => {
  // Usar datos del endpoint reportes-contratos cuando estén disponibles
  // Si vienen del endpoint contratos_emprestito_all, usar esos
  const valorContrato = contrato.valor_contrato || contrato.valor_del_contrato || 0
  const valorFacturado = contrato.valor_facturado || 0
  const valorPagado = contrato.valor_pagado || 0
  const valorPendienteEjecucion = contrato.valor_pendiente_de_ejecucion || 0

  // Usar avances directamente del endpoint reportes-contratos si están disponibles
  const avanceFisicoReporte = contrato.avance_fisico || contrato.ejecucion_fisica || 0
  const avanceFinancieroReporte = contrato.avance_financiero || contrato.ejecucion_financiera || 0

  // Ejecución Física - priorizar datos del reporte, sino calcular
  const ejecucionFisica = avanceFisicoReporte > 0 
    ? avanceFisicoReporte 
    : (valorContrato > 0 ? ((valorContrato - valorPendienteEjecucion) / valorContrato) * 100 : 0)

  // Ejecución Financiera/Presupuestal - priorizar datos del reporte, sino calcular
  const ejecucionPresupuestal = avanceFinancieroReporte > 0 
    ? avanceFinancieroReporte 
    : (valorContrato > 0 ? (valorFacturado / valorContrato) * 100 : 0)

  // Pagos = valor_pagado / valor_del_contrato
  const pagos = valorContrato > 0 
    ? (valorPagado / valorContrato) * 100 
    : 0

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
        <RingChart
          percentage={Math.max(0, Math.min(100, ejecucionFisica))}
          label="Avance Físico"
          value={avanceFisicoReporte > 0 ? `${ejecucionFisica.toFixed(1)}%` : `$${(valorContrato - valorPendienteEjecucion).toLocaleString('es-CO')}`}
          color={getColorByPercentage(ejecucionFisica)}
        />
        
        <RingChart
          percentage={Math.max(0, Math.min(100, ejecucionPresupuestal))}
          label="Avance Financiero"
          value={avanceFinancieroReporte > 0 ? `${ejecucionPresupuestal.toFixed(1)}%` : `$${valorFacturado.toLocaleString('es-CO')}`}
          color={getColorByPercentage(ejecucionPresupuestal)}
        />
        
        <RingChart
          percentage={Math.max(0, Math.min(100, pagos))}
          label="Pagos Realizados"
          value={`$${valorPagado.toLocaleString('es-CO')}`}
          color={getColorByPercentage(pagos)}
        />
      </div>
    </div>
  )
}

export default ContractMetricsRings
'use client'

import React from 'react'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface ContractFinancialVisualsProps {
  contrato: any
}

const ContractFinancialVisuals: React.FC<ContractFinancialVisualsProps> = ({ contrato }) => {
  const valorContrato = contrato.valor_del_contrato || contrato.valor_contrato || 0
  const valorFacturado = contrato.valor_facturado || 0
  const valorPagado = contrato.valor_pagado || 0
  const valorPendiente = contrato.valor_pendiente_de_pago || contrato.valor_pendiente_pago || 0

  const porcentajeFacturado = valorContrato > 0 ? (valorFacturado / valorContrato) * 100 : 0
  const porcentajePagado = valorContrato > 0 ? (valorPagado / valorContrato) * 100 : 0
  const porcentajePendiente = valorContrato > 0 ? (valorPendiente / valorContrato) * 100 : 0

  const MetricCard: React.FC<{
    icon: React.ElementType
    title: string
    value: string
    percentage: number
    color: string
    bgColor: string
  }> = ({ icon: Icon, title, value, percentage, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-600`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h5 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h5>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-800 ${color}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      
      <div className="space-y-2">
        <div className={`text-lg font-bold ${color}`}>
          {value}
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        💰 Análisis Financiero
      </h4>
      
      {/* Valor total destacado */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Valor Total del Contrato</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              ${valorContrato.toLocaleString('es-CO')}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={TrendingUp}
          title="Facturado"
          value={`$${valorFacturado.toLocaleString('es-CO')}`}
          percentage={porcentajeFacturado}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        
        <MetricCard
          icon={DollarSign}
          title="Pagado"
          value={`$${valorPagado.toLocaleString('es-CO')}`}
          percentage={porcentajePagado}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        
        {valorPendiente > 0 && (
          <MetricCard
            icon={AlertTriangle}
            title="Pendiente"
            value={`$${valorPendiente.toLocaleString('es-CO')}`}
            percentage={porcentajePendiente}
            color="text-amber-600 dark:text-amber-400"
            bgColor="bg-amber-50 dark:bg-amber-900/20"
          />
        )}
      </div>

      {/* Indicadores adicionales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Eficiencia de Pago</div>
          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            {valorFacturado > 0 ? ((valorPagado / valorFacturado) * 100).toFixed(1) : '0'}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Avance Contractual</div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {porcentajeFacturado.toFixed(1)}%
          </div>
        </div>
        
        {contrato.origen_de_los_recursos && (
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Origen Recursos</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {contrato.origen_de_los_recursos}
            </div>
          </div>
        )}
        
        {contrato.destino_gasto && (
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Destino</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {contrato.destino_gasto}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContractFinancialVisuals
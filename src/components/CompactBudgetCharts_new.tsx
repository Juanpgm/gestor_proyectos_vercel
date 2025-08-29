'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  Activity,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react'
import { useDataContext } from '../context/DataContext'
import { formatCurrency, formatCurrencyCompact } from '../utils/formatCurrency'
import { CHART_COLORS } from '@/lib/design-system'

interface CompactBudgetChartsProps {
  className?: string
}

const CompactBudgetCharts: React.FC<CompactBudgetChartsProps> = ({
  className = ''
}) => {
  const { filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = useDataContext()

  // Procesar datos de movimientos presupuestales para los últimos 6 períodos
  const movimientosData = useMemo(() => {
    if (!filteredMovimientosPresupuestales) return []

    const periodTotals: { [key: string]: any } = {}
    
    // Procesar movimientos presupuestales
    filteredMovimientosPresupuestales.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) || ''
      
      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          ppto_inicial: 0,
          ppto_modificado: 0,
          adiciones: 0,
          reducciones: 0
        }
      }
      
      periodTotals[period].ppto_inicial += item.ppto_inicial || 0
      periodTotals[period].ppto_modificado += item.ppto_modificado || 0
      periodTotals[period].adiciones += item.adiciones || 0
      periodTotals[period].reducciones += item.reducciones || 0
    })

    const sortedPeriods = Object.values(periodTotals)
      .sort((a: any, b: any) => a.period.localeCompare(b.period))
      .slice(-6)
      .map((item: any) => ({
        ...item,
        monthName: getMonthName(item.period)
      }))

    return sortedPeriods
  }, [filteredMovimientosPresupuestales])

  // Procesar datos de ejecución presupuestal
  const ejecucionData = useMemo(() => {
    if (!filteredEjecucionPresupuestal) return []

    const periodTotals: { [key: string]: any } = {}
    
    filteredEjecucionPresupuestal.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) || ''
      
      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          ejecutado: 0,
          pagado: 0,
          periodo_completo: item.periodo_corte
        }
      }
      
      periodTotals[period].ejecutado += item.ejecucion || 0
      periodTotals[period].pagado += item.pagos || 0
    })

    const sortedPeriods = Object.values(periodTotals)
      .sort((a: any, b: any) => a.period.localeCompare(b.period))
      .slice(-6)
      .map((item: any) => ({
        ...item,
        monthName: getMonthName(item.period)
      }))

    return sortedPeriods
  }, [filteredEjecucionPresupuestal])

  // Datos para el gráfico circular (último período)
  const pieData = useMemo(() => {
    const latestMovimientos = movimientosData[movimientosData.length - 1]
    const latestEjecucion = ejecucionData[ejecucionData.length - 1]
    
    if (!latestMovimientos || !latestEjecucion) return []

    const ejecutado = latestEjecucion.ejecutado
    const pagado = latestEjecucion.pagado
    const saldo = latestMovimientos.ppto_modificado - ejecutado

    return [
      { name: 'Ejecutado', value: ejecutado, color: CHART_COLORS[1] },
      { name: 'Pagado', value: pagado, color: CHART_COLORS[3] },
      { name: 'Saldo', value: Math.max(0, saldo), color: CHART_COLORS[5] }
    ]
  }, [movimientosData, ejecucionData])

  const getMonthName = (period: string) => {
    const months = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    }
    const month = period.split('-')[1]
    return months[month as keyof typeof months] || period
  }

  const formatTooltip = (value: number, name: string) => [
    formatCurrency(value),
    name
  ]

  if (!movimientosData.length || !ejecucionData.length) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const latestPeriod = ejecucionData[ejecucionData.length - 1]
  const latestFullDate = latestPeriod?.periodo_completo || ''
  const formattedDate = latestFullDate ? new Date(latestFullDate).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  }) : ''

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Movimientos Presupuestales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Movimientos Presupuestales
            </h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movimientosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="monthName" 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCurrencyCompact}
                  stroke="#6b7280"
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ppto_inicial" 
                  stackId="1"
                  stroke={CHART_COLORS[0]} 
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.3}
                  name="Presupuesto Inicial"
                />
                <Area 
                  type="monotone" 
                  dataKey="ppto_modificado" 
                  stackId="2"
                  stroke={CHART_COLORS[5]} 
                  fill={CHART_COLORS[5]}
                  fillOpacity={0.3}
                  name="Presupuesto Actual"
                />
                <Area 
                  type="monotone" 
                  dataKey="adiciones" 
                  stackId="3"
                  stroke={CHART_COLORS[1]} 
                  fill={CHART_COLORS[1]}
                  fillOpacity={0.3}
                  name="Adiciones"
                />
                <Area 
                  type="monotone" 
                  dataKey="reducciones" 
                  stackId="4"
                  stroke={CHART_COLORS[2]} 
                  fill={CHART_COLORS[2]}
                  fillOpacity={0.3}
                  name="Reducciones"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ejecución vs Pagos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Ejecución vs Pagos
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Período evaluado: {formattedDate}
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ejecucionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="monthName" 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCurrencyCompact}
                  stroke="#6b7280"
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="ejecutado" 
                  fill={CHART_COLORS[1]}
                  name="Ejecutado"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="pagado" 
                  fill={CHART_COLORS[3]}
                  name="Pagado"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CompactBudgetCharts

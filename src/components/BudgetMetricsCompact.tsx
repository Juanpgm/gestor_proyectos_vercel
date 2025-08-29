'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'
import { useDataContext } from '../context/DataContext'

interface BudgetMetricsCompactProps {
  className?: string
}

const BudgetMetricsCompact: React.FC<BudgetMetricsCompactProps> = ({ className = '' }) => {
  const dataContext = useDataContext()
  const { filteredMovimientosPresupuestales } = dataContext

  // Procesar datos para métricas compactas
  const budgetMetrics = useMemo(() => {
    if (!filteredMovimientosPresupuestales || filteredMovimientosPresupuestales.length === 0) {
      return {
        totalInitial: 0,
        totalCurrent: 0,
        totalAdditions: 0,
        totalReductions: 0,
        trend: [],
        variation: 0
      }
    }

    const totals = {
      totalInitial: 0,
      totalCurrent: 0,
      totalAdditions: 0,
      totalReductions: 0
    }

    // Obtener los valores del período más reciente
    if (filteredMovimientosPresupuestales && filteredMovimientosPresupuestales.length > 0) {
      // Encontrar el período más reciente en los datos filtrados
      const latestPeriod = filteredMovimientosPresupuestales.reduce((latest, item) => {
        return item.periodo_corte > latest ? item.periodo_corte : latest
      }, '1900-01-01')
      
      // Filtrar solo los registros del período más reciente
      const latestPeriodData = filteredMovimientosPresupuestales.filter(item => item.periodo_corte === latestPeriod)
      
      // Sumar todos los valores del período más reciente
      latestPeriodData.forEach((movimiento: any) => {
        totals.totalInitial += movimiento.ppto_inicial || 0
        totals.totalCurrent += movimiento.ppto_modificado || 0
        totals.totalAdditions += movimiento.adiciones || 0
        totals.totalReductions += movimiento.reducciones || 0
      })
    }

    // Calcular variación porcentual
    const variation = totals.totalInitial > 0 
      ? ((totals.totalCurrent - totals.totalInitial) / totals.totalInitial) * 100 
      : 0

    // Crear datos de tendencia (últimos 6 meses)
    const periodTotals: { [key: string]: number } = {}
    if (filteredMovimientosPresupuestales && filteredMovimientosPresupuestales.length > 0) {
      // Agrupar por periodo para la tendencia
      filteredMovimientosPresupuestales.forEach((movimiento: any) => {
        const period = movimiento.periodo_corte?.substring(0, 7) || 'Sin período'
        periodTotals[period] = (periodTotals[period] || 0) + (movimiento.ppto_modificado || 0)
      })
    }

    const trend = Object.entries(periodTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([period, value]) => ({ period, value }))

    return {
      ...totals,
      variation,
      trend
    }
  }, [filteredMovimientosPresupuestales])

  const formatCurrency = (value: number) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`
    }
    return `$${value.toLocaleString()}`
  }

  const MetricCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className={`bg-gradient-to-r ${color} rounded-lg p-3 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-90">{title}</p>
          <p className="text-lg font-bold">{formatCurrency(value)}</p>
        </div>
        <Icon className="w-6 h-6 opacity-80" />
      </div>
      {trend && (
        <div className="mt-2 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="rgba(255,255,255,0.8)" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )

  return (
    <motion.div 
      className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Métricas principales en formato horizontal */}
      <MetricCard
        title="Presupuesto Inicial"
        value={budgetMetrics.totalInitial}
        icon={DollarSign}
        color="from-blue-500 to-blue-600"
      />
      <MetricCard
        title="Presupuesto Actual"
        value={budgetMetrics.totalCurrent}
        icon={BarChart3}
        color="from-green-500 to-green-600"
        trend={budgetMetrics.trend}
      />
      <MetricCard
        title="Total Adiciones"
        value={budgetMetrics.totalAdditions}
        icon={TrendingUp}
        color="from-yellow-500 to-yellow-600"
      />
      <MetricCard
        title="Total Reducciones"
        value={budgetMetrics.totalReductions}
        icon={TrendingDown}
        color="from-red-500 to-red-600"
      />
    </motion.div>
  )
}

export default BudgetMetricsCompact

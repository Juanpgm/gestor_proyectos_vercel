'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Target, Activity, TrendingUp } from 'lucide-react'
import { useDataContext } from '../context/DataContext'
import { formatCurrency } from '../utils/formatCurrency'

const FinancialMetricsIntegrated: React.FC = () => {
  const { filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = useDataContext()

  const metrics = useMemo(() => {
    if (!filteredMovimientosPresupuestales || !filteredEjecucionPresupuestal) {
      return {
        presupuesto: 0,
        ejecutado: 0,
        pagado: 0
      }
    }

    // Obtener totales del último período
    const latestPeriod = '2024-11'
    
    const presupuesto = filteredMovimientosPresupuestales
      .filter(item => item.periodo_corte?.startsWith(latestPeriod))
      .reduce((sum, item) => sum + (item.ppto_modificado || 0), 0)
    
    const ejecutado = filteredEjecucionPresupuestal
      .filter(item => item.periodo_corte?.startsWith(latestPeriod))
      .reduce((sum, item) => sum + (item.ejecucion || 0), 0)
    
    const pagado = filteredEjecucionPresupuestal
      .filter(item => item.periodo_corte?.startsWith(latestPeriod))
      .reduce((sum, item) => sum + (item.pagos || 0), 0)

    return {
      presupuesto,
      ejecutado,
      pagado
    }
  }, [filteredMovimientosPresupuestales, filteredEjecucionPresupuestal])

  const MetricCard: React.FC<{
    icon: React.ReactNode
    title: string
    value: number
    color: string
    percentage?: number
  }> = ({ icon, title, value, color, percentage }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {formatCurrency(value)}
            </p>
            {percentage !== undefined && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {percentage.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const executionPercentage = metrics.presupuesto > 0 ? (metrics.ejecutado / metrics.presupuesto) * 100 : 0
  const paymentPercentage = metrics.ejecutado > 0 ? (metrics.pagado / metrics.ejecutado) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
          <DollarSign className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Métricas Financieras</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">Indicadores presupuestales principales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MetricCard
          icon={<DollarSign className="w-3 h-3 text-white" />}
          title="Presupuesto"
          value={metrics.presupuesto}
          color="bg-blue-500"
        />
        
        <MetricCard
          icon={<Target className="w-3 h-3 text-white" />}
          title="Ejecutado"
          value={metrics.ejecutado}
          color="bg-green-500"
          percentage={executionPercentage}
        />
        
        <MetricCard
          icon={<Activity className="w-3 h-3 text-white" />}
          title="Pagado"
          value={metrics.pagado}
          color="bg-orange-500"
          percentage={paymentPercentage}
        />
      </div>
    </motion.div>
  )
}

export default FinancialMetricsIntegrated

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
  ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  Activity,
  BarChart3,
  Calendar
} from 'lucide-react'
import { useDataContext } from '../context/DataContext'
import CompactMetricsCard from './CompactMetricsCard'
import { formatCurrencyFull, formatCurrencyCompact } from '../utils/formatCurrency'
import { CHART_COLORS } from '@/lib/design-system'

const IntegratedBudgetAnalysis: React.FC = () => {
  const { filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = useDataContext()

  const getMonthName = (period: string) => {
    const months = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    }
    const month = period.split('-')[1]
    return months[month as keyof typeof months] || period
  }

  // Procesar datos de movimientos presupuestales
  const movimientosData = useMemo(() => {
    if (!filteredMovimientosPresupuestales) return []

    const periodTotals: { [key: string]: any } = {}
    
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

    return Object.values(periodTotals)
      .sort((a: any, b: any) => a.period.localeCompare(b.period))
      .slice(-6)
      .map((item: any) => ({
        ...item,
        monthName: getMonthName(item.period)
      }))
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

    return Object.values(periodTotals)
      .sort((a: any, b: any) => a.period.localeCompare(b.period))
      .slice(-6)
      .map((item: any) => ({
        ...item,
        monthName: getMonthName(item.period)
      }))
  }, [filteredEjecucionPresupuestal])

  // Calcular métricas principales
  const metrics = useMemo(() => {
    if (!filteredMovimientosPresupuestales || !filteredEjecucionPresupuestal) {
      return {
        presupuesto: 0,
        ejecutado: 0,
        pagado: 0,
        saldo: 0,
        executionPercentage: 0,
        paymentPercentage: 0
      }
    }

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

    const saldo = presupuesto - ejecutado
    const executionPercentage = presupuesto > 0 ? (ejecutado / presupuesto) * 100 : 0
    const paymentPercentage = ejecutado > 0 ? (pagado / ejecutado) * 100 : 0

    return {
      presupuesto,
      ejecutado,
      pagado,
      saldo: Math.max(0, saldo),
      executionPercentage,
      paymentPercentage
    }
  }, [filteredMovimientosPresupuestales, filteredEjecucionPresupuestal])

  const formatTooltip = (value: number, name: string) => [
    formatCurrencyFull(value),
    name
  ]

  const latestPeriod = ejecucionData[ejecucionData.length - 1]
  const latestFullDate = latestPeriod?.periodo_completo || ''
  const formattedDate = latestFullDate ? new Date(latestFullDate).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  }) : ''

  if (!movimientosData.length || !ejecucionData.length) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con título principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Análisis Presupuestal
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Indicadores financieros y ejecución presupuestal municipal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Período: {formattedDate}</span>
        </div>
      </motion.div>

      {/* Métricas principales en cards compactas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CompactMetricsCard
          title="Presupuesto Total"
          value={metrics.presupuesto}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="blue"
          delay={0.1}
        />
        
        <CompactMetricsCard
          title="Ejecutado"
          value={metrics.ejecutado}
          subtitle={`${metrics.executionPercentage.toFixed(1)}% del presupuesto`}
          percentage={metrics.executionPercentage}
          icon={<Target className="w-5 h-5 text-white" />}
          color="green"
          trend="up"
          delay={0.2}
        />
        
        <CompactMetricsCard
          title="Pagado"
          value={metrics.pagado}
          subtitle={`${metrics.paymentPercentage.toFixed(1)}% de lo ejecutado`}
          percentage={metrics.paymentPercentage}
          icon={<Activity className="w-5 h-5 text-white" />}
          color="orange"
          trend="up"
          delay={0.3}
        />
        
        <CompactMetricsCard
          title="Saldo Disponible"
          value={metrics.saldo}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          color="purple"
          delay={0.4}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimientos Presupuestales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Movimientos Presupuestales
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Evolución del presupuesto, adiciones y reducciones
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movimientosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="monthName" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrencyCompact}
                  stroke="#6b7280"
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ppto_inicial" 
                  stackId="1"
                  stroke={CHART_COLORS[0]} 
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.6}
                  name="Presupuesto Inicial"
                />
                <Area 
                  type="monotone" 
                  dataKey="ppto_modificado" 
                  stackId="2"
                  stroke={CHART_COLORS[5]} 
                  fill={CHART_COLORS[5]}
                  fillOpacity={0.6}
                  name="Presupuesto Actual"
                />
                <Area 
                  type="monotone" 
                  dataKey="adiciones" 
                  stackId="3"
                  stroke={CHART_COLORS[1]} 
                  fill={CHART_COLORS[1]}
                  fillOpacity={0.6}
                  name="Adiciones"
                />
                <Area 
                  type="monotone" 
                  dataKey="reducciones" 
                  stackId="4"
                  stroke={CHART_COLORS[2]} 
                  fill={CHART_COLORS[2]}
                  fillOpacity={0.6}
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
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ejecución vs Pagos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comparación entre recursos ejecutados y pagados mensualmente
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ejecucionData} barGap={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="monthName" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrencyCompact}
                  stroke="#6b7280"
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="ejecutado" 
                  fill={CHART_COLORS[1]}
                  name="Ejecutado"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="pagado" 
                  fill={CHART_COLORS[3]}
                  name="Pagado"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default IntegratedBudgetAnalysis

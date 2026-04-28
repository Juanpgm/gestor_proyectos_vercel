'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  Percent
} from 'lucide-react'
import { formatNumber } from '@/lib/design-system'

interface FlujoCajaRegistro {
  id: string
  organismo: string
  banco: string
  bp_proyecto?: string
  mes: string
  periodo: string
  desembolso: number
  desembolso_real?: number
}

interface EmprestitoFinancialMetricsProps {
  data: FlujoCajaRegistro[]
  className?: string
}

interface MetricCard {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  gradient: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

const EmprestitoFinancialMetrics: React.FC<EmprestitoFinancialMetricsProps> = ({ 
  data, 
  className = '' 
}) => {
  // Cálculos de métricas financieras
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null

    const totalPlaneado = data.reduce((sum, row) => sum + (row.desembolso || 0), 0)
    const totalReal = data.reduce((sum, row) => sum + (row.desembolso_real || 0), 0)
    const diferencia = totalReal - totalPlaneado
    const cumplimiento = totalPlaneado > 0 ? (totalReal / totalPlaneado) * 100 : 0

    // Análisis por mes
    const monthlyData = data.reduce((acc, row) => {
      const month = row.mes
      if (!acc[month]) {
        acc[month] = {
          planeado: 0,
          real: 0,
          fecha: new Date(row.periodo)
        }
      }
      acc[month].planeado += row.desembolso || 0
      acc[month].real += row.desembolso_real || 0
      return acc
    }, {} as Record<string, any>)

    const monthlyArray = Object.values(monthlyData).sort((a: any, b: any) => 
      a.fecha.getTime() - b.fecha.getTime()
    )

    // Promedios mensuales
    const avgPlaneado = totalPlaneado / monthlyArray.length
    const avgReal = totalReal / monthlyArray.length

    // Tendencia (comparación últimos 3 meses vs primeros 3 meses)
    const firstThreeMonths = monthlyArray.slice(0, 3).reduce((sum: number, m: any) => sum + m.real, 0)
    const lastThreeMonths = monthlyArray.slice(-3).reduce((sum: number, m: any) => sum + m.real, 0)
    const trend = lastThreeMonths > firstThreeMonths 
      ? ((lastThreeMonths - firstThreeMonths) / firstThreeMonths) * 100 
      : 0

    // Proyectos únicos con desembolsos reales
    const proyectosConDesembolso = new Set(
      data.filter(row => (row.desembolso_real || 0) > 0).map(row => row.bp_proyecto)
    ).size

    const proyectosTotales = new Set(data.map(row => row.bp_proyecto)).size

    // Tasa de ejecución promedio
    const tasaEjecucion = cumplimiento

    return {
      totalPlaneado,
      totalReal,
      diferencia,
      cumplimiento,
      avgPlaneado,
      avgReal,
      trend,
      proyectosConDesembolso,
      proyectosTotales,
      tasaEjecucion,
      mesesProcesados: monthlyArray.length
    }
  }, [data])

  if (!metrics) {
    return (
      <div className={`text-center text-gray-500 dark:text-gray-400 p-6 ${className}`}>
        No hay datos disponibles para calcular métricas
      </div>
    )
  }

  const metricCards: MetricCard[] = [
    {
      title: 'Cumplimiento General',
      value: `${metrics.cumplimiento.toFixed(1)}%`,
      subtitle: `${formatNumber(metrics.totalReal, 'currency')} de ${formatNumber(metrics.totalPlaneado, 'currency')}`,
      icon: Target,
      gradient: 'from-blue-500 to-blue-600',
      trend: {
        value: metrics.cumplimiento,
        isPositive: metrics.cumplimiento >= 80
      }
    },
    {
      title: 'Desembolso Promedio Mensual',
      value: formatNumber(metrics.avgReal, 'currency'),
      subtitle: `Planeado: ${formatNumber(metrics.avgPlaneado, 'currency')}`,
      icon: Calendar,
      gradient: 'from-green-500 to-green-600',
      trend: {
        value: metrics.trend,
        isPositive: metrics.trend > 0
      }
    },
    {
      title: 'Proyectos en Ejecución',
      value: `${metrics.proyectosConDesembolso}/${metrics.proyectosTotales}`,
      subtitle: `${((metrics.proyectosConDesembolso / metrics.proyectosTotales) * 100).toFixed(0)}% activos`,
      icon: CheckCircle2,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Variación vs Planeado',
      value: formatNumber(Math.abs(metrics.diferencia), 'currency'),
      subtitle: metrics.diferencia >= 0 ? 'Sobre lo planeado' : 'Bajo lo planeado',
      icon: metrics.diferencia >= 0 ? TrendingUp : TrendingDown,
      gradient: metrics.diferencia >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600',
      trend: {
        value: metrics.diferencia,
        isPositive: metrics.diferencia >= 0
      }
    },
    {
      title: 'Tasa de Ejecución',
      value: `${metrics.tasaEjecucion.toFixed(1)}%`,
      subtitle: `En ${metrics.mesesProcesados} meses`,
      icon: Percent,
      gradient: 'from-cyan-500 to-cyan-600',
      trend: {
        value: metrics.tasaEjecucion,
        isPositive: metrics.tasaEjecucion >= 70
      }
    },
    {
      title: 'Tendencia Trimestral',
      value: `${metrics.trend > 0 ? '+' : ''}${metrics.trend.toFixed(1)}%`,
      subtitle: 'Ãšltimos 3 meses vs primeros 3',
      icon: Clock,
      gradient: 'from-indigo-500 to-indigo-600',
      trend: {
        value: metrics.trend,
        isPositive: metrics.trend > 0
      }
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {metricCards.map((metric, index) => {
        const Icon = metric.icon
        
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${metric.gradient}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              {metric.trend && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  metric.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </h4>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {metric.subtitle}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default EmprestitoFinancialMetrics

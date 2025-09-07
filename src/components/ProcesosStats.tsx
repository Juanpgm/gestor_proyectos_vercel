'use client'

import { motion } from 'framer-motion'
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Eye,
  Users
} from 'lucide-react'
import { formatNumber, ANIMATIONS, getCategoryConfig } from '@/lib/design-system'

export interface ProcesosStatsProps {
  totalProcesos: number
  procesosAdjudicados: number
  procesosNoAdjudicados: number
  valorTotalProcesos: number
  valorTotalAdjudicado: number
  promedioVisualizaciones: number
  promedioProveedoresInteres: number
  procesosPorEstado: Record<string, number>
}

export default function ProcesosStats({
  totalProcesos,
  procesosAdjudicados,
  procesosNoAdjudicados,
  valorTotalProcesos,
  valorTotalAdjudicado,
  promedioVisualizaciones,
  promedioProveedoresInteres,
  procesosPorEstado
}: ProcesosStatsProps) {

  const porcentajeAdjudicado = totalProcesos > 0 ? (procesosAdjudicados / totalProcesos) * 100 : 0
  const porcentajeEjecucion = valorTotalProcesos > 0 ? (valorTotalAdjudicado / valorTotalProcesos) * 100 : 0

  const stats = [
    {
      title: 'Total Procesos',
      value: totalProcesos.toLocaleString('es-CO'),
      subtitle: 'Procesos registrados',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Valor Total',
      value: formatNumber(valorTotalProcesos, 'currency'),
      subtitle: 'Valor base procesos',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      title: 'Procesos Adjudicados',
      value: procesosAdjudicados.toLocaleString('es-CO'),
      subtitle: `${porcentajeAdjudicado.toFixed(1)}% del total`,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800'
    },
    {
      title: 'Valor Adjudicado',
      value: formatNumber(valorTotalAdjudicado, 'currency'),
      subtitle: `${porcentajeEjecucion.toFixed(1)}% del total`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: 'Procesos Pendientes',
      value: procesosNoAdjudicados.toLocaleString('es-CO'),
      subtitle: `${(100 - porcentajeAdjudicado).toFixed(1)}% del total`,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    {
      title: 'Promedio Visualizaciones',
      value: Math.round(promedioVisualizaciones).toLocaleString('es-CO'),
      subtitle: 'Por proceso',
      icon: Eye,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      borderColor: 'border-cyan-200 dark:border-cyan-800'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
            initial={ANIMATIONS.fadeIn.initial}
            animate={ANIMATIONS.fadeIn.animate}
            transition={{ ...ANIMATIONS.fadeIn.transition, delay: index * 0.1 }}
            className={`
              bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg border 
              border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 
              transition-all duration-300 ${stat.bgColor}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.borderColor} border`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {stat.title}
              </h3>
              <p className={`text-2xl md:text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.subtitle}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

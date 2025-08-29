'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Calendar,
  Percent
} from 'lucide-react'

interface ActividadesStatsProps {
  totalActividades: number
  completedActivities: number
  inProgressActivities: number
  notStartedActivities: number
  activitiesWithoutDates?: number  // Nueva propiedad opcional
  averageProgress: number
  loading?: boolean
}

export default function ActividadesStats({
  totalActividades,
  completedActivities,
  inProgressActivities,
  notStartedActivities,
  activitiesWithoutDates = 0,
  averageProgress,
  loading = false
}: ActividadesStatsProps) {
  const stats = [
    {
      title: 'Total Actividades',
      value: totalActividades.toLocaleString(),
      icon: Activity,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-900 dark:text-blue-100'
    },
    {
      title: 'Completadas',
      value: completedActivities.toLocaleString(),
      subtitle: `${totalActividades > 0 ? ((completedActivities / totalActividades) * 100).toFixed(1) : 0}%`,
      icon: CheckCircle,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      textColor: 'text-emerald-900 dark:text-emerald-100'
    },
    {
      title: 'En Progreso',
      value: inProgressActivities.toLocaleString(),
      subtitle: `${totalActividades > 0 ? ((inProgressActivities / totalActividades) * 100).toFixed(1) : 0}%`,
      icon: AlertCircle,
      color: 'yellow',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      textColor: 'text-yellow-900 dark:text-yellow-100'
    },
    {
      title: 'No Iniciadas',
      value: notStartedActivities.toLocaleString(),
      subtitle: `${totalActividades > 0 ? ((notStartedActivities / totalActividades) * 100).toFixed(1) : 0}%`,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-100'
    },
    ...(activitiesWithoutDates > 0 ? [{
      title: 'Sin Fechas',
      value: activitiesWithoutDates.toLocaleString(),
      subtitle: `${totalActividades > 0 ? ((activitiesWithoutDates / totalActividades) * 100).toFixed(1) : 0}%`,
      icon: Calendar,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      textColor: 'text-orange-900 dark:text-orange-100'
    }] : []),
    {
      title: 'Progreso Promedio',
      value: `${(averageProgress * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      textColor: 'text-purple-900 dark:text-purple-100'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={`text-sm font-medium ${stat.textColor} opacity-75`}>
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className={`text-xs ${stat.textColor} opacity-60`}>
                    {stat.subtitle}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor} border-2 border-white dark:border-gray-800`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            
            {/* Indicador de progreso visual para algunas métricas */}
            {stat.title === 'Progreso Promedio' && (
              <div className="mt-4">
                <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${averageProgress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export { ActividadesStats }
export type { ActividadesStatsProps }

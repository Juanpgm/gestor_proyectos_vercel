'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Package,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  BarChart3,
  Percent
} from 'lucide-react'

interface ProductosStatsProps {
  totalProductos: number
  completedProducts: number
  inProgressProducts: number
  notStartedProducts: number
  averageProgress: number
  productsByType: Record<string, number>
  loading?: boolean
}

export default function ProductosStats({
  totalProductos,
  completedProducts,
  inProgressProducts,
  notStartedProducts,
  averageProgress,
  productsByType,
  loading = false
}: ProductosStatsProps) {
  // Obtener los tipos de producto más comunes
  const topProductTypes = Object.entries(productsByType)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  const stats = [
    {
      title: 'Total Productos',
      value: totalProductos.toLocaleString(),
      icon: Package,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      textColor: 'text-purple-900 dark:text-purple-100'
    },
    {
      title: 'Completados',
      value: completedProducts.toLocaleString(),
      subtitle: `${totalProductos > 0 ? ((completedProducts / totalProductos) * 100).toFixed(1) : 0}%`,
      icon: CheckCircle,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      textColor: 'text-emerald-900 dark:text-emerald-100'
    },
    {
      title: 'En Desarrollo',
      value: inProgressProducts.toLocaleString(),
      subtitle: `${totalProductos > 0 ? ((inProgressProducts / totalProductos) * 100).toFixed(1) : 0}%`,
      icon: AlertCircle,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-900 dark:text-blue-100'
    },
    {
      title: 'No Iniciados',
      value: notStartedProducts.toLocaleString(),
      subtitle: `${totalProductos > 0 ? ((notStartedProducts / totalProductos) * 100).toFixed(1) : 0}%`,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-100'
    },
    {
      title: 'Progreso Promedio',
      value: `${(averageProgress * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'indigo',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      textColor: 'text-indigo-900 dark:text-indigo-100'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${averageProgress * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Distribución por tipo de producto */}
      {topProductTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Tipos de Productos Más Comunes
            </h3>
          </div>
          
          <div className="space-y-3">
            {topProductTypes.map(([type, count], index) => {
              const percentage = totalProductos > 0 ? (count / totalProductos) * 100 : 0
              const colors = [
                'bg-orange-500',
                'bg-teal-500', 
                'bg-pink-500'
              ]
              
              return (
                <div key={type} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 pr-2">
                        {type}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[index]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {Object.keys(productsByType).length > 3 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Y {Object.keys(productsByType).length - 3} tipos más...
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export { ProductosStats }
export type { ProductosStatsProps }

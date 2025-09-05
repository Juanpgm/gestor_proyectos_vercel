'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  TrendingUp, 
  Building2, 
  DollarSign,
  BarChart3,
  Users
} from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'

interface EmprestitoStatsProps {
  totalProyectos: number
  totalContratos: number
  valorTotalContratos: number
  totalBancos: number
  totalCentrosGestor: number
  loading?: boolean
}

const EmprestitoStats: React.FC<EmprestitoStatsProps> = ({
  totalProyectos,
  totalContratos,
  valorTotalContratos,
  totalBancos,
  totalCentrosGestor,
  loading = false
}) => {
  const stats = [
    {
      title: 'Total Proyectos',
      value: totalProyectos,
      icon: CreditCard,
      gradient: CATEGORIES.emprestito.gradient,
      format: 'number'
    },
    {
      title: 'Total Contratos',
      value: totalContratos,
      icon: BarChart3,
      gradient: CATEGORIES.emprestito.gradient,
      format: 'number'
    },
    {
      title: 'Valor Total Contratos',
      value: valorTotalContratos,
      icon: DollarSign,
      gradient: CATEGORIES.emprestito.gradient,
      format: 'currency'
    },
    {
      title: 'Bancos Participantes',
      value: totalBancos,
      icon: Building2,
      gradient: CATEGORIES.emprestito.gradient,
      format: 'number'
    },
    {
      title: 'Centros Gestor',
      value: totalCentrosGestor,
      icon: Users,
      gradient: CATEGORIES.emprestito.gradient,
      format: 'number'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="relative bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-teal-50 dark:bg-teal-900/20 rounded-xl opacity-50" />
            
            {/* Content */}
            <div className="relative text-center animate-pulse">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mx-auto w-3/4"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mx-auto w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 group"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-teal-50 dark:bg-teal-900/20 rounded-xl opacity-50" />
            
            {/* Content */}
            <div className="relative text-center">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">
                  {stat.title}
                </h3>
                
                <p className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400 leading-tight">
                  {stat.format === 'currency' 
                    ? formatNumber(stat.value, 'currency')
                    : stat.format === 'percent'
                    ? formatNumber(stat.value, 'percent') 
                    : formatNumber(stat.value)
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default EmprestitoStats

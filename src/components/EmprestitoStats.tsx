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
      title: 'Bancos Participantes',
      value: totalBancos,
      icon: Building2,
      gradient: CATEGORIES.emprestito.gradient,
      format: 'number'
    },
    {
      title: 'Valor Total Contratos',
      value: valorTotalContratos,
      icon: DollarSign,
      gradient: CATEGORIES.emprestito.gradient,
      format: 'currency'
    }
  ]

  if (loading) {
    return (
      <div className="flex gap-1 md:gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="relative bg-white dark:bg-gray-800 rounded-xl p-2 md:p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex-1"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-teal-50 dark:bg-teal-900/20 rounded-xl opacity-50" />
            
            {/* Content */}
            <div className="relative text-center animate-pulse">
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mx-auto w-3/4"></div>
                <div className="h-6 md:h-8 bg-gray-300 dark:bg-gray-600 rounded mx-auto w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-1 md:gap-2">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl p-2 md:p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 group flex-1"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-teal-50 dark:bg-teal-900/20 rounded-xl opacity-50" />
            
            {/* Content */}
            <div className="relative text-center">
              <div className="space-y-1 md:space-y-2">
                <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-teal-600 dark:text-teal-400 leading-tight break-words">
                  {stat.format === 'currency' && stat.title === 'Valor Total Contratos'
                    ? stat.value.toLocaleString('es-CO', { 
                        style: 'currency', 
                        currency: 'COP', 
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })
                    : stat.format === 'currency' 
                    ? formatNumber(stat.value, 'currency')
                    : stat.format === 'percent'
                    ? formatNumber(stat.value, 'percent') 
                    : formatNumber(stat.value)
                  }
                </p>
                
                <h3 className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">
                  {stat.title}
                </h3>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default EmprestitoStats

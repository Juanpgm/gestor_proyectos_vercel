'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDashboardStats } from '@/context/DashboardContext'
import { useFilteredStats } from '@/hooks/useDataFilters'
import { useContratos } from '@/hooks/useContratos'
import { useProcesos } from '@/hooks/useProcesos'
import { formatCurrency } from '../utils/formatCurrency'
import { CATEGORIES, ANIMATIONS, formatNumber, TYPOGRAPHY, CSS_UTILS } from '@/lib/design-system'
import { DollarSign, Settings } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  category: keyof typeof CATEGORIES
  index: number
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: IconComponent, 
  category,
  index,
  loading = false
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatValue = (val: string | number) => {
    if (!mounted || loading) {
      return '...'
    }
    
    if (typeof val === 'number') {
      return formatNumber(val, 'number')
    }
    
    return val
  }

  const categoryConfig = CATEGORIES[category]

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`${CSS_UTILS.card} ${CSS_UTILS.cardHover} card-tablet p-4 tablet:p-6 md:p-5 min-h-[120px] tablet:min-h-[160px] md:min-h-[140px] tablet-interactive`}
    >
      <section className="flex flex-col h-full">
        {/* Header con ícono - Más grande en tablets */}
        <header className="flex justify-center mb-3 tablet:mb-4">
          <span className={`p-2 tablet:p-4 md:p-2.5 rounded-lg tablet:rounded-xl ${categoryConfig.className.accent} shadow-md tablet:shadow-lg`}>
            <IconComponent className={`w-5 h-5 tablet:w-8 tablet:h-8 md:w-6 md:h-6 ${categoryConfig.className.text}`} />
          </span>
        </header>

        {/* Título - Mejor tipografía para tablets */}
        <h3 className={`${TYPOGRAPHY.h6} tablet:text-tablet-base text-center text-gray-600 dark:text-gray-400 mb-2 tablet:mb-3 line-clamp-2 font-medium tablet:font-semibold`}>
          {title}
        </h3>

        {/* Valor principal - Más grande en tablets */}
        <main className="flex-1 flex items-center justify-center">
          <p className={`${TYPOGRAPHY.h4} tablet:text-3xl font-bold ${categoryConfig.className.text} text-center`}>
            {formatValue(value)}
          </p>
        </main>

        {/* Subtítulo opcional - Mejor espaciado en tablets */}
        {subtitle && (
          <p className={`${TYPOGRAPHY.bodySmall} tablet:text-tablet-sm text-gray-500 dark:text-gray-500 text-center mt-2 tablet:mt-3 line-clamp-1`}>
            {subtitle}
          </p>
        )}
      </section>
    </motion.article>
  )
}

const StatsCards: React.FC = () => {
  const dashboardStats = useDashboardStats()
  const filteredStats = useFilteredStats()
  
  // Obtener datos de contratos y procesos
  const contratosState = useContratos()
  const procesosState = useProcesos()
  
  // Detectar loading
  const loading = dashboardStats.loading || filteredStats.loading || contratosState.loading || procesosState.loading

  const statsData = [
    {
      title: 'Proyectos de Inversión',
      value: filteredStats.stats.totalProyectos || 0,
      subtitle: 'Total registrados',
      icon: CATEGORIES.projects.icon,
      category: 'projects' as const
    },
    {
      title: 'Actividades',
      value: filteredStats.stats.totalActividades || 0,
      subtitle: 'En ejecución',
      icon: CATEGORIES.activities.icon,
      category: 'activities' as const
    },
    {
      title: 'Productos Esperados',
      value: filteredStats.stats.totalProductos || 0,
      subtitle: 'Por entregar',
      icon: CATEGORIES.products.icon,
      category: 'products' as const
    },
    {
      title: 'Contratos',
      value: contratosState.metrics.totalContratos || 0,
      subtitle: 'Total registrados',
      icon: DollarSign,
      category: 'contracts' as const
    },
    {
      title: 'Procesos',
      value: procesosState.metrics.totalProcesos || 0,
      subtitle: 'En SECOP',
      icon: Settings,
      category: 'procesos' as const
    }
  ]

  return (
    <motion.section 
      className="grid grid-cols-2 tablet:grid-cols-3 tablet-lg:grid-cols-5 md:grid-cols-3 lg:grid-cols-6 gap-3 tablet:gap-6 md:gap-4 lg:gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {statsData.map((stat, index) => (
        <StatCard
          key={stat.title}
          index={index}
          loading={loading}
          {...stat}
        />
      ))}
    </motion.section>
  )
}

export default StatsCards

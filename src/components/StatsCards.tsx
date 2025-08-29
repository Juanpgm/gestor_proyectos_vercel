'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDashboardStats } from '@/context/DashboardContext'
import { useFilteredStats } from '@/hooks/useDataFilters'
import { formatCurrency } from '../utils/formatCurrency'
import { CATEGORIES, ANIMATIONS, formatNumber, TYPOGRAPHY, CSS_UTILS } from '@/lib/design-system'
import { DollarSign } from 'lucide-react'

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`${CSS_UTILS.card} ${CSS_UTILS.cardHover} p-4 md:p-5 min-h-[120px] md:min-h-[140px]`}
    >
      <div className="flex flex-col h-full">
        {/* Header con ícono */}
        <div className="flex justify-center mb-3">
          <div className={`p-2 md:p-2.5 rounded-lg ${categoryConfig.className.accent} shadow-md`}>
            <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${categoryConfig.className.text}`} />
          </div>
        </div>

        {/* Título */}
        <h3 className={`${TYPOGRAPHY.h6} text-center text-gray-600 dark:text-gray-400 mb-2 line-clamp-2`}>
          {title}
        </h3>

        {/* Valor principal */}
        <div className="flex-1 flex items-center justify-center">
          <p className={`${TYPOGRAPHY.h4} font-bold ${categoryConfig.className.text} text-center`}>
            {formatValue(value)}
          </p>
        </div>

        {/* Subtítulo opcional */}
        {subtitle && (
          <p className={`${TYPOGRAPHY.bodySmall} text-gray-500 dark:text-gray-500 text-center mt-2 line-clamp-1`}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}

const StatsCards: React.FC = () => {
  const dashboardStats = useDashboardStats()
  const filteredStats = useFilteredStats()
  
  // Detectar loading
  const loading = dashboardStats.loading || filteredStats.loading

  const statsData = [
    {
      title: 'Proyectos de Inversión',
      value: filteredStats.stats.totalProyectos || 0,
      subtitle: 'Total registrados',
      icon: CATEGORIES.projects.icon,
      category: 'projects' as const
    },
    {
      title: 'Unidades de Proyecto',  
      value: filteredStats.stats.totalUnidadesProyecto || 0,
      subtitle: 'En seguimiento',
      icon: CATEGORIES.project_units.icon,
      category: 'project_units' as const
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
      value: 0,
      subtitle: 'En desarrollo',
      icon: DollarSign,
      category: 'projects' as const
    }
  ]

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6"
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
    </motion.div>
  )
}

export default StatsCards

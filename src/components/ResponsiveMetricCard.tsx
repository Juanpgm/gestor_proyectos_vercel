'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { CATEGORIES, ANIMATIONS, TYPOGRAPHY, CSS_UTILS, formatNumber } from '@/lib/design-system'

interface ResponsiveMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  category: keyof typeof CATEGORIES
  index?: number
  loading?: boolean
  trend?: {
    value: number
    isPositive: boolean
  }
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'vertical' | 'horizontal'
}

const ResponsiveMetricCard: React.FC<ResponsiveMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  category,
  index = 0,
  loading = false,
  trend,
  size = 'md',
  orientation = 'vertical'
}) => {
  const categoryConfig = CATEGORIES[category]
  
  const sizeConfig = {
    sm: {
      container: 'min-h-[80px] p-3',
      icon: 'w-4 h-4 p-1.5',
      title: TYPOGRAPHY.caption,
      value: TYPOGRAPHY.h6,
      subtitle: 'text-xs'
    },
    md: {
      container: 'min-h-[90px] md:min-h-[100px] p-3 md:p-4',
      icon: 'w-4 h-4 md:w-5 md:h-5 p-1.5 md:p-2',
      title: TYPOGRAPHY.bodySmall,
      value: TYPOGRAPHY.h5,
      subtitle: TYPOGRAPHY.caption
    },
    lg: {
      container: 'min-h-[120px] p-5',
      icon: 'w-5 h-5 md:w-6 md:h-6 p-2 md:p-2.5',
      title: TYPOGRAPHY.h6,
      value: TYPOGRAPHY.h4,
      subtitle: TYPOGRAPHY.bodySmall
    }
  }

  const config = sizeConfig[size]

  const formatValue = (val: string | number) => {
    if (loading) return '...'
    if (typeof val === 'number') {
      return formatNumber(val, 'number')
    }
    return val
  }

  if (orientation === 'horizontal') {
    return (
      <motion.article
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        className={`${CSS_UTILS.card} ${CSS_UTILS.cardHover} ${config.container} flex items-center`}
      >
        {/* Ícono a la izquierda */}
        <span className={`${categoryConfig.className.accent} rounded-lg shadow-md flex-shrink-0 mr-3`}>
          <Icon className={`${config.icon.replace('p-', '')} ${categoryConfig.className.text}`} />
        </span>

        {/* Contenido principal */}
        <section className="flex-1 min-w-0">
          <h3 className={`${config.title} text-gray-600 dark:text-gray-400 mb-1 line-clamp-1`}>
            {title}
          </h3>
          
          <p className="flex items-baseline gap-2">
            <span className={`${config.value} font-bold ${categoryConfig.className.text} truncate`}>
              {formatValue(value)}
            </span>
            
            {trend && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                trend.isPositive 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </p>
        </section>
      </motion.article>
    )
  }

  // Orientación vertical (por defecto)
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`${CSS_UTILS.card} ${CSS_UTILS.cardHover} ${config.container} flex flex-col`}
    >
      {/* Header con ícono y trend */}
      <header className="flex justify-between items-start mb-2">
        <span className={`${categoryConfig.className.accent} rounded-lg shadow-md flex-shrink-0`}>
          <Icon className={`${config.icon} ${categoryConfig.className.text}`} />
        </span>
        
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trend.isPositive 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </header>

      {/* Título */}
      <h3 className={`${config.title} text-center text-gray-600 dark:text-gray-400 mb-1 line-clamp-2`}>
        {title}
      </h3>

      {/* Valor principal */}
      <main className="flex-1 flex items-center justify-center">
        <p className={`${config.value} font-bold ${categoryConfig.className.text} text-center`}>
          {formatValue(value)}
        </p>
      </main>
    </motion.article>
  )
}

export default ResponsiveMetricCard

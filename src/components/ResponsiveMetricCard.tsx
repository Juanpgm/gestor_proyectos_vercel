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
      container: 'min-h-[100px] p-3',
      icon: 'w-4 h-4 p-1.5',
      title: TYPOGRAPHY.caption,
      value: TYPOGRAPHY.h6,
      subtitle: 'text-xs'
    },
    md: {
      container: 'min-h-[120px] md:min-h-[140px] p-4 md:p-5',
      icon: 'w-5 h-5 md:w-6 md:h-6 p-2 md:p-2.5',
      title: TYPOGRAPHY.h6,
      value: TYPOGRAPHY.h4,
      subtitle: TYPOGRAPHY.bodySmall
    },
    lg: {
      container: 'min-h-[160px] p-6',
      icon: 'w-6 h-6 md:w-8 md:h-8 p-3',
      title: TYPOGRAPHY.h5,
      value: TYPOGRAPHY.h3,
      subtitle: TYPOGRAPHY.body
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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        className={`${CSS_UTILS.card} ${CSS_UTILS.cardHover} ${config.container} flex items-center`}
      >
        {/* Ícono a la izquierda */}
        <div className={`${categoryConfig.className.accent} rounded-lg shadow-md flex-shrink-0 mr-4`}>
          <Icon className={`${config.icon.replace('p-', '')} ${categoryConfig.className.text}`} />
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          <h3 className={`${config.title} text-gray-600 dark:text-gray-400 mb-1 line-clamp-2`}>
            {title}
          </h3>
          
          <div className="flex items-baseline gap-2 mb-1">
            <p className={`${config.value} font-bold ${categoryConfig.className.text} truncate`}>
              {formatValue(value)}
            </p>
            
            {trend && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                trend.isPositive 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>

          {subtitle && (
            <p className={`${config.subtitle} text-gray-500 dark:text-gray-500 line-clamp-1`}>
              {subtitle}
            </p>
          )}
        </div>
      </motion.div>
    )
  }

  // Orientación vertical (por defecto)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`${CSS_UTILS.card} ${CSS_UTILS.cardHover} ${config.container} flex flex-col`}
    >
      {/* Header con ícono y trend */}
      <div className="flex justify-between items-start mb-3">
        <div className={`${categoryConfig.className.accent} rounded-lg shadow-md flex-shrink-0`}>
          <Icon className={`${config.icon} ${categoryConfig.className.text}`} />
        </div>
        
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trend.isPositive 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>

      {/* Título */}
      <h3 className={`${config.title} text-center text-gray-600 dark:text-gray-400 mb-2 line-clamp-2`}>
        {title}
      </h3>

      {/* Valor principal */}
      <div className="flex-1 flex items-center justify-center">
        <p className={`${config.value} font-bold ${categoryConfig.className.text} text-center`}>
          {formatValue(value)}
        </p>
      </div>

      {/* Subtítulo opcional */}
      {subtitle && (
        <p className={`${config.subtitle} text-gray-500 dark:text-gray-500 text-center mt-2 line-clamp-1`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

export default ResponsiveMetricCard

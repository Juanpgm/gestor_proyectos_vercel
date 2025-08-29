'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { formatCurrencyFull } from '@/utils/formatCurrency'
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface CompactMetricsCardProps {
  title: string
  value: number
  subtitle?: string
  percentage?: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  trend?: 'up' | 'down' | 'neutral'
  delay?: number
}

const CompactMetricsCard: React.FC<CompactMetricsCardProps> = ({
  title,
  value,
  subtitle,
  percentage,
  icon,
  color,
  trend = 'neutral',
  delay = 0
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      light: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      bg: 'bg-green-500',
      light: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    orange: {
      bg: 'bg-orange-500',
      light: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800'
    },
    purple: {
      bg: 'bg-purple-500',
      light: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    },
    red: {
      bg: 'bg-red-500',
      light: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    }
  }

  const trendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border ${colorClasses[color].border} hover:shadow-md transition-all duration-300 group`}
    >
      {/* Background pattern */}
      <div className={`absolute inset-0 ${colorClasses[color].light} rounded-xl opacity-50`} />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 ${colorClasses[color].bg} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          {trendIcon && (
            <div className={`${trendColor}`}>
              {React.createElement(trendIcon, { size: 16 })}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">
            {title}
          </h3>
          
          <div className="space-y-1">
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {formatCurrencyFull(value)}
            </p>
            
            {subtitle && (
              <p className={`text-xs font-medium ${colorClasses[color].text}`}>
                {subtitle}
              </p>
            )}
            
            {percentage !== undefined && (
              <div className="flex items-center gap-1">
                <span className={`text-xs font-semibold ${colorClasses[color].text}`}>
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  del total
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default CompactMetricsCard

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { formatCurrencyCompact } from '../utils/formatCurrency'

interface CompactMetricsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  index?: number
  loading?: boolean
}

const CompactMetricsCard: React.FC<CompactMetricsCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'from-blue-500 to-blue-600',
  trend,
  index = 0,
  loading = false
}) => {
  const formatValue = (val: number | string) => {
    if (loading) return '...'
    if (typeof val === 'number') {
      return formatCurrencyCompact(val)
    }
    return val
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-r ${color} rounded-lg p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs opacity-90 mb-1 font-medium uppercase tracking-wide">
            {title}
          </p>
          <p className="text-lg md:text-xl font-bold truncate">
            {formatValue(value)}
          </p>
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                trend.isPositive 
                  ? 'bg-white/20 text-white'
                  : 'bg-black/20 text-white'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className="ml-3">
          <Icon className="w-6 h-6 md:w-7 md:h-7 opacity-80" />
        </div>
      </div>
    </motion.div>
  )
}

export default CompactMetricsCard
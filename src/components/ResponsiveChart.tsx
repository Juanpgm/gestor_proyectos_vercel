'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line 
} from 'recharts'
import { LucideIcon, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react'
import { CATEGORIES, ANIMATIONS, TYPOGRAPHY, CSS_UTILS, CHART_COLORS } from '@/lib/design-system'

interface ResponsiveChartProps {
  title: string
  data: any[]
  type?: 'pie' | 'bar' | 'line'
  category: keyof typeof CATEGORIES
  loading?: boolean
  height?: number
  showLegend?: boolean
  showControls?: boolean
  dataKey?: string
  nameKey?: string
  className?: string
  compact?: boolean
}

const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  title,
  data,
  type = 'bar',
  category,
  loading = false,
  height = 300,
  showLegend = true,
  showControls = true,
  dataKey = 'value',
  nameKey = 'name',
  className = '',
  compact = false
}) => {
  const [activeType, setActiveType] = useState(type)
  const categoryConfig = CATEGORIES[category]

  const chartTypes = [
    { id: 'bar', icon: BarChart3, label: 'Barras' },
    { id: 'pie', icon: PieIcon, label: 'Circular' },
    { id: 'line', icon: TrendingUp, label: 'Líneas' }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${CSS_UTILS.card} p-3 shadow-lg max-w-xs`}>
          <p className={`${TYPOGRAPHY.h6} font-semibold text-gray-900 dark:text-white mb-2`}>
            {label || payload[0]?.payload?.[nameKey]}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className={`${TYPOGRAPHY.bodySmall} text-gray-600 dark:text-gray-300`}>
                {entry.name || 'Valor'}:{' '}
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    if (loading || !data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-gray-400">
            Cargando gráfico...
          </div>
        </div>
      )
    }

    switch (activeType) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 20 : 40}
              outerRadius={compact ? 50 : 80}
              paddingAngle={2}
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        )

      case 'line':
        return (
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600 opacity-30" />
            <XAxis 
              dataKey={nameKey} 
              tick={{ fontSize: compact ? 10 : 12, fill: '#6b7280' }}
              className="dark:fill-gray-300"
              angle={compact ? -45 : 0}
              textAnchor={compact ? "end" : "middle"}
              height={compact ? 40 : 20}
            />
            <YAxis 
              hide={compact}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              className="dark:fill-gray-300"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={categoryConfig.color.primary}
              strokeWidth={2}
              dot={{ r: compact ? 3 : 4, fill: categoryConfig.color.primary }}
              activeDot={{ r: compact ? 5 : 6 }}
            />
          </LineChart>
        )

      case 'bar':
      default:
        return (
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: compact ? 40 : 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600 opacity-30" />
            <XAxis 
              dataKey={nameKey} 
              tick={{ fontSize: compact ? 9 : 11, fill: '#6b7280' }}
              className="dark:fill-gray-300"
              angle={compact ? -45 : 0}
              textAnchor={compact ? "end" : "middle"}
              height={compact ? 40 : 20}
            />
            <YAxis 
              hide={compact}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              className="dark:fill-gray-300"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey} 
              fill={categoryConfig.color.primary}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        )
    }
  }

  return (
    <motion.div
      {...ANIMATIONS.slideUp}
      className={`${CSS_UTILS.card} flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${categoryConfig.className.accent} rounded-lg`}>
              {chartTypes.find(t => t.id === activeType)?.icon && (
                React.createElement(chartTypes.find(t => t.id === activeType)!.icon, {
                  className: `w-4 h-4 md:w-5 md:h-5 ${categoryConfig.className.text}`
                })
              )}
            </div>
            <div>
              <h3 className={`${compact ? TYPOGRAPHY.h6 : TYPOGRAPHY.h5} font-semibold text-gray-900 dark:text-white`}>
                {title}
              </h3>
              <p className={`${TYPOGRAPHY.bodySmall} text-gray-600 dark:text-gray-400`}>
                {data?.length || 0} elementos
              </p>
            </div>
          </div>

          {/* Controles de tipo de gráfico */}
          {showControls && !compact && (
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {chartTypes.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveType(id as any)}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    activeType === id
                      ? `${categoryConfig.className.button} shadow-sm`
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600'
                  }`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Área del gráfico */}
      <div className="flex-1 p-4 md:p-6" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Leyenda compacta para móvil */}
      {showLegend && activeType === 'pie' && data && data.length > 0 && (
        <div className="px-4 md:px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {data.slice(0, compact ? 4 : 8).map((entry, index) => (
              <div key={entry[nameKey]} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className={`${TYPOGRAPHY.caption} text-gray-600 dark:text-gray-400 truncate`}>
                  {entry[nameKey]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ResponsiveChart

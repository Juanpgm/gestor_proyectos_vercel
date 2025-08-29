'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ANIMATIONS } from '@/lib/design-system'

interface SkeletonProps {
  className?: string
  animate?: boolean
  style?: React.CSSProperties
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  animate = true,
  style 
}) => {
  return (
    <div 
      className={`bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
      style={style}
    />
  )
}

interface LoadingCardProps {
  className?: string
  lines?: number
  showIcon?: boolean
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  className = '', 
  lines = 3,
  showIcon = true 
}) => {
  return (
    <motion.div
      {...ANIMATIONS.slideUp}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 ${className}`}
    >
      {/* Header con ícono */}
      {showIcon && (
        <div className="flex justify-center mb-4">
          <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg" />
        </div>
      )}
      
      {/* Líneas de contenido */}
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton 
            key={i}
            className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    </motion.div>
  )
}

interface LoadingTableProps {
  rows?: number
  columns?: number
  className?: string
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ 
  rows = 5, 
  columns = 4,
  className = '' 
}) => {
  return (
    <motion.div
      {...ANIMATIONS.fadeIn}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={`h-4 ${colIndex === 0 ? 'w-full' : 'w-16'}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

interface LoadingChartProps {
  className?: string
  type?: 'bar' | 'pie' | 'line'
}

export const LoadingChart: React.FC<LoadingChartProps> = ({ 
  className = '',
  type = 'bar'
}) => {
  return (
    <motion.div
      {...ANIMATIONS.scale}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Chart Area */}
      <div className="h-64 flex items-end justify-center space-x-2">
        {type === 'bar' && (
          <>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton 
                key={i}
                className="w-8"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </>
        )}
        
        {type === 'pie' && (
          <Skeleton className="w-40 h-40 rounded-full" />
        )}
        
        {type === 'line' && (
          <Skeleton className="w-full h-32" />
        )}
      </div>
    </motion.div>
  )
}

interface LoadingStatsProps {
  count?: number
  className?: string
}

export const LoadingStats: React.FC<LoadingStatsProps> = ({ 
  count = 5,
  className = '' 
}) => {
  return (
    <motion.div
      {...ANIMATIONS.stagger}
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 ${className}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <LoadingCard key={i} lines={2} showIcon={true} />
      ))}
    </motion.div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = '',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <motion.div
      {...ANIMATIONS.fadeIn}
      className={`flex flex-col items-center justify-center ${className}`}
    >
      <div 
        className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {text}
        </p>
      )}
    </motion.div>
  )
}

// Componente para errores con animación
interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error al cargar',
  message = 'Ha ocurrido un error inesperado',
  onRetry,
  className = ''
}) => {
  return (
    <motion.div
      {...ANIMATIONS.scale}
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
        {message}
      </p>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </motion.button>
      )}
    </motion.div>
  )
}

// Componente para estados vacíos
interface EmptyStateProps {
  title?: string
  message?: string
  action?: React.ReactNode
  className?: string
  icon?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No hay datos',
  message = 'No se encontraron elementos para mostrar',
  action,
  className = '',
  icon = '📋'
}) => {
  return (
    <motion.div
      {...ANIMATIONS.fadeIn}
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {message}
      </p>
      {action}
    </motion.div>
  )
}

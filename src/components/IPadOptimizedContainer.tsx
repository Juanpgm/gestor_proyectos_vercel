'use client'

import React from 'react'
import { useIPadClasses } from '@/hooks/useIPadDetection'

interface IPadOptimizedContainerProps {
  children: React.ReactNode
  className?: string
  type?: 'default' | 'grid' | 'table' | 'card'
  cols?: number
}

export const IPadOptimizedContainer: React.FC<IPadOptimizedContainerProps> = ({
  children,
  className = '',
  type = 'default',
  cols = 3
}) => {
  const { deviceInfo, getResponsiveClasses } = useIPadClasses()

  const getTypeClasses = () => {
    switch (type) {
      case 'grid':
        if (deviceInfo.isIpad10) {
          const gridCols = deviceInfo.isIpadLandscape ? Math.min(5, cols) : Math.min(3, cols)
          return `grid grid-cols-1 sm:grid-cols-2 ipad-10:grid-cols-${gridCols} lg:grid-cols-${cols}`
        }
        return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(3, cols)} lg:grid-cols-${cols}`
      
      case 'table':
        return 'overflow-x-auto'
      
      case 'card':
        return getResponsiveClasses(
          'bg-white dark:bg-gray-800 rounded-xl shadow-lg',
          'p-4',
          'p-6',
          'p-6',
          'p-5'
        )
      
      default:
        return ''
    }
  }

  const baseClasses = getTypeClasses()
  const finalClasses = `${baseClasses} ${className}`.trim()

  return (
    <div className={finalClasses}>
      {children}
    </div>
  )
}

interface IPadOptimizedTableProps {
  children: React.ReactNode
  className?: string
}

export const IPadOptimizedTable: React.FC<IPadOptimizedTableProps> = ({
  children,
  className = ''
}) => {
  const { getTableClasses } = useIPadClasses()

  return (
    <div className="overflow-x-auto">
      <table className={`w-full table-fixed ${getTableClasses()} ${className}`}>
        {children}
      </table>
    </div>
  )
}

interface IPadOptimizedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export const IPadOptimizedButton: React.FC<IPadOptimizedButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const { getTouchTargetClasses, deviceInfo } = useIPadClasses()

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const getSizeClasses = () => {
    if (deviceInfo.isIpad10) {
      switch (size) {
        case 'sm':
          return 'px-3 py-2 text-sm'
        case 'lg':
          return 'px-6 py-4 text-lg'
        default:
          return 'px-5 py-3 text-base'
      }
    }
    
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm'
      case 'lg':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${getTouchTargetClasses()}
    ${getVariantClasses()}
    ${getSizeClasses()}
  `.trim().replace(/\s+/g, ' ')

  const finalClasses = `${baseClasses} ${className}`.trim()

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={finalClasses}
      style={{
        minHeight: deviceInfo.isTouch ? '44px' : 'auto',
        minWidth: deviceInfo.isTouch ? '44px' : 'auto'
      }}
    >
      {children}
    </button>
  )
}

export default IPadOptimizedContainer
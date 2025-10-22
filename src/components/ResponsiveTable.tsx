/**
 * Componente de tabla optimizada para tablets
 * Incluye mejores controles táctiles, spacing y responsividad
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getTabletClasses, getResponsiveClasses, useTabletDetection } from '@/lib/tablet-responsive'

interface Column<T> {
  key: keyof T
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
  mobileHidden?: boolean
  tabletHidden?: boolean
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onRowClick?: (item: T) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
  className?: string
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRowClick,
  pagination,
  className = ''
}: ResponsiveTableProps<T>) {
  const { isTablet, isPortrait, isTouch } = useTabletDetection()
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filtrar columnas según el dispositivo
  const visibleColumns = columns.filter(col => {
    if (isTablet && isPortrait && col.tabletHidden) return false
    if (!isTablet && col.mobileHidden) return false
    return true
  })

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data
    
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      return 0
    })
  }, [data, sortKey, sortDirection])

  if (loading) {
    return (
      <div className={getResponsiveClasses({
        mobile: 'p-4',
        tablet: 'p-6',
        desktop: 'p-8'
      })}>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Renderizado móvil (cards)
  if (!isTablet && window.innerWidth < 768) {
    return (
      <div className={`space-y-4 ${className}`}>
        {sortedData.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`${getTabletClasses.card(!!onRowClick)} ${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={() => onRowClick?.(item)}
          >
            {visibleColumns.map((column) => (
              <div key={String(column.key)} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                  {column.header}
                </span>
                <span className="text-gray-900 dark:text-white text-sm">
                  {column.render ? column.render(item) : String(item[column.key])}
                </span>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    )
  }

  // Renderizado tablet/desktop (tabla)
  return (
    <div className={`${getResponsiveClasses({
      tablet: 'overflow-hidden',
      desktop: 'overflow-x-auto'
    })} ${className}`}>
      <div className={getTabletClasses.card(false)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {visibleColumns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`text-left py-4 px-6 font-semibold text-gray-900 dark:text-white ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
                    } ${getResponsiveClasses({
                      tablet: 'py-6 px-8 text-lg',
                      desktop: 'py-4 px-6 text-base'
                    })}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortKey === column.key && (
                        <span className="text-blue-500">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${getResponsiveClasses({
                    touch: 'active:bg-gray-100 dark:active:bg-gray-700',
                    noTouch: 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  })}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`py-4 px-6 text-gray-900 dark:text-white ${getResponsiveClasses({
                        tablet: 'py-6 px-8 text-lg',
                        desktop: 'py-4 px-6 text-base'
                      })}`}
                    >
                      {column.render ? column.render(item) : String(item[column.key])}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación optimizada para tablets */}
        {pagination && (
          <div className={`mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6 ${getResponsiveClasses({
            tablet: 'flex-col gap-4',
            desktop: 'flex-row'
          })}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Filas por página:
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                className={getTabletClasses.input()}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={getTabletClasses.button('outline')}
              >
                Anterior
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                className={getTabletClasses.button('outline')}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResponsiveTable
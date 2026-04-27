'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react'
import { 
  PagoEmprestito,
  formatCurrency,
  formatDate,
  formatDateTime
} from '@/services/pagos.service'

// Interfaz para filtros de columna
interface ColumnFilter {
  [key: string]: string[]
}

interface Column {
  key: keyof PagoEmprestito | 'acciones'
  label: string
  isSortable: boolean
}

interface PagosTableProps {
  pagos: PagoEmprestito[]
  loading: boolean
  onRefresh: () => void
}

const PagosTable: React.FC<PagosTableProps> = ({ pagos, loading, onRefresh }) => {
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [showFilters, setShowFilters] = useState<{[key: string]: boolean}>({})
  const [sortKey, setSortKey] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [columnSearchTerm, setColumnSearchTerm] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'numero_rpc',
    'referencia_contrato',
    'nombre_centro_gestor',
    'valor_pago',
    'fecha_transaccion',
    'estado',
    'fecha_registro'
  ]))
  const itemsPerPage = 20

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey)
      } else {
        newSet.add(columnKey)
      }
      return newSet
    })
  }

  const clearColumnFilter = (columnKey: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[columnKey]
      return newFilters
    })
  }

  const toggleColumnFilter = (columnKey: string, value: string) => {
    setColumnFilters(prev => {
      const currentFilters = prev[columnKey] || []
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value]
      
      return newFilters.length > 0
        ? { ...prev, [columnKey]: newFilters }
        : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== columnKey))
    })
    setCurrentPage(1)
  }

  const getUniqueValuesForColumn = (columnKey: string): string[] => {
    const values = pagos
      .map(item => {
        const value = item[columnKey as keyof typeof item]
        return value !== null && value !== undefined ? String(value) : ''
      })
    return Array.from(new Set(values)).sort()
  }

  const filteredData = useMemo(() => {
    let filtered = [...pagos]

    // Aplicar bÃºsqueda global
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Aplicar filtros por columna
    Object.entries(columnFilters).forEach(([columnKey, filterValues]) => {
      if (filterValues.length > 0) {
        filtered = filtered.filter(item => {
          const itemValue = item[columnKey as keyof typeof item]
          const valueStr = itemValue !== null && itemValue !== undefined ? String(itemValue) : ''
          return filterValues.includes(valueStr)
        })
      }
    })

    // Aplicar ordenamiento
    if (sortKey) {
      filtered.sort((a, b) => {
        const aValue = a[sortKey as keyof PagoEmprestito]
        const bValue = b[sortKey as keyof PagoEmprestito]
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        }
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      })
    }

    return filtered
  }, [pagos, searchTerm, sortKey, sortDirection, columnFilters])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />
  }

  const handleRefresh = () => {
    setCurrentPage(1)
    onRefresh()
  }

  const columns: Column[] = [
    { key: 'numero_rpc', label: 'NÃºmero RPC', isSortable: true },
    { key: 'referencia_contrato', label: 'Referencia Contrato', isSortable: true },
    { key: 'nombre_centro_gestor', label: 'Centro Gestor', isSortable: true },
    { key: 'valor_pago', label: 'Valor Pago', isSortable: true },
    { key: 'fecha_transaccion', label: 'Fecha TransacciÃ³n', isSortable: true },
    { key: 'estado', label: 'Estado', isSortable: true },
    { key: 'tipo', label: 'Tipo', isSortable: true },
    { key: 'fecha_registro', label: 'Fecha Registro', isSortable: true },
    { key: 'fecha_creacion', label: 'Fecha CreaciÃ³n', isSortable: true },
    { key: 'fecha_actualizacion', label: 'Fecha ActualizaciÃ³n', isSortable: true },
  ]

  const visibleColumnsList = columns.filter(col => visibleColumns.has(col.key))

  if (loading && pagos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando pagos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {(searchTerm || Object.values(columnFilters).some(f => f?.length > 0)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          {searchTerm && (
            <div className="flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
              <span>BÃºsqueda: &quot;{searchTerm}&quot;</span>
              <button
                onClick={() => setSearchTerm('')}
                className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {Object.entries(columnFilters).map(([column, values]) => (
            values.length > 0 && (
              <div
                key={column}
                className="flex items-center bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm"
              >
                <span>{columns.find(c => c.key === column)?.label}: {values.length} filtro(s)</span>
                <button
                  onClick={() => clearColumnFilter(column)}
                  className="ml-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          ))}
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-md shadow-none border border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por RPC, contrato, centro gestor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Selector de columnas */}
            <div className="relative" data-column-selector>
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Columnas</span>
              </button>
              
              {showColumnSelector && (
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-64 max-w-80">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mostrar Columnas
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setVisibleColumns(new Set(columns.map(c => c.key)))}
                          className="text-xs px-2 py-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          Todas
                        </button>
                        <button
                          onClick={() => setVisibleColumns(new Set(['numero_rpc']))}
                          className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          Ninguna
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar columna..."
                          value={columnSearchTerm}
                          onChange={(e) => setColumnSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {columns.filter(col => 
                        col.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
                      ).map((column) => {
                        const isVisible = visibleColumns.has(column.key)
                        return (
                          <label
                            key={column.key}
                            className="flex items-center space-x-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => toggleColumnVisibility(column.key)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                              {column.label}
                            </span>
                            {isVisible ? (
                              <Eye className="w-4 h-4 text-blue-500" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(Object.values(columnFilters).some(filters => filters.length > 0) || searchTerm) && (
              <button
                onClick={() => {
                  setColumnFilters({})
                  setSearchTerm('')
                  setCurrentPage(1)
                }}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar Filtros
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-md shadow-none border border-gray-200 dark:border-gray-700"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                {visibleColumnsList.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                  >
                    <div className="flex items-center justify-between space-x-1">
                      {column.isSortable ? (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors flex-1"
                        >
                          <span>{column.label}</span>
                          {getSortIcon(column.key)}
                        </button>
                      ) : (
                        <span>{column.label}</span>
                      )}
                      
                      {/* BotÃ³n de filtro */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowFilters(prev => ({ ...prev, [column.key]: !prev[column.key] }))
                          }}
                          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                            columnFilters[column.key]?.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                        
                        {showFilters[column.key] && (
                          <div
                            className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-48 max-w-64"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="p-2 max-h-64 overflow-y-auto">
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
                                Filtrar por {column.label}
                              </div>
                              {getUniqueValuesForColumn(column.key).map(value => (
                                <label
                                  key={value}
                                  className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={columnFilters[column.key]?.includes(value) || false}
                                    onChange={() => toggleColumnFilter(column.key, value)}
                                    className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-900 dark:text-gray-100 truncate">
                                    {value}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumnsList.length}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm ? 'No se encontraron resultados para la bÃºsqueda' : 'No hay pagos registrados'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((pago, index) => (
                  <motion.tr
                    key={pago.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {visibleColumnsList.map((column) => {
                      const value = pago[column.key as keyof PagoEmprestito]
                      
                      return (
                        <td
                          key={column.key}
                          className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100"
                        >
                          {column.key === 'valor_pago' 
                            ? <span className="font-semibold">{formatCurrency(value as number)}</span>
                            : column.key === 'fecha_transaccion'
                            ? formatDate(value as string)
                            : column.key === 'fecha_registro' || column.key === 'fecha_creacion' || column.key === 'fecha_actualizacion'
                            ? formatDateTime(value as string)
                            : column.key === 'estado'
                            ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                value === 'registrado' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : value === 'procesado'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                              }`}>
                                {value !== null && value !== undefined ? String(value) : 'N/A'}
                              </span>
                            )
                            : column.key === 'numero_rpc'
                            ? <span className="font-medium">{value !== null && value !== undefined ? String(value) : 'N/A'}</span>
                            : (value !== null && value !== undefined ? String(value) : 'N/A')}
                        </td>
                      )
                    })}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">
                PÃ¡gina {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default PagosTable

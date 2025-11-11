'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  RefreshCw,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  FileText,
  Calendar,
  Building,
  TrendingUp,
  CheckCircle,
  CreditCard,
  Wallet,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react'
import PagosTable from './PagosTable'
import { fetchPagosEmprestito, PagoEmprestito } from '@/services/pagos.service'

interface RPC {
  id: string
  numero_rpc: string
  beneficiario_id?: string
  beneficiario_nombre?: string
  descripcion_rpc?: string
  fecha_contabilizacion?: string
  fecha_impresion?: string
  estado_liberacion?: string
  bp?: string
  valor_rpc?: number
  cdp_asociados?: string[]
  programacion_pac?: {[key: string]: string}
  nombre_centro_gestor?: string
  referencia_contrato?: string
  fecha_creacion?: string
  fecha_actualizacion?: string
  estado?: string
  tipo?: string
}

// Interfaz para filtros de columna
interface ColumnFilter {
  [key: string]: string[]
}

interface Column {
  key: string
  label: string
  isSortable: boolean
}

interface GestionPagosProps {
  onNavigateHome: () => void
}

const GestionPagos: React.FC<GestionPagosProps> = ({ onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<'rpcs' | 'pagos'>('rpcs')
  const [rpcs, setRpcs] = useState<RPC[]>([])
  const [pagos, setPagos] = useState<PagoEmprestito[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPagos, setLoadingPagos] = useState(true)
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
    'beneficiario_nombre',
    'nombre_centro_gestor',
    'valor_rpc',
    'estado_liberacion',
    'fecha_contabilizacion',
    'bp'
  ]))
  const itemsPerPage = 20

  const fetchRPCs = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) throw new Error('URL de API no configurada')
      const response = await fetch(`${apiUrl}/rpc_all`)
      if (!response.ok) throw new Error(`Error ${response.status}`)
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setRpcs(data.data)
      }
    } catch (error) {
      console.error('Error fetching RPCs:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const fetchPagos = async () => {
    try {
      setLoadingPagos(true)
      const response = await fetchPagosEmprestito()
      setPagos(response.data)
    } catch (error) {
      console.error('Error fetching pagos:', error)
    } finally {
      setLoadingPagos(false)
    }
  }

  useEffect(() => {
    fetchRPCs()
    fetchPagos()
  }, [])

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatCompactCurrency = (value: number) => {
    const absValue = Math.abs(value || 0)
    let compactValue: number
    let suffix: string
    
    if (absValue >= 1_000_000_000_000) {
      compactValue = value / 1_000_000_000_000
      suffix = 'B'
    } else if (absValue >= 1_000_000_000) {
      compactValue = value / 1_000_000_000
      suffix = 'MM'
    } else if (absValue >= 1_000_000) {
      compactValue = value / 1_000_000
      suffix = 'M'
    } else if (absValue >= 1_000) {
      compactValue = value / 1_000
      suffix = 'K'
    } else {
      return formatCurrency(value)
    }
    
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(Math.abs(compactValue))
    
    return (value < 0 ? '-' : '') + formatted + suffix
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-CO')
    } catch {
      return dateString
    }
  }

  const stats = useMemo(() => {
    const totalRPCs = rpcs.length
    const totalValorRPCs = rpcs.reduce((sum, rpc) => sum + (rpc.valor_rpc || 0), 0)
    const totalPagos = pagos.length
    const totalValorPagos = pagos.reduce((sum, pago) => sum + (pago.valor_pago || 0), 0)
    const saldoPorPagar = totalValorRPCs - totalValorPagos
    
    return {
      totalRPCs,
      totalValorRPCs,
      totalPagos,
      totalValorPagos,
      saldoPorPagar
    }
  }, [rpcs, pagos])

  const filteredData = useMemo(() => {
    let filtered = [...rpcs]

    // Aplicar búsqueda global
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
        const aValue = a[sortKey as keyof typeof a]
        const bValue = b[sortKey as keyof typeof b]
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
  }, [rpcs, searchTerm, sortKey, sortDirection, columnFilters])

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
    fetchRPCs()
    fetchPagos()
  }

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
    const values = rpcs
      .map(item => {
        const value = item[columnKey as keyof typeof item]
        return value !== null && value !== undefined ? String(value) : ''
      })
    return Array.from(new Set(values)).sort()
  }

  const columns: Column[] = [
    { key: 'numero_rpc', label: 'Número RPC', isSortable: true },
    { key: 'referencia_contrato', label: 'Referencia Contrato', isSortable: true },
    { key: 'beneficiario_id', label: 'ID Beneficiario', isSortable: true },
    { key: 'beneficiario_nombre', label: 'Beneficiario', isSortable: true },
    { key: 'descripcion_rpc', label: 'Descripción', isSortable: true },
    { key: 'nombre_centro_gestor', label: 'Centro Gestor', isSortable: true },
    { key: 'valor_rpc', label: 'Valor RPC', isSortable: true },
    { key: 'estado_liberacion', label: 'Estado Liberación', isSortable: true },
    { key: 'fecha_contabilizacion', label: 'Fecha Contabilización', isSortable: true },
    { key: 'fecha_impresion', label: 'Fecha Impresión', isSortable: true },
    { key: 'bp', label: 'BP', isSortable: true },
    { key: 'estado', label: 'Estado', isSortable: true },
    { key: 'tipo', label: 'Tipo', isSortable: true },
  ]

  const visibleColumnsList = columns.filter(col => visibleColumns.has(col.key))

  if (loading && rpcs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Pagos</h1>
              <p className="text-green-100">
                Gestión de RPCs y pagos de empréstito
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </motion.div>

      {/* Tabs - Fuera del header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('rpcs')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rpcs'
                ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>RPCs</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pagos')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pagos'
                ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Pagos</span>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards - Globales (Fijas) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-full w-full">
            <div className="flex flex-col justify-center h-full text-left flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Número de RPCs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRPCs}</p>
            </div>
            <FileText className="w-8 h-8 text-indigo-500 ml-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-full w-full">
            <div className="flex flex-col justify-center h-full text-left flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Número de Pagos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPagos}</p>
            </div>
            <CreditCard className="w-8 h-8 text-purple-500 ml-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-full w-full">
            <div className="flex flex-col justify-center h-full text-left flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Valor Total RPCs</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCompactCurrency(stats.totalValorRPCs)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500 ml-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-full w-full">
            <div className="flex flex-col justify-center h-full text-left flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Valor Total Pagos</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCompactCurrency(stats.totalValorPagos)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 ml-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-full w-full">
            <div className="flex flex-col justify-center h-full text-left flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Saldo por Pagar</p>
              <p className={`text-lg font-bold ${
                stats.saldoPorPagar > 0 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : stats.saldoPorPagar < 0 
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {formatCompactCurrency(stats.saldoPorPagar)}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-teal-500 ml-4" />
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'rpcs' ? (
        <>
          {/* Active Filters */}
          {(searchTerm || Object.values(columnFilters).some(f => f?.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              {searchTerm && (
                <div className="flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                  <span>Búsqueda: &quot;{searchTerm}&quot;</span>
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

          {/* Controls - RPCs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar en todos los campos..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                              className="text-xs px-2 py-1 text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors"
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
                              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
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
                                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                                  {column.label}
                                </span>
                                {isVisible ? (
                                  <Eye className="w-4 h-4 text-green-500" />
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

          {/* Table - RPCs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
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
                          <button
                            onClick={() => handleSort(column.key)}
                            className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors flex-1"
                          >
                            <span>{column.label}</span>
                            {getSortIcon(column.key)}
                          </button>
                          
                          {/* Botón de filtro */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowFilters(prev => ({ ...prev, [column.key]: !prev[column.key] }))
                              }}
                              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                                columnFilters[column.key]?.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
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
                                        className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
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
                        {searchTerm || Object.values(columnFilters).some(f => f?.length > 0)
                          ? 'No se encontraron resultados con los filtros aplicados'
                          : 'No hay datos disponibles'}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <motion.tr
                        key={item.id || index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        {visibleColumnsList.map((column) => (
                          <td
                            key={column.key}
                            className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100"
                          >
                            {column.key === 'valor_rpc' 
                              ? formatCurrency(item[column.key as keyof typeof item] as number)
                              : column.key.includes('fecha')
                              ? formatDate(item[column.key as keyof typeof item] as string)
                              : column.key === 'estado_liberacion'
                              ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.estado_liberacion === 'Liberado' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : item.estado_liberacion === 'Parcialmente Liberado'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                  {item.estado_liberacion !== null && item.estado_liberacion !== undefined ? String(item.estado_liberacion) : ''}
                                </span>
                              )
                              : (item[column.key as keyof typeof item] !== null && item[column.key as keyof typeof item] !== undefined ? String(item[column.key as keyof typeof item]) : '')}
                          </td>
                        ))}
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
                    Página {currentPage} de {totalPages}
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
        </>
      ) : (
        /* Tab Content - Pagos */
        <PagosTable pagos={pagos} loading={loadingPagos} onRefresh={fetchPagos} />
      )}
    </div>
  )
}

export default GestionPagos

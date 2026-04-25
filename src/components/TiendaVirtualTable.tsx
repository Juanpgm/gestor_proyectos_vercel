'use client'

const extractArrayPayload = <T = any>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (Array.isArray(payload?.data)) return payload.data as T[]
  if (Array.isArray(payload?.results)) return payload.results as T[]
  if (Array.isArray(payload?.items)) return payload.items as T[]
  return []
}

const parseDateCandidate = (value: any): number => {
  if (value === null || value === undefined) return 0

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0
    return value > 1e12 ? value : value * 1000
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  if (typeof value === 'object') {
    const maybeSeconds = (value as any).seconds ?? (value as any)._seconds
    if (typeof maybeSeconds === 'number' && Number.isFinite(maybeSeconds)) {
      return maybeSeconds * 1000
    }
  }

  return 0
}

const getOrdenRecencyTimestamp = (orden: OrdenCompra): number => {
  const candidates = [
    orden.fecha_actualizacion,
    orden.fecha_guardado,
    orden.fecha_creacion,
    orden.fecha_publicacion_orden,
    orden.fecha_enriquecimiento_tvec,
    (orden as any).updated_at,
    (orden as any).created_at,
  ]

  return candidates.reduce((maxTimestamp, candidate) => {
    const ts = parseDateCandidate(candidate)
    return ts > maxTimestamp ? ts : maxTimestamp
  }, 0)
}

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  EyeOff,
  ShoppingCart,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react'
import AgregarOrdenCompraModal from './AgregarOrdenCompraModal'
import ModificarOrdenCompraModal from './ModificarOrdenCompraModal'
import { useAuth } from '@/context/AuthContext'

// Interfaz para orden de compra
interface OrdenCompra {
  id?: string
  numero_orden?: string
  solicitud_id?: string
  bp?: string
  tipo_documento?: string
  plataforma_origen?: string
  nombre_resumido_proceso?: string
  modalidad_contratacion?: string
  valor_orden?: string | number
  valor_proyectado?: number
  estado_orden?: string
  fecha_publicacion_orden?: string
  fecha_vencimiento_orden?: string
  nit_proveedor?: string
  nombre_proveedor?: string
  items?: string
  objeto_orden?: string
  ordenador_gasto?: string
  solicitante?: string
  nombre_banco?: string
  nombre_centro_gestor?: string
  sector?: string
  rama_entidad?: string
  bpin?: number
  nit_entidad?: string
  ano_orden?: string
  fecha_creacion?: string
  fecha_actualizacion?: string
  fecha_guardado?: string
  fecha_enriquecimiento_tvec?: string
  estado?: string
  tipo?: string
  fuente_datos?: string
  _dataset_source?: string
  [key: string]: any
}

interface ColumnFilter {
  [key: string]: string[]
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

const TiendaVirtualTable: React.FC = () => {
  const { canModifyOrDeleteRecords } = useAuth()
  const canManageRecordActions = canModifyOrDeleteRecords()
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [showFilters, setShowFilters] = useState<{[key: string]: boolean}>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' })
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [columnSearchTerm, setColumnSearchTerm] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'numero_orden',
    'nombre_resumido_proceso',
    'nombre_proveedor',
    'nombre_centro_gestor',
    'valor_orden',
    'estado_orden',
    'fecha_publicacion_orden',
    'modalidad_contratacion',
    'bp'
  ]))
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>({})
  
  // Estados para modales
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [showModificarModal, setShowModificarModal] = useState(false)
  const [ordenToEdit, setOrdenToEdit] = useState<OrdenCompra | null>(null)
  const [ordenToEditComplete, setOrdenToEditComplete] = useState<OrdenCompra | null>(null)
  const [ordenToDelete, setOrdenToDelete] = useState<OrdenCompra | null>(null)
  const [isDeletingOrden, setIsDeletingOrden] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const filtersRef = React.useRef<{[key: string]: HTMLDivElement | null}>({})

  const columns = useMemo(() => [
    { key: 'numero_orden', label: 'Número de Orden', isSortable: true },
    { key: 'solicitud_id', label: 'ID Solicitud', isSortable: true },
    { key: 'nombre_resumido_proceso', label: 'Nombre del Proceso', isSortable: true },
    { key: 'nombre_proveedor', label: 'Proveedor', isSortable: true },
    { key: 'nit_proveedor', label: 'NIT Proveedor', isSortable: true },
    { key: 'nombre_centro_gestor', label: 'Centro Gestor', isSortable: true },
    { key: 'modalidad_contratacion', label: 'Modalidad', isSortable: true },
    { key: 'valor_orden', label: 'Valor Orden', isSortable: true },
    { key: 'valor_proyectado', label: 'Valor Proyectado', isSortable: true },
    { key: 'estado_orden', label: 'Estado', isSortable: true },
    { key: 'fecha_publicacion_orden', label: 'Fecha Publicación', isSortable: true },
    { key: 'fecha_vencimiento_orden', label: 'Fecha Vencimiento', isSortable: true },
    { key: 'bp', label: 'BP', isSortable: true },
    { key: 'nombre_banco', label: 'Banco', isSortable: true },
    { key: 'items', label: 'Items', isSortable: true },
    { key: 'objeto_orden', label: 'Objeto', isSortable: true },
    { key: 'ordenador_gasto', label: 'Ordenador Gasto', isSortable: true },
    { key: 'solicitante', label: 'Solicitante', isSortable: true },
    { key: 'sector', label: 'Sector', isSortable: true },
    { key: 'ano_orden', label: 'Año', isSortable: true }
  ], [])

  const fetchOrdenes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/proxy/emprestito/ordenes-compra')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
        const ordenesData = extractArrayPayload(result)
        setOrdenes(ordenesData)
    } catch (error) {
      console.error('Error fetching órdenes:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrden = async (orden: OrdenCompra) => {
    setIsDeletingOrden(true)
    try {
      const numeroOrden = String(orden.numero_orden || (orden as any).numeroOrden || '').trim()

      if (!numeroOrden) {
        throw new Error('No se encontró numero_orden para eliminar esta orden')
      }

      const response = await fetch(`/api/proxy/emprestito/eliminar-orden-compra/${encodeURIComponent(numeroOrden)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        let deleteError = 'No fue posible eliminar la orden'
        try {
          const errorData = await response.json()
          deleteError = errorData?.detail || errorData?.error || errorData?.message || `${response.status}: ${response.statusText}`
        } catch {
          deleteError = `${response.status}: ${response.statusText}`
        }
        throw new Error(deleteError)
      }

      setOrdenes(prev => prev.filter(item => item.id !== orden.id && item.numero_orden !== numeroOrden))
      await fetchOrdenes()
      setSuccessToast(`Orden ${numeroOrden} eliminada correctamente`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      setErrorToast(`Error al eliminar orden: ${message}`)
      return false
    } finally {
      setIsDeletingOrden(false)
    }
  }

  useEffect(() => {
    fetchOrdenes()
  }, [])

  useEffect(() => {
    if (!successToast) return

    const timeout = setTimeout(() => {
      setSuccessToast(null)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [successToast])

  useEffect(() => {
    if (!errorToast) return

    const timeout = setTimeout(() => {
      setErrorToast(null)
    }, 4000)

    return () => clearTimeout(timeout)
  }, [errorToast])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(showFilters).forEach(key => {
        if (showFilters[key] && filtersRef.current[key]) {
          const filterElement = filtersRef.current[key]
          if (filterElement && !filterElement.contains(event.target as Node)) {
            setShowFilters(prev => ({ ...prev, [key]: false }))
          }
        }
      })
      
      if (showColumnSelector) {
        const columnSelector = document.querySelector('[data-column-selector-tv]')
        if (columnSelector && !columnSelector.contains(event.target as Node)) {
          setShowColumnSelector(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilters, showColumnSelector])

  const getUniqueValues = (key: string): string[] => {
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      return []
    }

    const values = ordenes
      .map(orden => orden[key])
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value))
    
    return Array.from(new Set(values)).sort()
  }

  const clearColumnFilter = (columnKey: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: []
    }))
  }

  const allOrdenes = useMemo(() => {
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      return []
    }

    let filtered = ordenes.filter(orden => {
      if (searchTerm) {
        const searchableText = Object.values(orden)
          .join(' ')
          .toLowerCase()
        if (!searchableText.includes(searchTerm.toLowerCase())) {
          return false
        }
      }

      for (const [key, values] of Object.entries(columnFilters)) {
        if (values && values.length > 0) {
          const ordenValue = String(orden[key] || '')
          if (!values.includes(ordenValue)) {
            return false
          }
        }
      }

      return true
    })

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        
        return sortConfig.direction === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr)
      })
    } else {
      filtered.sort((a, b) => getOrdenRecencyTimestamp(b) - getOrdenRecencyTimestamp(a))
    }

    return filtered
  }, [ordenes, searchTerm, columnFilters, sortConfig])

  const stats = useMemo(() => {
    const parseNumeric = (value: any) => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d.-]/g, '')
        const numeric = Number(cleaned)
        return Number.isFinite(numeric) ? numeric : 0
      }
      return 0
    }

    const totalOrdenes = ordenes.length
    const filteredCount = allOrdenes.length

    const totalValorOrdenes = allOrdenes.reduce((sum, orden) => {
      return sum + parseNumeric(orden.valor_orden)
    }, 0)

    const totalValorProyectado = allOrdenes.reduce((sum, orden) => {
      return sum + parseNumeric(orden.valor_proyectado)
    }, 0)

    const proveedores = new Set(
      allOrdenes.map(orden => orden.nombre_proveedor).filter(Boolean)
    ).size

    const centrosGestores = new Set(
      allOrdenes.map(orden => orden.nombre_centro_gestor).filter(Boolean)
    ).size

    return {
      totalOrdenes,
      filteredCount,
      totalValorOrdenes,
      totalValorProyectado,
      proveedores,
      centrosGestores
    }
  }, [ordenes, allOrdenes])

  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    if ((key === 'valor_orden' || key === 'valor_proyectado') && (typeof value === 'number' || typeof value === 'string')) {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''))
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue)
      }
    }

    if (key.includes('fecha') && value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        }
        return String(value)
      } catch {
        return String(value)
      }
    }

    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...'
    }

    return String(value)
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
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(value || 0)
    }
    
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(Math.abs(compactValue))
    
    return (value < 0 ? '-' : '') + formatted + suffix
  }

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />
  }

  const toggleColumnVisibility = (columnKey: string) => {
    if (columnKey === 'numero_orden') return
    
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

  const getColumnWidth = (columnKey: string) => {
    return columnWidths[columnKey] || 150
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando órdenes de compra...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <button 
            onClick={fetchOrdenes}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-sm font-medium">{successToast}</span>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-white/80 hover:text-white text-lg leading-none"
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-36 right-4 z-40">
          <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-sm font-medium">{errorToast}</span>
            <button
              onClick={() => setErrorToast(null)}
              className="text-white/80 hover:text-white text-lg leading-none"
              aria-label="Cerrar notificación de error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {ordenes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Órdenes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.filteredCount}
                  {stats.filteredCount !== stats.totalOrdenes && (
                    <span className="text-sm text-gray-500 ml-1">/ {stats.totalOrdenes}</span>
                  )}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-indigo-500 ml-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Valor Total Órdenes</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCompactCurrency(stats.totalValorOrdenes)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 ml-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Valor Proyectado</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCompactCurrency(stats.totalValorProyectado)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500 ml-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Proveedores</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.proveedores}</p>
              </div>
              <Building className="w-8 h-8 text-purple-500 ml-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Centros Gestores</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.centrosGestores}</p>
              </div>
              <Building className="w-8 h-8 text-teal-500 ml-4" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Controls */}
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" data-column-selector-tv>
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
                          onClick={() => setVisibleColumns(new Set(['numero_orden']))}
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
                      {columns.filter(col => col.label.toLowerCase().includes(columnSearchTerm.toLowerCase())).map((column) => {
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
                              disabled={column.key === 'numero_orden'}
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
                }}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar Filtros
              </button>
            )}
            
            <button
              onClick={fetchOrdenes}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
            
            {canManageRecordActions && (
              <button
                onClick={() => setShowAgregarModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Orden</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

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

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="overflow-x-auto max-h-[70vh] min-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                {columns.filter(col => visibleColumns.has(col.key)).map((column) => (
                  <th 
                    key={column.key} 
                    className="px-3 py-2 text-left relative border-r border-gray-200 dark:border-gray-600 last:border-r-0 group bg-gray-50 dark:bg-gray-700"
                    style={{ width: `${getColumnWidth(column.key)}px`, minWidth: '80px' }}
                  >
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <span className="truncate">{column.label}</span>
                        {getSortIcon(column.key)}
                      </button>
                      
                      <div 
                        className="relative"
                        ref={el => { filtersRef.current[column.key] = el }}
                      >
                        <button
                          onClick={() => setShowFilters(prev => ({
                            ...prev,
                            [column.key]: !prev[column.key]
                          }))}
                          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative ${
                            columnFilters[column.key]?.length > 0 ? 'text-blue-500' : 'text-gray-400'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                          {columnFilters[column.key]?.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                              {columnFilters[column.key].length}
                            </span>
                          )}
                        </button>
                        
                        {showFilters[column.key] && (
                          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48 max-w-64">
                            <div className="p-2">
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Filtro múltiple
                                </span>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => {
                                      setColumnFilters(prev => ({
                                        ...prev,
                                        [column.key]: []
                                      }))
                                    }}
                                    className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                  >
                                    Limpiar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setColumnFilters(prev => ({
                                        ...prev,
                                        [column.key]: getUniqueValues(column.key)
                                      }))
                                    }}
                                    className="text-xs px-2 py-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                  >
                                    Todos
                                  </button>
                                </div>
                              </div>
                              
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {getUniqueValues(column.key).map((value) => {
                                  const isSelected = columnFilters[column.key]?.includes(value) || false
                                  return (
                                    <label
                                      key={value}
                                      className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const currentFilters = columnFilters[column.key] || []
                                          if (e.target.checked) {
                                            setColumnFilters(prev => ({
                                              ...prev,
                                              [column.key]: [...currentFilters, value]
                                            }))
                                          } else {
                                            setColumnFilters(prev => ({
                                              ...prev,
                                              [column.key]: currentFilters.filter(v => v !== value)
                                            }))
                                          }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                      />
                                      <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate" title={String(value)}>
                                        {formatValue(value, column.key)}
                                      </span>
                                    </label>
                                  )
                                })}
                              </div>
                              
                              {columnFilters[column.key]?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {columnFilters[column.key].length} de {getUniqueValues(column.key).length} seleccionados
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
                
                {canManageRecordActions && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Acciones</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {allOrdenes.map((orden, index) => (
                <motion.tr
                  key={orden.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {columns.filter(col => visibleColumns.has(col.key)).map((column) => (
                    <td 
                      key={column.key} 
                      className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700"
                      style={{ width: `${getColumnWidth(column.key)}px`, maxWidth: `${getColumnWidth(column.key)}px` }}
                    >
                      <div className="max-w-full overflow-hidden">
                        <span className="block truncate" title={String(orden[column.key] || '')}>
                          {formatValue(orden[column.key], column.key)}
                        </span>
                      </div>
                    </td>
                  ))}
                  
                  {canManageRecordActions && (
                    <td className="px-3 py-2 text-xs border-r border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1">
                        {/* Botón Modificar Valor */}
                        <button
                          onClick={() => {
                            setOrdenToEdit(orden)
                            setShowModificarModal(true)
                          }}
                          className="p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                          title="Modificar Valor"
                        >
                          <span className="text-lg font-bold">$</span>
                        </button>
                        
                        {/* Botón Editar Completo */}
                        <button
                          onClick={() => {
                            setOrdenToEditComplete(orden)
                            setShowAgregarModal(true)
                          }}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Editar Completo"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setOrdenToDelete(orden)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {ordenToDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            if (!isDeletingOrden) {
              setOrdenToDelete(null)
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Eliminar Orden de Compra</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              ¿Está seguro que desea eliminar la orden <strong>{ordenToDelete.numero_orden || (ordenToDelete as any).numeroOrden}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOrdenToDelete(null)}
                disabled={isDeletingOrden}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!ordenToDelete) return
                  const deleted = await handleDeleteOrden(ordenToDelete)
                  if (deleted) {
                    setOrdenToDelete(null)
                  }
                }}
                disabled={isDeletingOrden}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeletingOrden ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modales */}
      <AgregarOrdenCompraModal
        isOpen={canManageRecordActions && showAgregarModal}
        onClose={() => {
          setShowAgregarModal(false)
          setOrdenToEditComplete(null)
        }}
        onSuccess={async (updatedData?: any) => {
          // Actualización optimista si recibimos datos actualizados
          if (updatedData && updatedData.numero_orden) {
            console.log('🔄 Actualización optimista de orden:', updatedData)
            setOrdenes(prevOrdenes =>
              prevOrdenes.map(orden =>
                orden.numero_orden === updatedData.numero_orden
                  ? { ...orden, ...updatedData }
                  : orden
              )
            )
            
            // Sincronizar con Firebase después de 5 segundos
            setTimeout(async () => {
              console.log('🔄 Sincronizando con Firebase...')
              await fetchOrdenes()
            }, 5000)
          } else {
            // Si es nuevo registro, recargar todo
            await new Promise(resolve => setTimeout(resolve, 500))
            await fetchOrdenes()
          }
          
          setShowAgregarModal(false)
          setOrdenToEditComplete(null)
        }}
        editingData={ordenToEditComplete}
        onEdit={() => {
          fetchOrdenes()
          setShowAgregarModal(false)
          setOrdenToEditComplete(null)
        }}
      />
      
      <ModificarOrdenCompraModal
        isOpen={showModificarModal}
        onClose={() => {
          setShowModificarModal(false)
          setOrdenToEdit(null)
        }}
        onSuccess={() => {
          fetchOrdenes()
          setShowModificarModal(false)
          setOrdenToEdit(null)
        }}
        ordenData={ordenToEdit}
      />
    </div>
  )
}

export default TiendaVirtualTable

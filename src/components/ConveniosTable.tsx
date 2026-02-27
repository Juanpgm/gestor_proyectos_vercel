'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Building,
  DollarSign,
  Users,
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  EyeOff,
  Handshake,
  TrendingUp,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react'
import AgregarConvenioTransferenciaModal from './AgregarConvenioTransferenciaModal'
import ModificarConvenioModal from './ModificarConvenioModal'

interface ConvenioTransferencia {
  id?: string
  referencia_contrato?: string
  nombre_centro_gestor?: string
  banco?: string
  bp?: string
  bpin?: string | number
  objeto_contrato?: string
  valor_contrato?: number
  valor_convenio?: number
  fecha_inicio_contrato?: string
  fecha_fin_contrato?: string
  modalidad_contrato?: string
  ordenador_gastor?: string
  tipo_contrato?: string
  estado_contrato?: string
  sector?: string
  urlproceso?: string
  fecha_creacion?: string
  fecha_actualizacion?: string
  estado?: string
  tipo?: string
  [key: string]: any
}

interface ColumnFilter {
  [key: string]: string[]
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

const extractArrayPayload = <T = any>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (Array.isArray(payload?.data)) return payload.data as T[]
  if (Array.isArray(payload?.results)) return payload.results as T[]
  if (Array.isArray(payload?.items)) return payload.items as T[]
  return []
}

const ConveniosTable: React.FC = () => {
  const [convenios, setConvenios] = useState<ConvenioTransferencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [showFilters, setShowFilters] = useState<{[key: string]: boolean}>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' })
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [columnSearchTerm, setColumnSearchTerm] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'referencia_contrato',
    'nombre_centro_gestor',
    'banco',
    'valor_contrato',
    'valor_convenio',
    'estado_contrato',
    'fecha_fin_contrato',
    'tipo_contrato',
    'bp'
  ]))
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>({})
  
  // Estados para modales
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [showModificarModal, setShowModificarModal] = useState(false)
  const [convenioToEdit, setConvenioToEdit] = useState<ConvenioTransferencia | null>(null)
  const [editingConvenio, setEditingConvenio] = useState<ConvenioTransferencia | null>(null)
  const [convenioToDelete, setConvenioToDelete] = useState<ConvenioTransferencia | null>(null)
  const [isDeletingConvenio, setIsDeletingConvenio] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const filtersRef = React.useRef<{[key: string]: HTMLDivElement | null}>({})

  const columns = useMemo(() => [
    { key: 'referencia_contrato', label: 'Referencia Contrato', isSortable: true },
    { key: 'nombre_centro_gestor', label: 'Centro Gestor', isSortable: true },
    { key: 'banco', label: 'Banco', isSortable: true },
    { key: 'objeto_contrato', label: 'Objeto del Contrato', isSortable: true },
    { key: 'valor_contrato', label: 'Valor Contrato', isSortable: true },
    { key: 'valor_convenio', label: 'Valor Convenio', isSortable: true },
    { key: 'estado_contrato', label: 'Estado', isSortable: true },
    { key: 'fecha_inicio_contrato', label: 'Fecha Inicio', isSortable: true },
    { key: 'fecha_fin_contrato', label: 'Fecha Fin', isSortable: true },
    { key: 'modalidad_contrato', label: 'Modalidad', isSortable: true },
    { key: 'tipo_contrato', label: 'Tipo Contrato', isSortable: true },
    { key: 'ordenador_gastor', label: 'Ordenador Gasto', isSortable: true },
    { key: 'bp', label: 'BP', isSortable: true },
    { key: 'bpin', label: 'BPIN', isSortable: true },
    { key: 'sector', label: 'Sector', isSortable: true }
  ], [])

  const fetchConvenios = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      const response = await fetch('/api/proxy/convenios_transferencias_all')
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      
      const result = await response.json()
      setConvenios(extractArrayPayload(result))
    } catch (error) {
      console.error('Error fetching convenios:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Función para manejar la edición completa
  const handleEditConvenio = (convenio: ConvenioTransferencia) => {
    setEditingConvenio(convenio)
    setShowAgregarModal(true)
  }

  // Función para actualizar convenio completo vía API
  const handleUpdateConvenio = async (docId: string, formData: any) => {
    try {
      const payload = new URLSearchParams()
      payload.append('doc_id', docId)

      const allowedFields = [
        'referencia_contrato',
        'nombre_centro_gestor',
        'banco',
        'objeto_contrato',
        'valor_contrato',
        'bp',
        'bpin',
        'valor_convenio',
        'urlproceso',
        'fecha_inicio_contrato',
        'fecha_fin_contrato',
        'modalidad_contrato',
        'ordenador_gastor',
        'tipo_contrato',
        'estado_contrato',
        'sector',
        'nombre_resumido_proceso'
      ] as const

      allowedFields.forEach((key) => {
        const value = formData?.[key]
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          payload.append(key, String(value).trim())
        }
      })

      const response = await fetch('/api/proxy/emprestito/modificar-convenio-transferencia', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload.toString()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.detail || 'Error al actualizar el convenio')
      }

      // Actualización optimista
      setConvenios(prev => prev.map(c => {
         // Compara usando el ID que tengamos disponible
         const cId = (c as any).id || (c as any).doc_id;
         if (cId === docId || c.referencia_contrato === formData.referencia_contrato) {
             return { ...c, ...formData }
         }
         return c;
      }))

      // Recargar datos silenciosamente sin mostrar spinner (que desmontaría el modal)
      await fetchConvenios(false)
      
    } catch (error) {
      console.error('Error updating convenio:', error)
      throw error
    }
  }

  const handleDeleteConvenio = async (convenio: ConvenioTransferencia) => {
    setIsDeletingConvenio(true)
    try {
      const referenciaContrato = String(convenio.referencia_contrato || '').trim()

      if (!referenciaContrato) {
        throw new Error('No se encontró referencia_contrato para eliminar este convenio')
      }

      const response = await fetch(`/api/proxy/emprestito/eliminar-convenio-transferencia/${encodeURIComponent(referenciaContrato)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        let deleteError = 'No fue posible eliminar el convenio'
        try {
          const errorData = await response.json()
          deleteError = errorData?.detail || errorData?.error || errorData?.message || `${response.status}: ${response.statusText}`
        } catch {
          deleteError = `${response.status}: ${response.statusText}`
        }
        throw new Error(deleteError)
      }

      setConvenios(prev => prev.filter(item => item.id !== convenio.id && item.referencia_contrato !== referenciaContrato))
      await fetchConvenios(false)
      setSuccessToast(`Convenio ${referenciaContrato} eliminado correctamente`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      setErrorToast(`Error al eliminar convenio: ${message}`)
      return false
    } finally {
      setIsDeletingConvenio(false)
    }
  }

  useEffect(() => {
    fetchConvenios()
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
        const columnSelector = document.querySelector('[data-column-selector-conv]')
        if (columnSelector && !columnSelector.contains(event.target as Node)) {
          setShowColumnSelector(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilters, showColumnSelector])

  const getUniqueValues = (key: string): string[] => {
    if (!Array.isArray(convenios) || convenios.length === 0) return []
    const values = convenios
      .map(convenio => convenio[key])
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value))
    return Array.from(new Set(values)).sort()
  }

  const clearColumnFilter = (columnKey: string) => {
    setColumnFilters(prev => ({ ...prev, [columnKey]: [] }))
  }

  const allConvenios = useMemo(() => {
    if (!Array.isArray(convenios) || convenios.length === 0) return []

    let filtered = convenios.filter(convenio => {
      if (searchTerm) {
        const searchableText = Object.values(convenio).join(' ').toLowerCase()
        if (!searchableText.includes(searchTerm.toLowerCase())) return false
      }

      for (const [key, values] of Object.entries(columnFilters)) {
        if (values && values.length > 0) {
          const convenioValue = String(convenio[key] || '')
          if (!values.includes(convenioValue)) return false
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
        
        return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      })
    }

    return filtered
  }, [convenios, searchTerm, columnFilters, sortConfig])

  const stats = useMemo(() => {
    const parseNumeric = (value: any) => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const numeric = Number(value.replace(/[^\d.-]/g, ''))
        return Number.isFinite(numeric) ? numeric : 0
      }
      return 0
    }
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
            <div className="fixed top-20 right-4 z-50">
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


    return {
      totalConvenios: convenios.length,
      filteredCount: allConvenios.length,
      totalValorContratos: allConvenios.reduce((sum, c) => sum + parseNumeric(c.valor_contrato), 0),
      totalValorConvenios: allConvenios.reduce((sum, c) => sum + parseNumeric(c.valor_convenio), 0),
      centrosGestores: new Set(allConvenios.map(c => c.nombre_centro_gestor).filter(Boolean)).size,
      bancos: new Set(allConvenios.map(c => c.banco).filter(Boolean)).size,
      activos: allConvenios.filter(c => c.estado_contrato === 'En ejecución').length
    }
  }, [convenios, allConvenios])

  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined || value === '') return '-'

    if ((key === 'valor_contrato' || key === 'valor_convenio')) {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''))
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(numValue)
      }
    }

    if (key.includes('fecha') && value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-CO')
        }
      } catch {}
    }

    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...'
    }

    return String(value)
  }

  const formatCompactCurrency = (value: number) => {
    const absValue = Math.abs(value || 0)
    let compactValue: number, suffix: string
    
    if (absValue >= 1_000_000_000) {
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
        currency: 'COP'
      }).format(value || 0)
    }
    
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(compactValue) + suffix
  }

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />
  }

  const toggleColumnVisibility = (columnKey: string) => {
    if (columnKey === 'referencia_contrato') return
    setVisibleColumns(prev => {
      const newSet = new Set(prev)
      newSet.has(columnKey) ? newSet.delete(columnKey) : newSet.add(columnKey)
      return newSet
    })
  }

  const getColumnWidth = (columnKey: string) => columnWidths[columnKey] || 150

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando convenios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Handshake className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button onClick={() => fetchConvenios()} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {convenios.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Convenios', value: `${stats.filteredCount}${stats.filteredCount !== stats.totalConvenios ? ` / ${stats.totalConvenios}` : ''}`, icon: Handshake, color: 'indigo' },
            { label: 'Valor Total Contratos', value: formatCompactCurrency(stats.totalValorContratos), icon: DollarSign, color: 'green' },
            { label: 'Valor Total Convenios', value: formatCompactCurrency(stats.totalValorConvenios), icon: TrendingUp, color: 'blue' },
            { label: 'Centros Gestores', value: stats.centrosGestores, icon: Building, color: 'purple' },
            { label: 'Bancos', value: stats.bancos, icon: Building, color: 'teal' },
            { label: 'Convenios Activos', value: stats.activos, icon: Users, color: 'orange' }
          ].map(({ label, value, icon: Icon, color }, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <Icon className={`w-8 h-8 text-${color}-500 ml-4`} />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {showColumnSelector ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>Columnas</span>
              </button>

              {showColumnSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 z-50 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4"
                  data-column-selector-conv
                >
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Buscar columna..."
                      value={columnSearchTerm}
                      onChange={(e) => setColumnSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {columns
                      .filter(col => 
                        col.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
                      )
                      .map(column => (
                        <label
                          key={column.key}
                          className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            column.key === 'referencia_contrato' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns.has(column.key)}
                            onChange={() => toggleColumnVisibility(column.key)}
                            disabled={column.key === 'referencia_contrato'}
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{column.label}</span>
                          {column.key === 'referencia_contrato' && (
                            <span className="text-xs text-gray-500">(Siempre visible)</span>
                          )}
                        </label>
                      ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{visibleColumns.size} de {columns.length} columnas visibles</span>
                    <button
                      onClick={() => setShowColumnSelector(false)}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
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
                <X className="w-4 h-4 mr-2" />
                <span>Limpiar filtros</span>
              </button>
            )}
            
            <button onClick={() => fetchConvenios()} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            
            <button
              onClick={() => setShowAgregarModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Convenio</span>
            </button>
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                {columns.filter(col => visibleColumns.has(col.key)).map((column) => (
                  <th key={column.key} className="px-3 py-2 text-left">
                    <div className="flex items-center justify-between space-x-2">
                      <button 
                        onClick={() => handleSort(column.key)} 
                        className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <span>{column.label}</span>
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
                                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                        {value}
                                      </span>
                                    </label>
                                  )
                                })}
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 text-center">
                                {columnFilters[column.key]?.length > 0 
                                  ? `${columnFilters[column.key].length} seleccionado(s)`
                                  : 'Ninguno seleccionado'
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
                
                {/* Columna de Acciones */}
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Acciones</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {allConvenios.map((convenio, idx) => (
                <tr key={convenio.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {columns.filter(col => visibleColumns.has(col.key)).map((column) => (
                    <td key={column.key} className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                      <span className="block truncate" title={String(convenio[column.key] || '')}>
                        {formatValue(convenio[column.key], column.key)}
                      </span>
                    </td>
                  ))}
                  
                  {/* Columna de Acciones */}
                  <td className="px-3 py-2 text-xs border-r border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setConvenioToEdit(convenio)
                          setShowModificarModal(true)
                        }}
                        className="p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                        title="Modificar Valor"
                      >
                        <span className="text-lg font-bold">$</span>
                      </button>
                      <button
                        onClick={() => handleEditConvenio(convenio)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Editar Completo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConvenioToDelete(convenio)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {convenioToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              ¿Está seguro que desea eliminar el convenio <span className="font-semibold">{convenioToDelete.referencia_contrato || '-'}</span>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConvenioToDelete(null)}
                disabled={isDeletingConvenio}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!convenioToDelete) return
                  const deleted = await handleDeleteConvenio(convenioToDelete)
                  if (deleted) {
                    setConvenioToDelete(null)
                  }
                }}
                disabled={isDeletingConvenio}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeletingConvenio ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modales */}
      <AgregarConvenioTransferenciaModal
        isOpen={showAgregarModal}
        onClose={() => {
          setShowAgregarModal(false)
          setEditingConvenio(null)
        }}
        onSuccess={() => {
          fetchConvenios()
          setShowAgregarModal(false)
          setEditingConvenio(null)
        }}
        editingData={editingConvenio}
        onEdit={handleUpdateConvenio}
      />
      
      <ModificarConvenioModal
        isOpen={showModificarModal}
        onClose={() => {
          console.log('🚪 Cerrando modal de convenio')
          setShowModificarModal(false)
          setConvenioToEdit(null)
        }}
        onSuccess={async (updatedData?: any) => {
          console.log('✅ OnSuccess de convenio llamado')
          
          // Limpiar estados del modal primero
          setShowModificarModal(false)
          setConvenioToEdit(null)
          
          // Actualización optimista si recibimos datos actualizados
          if (updatedData && updatedData.referencia_contrato) {
            console.log('🔄 Actualización optimista de convenio:', updatedData)
            setConvenios(prevConvenios =>
              prevConvenios.map(convenio =>
                convenio.referencia_contrato === updatedData.referencia_contrato
                  ? { ...convenio, ...updatedData }
                  : convenio
              )
            )
            
            // Sincronizar con Firebase después de 5 segundos
            setTimeout(async () => {
              console.log('🔄 Sincronizando con Firebase...')
              await fetchConvenios()
            }, 5000)
          } else {
            // Si es nuevo registro, recargar todo
            await fetchConvenios()
          }
        }}
        convenioData={convenioToEdit}
      />
    </div>
  )
}

export default ConveniosTable

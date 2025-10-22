'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  RefreshCw, 
  FileText,
  Calendar,
  Building,
  DollarSign,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Plus
} from 'lucide-react'
import AgregarProcesoModalAlt from './AgregarProcesoModalAlt'

// Interfaz para proceso de empréstito
interface ProcesoEmprestito {
  id?: string
  referencia_proceso?: string
  nombre_proceso?: string
  valor_proyectado?: number
  valor_publicacion?: number
  nombre_centro_gestor?: string
  estado_proceso?: string
  fecha_publicacion?: string
  fecha_publicacion_fase?: string
  modalidad_contratacion?: string
  tipo_contrato?: string
  nombre_banco?: string
  bp?: string
  descripcion_proceso?: string
  fase?: string
  estado_resumen?: string
  duracion?: string
  unidad_duracion?: string
  adjudicado?: string
  proceso_contractual?: string
  plataforma?: string
  [key: string]: any // Para permitir propiedades adicionales
}

// Interfaz para filtros de columna (ahora soporta múltiples valores)
interface ColumnFilter {
  [key: string]: string[]
}

// Interfaz para ordenamiento
interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface GestionProcesosProps {
  onNavigateHome: () => void
}

const GestionProcesos: React.FC<GestionProcesosProps> = ({ onNavigateHome }) => {
  // Estados para datos
  const [procesos, setProcesos] = useState<ProcesoEmprestito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para UI
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [showFilters, setShowFilters] = useState<{[key: string]: boolean}>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' })
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  
  // Refs para manejar clics fuera del dropdown
  const filtersRef = React.useRef<{[key: string]: HTMLDivElement | null}>({})
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  // Effect para manejar clics fuera de los filtros
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Verificar si el clic fue fuera de cualquier filtro abierto
      Object.keys(showFilters).forEach(key => {
        if (showFilters[key] && filtersRef.current[key]) {
          const filterElement = filtersRef.current[key]
          if (filterElement && !filterElement.contains(event.target as Node)) {
            setShowFilters(prev => ({ ...prev, [key]: false }))
          }
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilters])

  // Cargar datos del endpoint
  useEffect(() => {
    const fetchProcesos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
        if (!apiUrl) {
          throw new Error('URL de API no configurada')
        }

        const response = await fetch(`${apiUrl}/procesos_emprestito_all`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('API Response:', data)
        console.log('Is Array:', Array.isArray(data))
        
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(data)) {
          setProcesos(data)
        } else if (data && Array.isArray(data.data)) {
          setProcesos(data.data)
        } else if (data && Array.isArray(data.procesos)) {
          setProcesos(data.procesos)
        } else {
          console.warn('Formato de respuesta inesperado:', data)
          setProcesos([])
        }
      } catch (error) {
        console.error('Error fetching procesos:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchProcesos()
  }, [])

  // Función para manejar el éxito al agregar proceso
  const handleAgregarProcesoSuccess = () => {
    // Recargar los datos
    const fetchProcesos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
        if (!apiUrl) {
          throw new Error('URL de API no configurada')
        }

        const response = await fetch(`${apiUrl}/procesos_emprestito_all`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(data)) {
          setProcesos(data)
        } else if (data && Array.isArray(data.data)) {
          setProcesos(data.data)
        } else if (data && Array.isArray(data.procesos)) {
          setProcesos(data.procesos)
        } else {
          console.warn('Formato de respuesta inesperado:', data)
          setProcesos([])
        }
      } catch (error) {
        console.error('Error fetching procesos:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchProcesos()
  }
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Función para obtener valores únicos de una columna para filtros
  const getUniqueValues = (key: string): string[] => {
    if (!Array.isArray(procesos) || procesos.length === 0) {
      return []
    }

    const values = procesos
      .map(proceso => proceso[key])
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value))
    
    return Array.from(new Set(values)).sort()
  }

  // Procesos filtrados y ordenados
  const filteredAndSortedProcesos = useMemo(() => {
    // Verificar que procesos sea un array válido
    if (!Array.isArray(procesos) || procesos.length === 0) {
      return []
    }

    let filtered = procesos.filter(proceso => {
      // Filtro de búsqueda global
      if (searchTerm) {
        const searchableText = Object.values(proceso)
          .join(' ')
          .toLowerCase()
        if (!searchableText.includes(searchTerm.toLowerCase())) {
          return false
        }
      }

      // Filtros por columna (multifiltro)
      for (const [key, values] of Object.entries(columnFilters)) {
        if (values && values.length > 0) {
          const procesoValue = String(proceso[key] || '')
          if (!values.includes(procesoValue)) {
            return false
          }
        }
      }

      return true
    })

    // Ordenamiento
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
    }

    return filtered
  }, [procesos, searchTerm, columnFilters, sortConfig])

  // Paginación
  const paginatedProcesos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedProcesos.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedProcesos, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedProcesos.length / itemsPerPage)

  // Columnas de la tabla
  const columns = [
    { key: 'referencia_proceso', label: 'Referencia', width: 'w-40' },
    { key: 'nombre_proceso', label: 'Nombre del Proceso', width: 'w-64' },
    { key: 'nombre_centro_gestor', label: 'Centro Gestor', width: 'w-48' },
    { key: 'estado_proceso', label: 'Estado', width: 'w-32' },
    { key: 'modalidad_contratacion', label: 'Modalidad', width: 'w-36' },
    { key: 'tipo_contrato', label: 'Tipo de Contrato', width: 'w-36' },
    { key: 'valor_proyectado', label: 'Valor Proyectado', width: 'w-40' },
    { key: 'fecha_publicacion', label: 'Fecha Publicación', width: 'w-36' },
    { key: 'fecha_publicacion_fase', label: 'Fecha Fase', width: 'w-36' },
    { key: 'nombre_banco', label: 'Banco', width: 'w-32' }
  ]

  // Función para formatear valores
  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    // Formatear valores monetarios
    if ((key === 'valor_proyectado' || key === 'valor_publicacion') && typeof value === 'number') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    }

    // Formatear fechas
    if (key.includes('fecha') && value) {
      try {
        // Manejar diferentes formatos de fecha
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

    // Truncar textos muy largos
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...'
    }

    return String(value)
  }

  // Función para obtener el ícono de ordenamiento
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando procesos contractuales...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">Error cargando datos: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Gestión de Procesos Contractuales del Empréstito
              </h1>
              <div className="flex items-center space-x-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredAndSortedProcesos.length} proceso{filteredAndSortedProcesos.length !== 1 ? 's' : ''} encontrado{filteredAndSortedProcesos.length !== 1 ? 's' : ''}
                  {procesos.length !== filteredAndSortedProcesos.length && (
                    <span className="text-gray-500"> de {procesos.length} total</span>
                  )}
                </p>
                {(searchTerm || Object.values(columnFilters).some(f => f?.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-blue-600 dark:text-blue-400">Filtros activos:</span>
                    {searchTerm && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs flex items-center space-x-1">
                        <span>Búsqueda: &quot;{searchTerm}&quot;</span>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {Object.entries(columnFilters).filter(([_, values]) => values?.length > 0).map(([key, values]) => (
                      <span key={key} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs flex items-center space-x-1">
                        <span>
                          {columns.find(c => c.key === key)?.label}: {values.length} elemento{values.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setColumnFilters(prev => ({ ...prev, [key]: [] }))}
                          className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </button>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda global */}
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

            {/* Controles */}
            <div className="flex items-center gap-2">
              {/* Botón limpiar filtros */}
              {(Object.values(columnFilters).some(filters => filters.length > 0) || searchTerm) && (
                <button
                  onClick={() => {
                    setColumnFilters({})
                    setSearchTerm('')
                  }}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpiar Filtros
                </button>
              )}
              
              {/* Refresh */}
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </button>

              {/* Agregar Proceso */}
              <button
                onClick={() => setShowAgregarModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Proceso</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Resumen de Totalizaciones */}
        {filteredAndSortedProcesos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Resumen de Totalizaciones
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Valor Proyectado */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Valor Total Proyectado</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(
                        filteredAndSortedProcesos.reduce((sum, proceso) => {
                          const valor = proceso.valor_proyectado || 0
                          return sum + (typeof valor === 'number' ? valor : 0)
                        }, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Valor Proceso (SECOP) */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Valor Total SECOP</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(
                        filteredAndSortedProcesos.reduce((sum, proceso) => {
                          const valor = proceso.valor_proceso || 0
                          return sum + (typeof valor === 'number' ? valor : 0)
                        }, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total de Procesos por Estado */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Estados de Procesos</p>
                    <div className="text-sm space-y-1">
                      {Object.entries(
                        filteredAndSortedProcesos.reduce((acc, proceso) => {
                          const estado = proceso.estado_proceso || 'Sin Estado'
                          acc[estado] = (acc[estado] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                      ).slice(0, 3).map(([estado, count]) => (
                        <div key={estado} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400 truncate text-xs">{estado}:</span>
                          <span className="font-medium text-gray-900 dark:text-white text-xs">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className={`px-3 py-2 text-left ${column.width}`}>
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
                                {/* Header con controles */}
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
                                
                                {/* Lista de valores con checkboxes */}
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
                                              // Añadir valor
                                              setColumnFilters(prev => ({
                                                ...prev,
                                                [column.key]: [...currentFilters, value]
                                              }))
                                            } else {
                                              // Remover valor
                                              setColumnFilters(prev => ({
                                                ...prev,
                                                [column.key]: currentFilters.filter(v => v !== value)
                                              }))
                                            }
                                          }}
                                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate" title={formatValue(value, column.key)}>
                                          {formatValue(value, column.key)}
                                        </span>
                                      </label>
                                    )
                                  })}
                                </div>
                                
                                {/* Contador de seleccionados */}
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
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedProcesos.map((proceso, index) => (
                  <motion.tr
                    key={proceso.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700">
                        <div className="max-w-full overflow-hidden">
                          <span className="block truncate" title={String(proceso[column.key] || '')}>
                            {formatValue(proceso[column.key], column.key)}
                          </span>
                        </div>
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedProcesos.length)} de{' '}
                  {filteredAndSortedProcesos.length} resultados
                </p>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal para agregar proceso */}
      <AgregarProcesoModalAlt
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onSuccess={handleAgregarProcesoSuccess}
      />
    </div>
  )
}

export default GestionProcesos
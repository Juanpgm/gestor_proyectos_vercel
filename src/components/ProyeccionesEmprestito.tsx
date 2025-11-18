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
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  TrendingUp,
  ExternalLink,
  Plus,
  Columns
} from 'lucide-react'
import AgregarProcesoModalAlt from './AgregarProcesoModalAlt'

// Interfaz para proyección de empréstito
interface ProyeccionEmprestito {
  id?: string
  item?: string
  referencia_proceso?: string
  nombre_organismo_reducido?: string
  nombre_banco?: string
  BP?: string
  nombre_generico_proyecto?: string
  nombre_resumido_proceso?: string
  id_paa?: string
  urlProceso?: string
  valor_proyectado?: number
  fila_origen?: number
  fuente?: string
  ultima_actualizacion?: string
  fecha_carga?: string
  fecha_guardado?: string
  descripcion_bp?: string
  sin_proceso?: boolean // Indica si la proyección no tiene proceso asociado
  estado_proceso?: string // Estado del proceso o 'Sin Proceso'
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

// Interfaz para columnas de tabla
interface Column {
  key: string
  label: string
  sortable: boolean
  filterable: boolean
  width: string
  type?: 'currency' | 'date' | 'text'
}

interface ProyeccionesEmprestitoProps {
  onNavigateHome: () => void
}

const ProyeccionesEmprestito: React.FC<ProyeccionesEmprestitoProps> = ({ onNavigateHome }) => {
  // Estados para datos
  const [proyecciones, setProyecciones] = useState<ProyeccionEmprestito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para UI
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [showFilters, setShowFilters] = useState<{[key: string]: boolean}>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' })
  
  // Estados para modal de agregar proceso
  const [showAgregarProcesoModal, setShowAgregarProcesoModal] = useState(false)
  const [proyeccionSeleccionada, setProyeccionSeleccionada] = useState<ProyeccionEmprestito | null>(null)
  
  // Estados para selector de columnas
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'item',
    'referencia_proceso',
    'estado_proceso',
    'nombre_organismo_reducido',
    'nombre_banco',
    'BP',
    'nombre_resumido_proceso',
    'id_paa',
    'valor_proyectado',
  ]))
  
  // Estados para redimensionamiento de columnas
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>({})
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  
  // Refs para manejar clics fuera del dropdown
  const filtersRef = React.useRef<{[key: string]: HTMLDivElement | null}>({})
  
  // Effect para manejar clics fuera de los filtros y selector de columnas
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
      
      // Verificar si el clic fue fuera del selector de columnas
      if (showColumnSelector) {
        const columnSelector = document.querySelector('[data-column-selector]')
        if (columnSelector && !columnSelector.contains(event.target as Node)) {
          setShowColumnSelector(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters, showColumnSelector])

  // Cargar datos de proyecciones al montar el componente
  useEffect(() => {
    fetchProyecciones()
  }, [])

  const fetchProyecciones = async () => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = window.location.origin
      const timestamp = new Date().getTime()
      
      // Cargar solo desde el endpoint principal con parámetro false
      const response = await fetch(`${baseUrl}/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (!response.ok) {
        throw new Error(`Error al cargar proyecciones: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        throw new Error('Respuesta inválida del servidor')
      }

      // Cargar proyecciones sin proceso desde el segundo endpoint
      const sinProcesoResponse = await fetch(`${baseUrl}/api/emprestito/proyecciones-sin-proceso?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      let proyeccionesSinProceso: ProyeccionEmprestito[] = []
      if (sinProcesoResponse.ok) {
        const sinProcesoData = await sinProcesoResponse.json()
        if (sinProcesoData.success && Array.isArray(sinProcesoData.data)) {
          proyeccionesSinProceso = sinProcesoData.data
        }
      } else {
        console.error('❌ Error al cargar proyecciones sin proceso:', sinProcesoResponse.status)
      }

      // Crear un Set con los IDs de proyecciones sin proceso
      const idsSinProceso = new Set(proyeccionesSinProceso.map(p => p.id))
      
      // Verificar cuáles IDs de sin-proceso están en los datos principales
      const idsEnPrincipal = new Set(data.data.map((p: any) => p.id))
      const faltantesEnPrincipal = proyeccionesSinProceso.filter(p => !idsEnPrincipal.has(p.id))
      
      if (faltantesEnPrincipal.length > 0) {
        console.log(`➕ Agregando ${faltantesEnPrincipal.length} registros sin proceso que faltan en el endpoint principal`)
        // Agregar los registros faltantes al array principal
        data.data = [...data.data, ...faltantesEnPrincipal]
      }

      // Procesar todas las proyecciones del endpoint principal (ahora incluye los agregados)
      const todasLasProyecciones = data.data.map((p: ProyeccionEmprestito) => {
        // Verificar si NO tiene referencia_proceso O está en la lista de sin proceso
        const sinRefProceso = !p.referencia_proceso || p.referencia_proceso.trim() === ''
        const enListaSinProceso = idsSinProceso.has(p.id)
        const esSinProceso = sinRefProceso || enListaSinProceso

        return {
          ...p,
          sin_proceso: esSinProceso,
          estado_proceso: esSinProceso ? 'Sin Proceso' : 'Con Proceso'
        }
      })

      setProyecciones(todasLasProyecciones)

    } catch (err) {
      console.error('Error al cargar proyecciones:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener valores únicos de una columna para los filtros
  const getUniqueValues = (key: string): string[] => {
    const values = proyecciones
      .map(item => item[key])
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value))
    
    return Array.from(new Set(values)).sort()
  }

  // Aplicar filtros y búsqueda
  const filteredProyecciones = useMemo(() => {
    return proyecciones.filter(proyeccion => {
      // Filtro de búsqueda global
      if (searchTerm) {
        const searchValue = searchTerm.toLowerCase()
        const searchableFields = [
          proyeccion.referencia_proceso,
          proyeccion.nombre_organismo_reducido,
          proyeccion.nombre_banco,
          proyeccion.BP,
          proyeccion.nombre_generico_proyecto,
          proyeccion.nombre_resumido_proceso,
          proyeccion.id_paa
        ]
        
        const matches = searchableFields.some(field => 
          field && String(field).toLowerCase().includes(searchValue)
        )
        
        if (!matches) return false
      }

      // Filtros de columna
      for (const [column, filterValues] of Object.entries(columnFilters)) {
        if (filterValues.length > 0) {
          const cellValue = String(proyeccion[column] || '')
          if (!filterValues.includes(cellValue)) {
            return false
          }
        }
      }

      return true
    })
  }, [proyecciones, searchTerm, columnFilters])

  // Aplicar ordenamiento
  const sortedProyecciones = useMemo(() => {
    return [...filteredProyecciones].sort((a, b) => {
      // ORDEN PRIMARIO: Sin Proceso primero
      if (a.sin_proceso !== b.sin_proceso) {
        return a.sin_proceso ? -1 : 1 // sin_proceso=true va primero
      }
      
      // ORDEN SECUNDARIO: Si hay configuración de ordenamiento, aplicarla
      if (sortConfig.key) {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        // Manejar valores nulos/undefined
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        // Conversión a string para comparación
        const aString = String(aValue).toLowerCase()
        const bString = String(bValue).toLowerCase()

        if (aString < bString) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aString > bString) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
      }
      
      return 0
    })
  }, [filteredProyecciones, sortConfig])

  // Calcular paginación
  const totalItems = sortedProyecciones.length
  // Todos los datos sin paginación
  const allProyecciones = sortedProyecciones

  // Funciones para manejar filtros
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleFilter = (column: string) => {
    setShowFilters(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const handleFilterChange = (column: string, value: string, checked: boolean) => {
    setColumnFilters(prev => {
      const currentFilters = prev[column] || []
      if (checked) {
        return { ...prev, [column]: [...currentFilters, value] }
      } else {
        return { ...prev, [column]: currentFilters.filter(v => v !== value) }
      }
    })
  }

  const clearFilters = () => {
    setColumnFilters({})
    setSearchTerm('')
  }

  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[column]
      return newFilters
    })
  }

  // Funciones para redimensionamiento de columnas
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    setIsResizing(true)
    setResizingColumn(columnKey)
    
    const startX = e.clientX
    const startWidth = columnWidths[columnKey] || 150
    
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX
      const newWidth = Math.max(80, startWidth + diff) // Mínimo 80px
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }))
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizingColumn(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const getColumnWidth = (columnKey: string) => {
    return columnWidths[columnKey] || 150
  }

  // Funciones para manejo de columnas visibles
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

  const showAllColumns = () => {
    setVisibleColumns(new Set(columns.map(col => col.key)))
  }

  const hideAllColumns = () => {
    // Mantener al menos una columna visible (referencia_proceso)
    setVisibleColumns(new Set(['referencia_proceso']))
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Función para obtener el ícono de ordenamiento
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />
  }

  // Función para formatear valores
  const formatValue = (value: any, type: 'currency' | 'date' | 'text' = 'text'): string => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    switch (type) {
      case 'currency':
        const numValue = Number(value)
        if (isNaN(numValue)) return '-'
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue)
      
      case 'date':
        try {
          return new Date(value).toLocaleDateString('es-CO')
        } catch {
          return String(value)
        }
      
      default:
        return String(value)
    }
  }

  const formatCompactCurrency = (value: number) => {
    const absValue = Math.abs(value || 0)
    let compactValue: number
    let suffix: string
    
    if (absValue >= 1_000_000_000_000) {
      // Billones
      compactValue = value / 1_000_000_000_000
      suffix = 'B'
    } else if (absValue >= 1_000_000_000) {
      // Mil millones (MM)
      compactValue = value / 1_000_000_000
      suffix = 'MM'
    } else if (absValue >= 1_000_000) {
      // Millones (M)
      compactValue = value / 1_000_000
      suffix = 'M'
    } else if (absValue >= 1_000) {
      compactValue = value / 1_000
      suffix = 'K'
    } else {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value || 0)
    }
    
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(Math.abs(compactValue))
    
    return (value < 0 ? '-' : '') + formatted + suffix
  }

  // Función para obtener estadísticas de resumen
  const getStats = () => {
    const totalProyecciones = proyecciones.length
    const totalValorProyectado = proyecciones.reduce((sum, p) => sum + (Number(p.valor_proyectado) || 0), 0)
    const organismos = new Set(proyecciones.map(p => p.nombre_organismo_reducido).filter(Boolean)).size
    const bancos = new Set(proyecciones.map(p => p.nombre_banco).filter(Boolean)).size
    
    // Nuevas estadísticas para proyecciones con y sin proceso
    const conProceso = proyecciones.filter(p => !p.sin_proceso).length
    const sinProceso = proyecciones.filter(p => p.sin_proceso).length

    return {
      totalProyecciones,
      totalValorProyectado,
      organismos,
      bancos,
      conProceso,
      sinProceso,
      filteredCount: filteredProyecciones.length
    }
  }

  const stats = getStats()

  // Configuración de columnas
  const columns: Column[] = [
    { key: 'item', label: 'Ítem', sortable: true, filterable: true, width: 'w-20' },
    { key: 'referencia_proceso', label: 'Referencia Proceso', sortable: true, filterable: true, width: 'w-40' },
    { key: 'estado_proceso', label: 'Estado', sortable: true, filterable: true, width: 'w-28' },
    { key: 'nombre_organismo_reducido', label: 'Organismo', sortable: true, filterable: true, width: 'w-32' },
    { key: 'nombre_banco', label: 'Banco', sortable: true, filterable: true, width: 'w-36' },
    { key: 'BP', label: 'BP', sortable: true, filterable: true, width: 'w-32' },
    { key: 'nombre_generico_proyecto', label: 'Proyecto Genérico', sortable: true, filterable: true, width: 'w-64' },
    { key: 'nombre_resumido_proceso', label: 'Proceso Resumido', sortable: true, filterable: true, width: 'w-64' },
    { key: 'id_paa', label: 'ID PAA', sortable: true, filterable: true, width: 'w-24' },
    { key: 'valor_proyectado', label: 'Valor Proyectado', sortable: true, filterable: false, type: 'currency', width: 'w-40' },
    { key: 'urlProceso', label: 'URL Proceso', sortable: false, filterable: false, width: 'w-32' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando proyecciones de empréstito...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={fetchProyecciones}
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Proyecciones de Empréstito</h1>
              <p className="text-indigo-100">
                Gestión y seguimiento de proyecciones de empréstito
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

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Proyecciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.filteredCount}
                {stats.filteredCount !== stats.totalProyecciones && (
                  <span className="text-sm text-gray-500 ml-1">/ {stats.totalProyecciones}</span>
                )}
              </p>
            </div>
            <FileText className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Valor Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white" title={formatValue(stats.totalValorProyectado, 'currency')}>
                {formatCompactCurrency(stats.totalValorProyectado)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Organismos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.organismos}</p>
            </div>
            <Building className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Bancos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bancos}</p>
            </div>
            <Building className="w-8 h-8 text-teal-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Con Proceso</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.conProceso}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Sin Proceso</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.sinProceso}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Filters Display */}
      {(searchTerm || Object.values(columnFilters).some(f => f?.length > 0)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6"
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
              <div key={column} className="flex items-center bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm">
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
            
            {/* Selector de Columnas */}
            <div className="relative" data-column-selector>
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Columns className="w-4 h-4" />
                <span>Columnas</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showColumnSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showColumnSelector && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Columnas Visibles ({visibleColumns.size}/{columns.length})
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={showAllColumns}
                          className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        >
                          Todas
                        </button>
                        <button
                          onClick={hideAllColumns}
                          className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                        >
                          Ninguna
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    {columns.map((column) => (
                      <label
                        key={column.key}
                        className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(column.key)}
                          onChange={() => toggleColumnVisibility(column.key)}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <div className="flex items-center justify-between flex-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {column.label}
                          </span>
                          {visibleColumns.has(column.key) ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Refresh */}
            <button
              onClick={fetchProyecciones}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[70vh] min-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                {columns.filter(col => visibleColumns.has(col.key)).map((column) => (
                  <th 
                    key={column.key} 
                    className="px-3 py-2 text-left relative border-r border-gray-200 dark:border-gray-600 last:border-r-0 group"
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
                      
                      {column.filterable && (
                        <div className="relative" ref={el => { filtersRef.current[column.key] = el }}>
                          <button
                            onClick={() => toggleFilter(column.key)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Filter className={`w-3 h-3 ${columnFilters[column.key]?.length > 0 ? 'text-blue-500' : 'text-gray-400'}`} />
                          </button>
                          
                          {showFilters[column.key] && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                              <div className="p-3">
                                {getUniqueValues(column.key).map((value) => (
                                  <label key={value} className="flex items-center space-x-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={columnFilters[column.key]?.includes(value) || false}
                                      onChange={(e) => handleFilterChange(column.key, value, e.target.checked)}
                                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                      {formatValue(value, column.type as any) || '(vacío)'}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Column Resizer */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                      onMouseDown={(e) => handleMouseDown(e, column.key)}
                    />
                  </th>
                ))}
                
                {/* Columna de Acciones - Solo visible si hay proyecciones sin proceso */}
                {stats.sinProceso > 0 && (
                  <th className="px-3 py-2 text-left border-r border-gray-200 dark:border-gray-600">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {allProyecciones.map((proyeccion) => (
                <tr 
                  key={proyeccion.id} 
                  className={`transition-colors ${
                    proyeccion.sin_proceso 
                      ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-l-4 border-amber-500 dark:border-amber-600' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={proyeccion.sin_proceso ? 'Esta proyección no tiene proceso asociado' : ''}
                >
                  {columns.filter(col => visibleColumns.has(col.key)).map((column) => (
                    <td 
                      key={`${proyeccion.id}-${column.key}`} 
                      className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700"
                      style={{ width: `${getColumnWidth(column.key)}px`, maxWidth: `${getColumnWidth(column.key)}px` }}
                    >
                      <div className="max-w-full overflow-hidden">
                        {column.key === 'estado_proceso' ? (
                          proyeccion.sin_proceso ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded">
                              Sin Proceso
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded">
                              Con Proceso
                            </span>
                          )
                        ) : column.key === 'urlProceso' ? (
                          proyeccion[column.key] && proyeccion[column.key] !== 'Publicado' ? (
                            <a
                              href={proyeccion[column.key]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title={proyeccion[column.key]}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="block truncate">Ver proceso</span>
                            </a>
                          ) : (
                            <span className="block truncate text-gray-500 dark:text-gray-400" title={String(proyeccion[column.key] || '-')}>
                              {proyeccion[column.key] || '-'}
                            </span>
                          )
                        ) : (
                          <span className={`block truncate ${column.key === 'valor_proyectado' ? 'font-medium' : ''}`} title={String(proyeccion[column.key] || '')}>
                            {formatValue(proyeccion[column.key], column.type as any)}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                  
                  {/* Columna de acciones - Solo para proyecciones sin proceso */}
                  {proyeccion.sin_proceso && (
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setProyeccionSeleccionada(proyeccion)
                          setShowAgregarProcesoModal(true)
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                        title="Agregar proceso contractual"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar Proceso
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal para agregar proceso desde proyección */}
      <AgregarProcesoModalAlt
        isOpen={showAgregarProcesoModal}
        onClose={() => {
          setShowAgregarProcesoModal(false)
          setProyeccionSeleccionada(null)
        }}
        onSuccess={async () => {
          setShowAgregarProcesoModal(false)
          setProyeccionSeleccionada(null)
          // Recargar las proyecciones para actualizar el estado
          await fetchProyecciones()
        }}
        editingData={proyeccionSeleccionada ? {
          referencia_proceso: proyeccionSeleccionada.referencia_proceso,
          nombre_proceso: proyeccionSeleccionada.nombre_generico_proyecto,
          nombre_resumido_proceso: proyeccionSeleccionada.nombre_resumido_proceso,
          nombre_centro_gestor: proyeccionSeleccionada.nombre_organismo_reducido,
          nombre_banco: proyeccionSeleccionada.nombre_banco,
          bp: proyeccionSeleccionada.BP,
          id_paa: proyeccionSeleccionada.id_paa,
          valor_proyectado: proyeccionSeleccionada.valor_proyectado,
          plataforma: proyeccionSeleccionada.urlProceso?.includes('secop') ? 'SECOP II' : undefined,
          descripcion_proceso: proyeccionSeleccionada.descripcion_bp,
        } : null}
      />
    </div>
  )
}

export default ProyeccionesEmprestito
'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  RefreshCw,
  Building,
  DollarSign,
  TrendingUp,
  Landmark,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'

// Interfaz para contrato de empréstito
interface ContratoEmprestito {
  id?: string
  id_contrato?: string
  referencia_proceso?: string
  nombre_proceso?: string
  nombre_centro_gestor?: string
  banco?: string
  estado?: string
  valor_contrato?: number
  avance_ejecucion?: number
  ultima_observacion?: string
  tipo_contrato?: string
  modalidad_contratacion?: string
  sector?: string
  codigo_categoria?: string
  supervisor?: string
  fecha_inicio?: string
  fecha_fin?: string
  [key: string]: any
}

// Interfaz para filtros de columna (soporta múltiples valores)
interface ColumnFilter {
  [key: string]: string[]
}

// Interfaz para ordenamiento
interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface ContratosDetalladosTableProps {
  contratos: ContratoEmprestito[]
  onContratoClick: (contrato: ContratoEmprestito) => void
}

const ContratosDetalladosTable: React.FC<ContratosDetalladosTableProps> = ({ 
  contratos,
  onContratoClick 
}) => {
  // Estados para UI
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [showFilters, setShowFilters] = useState<{[key: string]: boolean}>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' })
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [columnSearchTerm, setColumnSearchTerm] = useState('')
  
  // Columnas visibles por defecto
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'referencia_proceso',
    'nombre_proceso',
    'nombre_centro_gestor',
    'banco',
    'estado',
    'valor_contrato',
    'avance_ejecucion',
    'ultima_observacion'
  ]))

  // Definición de todas las columnas disponibles
  const allColumns = [
    { key: 'referencia_proceso', label: 'Referencia Proceso', required: true },
    { key: 'nombre_proceso', label: 'Nombre Proceso', required: false },
    { key: 'nombre_centro_gestor', label: 'Centro Gestor', required: false },
    { key: 'banco', label: 'Banco', required: false },
    { key: 'estado', label: 'Estado', required: false },
    { key: 'valor_contrato', label: 'Valor Contrato', required: false },
    { key: 'avance_ejecucion', label: 'Avance Ejecución', required: false },
    { key: 'ultima_observacion', label: 'Última Observación', required: false },
    { key: 'tipo_contrato', label: 'Tipo Contrato', required: false },
    { key: 'modalidad_contratacion', label: 'Modalidad Contratación', required: false },
    { key: 'sector', label: 'Sector', required: false },
    { key: 'codigo_categoria', label: 'Código Categoría', required: false },
    { key: 'supervisor', label: 'Supervisor', required: false },
    { key: 'fecha_inicio', label: 'Fecha Inicio', required: false },
    { key: 'fecha_fin', label: 'Fecha Fin', required: false },
    { key: 'dias_transcurridos', label: 'Días Transcurridos', required: false },
    { key: 'dias_restantes', label: 'Días Restantes', required: false }
  ]

  // Función para calcular días transcurridos/restantes
  const calcularDias = (fechaInicio?: string, fechaFin?: string) => {
    if (!fechaInicio || !fechaFin) return { transcurridos: null, restantes: null }
    
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    const hoy = new Date()
    
    const transcurridos = Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    const restantes = Math.floor((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    return { transcurridos, restantes }
  }

  // Función para obtener valores únicos de una columna
  const getUniqueValues = (key: string): string[] => {
    const values = new Set<string>()
    contratos.forEach(contrato => {
      const value = contrato[key]
      if (value !== null && value !== undefined && value !== '') {
        values.add(String(value))
      }
    })
    return Array.from(values).sort()
  }

  // Filtrar y ordenar contratos
  const filteredAndSortedContratos = useMemo(() => {
    let filtered = [...contratos]

    // Aplicar búsqueda global
    if (searchTerm) {
      filtered = filtered.filter(contrato =>
        Object.values(contrato).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Aplicar filtros por columna
    Object.entries(columnFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(contrato => {
          const contratoValue = String(contrato[key] || '')
          return values.some(filterValue => contratoValue === filterValue)
        })
      }
    })

    // Aplicar ordenamiento
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        // Manejar campos calculados
        if (sortConfig.key === 'dias_transcurridos') {
          const diasA = calcularDias(a.fecha_inicio, a.fecha_fin)
          const diasB = calcularDias(b.fecha_inicio, b.fecha_fin)
          aValue = diasA.transcurridos
          bValue = diasB.transcurridos
        } else if (sortConfig.key === 'dias_restantes') {
          const diasA = calcularDias(a.fecha_inicio, a.fecha_fin)
          const diasB = calcularDias(b.fecha_inicio, b.fecha_fin)
          aValue = diasA.restantes
          bValue = diasB.restantes
        } else {
          aValue = a[sortConfig.key]
          bValue = b[sortConfig.key]
        }

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }

        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [contratos, searchTerm, columnFilters, sortConfig])

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = filteredAndSortedContratos.length
    const valorTotal = filteredAndSortedContratos.reduce((sum, c) => sum + (c.valor_contrato || 0), 0)
    const avancePromedio = total > 0 
      ? filteredAndSortedContratos.reduce((sum, c) => sum + (c.avance_ejecucion || 0), 0) / total 
      : 0
    const bancosUnicos = new Set(filteredAndSortedContratos.map(c => c.banco).filter(Boolean)).size
    const estadosUnicos = new Set(filteredAndSortedContratos.map(c => c.estado).filter(Boolean)).size
    const centrosUnicos = new Set(filteredAndSortedContratos.map(c => c.nombre_centro_gestor).filter(Boolean)).size

    return {
      total,
      valorTotal,
      avancePromedio,
      bancosUnicos,
      estadosUnicos,
      centrosUnicos
    }
  }, [filteredAndSortedContratos])

  // Función para manejar ordenamiento
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Función para manejar filtros de columna
  const handleColumnFilter = (columnKey: string, value: string) => {
    setColumnFilters(prev => {
      const currentFilters = prev[columnKey] || []
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value]
      
      if (newFilters.length === 0) {
        const { [columnKey]: _, ...rest } = prev
        return rest
      }
      
      return { ...prev, [columnKey]: newFilters }
    })
  }

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setColumnFilters({})
    setSearchTerm('')
    setSortConfig({ key: '', direction: 'asc' })
  }

  // Función para alternar visibilidad de columna
  const toggleColumnVisibility = (columnKey: string) => {
    const column = allColumns.find(col => col.key === columnKey)
    if (column?.required) return // No permitir ocultar columnas requeridas
    
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

  // Filtrar columnas por búsqueda
  const filteredColumns = allColumns.filter(col =>
    col.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
  )

  // Contar filtros activos
  const activeFiltersCount = Object.values(columnFilters).reduce((sum, filters) => sum + filters.length, 0)

  // Formato de moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Contratos Detallados</h2>
            <p className="text-teal-100 mt-1">Gestión integral de contratos del empréstito</p>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(columnFilters).map(([key, values]) =>
              values.map(value => (
                <motion.div
                  key={`${key}-${value}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm"
                >
                  <span className="font-medium">
                    {allColumns.find(col => col.key === key)?.label}:
                  </span>
                  <span>{value}</span>
                  <button
                    onClick={() => handleColumnFilter(key, value)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))
            )}
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 bg-white/30 hover:bg-white/40 rounded-full text-sm font-medium transition-colors"
            >
              Limpiar todos
            </button>
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
          {/* Total Contratos */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Total Contratos</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Valor Total */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Valor Total</p>
                <p className="text-lg font-bold mt-1">{formatCurrency(stats.valorTotal)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Avance Promedio */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Avance Promedio</p>
                <p className="text-2xl font-bold mt-1">{stats.avancePromedio.toFixed(1)}%</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Bancos */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Bancos</p>
                <p className="text-2xl font-bold mt-1">{stats.bancosUnicos}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Landmark className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Estados</p>
                <p className="text-2xl font-bold mt-1">{stats.estadosUnicos}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Centros Gestores */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Centros Gestores</p>
                <p className="text-2xl font-bold mt-1">{stats.centrosUnicos}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de columnas */}
          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Columnas
            </button>

            {showColumnSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-600 max-h-96 overflow-hidden flex flex-col"
              >
                {/* Buscador de columnas */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar columnas..."
                      value={columnSearchTerm}
                      onChange={(e) => setColumnSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Lista de columnas */}
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                  {filteredColumns.map(col => (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded ${
                        col.required ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={() => toggleColumnVisibility(col.key)}
                        disabled={col.required}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {col.label}
                        {col.required && <span className="text-xs text-gray-500 ml-1">(requerido)</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Botón de limpiar filtros */}
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="Limpiar filtros"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>

          {/* Botón de refrescar */}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className="w-4 h-4" />
            Refrescar
          </button>
        </div>
      </div>

      {/* Tabla con sticky header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                {visibleColumns.has('referencia_proceso') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Referencia</span>
                      <button onClick={() => handleSort('referencia_proceso')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'referencia_proceso' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowFilters(prev => ({ ...prev, referencia_proceso: !prev.referencia_proceso }))}
                        className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                      >
                        <Filter className={`w-4 h-4 ${columnFilters.referencia_proceso?.length ? 'text-teal-600' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    {showFilters.referencia_proceso && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="absolute mt-2 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-20 p-3 border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto"
                      >
                        <div className="space-y-2">
                          {getUniqueValues('referencia_proceso').map(value => (
                            <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={columnFilters.referencia_proceso?.includes(value) || false}
                                onChange={() => handleColumnFilter('referencia_proceso', value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </th>
                )}

                {visibleColumns.has('nombre_proceso') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Nombre Proceso</span>
                      <button onClick={() => handleSort('nombre_proceso')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'nombre_proceso' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('nombre_centro_gestor') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Centro Gestor</span>
                      <button onClick={() => handleSort('nombre_centro_gestor')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'nombre_centro_gestor' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowFilters(prev => ({ ...prev, nombre_centro_gestor: !prev.nombre_centro_gestor }))}
                        className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                      >
                        <Filter className={`w-4 h-4 ${columnFilters.nombre_centro_gestor?.length ? 'text-teal-600' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    {showFilters.nombre_centro_gestor && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="absolute mt-2 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-20 p-3 border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto"
                      >
                        <div className="space-y-2">
                          {getUniqueValues('nombre_centro_gestor').map(value => (
                            <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={columnFilters.nombre_centro_gestor?.includes(value) || false}
                                onChange={() => handleColumnFilter('nombre_centro_gestor', value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </th>
                )}

                {visibleColumns.has('banco') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Banco</span>
                      <button onClick={() => handleSort('banco')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'banco' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowFilters(prev => ({ ...prev, banco: !prev.banco }))}
                        className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                      >
                        <Filter className={`w-4 h-4 ${columnFilters.banco?.length ? 'text-teal-600' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    {showFilters.banco && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="absolute mt-2 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-20 p-3 border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto"
                      >
                        <div className="space-y-2">
                          {getUniqueValues('banco').map(value => (
                            <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={columnFilters.banco?.includes(value) || false}
                                onChange={() => handleColumnFilter('banco', value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </th>
                )}

                {visibleColumns.has('estado') && (
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span>Estado</span>
                      <button onClick={() => handleSort('estado')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'estado' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowFilters(prev => ({ ...prev, estado: !prev.estado }))}
                        className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                      >
                        <Filter className={`w-4 h-4 ${columnFilters.estado?.length ? 'text-teal-600' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    {showFilters.estado && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="absolute mt-2 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-20 p-3 border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto"
                      >
                        <div className="space-y-2">
                          {getUniqueValues('estado').map(value => (
                            <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={columnFilters.estado?.includes(value) || false}
                                onChange={() => handleColumnFilter('estado', value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </th>
                )}

                {visibleColumns.has('valor_contrato') && (
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <span>Valor Contrato</span>
                      <button onClick={() => handleSort('valor_contrato')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'valor_contrato' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('avance_ejecucion') && (
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span>Avance</span>
                      <button onClick={() => handleSort('avance_ejecucion')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'avance_ejecucion' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {/* Resto de columnas opcionales */}
                {visibleColumns.has('ultima_observacion') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Última Observación</span>
                      <button onClick={() => handleSort('ultima_observacion')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'ultima_observacion' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('tipo_contrato') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Tipo Contrato</span>
                      <button onClick={() => handleSort('tipo_contrato')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'tipo_contrato' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('modalidad_contratacion') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Modalidad</span>
                      <button onClick={() => handleSort('modalidad_contratacion')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'modalidad_contratacion' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('sector') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Sector</span>
                      <button onClick={() => handleSort('sector')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'sector' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('codigo_categoria') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Categoría</span>
                      <button onClick={() => handleSort('codigo_categoria')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'codigo_categoria' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('supervisor') && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Supervisor</span>
                      <button onClick={() => handleSort('supervisor')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'supervisor' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('fecha_inicio') && (
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span>Fecha Inicio</span>
                      <button onClick={() => handleSort('fecha_inicio')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'fecha_inicio' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('fecha_fin') && (
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span>Fecha Fin</span>
                      <button onClick={() => handleSort('fecha_fin')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'fecha_fin' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('dias_transcurridos') && (
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span>Días Transcurridos</span>
                      <button onClick={() => handleSort('dias_transcurridos')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'dias_transcurridos' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}

                {visibleColumns.has('dias_restantes') && (
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span>Días Restantes</span>
                      <button onClick={() => handleSort('dias_restantes')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                        {sortConfig.key === 'dias_restantes' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedContratos.map((contrato, index) => {
                const { transcurridos, restantes } = calcularDias(contrato.fecha_inicio, contrato.fecha_fin)
                
                return (
                  <motion.tr
                    key={contrato.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => onContratoClick(contrato)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    {visibleColumns.has('referencia_proceso') && (
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {contrato.referencia_proceso || 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('nombre_proceso') && (
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {contrato.nombre_proceso || 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('nombre_centro_gestor') && (
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {contrato.nombre_centro_gestor || 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('banco') && (
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                          {contrato.banco || 'N/A'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.has('estado') && (
                      <td className="py-3 px-4 text-center text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          contrato.estado === 'Activo' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {contrato.estado === 'Activo' && <CheckCircle className="w-3 h-3" />}
                          {contrato.estado || 'N/A'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.has('valor_contrato') && (
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                        {contrato.valor_contrato ? formatCurrency(contrato.valor_contrato) : 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('avance_ejecucion') && (
                      <td className="py-3 px-4 text-center text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-teal-600 h-2 rounded-full"
                              style={{ width: `${contrato.avance_ejecucion || 0}%` }}
                            />
                          </div>
                          <span className="font-medium">{contrato.avance_ejecucion?.toFixed(1) || 0}%</span>
                        </div>
                      </td>
                    )}

                    {visibleColumns.has('ultima_observacion') && (
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {contrato.ultima_observacion || 'Sin observaciones'}
                      </td>
                    )}

                    {visibleColumns.has('tipo_contrato') && (
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {contrato.tipo_contrato || 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('modalidad_contratacion') && (
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {contrato.modalidad_contratacion || 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('sector') && (
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {contrato.sector || 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('codigo_categoria') && (
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {contrato.codigo_categoria || 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('supervisor') && (
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {contrato.supervisor || 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('fecha_inicio') && (
                      <td className="py-3 px-4 text-center text-sm text-gray-900 dark:text-gray-100">
                        {contrato.fecha_inicio ? new Date(contrato.fecha_inicio).toLocaleDateString('es-CO') : 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('fecha_fin') && (
                      <td className="py-3 px-4 text-center text-sm text-gray-900 dark:text-gray-100">
                        {contrato.fecha_fin ? new Date(contrato.fecha_fin).toLocaleDateString('es-CO') : 'N/A'}
                      </td>
                    )}

                    {visibleColumns.has('dias_transcurridos') && (
                      <td className="py-3 px-4 text-center text-sm">
                        {transcurridos !== null ? (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                            {transcurridos} días
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    )}

                    {visibleColumns.has('dias_restantes') && (
                      <td className="py-3 px-4 text-center text-sm">
                        {restantes !== null ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            restantes < 0 
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                              : restantes <= 30 
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' 
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          }`}>
                            {restantes} días
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    )}
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay resultados */}
        {filteredAndSortedContratos.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No se encontraron contratos
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContratosDetalladosTable

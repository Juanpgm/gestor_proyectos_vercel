'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Download
} from 'lucide-react'
import type { UnidadProyectoFilters } from '../hooks/useUnidadesProyectoOffline'
import type { UnidadProyectoMock } from '../data/mockUnidadesProyecto'

interface UnidadesProyectoTableProps {
  data: UnidadProyectoMock[]
  loading: boolean
  onItemSelect?: (item: UnidadProyectoMock) => void
  filters: UnidadProyectoFilters
  onFiltersChange: (filters: UnidadProyectoFilters) => void
  totalCount: number
}

// Componente para el badge de estado
const StatusBadge = ({ status }: { status?: string }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completado':
      case 'terminado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'en ejecución':
      case 'en_ejecucion':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'planificación':
      case 'planificacion':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'suspendido':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status || 'Sin Estado')}`}>
      {status || 'Sin Estado'}
    </span>
  )
}

// Componente para el indicador de progreso
const ProgressBar = ({ progress }: { progress: number }) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 1) return 'bg-green-500'
    if (progress >= 0.7) return 'bg-blue-500'
    if (progress >= 0.3) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const percentage = Math.min(progress * 100, 100)

  return (
    <div className="flex items-center space-x-2">
      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px]">
        {percentage.toFixed(0)}%
      </span>
    </div>
  )
}

// Función para formatear valores monetarios
const formatCurrency = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}B`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}Mm`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

export default function UnidadesProyectoTable({ 
  data, 
  loading, 
  onItemSelect,
  filters,
  onFiltersChange,
  totalCount
}: UnidadesProyectoTableProps) {
  
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Obtener valores únicos para los filtros
  const filterOptions = useMemo(() => {
    const tiposIntervencion = Array.from(new Set(data.map(item => item.tipo_intervencion))).sort()
    const estados = Array.from(new Set(data.map(item => item.estado).filter(Boolean))).sort()
    const centrosGestores = Array.from(new Set(data.map(item => item.nombre_centro_gestor))).sort()
    const comunas = Array.from(new Set(data.map(item => item.comuna_corregimiento))).sort()
    const anos = Array.from(new Set(data.map(item => item.ano))).sort()

    return {
      tiposIntervencion,
      estados,
      centrosGestores,
      comunas,
      anos
    }
  }, [data])

  // Ordenar datos (el filtrado ahora se hace en la API)
  const sortedData = useMemo(() => {
    if (!sortField) return data

    const sorted = [...data].sort((a, b) => {
      let aVal: any = null
      let bVal: any = null

      // Acceso seguro a las propiedades
      switch (sortField) {
        case 'bpin':
          aVal = a.bpin
          bVal = b.bpin
          break
        case 'nombre_up':
          aVal = a.nombre_up
          bVal = b.nombre_up
          break
        case 'avance_obra':
          aVal = a.avance_obra
          bVal = b.avance_obra
          break
        case 'presupuesto_base':
          aVal = a.presupuesto_base
          bVal = b.presupuesto_base
          break
        default:
          return 0
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
      }
      
      const aStr = String(aVal || '').toLowerCase()
      const bStr = String(bVal || '').toLowerCase()
      
      return sortDirection === 'desc' 
        ? bStr.localeCompare(aStr)
        : aStr.localeCompare(bStr)
    })

    return sorted
  }, [data, sortField, sortDirection])

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Función para manejar ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Función para exportar datos
  const handleExport = () => {
    try {
      const csvContent = [
        // Headers
        ['BPIN', 'UPID', 'Nombre', 'Tipo Intervención', 'Estado', 'Avance', 'Presupuesto', 'Centro Gestor', 'Comuna', 'Año'].join(','),
        // Data
        ...sortedData.map(item => [
          `"${item.bpin || ''}"`,
          `"${item.upid || ''}"`,
          `"${(item.nombre_up || '').replace(/"/g, '""')}"`,
          `"${(item.tipo_intervencion || '').replace(/"/g, '""')}"`,
          `"${(item.estado || '').replace(/"/g, '""')}"`,
          (item.avance_obra || 0).toFixed(4),
          item.presupuesto_base || 0,
          `"${(item.nombre_centro_gestor || '').replace(/"/g, '""')}"`,
          `"${(item.comuna_corregimiento || '').replace(/"/g, '""')}"`,
          `"${item.ano || ''}"`
        ].join(','))
      ].join('\n')

      if (typeof window !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `unidades_proyecto_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
      }
    } catch (error) {
      console.error('Error al exportar datos:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header con filtros */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unidades de Proyecto ({data.length.toLocaleString()} de {totalCount.toLocaleString()} registros)
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onFiltersChange({})}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Limpiar filtros"
            >
              <Filter className="w-4 h-4" />
              <span>Limpiar Filtros</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por Tipo de Intervención */}
          <select
            value={filters.tipo_intervencion || ''}
            onChange={(e) => onFiltersChange({ ...filters, tipo_intervencion: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {filterOptions.tiposIntervencion.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={filters.estado || ''}
            onChange={(e) => onFiltersChange({ ...filters, estado: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            {filterOptions.estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>

          {/* Filtro por Comuna */}
          <select
            value={filters.comuna_corregimiento || ''}
            onChange={(e) => onFiltersChange({ ...filters, comuna_corregimiento: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las comunas</option>
            {filterOptions.comunas.map(comuna => (
              <option key={comuna} value={comuna}>{comuna}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('bpin')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100"
                >
                  <span>BPIN</span>
                  {sortField === 'bpin' && (
                    sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('nombre_up')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100"
                >
                  <span>Proyecto</span>
                  {sortField === 'nombre_up' && (
                    sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tipo/Clase
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('avance_obra')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100"
                >
                  <span>Avance</span>
                  {sortField === 'avance_obra' && (
                    sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('presupuesto_base')}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100"
                >
                  <span>Presupuesto</span>
                  {sortField === 'presupuesto_base' && (
                    sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((item, index) => (
              <tr 
                key={item.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-4 py-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.bpin}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.upid}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex flex-col max-w-xs">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {item.nombre_up || 'Sin nombre'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.nombre_centro_gestor}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white text-xs">
                      {item.tipo_intervencion || 'Sin tipo'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {item.clase_obra || 'Sin clasificar'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge status={item.estado} />
                </td>
                <td className="px-4 py-4 text-sm">
                  <ProgressBar progress={item.avance_obra || 0} />
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.presupuesto_base || 0)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-900 dark:text-white text-xs">
                      {item.comuna_corregimiento || 'Sin ubicación'}
                    </span>
                  </div>
                  {item.barrio_vereda && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.barrio_vereda}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center space-x-2">
                    {onItemSelect && (
                      <button
                        onClick={() => onItemSelect(item)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {item.url_proceso && (
                      <a
                        href={item.url_proceso}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="Ver proceso"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length} registros
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded 
                         hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded 
                         hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Search, 
  Calendar,
  Building2,
  DollarSign,
  FileText,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { CATEGORIES, formatNumber, ANIMATIONS } from '@/lib/design-system'
import { openSecopLink } from '@/utils/url-helpers'
import { Contrato } from '@/hooks/useContratos'
import { getContractStateColors } from '@/lib/contract-colors'

interface ContratosTableProps {
  contratos: Contrato[]
  filteredContratos: Contrato[]
  loading?: boolean
}

type SortField = 'valor_contrato' | 'fecha_firma' | 'proveedor_adjudicado' | 'estado_contrato' | 'nombre_entidad' | 'referencia_contrato'
type SortDirection = 'asc' | 'desc'

interface TableFilters {
  search: string
  estado: string
  sector: string
  entidad: string
  modalidad: string
  fechaDesde: string
  fechaHasta: string
  valorMin: string
  valorMax: string
  soloActivos: boolean
  soloPyme: boolean
}

const ContratosTable: React.FC<ContratosTableProps> = ({
  contratos,
  filteredContratos,
  loading = false
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('valor_contrato')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    estado: '',
    sector: '',
    entidad: '',
    modalidad: '',
    fechaDesde: '',
    fechaHasta: '',
    valorMin: '',
    valorMax: '',
    soloActivos: false,
    soloPyme: false
  })

  // Opciones para filtros
  const filterOptions = useMemo(() => {
    const estados = Array.from(new Set(contratos.map(c => c.estado_contrato).filter(Boolean))).sort()
    const sectores = Array.from(new Set(contratos.map(c => c.sector).filter(Boolean))).sort()
    const entidades = Array.from(new Set(contratos.map(c => c.nombre_entidad).filter(Boolean))).sort()
    const modalidades = Array.from(new Set(contratos.map(c => c.modalidad_contratacion).filter(Boolean))).sort()

    return { estados, sectores, entidades, modalidades }
  }, [contratos])

  // Aplicar filtros y ordenamiento
  const processedData = useMemo(() => {
    let filtered = filteredContratos.filter(contrato => {
      // Filtro de búsqueda
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          contrato.referencia_contrato,
          contrato.proveedor_adjudicado,
          contrato.descripcion_proceso,
          contrato.nombre_entidad,
          contrato.sector,
          contrato.proceso_compra
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) return false
      }

      // Filtros específicos
      if (filters.estado && contrato.estado_contrato !== filters.estado) return false
      if (filters.sector && contrato.sector !== filters.sector) return false
      if (filters.entidad && contrato.nombre_entidad !== filters.entidad) return false
      if (filters.modalidad && contrato.modalidad_contratacion !== filters.modalidad) return false
      
      // Filtros de fecha
      if (filters.fechaDesde && contrato.fecha_firma) {
        if (new Date(contrato.fecha_firma) < new Date(filters.fechaDesde)) return false
      }
      if (filters.fechaHasta && contrato.fecha_firma) {
        if (new Date(contrato.fecha_firma) > new Date(filters.fechaHasta)) return false
      }

      // Filtros de valor
      if (filters.valorMin && contrato.valor_contrato < parseFloat(filters.valorMin)) return false
      if (filters.valorMax && contrato.valor_contrato > parseFloat(filters.valorMax)) return false

      // Filtros booleanos
      if (filters.soloActivos && !['Vigente', 'En Ejecución', 'Activo'].includes(contrato.estado_contrato || '')) return false
      if (filters.soloPyme && contrato.es_pyme !== 'Sí') return false

      return true
    })

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'valor_contrato') {
        aValue = aValue || 0
        bValue = bValue || 0
      } else if (sortField === 'fecha_firma') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      } else {
        aValue = (aValue || '').toString().toLowerCase()
        bValue = (bValue || '').toString().toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [filteredContratos, filters, sortField, sortDirection])

  // Paginación
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return processedData.slice(startIndex, startIndex + itemsPerPage)
  }, [processedData, currentPage])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)

  // Handlers
  const toggleRowExpansion = (contratoId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(contratoId)) {
      newExpanded.delete(contratoId)
    } else {
      newExpanded.add(contratoId)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Vigente':
      case 'En Ejecución':
      case 'Activo':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'Liquidado':
      case 'Terminado':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'Modificado':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getEstadoColor = (estado: string) => {
    return getContractStateColors(estado).badge
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      {...ANIMATIONS.slideUp}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      {/* Header con filtros */}
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.contracts.gradient}`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tabla de Contratos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {processedData.length} de {contratos.length} contratos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                ${showFilters 
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }
                hover:bg-violet-200 dark:hover:bg-violet-900/50
              `}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
            </button>
          </div>
        </div>

        {/* Panel de filtros expandible */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Búsqueda
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Buscar contratos..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Todos los estados</option>
                    {filterOptions.estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sector
                  </label>
                  <select
                    value={filters.sector}
                    onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Todos los sectores</option>
                    {filterOptions.sectores.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                {/* Entidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entidad
                  </label>
                  <select
                    value={filters.entidad}
                    onChange={(e) => setFilters(prev => ({ ...prev, entidad: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Todas las entidades</option>
                    {filterOptions.entidades.map(entidad => (
                      <option key={entidad} value={entidad}>
                        {entidad.replace('SECRETARIA DE ', '').replace('SECRETARÍA DE ', '')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.soloActivos}
                      onChange={(e) => setFilters(prev => ({ ...prev, soloActivos: e.target.checked }))}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Solo activos</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.soloPyme}
                      onChange={(e) => setFilters(prev => ({ ...prev, soloPyme: e.target.checked }))}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Solo PYME</span>
                  </label>
                </div>
              </div>

              {/* Botón para limpiar filtros */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({
                    search: '',
                    estado: '',
                    sector: '',
                    entidad: '',
                    modalidad: '',
                    fechaDesde: '',
                    fechaHasta: '',
                    valorMin: '',
                    valorMax: '',
                    soloActivos: false,
                    soloPyme: false
                  })}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Limpiar filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('referencia_contrato')}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Contrato
                  {sortField === 'referencia_contrato' && (
                    sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('proveedor_adjudicado')}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Proveedor
                  {sortField === 'proveedor_adjudicado' && (
                    sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('valor_contrato')}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Valor
                  {sortField === 'valor_contrato' && (
                    sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('estado_contrato')}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Estado
                  {sortField === 'estado_contrato' && (
                    sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('fecha_firma')}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Fecha Firma
                  {sortField === 'fecha_firma' && (
                    sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((contrato, index) => {
              const isExpanded = expandedRows.has(contrato.id_contrato)
              
              return (
                <React.Fragment key={contrato.id_contrato}>
                  <motion.tr
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    {/* Información del contrato */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col max-w-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded">
                            {contrato.referencia_contrato}
                          </span>
                          {contrato.es_pyme === 'Sí' && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded font-medium">
                              PYME
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          {contrato.nombre_entidad?.replace('SECRETARIA DE ', '').replace('SECRETARÍA DE ', '')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          BPIN: {contrato.bpin}
                        </span>
                      </div>
                    </td>

                    {/* Proveedor */}
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {contrato.proveedor_adjudicado}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contrato.sector}
                        </p>
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatNumber(contrato.valor_contrato || 0, 'currency')}
                        </span>
                        {contrato.valor_pagado > 0 && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            Pagado: {formatNumber(contrato.valor_pagado, 'currency')}
                          </span>
                        )}
                        {contrato.valor_pendiente_pago > 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Pendiente: {formatNumber(contrato.valor_pendiente_pago, 'currency')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getEstadoIcon(contrato.estado_contrato || '')}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(contrato.estado_contrato || '')}`}>
                          {contrato.estado_contrato}
                        </span>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {contrato.fecha_firma 
                            ? new Date(contrato.fecha_firma).toLocaleDateString('es-CO')
                            : 'Sin fecha'
                          }
                        </span>
                        {contrato.fecha_fin_contrato && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Fin: {new Date(contrato.fecha_fin_contrato).toLocaleDateString('es-CO')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleRowExpansion(contrato.id_contrato)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {contrato.urlproceso && (
                          <button
                            onClick={() => {
                              const url = (contrato.urlproceso as any)?.url || contrato.urlproceso
                              if (typeof url === 'string' && url.trim()) {
                                openSecopLink(url.trim())
                              }
                            }}
                            className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                            title="Ver en SECOP"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => toggleRowExpansion(contrato.id_contrato)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>

                  {/* Fila expandible con detalles */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
                      >
                        <td colSpan={6} className="px-6 py-6">
                          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`p-2 bg-gradient-to-r ${CATEGORIES.contracts.gradient} rounded-lg`}>
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  Detalles del Contrato
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Información completa y enlaces
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* Información general */}
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
                                  Información General
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Proceso:</span>
                                    <p className="font-mono text-xs text-gray-700 dark:text-gray-300">{contrato.proceso_compra}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Modalidad:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{contrato.modalidad_contratacion}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{contrato.tipo_contrato}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Información del proveedor */}
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
                                  Proveedor
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Documento:</span>
                                    <p className="font-mono text-gray-700 dark:text-gray-300">{contrato.documento_proveedor}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Representante:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{contrato.nombre_representante_legal}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {contrato.es_pyme === 'Sí' && (
                                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">PYME</span>
                                    )}
                                    {contrato.es_grupo === 'Sí' && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Grupo</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Información financiera */}
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
                                  Información Financiera
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Facturado:</span>
                                    <p className="font-semibold text-green-600 dark:text-green-400">
                                      {formatNumber(contrato.valor_facturado || 0, 'currency')}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Pendiente Ejecución:</span>
                                    <p className="font-semibold text-orange-600 dark:text-orange-400">
                                      {formatNumber(contrato.valor_pendiente_ejecucion || 0, 'currency')}
                                    </p>
                                  </div>
                                  {contrato.habilita_pago_adelantado > 0 && (
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Pago Adelantado:</span>
                                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                                        {formatNumber(contrato.valor_pago_adelantado || 0, 'currency')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Descripción del proceso */}
                            {contrato.descripcion_proceso && (
                              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  Descripción del Proceso
                                </h5>
                                <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
                                  {contrato.descripcion_proceso}
                                </p>
                              </div>
                            )}

                            {/* Enlaces */}
                            {contrato.urlproceso && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">Enlaces</span>
                                  <button
                                    onClick={() => {
                                      const url = (contrato.urlproceso as any)?.url || contrato.urlproceso
                                      if (typeof url === 'string' && url.trim()) {
                                        openSecopLink(url.trim())
                                      }
                                    }}
                                    className={`
                                      flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm
                                      bg-gradient-to-r ${CATEGORIES.contracts.gradient}
                                      hover:shadow-lg transition-all duration-200
                                    `}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Ver en SECOP
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length} contratos
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Anterior
              </button>
              
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ContratosTable

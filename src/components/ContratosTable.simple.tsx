'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
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

const ContratosTableSimple: React.FC<ContratosTableProps> = ({
  contratos,
  filteredContratos,
  loading = false
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('valor_contrato')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Aplicar ordenamiento
  const processedData = useMemo(() => {
    let filtered = [...filteredContratos]

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
  }, [filteredContratos, sortField, sortDirection])

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
    setCurrentPage(1)
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
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
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
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              💡 Usa los "Filtros de Búsqueda" arriba para filtrar los contratos
            </p>
          </div>
        </div>

        {/* Nota sobre filtros integrados */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="font-medium text-blue-700 dark:text-blue-300">💡 Filtros Integrados:</span> Los contratos mostrados se filtran automáticamente usando los "Filtros de Búsqueda" en la parte superior de la página.
        </div>
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
                  onClick={() => handleSort('nombre_entidad')}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Entidad
                  {sortField === 'nombre_entidad' && (
                    sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((contrato) => {
              const isExpanded = expandedRows.has(contrato.id_contrato || contrato.referencia_contrato || '')
              const contractId = contrato.id_contrato || contrato.referencia_contrato || ''
              const stateColors = getContractStateColors(contrato.estado_contrato)

              return (
                <React.Fragment key={contractId}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleRowExpansion(contractId)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {contrato.referencia_contrato}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {contrato.proceso_compra}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {contrato.proveedor_adjudicado || 'No especificado'}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        ${formatNumber(contrato.valor_contrato)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stateColors.bg} ${stateColors.text}`}>
                        {contrato.estado_contrato || 'Sin estado'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {contrato.nombre_entidad?.replace('SECRETARIA DE ', '').replace('SECRETARÍA DE ', '') || 'No especificada'}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRowExpansion(contractId)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {contrato.urlproceso && (
                          <button
                            onClick={() => openSecopLink(contrato.urlproceso || '')}
                            className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                            title="Ver en SECOP"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>

                  {/* Detalles expandidos */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan={6} className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Información general */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Información General
                                </h4>
                                <div className="space-y-1 text-xs">
                                  <div><span className="font-medium">Descripción:</span> {contrato.descripcion_proceso || 'No disponible'}</div>
                                  <div><span className="font-medium">Modalidad:</span> {contrato.modalidad_contratacion || 'No especificada'}</div>
                                  <div><span className="font-medium">Sector:</span> {contrato.sector || 'No especificado'}</div>
                                </div>
                              </div>

                              {/* Información temporal */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Fechas
                                </h4>
                                <div className="space-y-1 text-xs">
                                  <div><span className="font-medium">Firma:</span> {contrato.fecha_firma || 'No disponible'}</div>
                                  <div><span className="font-medium">Fecha Firma:</span> {contrato.fecha_firma || 'No disponible'}</div>
                                  <div><span className="font-medium">ID:</span> {contrato.id_contrato || 'No disponible'}</div>
                                </div>
                              </div>

                              {/* Información financiera */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  Información Financiera
                                </h4>
                                <div className="space-y-1 text-xs">
                                  <div><span className="font-medium">Valor Total:</span> ${formatNumber(contrato.valor_contrato)}</div>
                                  <div><span className="font-medium">Pagado:</span> ${formatNumber(contrato.valor_pagado || 0)}</div>
                                  <div><span className="font-medium">Pendiente:</span> ${formatNumber((contrato.valor_contrato || 0) - (contrato.valor_pagado || 0))}</div>
                                </div>
                              </div>
                            </div>
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
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ContratosTableSimple


'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  Eye,
  Calendar,
  DollarSign,
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'
import { EmprestitoContrato, EmprestitoProyecto } from '@/hooks/useEmprestito'

interface EmprestitoTableProps {
  contratos: EmprestitoContrato[]
  proyectos: EmprestitoProyecto[]
  loading?: boolean
}

interface CombinedData extends EmprestitoContrato {
  descripcion_bp?: string
  nombre_comercial?: string
}

const EmprestitoTable: React.FC<EmprestitoTableProps> = ({
  contratos,
  proyectos,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBanco, setSelectedBanco] = useState('')
  const [selectedCentroGestor, setSelectedCentroGestor] = useState('')
  const [sortBy, setSortBy] = useState<'valor_contrato' | 'fecha_adjudicacion' | 'bp' | 'fecha_publicacion_proceso'>('valor_contrato')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Combinar datos de contratos y proyectos
  const combinedData: CombinedData[] = useMemo(() => {
    return contratos.map(contrato => {
      const proyecto = proyectos.find(p => p.bpin === contrato.bpin)
      return {
        ...contrato,
        descripcion_bp: proyecto?.descripcion_bp,
        nombre_comercial: proyecto?.nombre_comercial
      }
    })
  }, [contratos, proyectos])

  // Obtener listas únicas para filtros
  const bancos = useMemo(() => 
    Array.from(new Set(combinedData.map(item => item.banco))).filter(Boolean)
  , [combinedData])

  const centrosGestor = useMemo(() => 
    Array.from(new Set(combinedData.map(item => item.centro_gestor))).filter(Boolean)
  , [combinedData])

  // Filtrar datos
  const filteredData = useMemo(() => {
    return combinedData.filter(item => {
      const matchesSearch = !searchTerm || 
        item.bpin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.centro_gestor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nombre_comercial && item.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.descripcion_bp && item.descripcion_bp.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesBanco = !selectedBanco || item.banco === selectedBanco
      const matchesCentroGestor = !selectedCentroGestor || item.centro_gestor === selectedCentroGestor

      return matchesSearch && matchesBanco && matchesCentroGestor
    })
  }, [combinedData, searchTerm, selectedBanco, selectedCentroGestor])

  // Ordenar datos
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'valor_contrato') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (sortBy === 'fecha_adjudicacion' || sortBy === 'fecha_publicacion_proceso') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredData, sortBy, sortOrder])

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No definida'
    try {
      return new Date(fecha).toLocaleDateString('es-CO')
    } catch {
      return fecha
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contratos de Empréstito
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sortedData.length} contratos encontrados
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por BPIN, BP, Centro Gestor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtro por Banco */}
          <select
            value={selectedBanco}
            onChange={(e) => setSelectedBanco(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los bancos</option>
            {bancos.map(banco => (
              <option key={banco} value={banco}>{banco}</option>
            ))}
          </select>

          {/* Filtro por Centro Gestor */}
          <select
            value={selectedCentroGestor}
            onChange={(e) => setSelectedCentroGestor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los centros</option>
            {centrosGestor.map(centro => (
              <option key={centro} value={centro}>{centro}</option>
            ))}
          </select>

          {/* Botón de exportar */}
          <button className={`${CATEGORIES.emprestito.className.button} flex items-center gap-2 px-4 py-2 rounded-lg transition-colors`}>
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th 
                onClick={() => handleSort('bp')}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              >
                BP
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Proyecto
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Centro Gestor
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Banco
              </th>
              <th 
                onClick={() => handleSort('valor_contrato')}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              >
                Valor Contrato
              </th>
              <th 
                onClick={() => handleSort('fecha_publicacion_proceso')}
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              >
                Fecha Publicación
              </th>
              <th 
                onClick={() => handleSort('fecha_adjudicacion')}
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              >
                Fecha Adjudicación
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((item, index) => (
              <motion.tr
                key={item.bpin}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
              >
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {item.bp}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.bpin}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col max-w-xs">
                    <span className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2" title={item.nombre_comercial || 'Sin nombre'}>
                      {item.nombre_comercial || 'Sin nombre'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2" title={item.descripcion_bp || 'Sin descripción'}>
                      {item.descripcion_bp || 'Sin descripción'}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="max-w-48">
                    <span className="text-xs text-gray-900 dark:text-white block leading-tight" title={item.centro_gestor}>
                      {item.centro_gestor}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {item.banco}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {item.valor_contrato.toLocaleString('es-CO', { 
                      style: 'currency', 
                      currency: 'COP', 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-900 dark:text-white">
                      {formatFecha(item.fecha_publicacion_proceso)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-900 dark:text-white">
                      {formatFecha(item.fecha_adjudicacion)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    {item.link_secop && (
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Ver en SECOP"
                        onClick={() => window.open(item.link_secop, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length} contratos
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmprestitoTable

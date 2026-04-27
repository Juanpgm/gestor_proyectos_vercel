'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Calendar,
  Clock,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  ArrowUpDown
} from 'lucide-react'
import { formatNumber, ANIMATIONS } from '@/lib/design-system'
import { Proceso } from '@/hooks/useProcesos'
import { openSecopLink } from '@/utils/url-helpers'

interface ProcesosTableProps {
  procesos: Proceso[]
  loading?: boolean
}

type SortField = 'fecha_publicacion_proceso' | 'precio_base' | 'visualizaciones_procedimiento' | 'estado_procedimiento'
type SortDirection = 'asc' | 'desc'

export default function ProcesosTable({ procesos, loading = false }: ProcesosTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')
  const [modalidadFilter, setModalidadFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('fecha_publicacion_proceso')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const itemsPerPage = 20

  // Obtener valores Ãºnicos para filtros
  const estados = Array.from(new Set(procesos.map(p => p.estado_procedimiento).filter(Boolean)))
  const modalidades = Array.from(new Set(procesos.map(p => p.modalidad_contratacion).filter(Boolean)))

  // Filtrar y ordenar datos
  const filteredProcesos = useMemo(() => {
    let filtered = procesos.filter(proceso => {
      const matchesSearch = !searchTerm || 
        proceso.nombre_procedimiento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proceso.entidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proceso.referencia_proceso?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesEstado = estadoFilter === 'all' || proceso.estado_procedimiento === estadoFilter
      const matchesModalidad = modalidadFilter === 'all' || proceso.modalidad_contratacion === modalidadFilter
      
      return matchesSearch && matchesEstado && matchesModalidad
    })

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'fecha_publicacion_proceso') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [procesos, searchTerm, estadoFilter, modalidadFilter, sortField, sortDirection])

  // PaginaciÃ³n
  const totalPages = Math.ceil(filteredProcesos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProcesos = filteredProcesos.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getEstadoBadge = (estado: string, adjudicado: string) => {
    if (adjudicado === 'SÃ­' || adjudicado === 'Si') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Adjudicado
        </span>
      )
    }
    
    const statusColors: Record<string, string> = {
      'EvaluaciÃ³n': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Publicado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Cerrado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'Adjudicado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}>
        {estado}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No definida'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse text-center text-gray-500 dark:text-gray-400">
          Cargando tabla de procesos...
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={ANIMATIONS.slideUp.initial}
      animate={ANIMATIONS.slideUp.animate}
      transition={ANIMATIONS.slideUp.transition}
      className="bg-white dark:bg-gray-800 rounded-md shadow-none border border-gray-200 dark:border-gray-700"
    >
      {/* Header y Filtros */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tabla de Procesos ({filteredProcesos.length.toLocaleString('es-CO')})
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* BÃºsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar procesos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* Filtro Estado */}
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Todos los estados</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>

            {/* Filtro Modalidad */}
            <select
              value={modalidadFilter}
              onChange={(e) => {
                setModalidadFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Todas las modalidades</option>
              {modalidades.slice(0, 10).map(modalidad => (
                <option key={modalidad} value={modalidad}>
                  {modalidad.length > 30 ? modalidad.substring(0, 30) + '...' : modalidad}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Proceso
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('fecha_publicacion_proceso')}
              >
                <div className="flex items-center gap-1">
                  Fecha PublicaciÃ³n
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('precio_base')}
              >
                <div className="flex items-center gap-1">
                  Valor Base
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('estado_procedimiento')}
              >
                <div className="flex items-center gap-1">
                  Estado
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Modalidad
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('visualizaciones_procedimiento')}
              >
                <div className="flex items-center gap-1">
                  Visualizaciones
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedProcesos.map((proceso, index) => (
              <tr key={`${proceso.id_proceso}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {proceso.nombre_procedimiento?.substring(0, 60)}
                      {proceso.nombre_procedimiento && proceso.nombre_procedimiento.length > 60 && '...'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {proceso.referencia_proceso}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {proceso.entidad?.substring(0, 40)}
                      {proceso.entidad && proceso.entidad.length > 40 && '...'}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(proceso.fecha_publicacion_proceso)}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    {formatNumber(proceso.precio_base || 0, 'currency')}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {getEstadoBadge(proceso.estado_procedimiento, proceso.adjudicado)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {proceso.modalidad_contratacion?.substring(0, 25)}
                  {proceso.modalidad_contratacion && proceso.modalidad_contratacion.length > 25 && '...'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {proceso.visualizaciones_procedimiento?.toLocaleString('es-CO') || 0}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openSecopLink(`https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=${proceso.id_proceso}&isFromPublicArea=True`)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Ver en SECOP"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PaginaciÃ³n */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredProcesos.length)} de {filteredProcesos.length} procesos
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                PÃ¡gina {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

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
  ChevronRight,
  FileText
} from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'
import { EmprestitoContrato, EmprestitoProyecto } from '@/hooks/useEmprestito'
import { openSecopLink } from '@/utils/url-helpers'

// Función helper para obtener los colores del estado del contrato
const getContractStateColors = (estado: string) => {
  const estadoLower = (estado || '').toLowerCase()
  
  // Estados positivos - Verde
  if (['celebrado', 'liquidado', 'ejecutado', 'finalizado'].some(s => estadoLower.includes(s))) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
  
  // Estados de finalización - Azul
  if (['terminado', 'completado', 'cerrado'].some(s => estadoLower.includes(s))) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
  
  // Estados en progreso - Amarillo
  if (['en ejecución', 'ejecución', 'vigente', 'activo', 'en curso'].some(s => estadoLower.includes(s))) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  }
  
  // Estados de adjudicación - Púrpura
  if (['adjudicado', 'asignado', 'contratado'].some(s => estadoLower.includes(s))) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  }
  
  // Estados de convocatoria - Naranja
  if (['convocado', 'abierto', 'publicado', 'licitación'].some(s => estadoLower.includes(s))) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  }
  
  // Estados negativos - Rojo
  if (['desierto', 'cancelado', 'anulado', 'revocado', 'fallido'].some(s => estadoLower.includes(s))) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  
  // Estados suspendidos - Ámbar
  if (['suspendido', 'pausado', 'detenido'].some(s => estadoLower.includes(s))) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
  }
  
  // Estados en evaluación - Índigo
  if (['evaluación', 'revisión', 'análisis', 'estudio'].some(s => estadoLower.includes(s))) {
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
  }
  
  // Estados de inicio - Teal
  if (['inicio', 'iniciado', 'comenzado'].some(s => estadoLower.includes(s))) {
    return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400'
  }
  
  // Estados desconocidos o sin estado - Gris
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
}

interface EmprestitoTableProps {
  proyectos: EmprestitoProyecto[]
  contratos: EmprestitoContrato[]
  loading?: boolean
}

const EmprestitoTable: React.FC<EmprestitoTableProps> = ({
  proyectos = [],
  contratos = [],
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntidad, setSelectedEntidad] = useState('')
  const [selectedCentroGestor, setSelectedCentroGestor] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'proyectos' | 'contratos'>('proyectos')
  const itemsPerPage = 10

  // Filtros únicos
  const uniqueEntidades = useMemo(() => 
    Array.from(new Set(contratos.map(contrato => contrato?.nombre_entidad).filter(Boolean))),
    [contratos]
  )

  const uniqueCentrosGestor = useMemo(() => 
    Array.from(new Set(proyectos.map(proyecto => proyecto?.nombre_centro_gestor).filter(Boolean))),
    [proyectos]
  )

  // Filtrado de proyectos
  const filteredProyectos = useMemo(() => {
    return proyectos.filter(proyecto => {
      if (!proyecto) return false;
      
      const matchesSearch = !searchTerm || 
        (proyecto.nombre_proyecto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proyecto.nombre_centro_gestor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proyecto.bpin || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCentroGestor = !selectedCentroGestor || 
        (proyecto.nombre_centro_gestor || '') === selectedCentroGestor
      
      return matchesSearch && matchesCentroGestor
    })
  }, [proyectos, searchTerm, selectedCentroGestor])

  // Filtrado de contratos
  const filteredContratos = useMemo(() => {
    return contratos.filter(contrato => {
      if (!contrato) return false;
      
      const matchesSearch = !searchTerm || 
        (contrato.descripcion_proceso || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.nombre_entidad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.proveedor_adjudicado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.bpin || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesEntidad = !selectedEntidad || 
        (contrato.nombre_entidad || '') === selectedEntidad
      
      return matchesSearch && matchesEntidad
    })
  }, [contratos, searchTerm, selectedEntidad])

  // Paginación
  const getCurrentItems = (): (EmprestitoProyecto | EmprestitoContrato)[] => {
    const items = activeTab === 'proyectos' ? filteredProyectos : filteredContratos
    const startIndex = (currentPage - 1) * itemsPerPage
    return items.slice(startIndex, startIndex + itemsPerPage)
  }

  const totalPages = Math.ceil(
    (activeTab === 'proyectos' ? filteredProyectos.length : filteredContratos.length) / itemsPerPage
  )

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedEntidad('')
    setSelectedCentroGestor('')
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Proyectos y Contratos de Empréstito
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredProyectos.length} proyectos y {filteredContratos.length} contratos
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('proyectos')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'proyectos'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Proyectos ({filteredProyectos.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('contratos')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'contratos'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Contratos ({filteredContratos.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filtro por entidad (solo para contratos) */}
          {activeTab === 'contratos' && (
            <select
              value={selectedEntidad}
              onChange={(e) => setSelectedEntidad(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todas las entidades</option>
              {uniqueEntidades.map(entidad => (
                <option key={entidad} value={entidad}>{entidad}</option>
              ))}
            </select>
          )}

          {/* Filtro por centro gestor (solo para proyectos) */}
          {activeTab === 'proyectos' && (
            <select
              value={selectedCentroGestor}
              onChange={(e) => setSelectedCentroGestor(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos los centros gestores</option>
              {uniqueCentrosGestor.map(centro => (
                <option key={centro} value={centro}>{centro}</option>
              ))}
            </select>
          )}

          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'proyectos' ? (
          /* Tabla de Proyectos */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">BPIN</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Proyecto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Centro Gestor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Dimensión</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Año</th>
                </tr>
              </thead>
              <tbody>
                {(getCurrentItems() as EmprestitoProyecto[]).map((proyecto, index) => (
                  <motion.tr
                    key={proyecto.bpin}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 font-mono text-sm">{proyecto.bpin}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(proyecto.nombre_proyecto || '').length > 50
                          ? `${(proyecto.nombre_proyecto || '').substring(0, 50)}...`
                          : proyecto.nombre_proyecto || 'Sin nombre'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {proyecto.nombre_actividad || 'Sin actividad'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {proyecto.nombre_centro_gestor || 'Sin centro gestor'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {proyecto.nombre_dimension || 'Sin dimensión'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {proyecto.anio || 'Sin año'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tabla de Contratos */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">BPIN</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Proceso</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Entidad</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Proveedor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Valor Contrato</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(getCurrentItems() as EmprestitoContrato[]).map((contrato, index) => (
                  <motion.tr
                    key={`${contrato.bpin}-${contrato.id_contrato}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 font-mono text-sm">{contrato.bpin}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {contrato.referencia_contrato || 'Sin referencia'}
                      </div>
                      {contrato.objeto_contrato && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          {contrato.objeto_contrato.length > 60
                            ? `${contrato.objeto_contrato.substring(0, 60)}...`
                            : contrato.objeto_contrato}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {contrato.tipo_contrato || 'Sin tipo'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {contrato.nombre_entidad || 'Sin entidad'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {(contrato.proveedor_adjudicado || '').length > 30
                        ? `${(contrato.proveedor_adjudicado || '').substring(0, 30)}...`
                        : contrato.proveedor_adjudicado || 'Sin proveedor'}
                    </td>
                    <td className="py-3 px-4 font-medium text-teal-600 dark:text-teal-400">
                      {formatNumber(contrato.valor_contrato, 'currency')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getContractStateColors(contrato.estado_contrato)
                      }`}>
                        {contrato.estado_contrato || 'Sin estado'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {contrato.urlproceso && (
                        <button
                          onClick={() => openSecopLink(contrato.urlproceso)}
                          className="text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
                          title="Ver en SECOP"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmprestitoTable

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
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
import ContratosModal from './ContratosModal'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'proyectos' | 'contratos'>('proyectos')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedContrato, setSelectedContrato] = useState<EmprestitoContrato | null>(null)
  const [reportesData, setReportesData] = useState<any[]>([])
  const [loadingReportes, setLoadingReportes] = useState(false)
  const itemsPerPage = 10

  // Cargar datos de reportes para los detalles del modal
  useEffect(() => {
    const fetchReportesData = async () => {
      try {
        setLoadingReportes(true)
        const reportesRes = await fetch('https://gestorproyectoapi-production.up.railway.app/reportes-contratos/')
        if (reportesRes.ok) {
          const reportes = await reportesRes.json()
          setReportesData(reportes.data || [])
        }
      } catch (error) {
        console.error('Error cargando reportes:', error)
      } finally {
        setLoadingReportes(false)
      }
    }

    fetchReportesData()
  }, [])

  // Función para abrir el modal con los datos del contrato
  const handleOpenModal = (contrato: EmprestitoContrato) => {
    // Buscar datos adicionales del reporte para este contrato
    const reporteContrato = reportesData.find(r => 
      r.referencia_contrato === contrato.referencia_del_contrato ||
      r.id_contrato === contrato.id_contrato ||
      r.bpin === contrato.bpin
    )

    // Combinar datos del contrato con datos del reporte
    const contratoCompleto = {
      ...contrato,
      ...reporteContrato,
      // Asegurar que los campos de ejecución estén disponibles
      ejecucion_fisica: reporteContrato?.ejecucion_fisica || null,
      ejecucion_financiera: reporteContrato?.ejecucion_financiera || null,
      pagos: reporteContrato?.pagos || null
    }

    setSelectedContrato(contratoCompleto)
    setModalOpen(true)
  }

  // Paginación
  const getCurrentItems = (): (EmprestitoProyecto | EmprestitoContrato)[] => {
    const items = activeTab === 'proyectos' ? proyectos : contratos
    const startIndex = (currentPage - 1) * itemsPerPage
    return items.slice(startIndex, startIndex + itemsPerPage)
  }

  const totalPages = Math.ceil(
    (activeTab === 'proyectos' ? proyectos.length : contratos.length) / itemsPerPage
  )

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse text-center text-gray-500 dark:text-gray-400">
          Cargando tabla de empréstito...
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
              {proyectos.length} proyectos y {contratos.length} contratos
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
              Proyectos ({proyectos.length})
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
              Contratos ({contratos.length})
            </button>
          </div>
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
                  <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-white w-48">Referencia / Centro Gestor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Proveedor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Valor Contrato</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Avance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Observaciones / Alertas</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-900 dark:text-white w-16">Detalle</th>
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
                    <td className="py-3 px-2 w-48">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900 dark:text-white text-xs leading-tight">
                          {contrato.descripcion_del_proceso || contrato.referencia_del_contrato || 'Sin proceso'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                          {contrato.nombre_entidad || 'Sin centro gestor'}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                          {contrato.referencia_del_contrato || 'Sin referencia'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {(contrato.proveedor_adjudicado || '').length > 30
                        ? `${(contrato.proveedor_adjudicado || '').substring(0, 30)}...`
                        : contrato.proveedor_adjudicado || 'Sin proveedor'}
                    </td>
                    <td className="py-3 px-4 font-medium text-teal-600 dark:text-teal-400">
                      {formatNumber(contrato.valor_del_contrato, 'currency')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        {/* Progress bar para Avance Financiero */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Financiero</span>
                            <span className="font-medium">
                              {Math.round(((contrato.valor_pagado || 0) / (contrato.valor_del_contrato || 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(((contrato.valor_pagado || 0) / (contrato.valor_del_contrato || 1)) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                        {/* Progress bar para Avance Físico (calculado basado en fechas) */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Físico</span>
                            <span className="font-medium">
                              {(() => {
                                const fechaInicio = contrato.fecha_de_firma ? new Date(contrato.fecha_de_firma) : null
                                const fechaFin = contrato.fecha_de_fin_del_contrato ? new Date(contrato.fecha_de_fin_del_contrato) : null
                                const fechaActual = new Date()
                                
                                if (!fechaInicio || !fechaFin) return '0%'
                                
                                const tiempoTotal = fechaFin.getTime() - fechaInicio.getTime()
                                const tiempoTranscurrido = fechaActual.getTime() - fechaInicio.getTime()
                                const porcentaje = Math.min(Math.max((tiempoTranscurrido / tiempoTotal) * 100, 0), 100)
                                
                                return Math.round(porcentaje) + '%'
                              })()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(() => {
                                  const fechaInicio = contrato.fecha_de_firma ? new Date(contrato.fecha_de_firma) : null
                                  const fechaFin = contrato.fecha_de_fin_del_contrato ? new Date(contrato.fecha_de_fin_del_contrato) : null
                                  const fechaActual = new Date()
                                  
                                  if (!fechaInicio || !fechaFin) return 0
                                  
                                  const tiempoTotal = fechaFin.getTime() - fechaInicio.getTime()
                                  const tiempoTranscurrido = fechaActual.getTime() - fechaInicio.getTime()
                                  const porcentaje = Math.min(Math.max((tiempoTranscurrido / tiempoTotal) * 100, 0), 100)
                                  
                                  return porcentaje
                                })()}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getContractStateColors(contrato.estado_contrato)
                      }`}>
                        {contrato.estado_contrato || 'Sin estado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                      {(() => {
                        const observaciones = []
                        
                        // Revisar si hay retrasos
                        const fechaFin = contrato.fecha_de_fin_del_contrato ? new Date(contrato.fecha_de_fin_del_contrato) : null
                        if (fechaFin && fechaFin < new Date() && contrato.estado_contrato?.toLowerCase() !== 'liquidado') {
                          observaciones.push('⚠️ Vencido')
                        }
                        
                        // Revisar avance financiero vs físico
                        const avanceFinanciero = ((contrato.valor_pagado || 0) / (contrato.valor_del_contrato || 1)) * 100
                        const fechaInicio = contrato.fecha_de_firma ? new Date(contrato.fecha_de_firma) : null
                        const fechaFinContrato = contrato.fecha_de_fin_del_contrato ? new Date(contrato.fecha_de_fin_del_contrato) : null
                        const fechaActual = new Date()
                        
                        let avanceFisico = 0
                        if (fechaInicio && fechaFinContrato) {
                          const tiempoTotal = fechaFinContrato.getTime() - fechaInicio.getTime()
                          const tiempoTranscurrido = fechaActual.getTime() - fechaInicio.getTime()
                          avanceFisico = Math.min(Math.max((tiempoTranscurrido / tiempoTotal) * 100, 0), 100)
                        }
                        
                        if (avanceFinanciero > avanceFisico + 20) {
                          observaciones.push('📈 Avance financiero alto')
                        } else if (avanceFisico > avanceFinanciero + 20) {
                          observaciones.push('📉 Avance financiero bajo')
                        }
                        
                        // Revisar si está próximo a vencer
                        if (fechaFin) {
                          const diasRestantes = Math.ceil((fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          if (diasRestantes <= 30 && diasRestantes > 0) {
                            observaciones.push('🔔 Próximo a vencer')
                          }
                        }
                        
                        return observaciones.length > 0 ? observaciones.join(', ') : 'Sin observaciones'
                      })()}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleOpenModal(contrato)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg"
                        title="Ver detalles del contrato"
                        disabled={loadingReportes}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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

      {/* Modal de detalles del contrato */}
      <ContratosModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedContrato(null)
        }}
        contratoData={selectedContrato}
        referenciaContrato={selectedContrato?.referencia_del_contrato}
      />
    </div>
  )
}

export default EmprestitoTable

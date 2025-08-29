'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, DollarSign, Building, PieChart as PieChartIcon, Activity, Info, ChevronDown, ChevronUp, MapPin, Calendar, Package, Users } from 'lucide-react'
import { Project } from './ProjectsTable'
import { useDataContext } from '../context/DataContext'
import { ActivityProgressGauge, ProductProgressGauge, BudgetExecutionGauge } from './GaugeChart'
import { exportProjectToPDF } from '../utils/pdfExporter'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}

interface CollapsibleSectionProps {
  title: string | React.ReactNode
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center">
          {icon}
          <span className="text-lg font-semibold text-gray-900 dark:text-white ml-2">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t border-gray-200 dark:border-gray-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, project }) => {
  const { seguimientoPa, ejecucionPresupuestal, productosPa, actividadesPa, equipamientos, infraestructuraVial } = useDataContext()
  const dataContext = useDataContext()

  if (!project) return null

  // Funciones de utilidad
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Función para determinar el estado de una actividad
  const getActivityStatus = (actividad: any) => {
    const today = new Date()
    const startDate = actividad.fecha_inicio_actividad ? new Date(actividad.fecha_inicio_actividad) : null
    const endDate = actividad.fecha_fin_actividad ? new Date(actividad.fecha_fin_actividad) : null
    const progress = actividad.avance_actividad_acumulado || 0

    // Si no tiene fechas para comparar (cualquiera de las dos fechas faltante)
    if (!startDate || !endDate) {
      return {
        status: 'La tarea no posee fecha de inicio o fin',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: '❓'
      }
    }

    // Si tiene progreso del 100% (1.0), está completada
    if (progress >= 1.0) {
      return {
        status: 'Completada',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: '✓'
      }
    }

    // No iniciada: avance 0% y fecha de inicio anterior a hoy
    if (progress === 0 && startDate && startDate < today) {
      return {
        status: 'No Iniciada',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        icon: '⏸'
      }
    }

    // Si ya pasó la fecha de fin y no está completa, está demorada
    if (endDate && endDate < today && progress < 1.0) {
      return {
        status: 'Demorada',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        icon: '⚠'
      }
    }

    // Si está dentro del rango de fechas, está a tiempo
    return {
      status: 'A Tiempo',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      icon: '▶'
    }
  }

  const formatPercentage = (value: number) => {
    return value.toFixed(1) + '%'
  }

  const formatPercentageFromDecimal = (value: number) => {
    return (value * 100).toFixed(2) + '%'
  }

  const formatPeriod = (period: string) => {
    if (!period) return '—'
    const [year, month] = period.split('-')
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    const monthName = months[parseInt(month) - 1] || ''
    return `${monthName} ${year}`
  }

  const getProductStatus = (producto: any) => {
    const avanceReal = producto.avance_real_producto || 0
    const avanceProducto = producto.avance_producto || 0
    
    // Si el avance real es 100% (1.0), está completado
    if (avanceReal >= 1.0) {
      return {
        status: 'Completado',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: '✓'
      }
    }

    // Si tiene avance significativo, está en progreso
    if (avanceReal > 0.1) {
      return {
        status: 'En Progreso',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        icon: '▶'
      }
    }

    // Si no tiene avance, no ha iniciado
    return {
      status: 'No Iniciado',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      icon: '⏸'
    }
  }

  // Funciones para obtener datos específicos
  const getProgresoFisico = (bpin: number) => {
    const seguimiento = seguimientoPa?.find(s => s.bpin === bpin)
    return seguimiento?.avance_proyecto_pa ? (seguimiento.avance_proyecto_pa * 100) : 0
  }

  const getProgresoFinanciero = (bpin: number) => {
    const ejecucion = ejecucionPresupuestal?.find(e => e.bpin === bpin)
    if (ejecucion?.ejecucion && ejecucion?.ppto_modificado && ejecucion.ppto_modificado > 0) {
      return (ejecucion.ejecucion / ejecucion.ppto_modificado) * 100
    }
    return project.progressFinanciero || ((project.executed / project.budget) * 100) || 0
  }

  const getActividadesByBpin = (bpin: number) => {
    return actividadesPa?.filter(actividad => actividad.bpin === bpin) || []
  }

  const getProductosByBpin = (bpin: number) => {
    return productosPa?.filter(producto => producto.bpin === bpin) || []
  }

  const getUnidadesProyecto = (bpin: number) => {
    const equipamientosDelProyecto = equipamientos?.filter(eq => eq.bpin === bpin) || []
    const infraestructuraDelProyecto = infraestructuraVial?.filter(inf => inf.bpin === bpin) || []
    return [...equipamientosDelProyecto, ...infraestructuraDelProyecto]
  }

  // Función para obtener el color de la barra de progreso basado en el tipo y porcentaje
  const getProgressBarColor = (type: 'physical' | 'financial', progress: number) => {
    if (type === 'physical') {
      if (progress < 30) return 'bg-red-500'
      if (progress < 60) return 'bg-amber-500'
      if (progress < 90) return 'bg-blue-500'
      return 'bg-emerald-500'
    } else {
      if (progress < 30) return 'bg-red-600'
      if (progress < 60) return 'bg-orange-500'
      if (progress < 90) return 'bg-emerald-600'
      return 'bg-green-600'
    }
  }

  const getProgressTextColor = (type: 'physical' | 'financial', progress: number) => {
    if (type === 'physical') {
      if (progress < 30) return 'text-red-500'
      if (progress < 60) return 'text-amber-500'
      if (progress < 90) return 'text-blue-500'
      return 'text-emerald-500'
    } else {
      if (progress < 30) return 'text-red-600'
      if (progress < 60) return 'text-orange-500'
      if (progress < 90) return 'text-emerald-600'
      return 'text-green-600'
    }
  }

  const getBPFromBPIN = (bpin: string) => {
    // Obtener BP desde el contexto de datos si está disponible
    const proyectoData = dataContext.proyectos?.find(p => p.bpin === Number(bpin))
    return proyectoData?.bp || bpin.substring(0, 8) // Fallback: primeros 8 dígitos del BPIN
  }

  // Función para exportar PDF
  const handleExportPDF = () => {
    if (project) {
      exportProjectToPDF(project)
    }
  }
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            id="project-modal-content"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h2 className="text-3xl font-bold mb-2 text-white break-words leading-tight">{project.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-blue-100 text-base mb-2">
                    <span className="flex items-center">
                      <Building className="w-4 h-4 mr-1 flex-shrink-0" />
                      BPIN: {project.bpin}
                    </span>
                    <span className="flex items-center">
                      <Info className="w-4 h-4 mr-1 flex-shrink-0" />
                      BP: {getBPFromBPIN(project.bpin)}
                    </span>
                  </div>
                  <div className="text-blue-200 text-base">
                    <span className="font-medium">Centro Gestor:</span>
                    <span className="text-blue-100 ml-1 break-words">{project.responsible}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-full"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
                        {/* Contenido */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)] bg-white dark:bg-gray-900 flex-1">
              <div className="p-3 space-y-3">
                
                {/* Progreso */}
                <CollapsibleSection
                  title="Progreso del Proyecto"
                  icon={<Activity className="w-4 h-4 text-blue-600" />}
                  defaultOpen={true}
                >
                  <div className="space-y-3 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    {/* Progreso Físico */}
                    <div className="bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">Progreso Físico</span>
                        <span className={`text-base font-semibold ${getProgressTextColor('physical', getProgresoFisico(Number(project.bpin)))} dark:${getProgressTextColor('physical', getProgresoFisico(Number(project.bpin)))}`}>
                          {formatPercentage(getProgresoFisico(Number(project.bpin)))}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`${getProgressBarColor('physical', getProgresoFisico(Number(project.bpin)))} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(getProgresoFisico(Number(project.bpin)), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progreso Financiero */}
                    <div className="bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">Progreso Financiero</span>
                        <span className={`text-base font-semibold ${getProgressTextColor('financial', getProgresoFinanciero(Number(project.bpin)))} dark:${getProgressTextColor('financial', getProgresoFinanciero(Number(project.bpin)))}`}>
                          {formatPercentage(getProgresoFinanciero(Number(project.bpin)))}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`${getProgressBarColor('financial', getProgresoFinanciero(Number(project.bpin)))} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(getProgresoFinanciero(Number(project.bpin)), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Información Financiera */}
                <CollapsibleSection
                  title="Información Financiera"
                  icon={<DollarSign className="w-4 h-4 text-green-600" />}
                  defaultOpen={true}
                >
                  <div className="space-y-4">
                    {/* Métricas financieras */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-gray-700 rounded-lg border">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Presupuesto</div>
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(project.budget)}
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-gray-700 rounded-lg border">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ejecutado</div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(project.executed)}
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-gray-700 rounded-lg border">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Pagado</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(project.pagado)}
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-gray-700 rounded-lg border">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Disponible</div>
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {formatCurrency(Math.max(0, project.budget - project.executed))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Información del Proyecto */}
                <CollapsibleSection
                  title="Información del Proyecto"
                  icon={<Info className="w-4 h-4 text-blue-600" />}
                  defaultOpen={true}
                >
                  <div className="space-y-2 text-sm bg-blue-50/30 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    {(() => {
                      const proyectoData = dataContext.proyectos?.find(p => p.bpin === Number(project.bpin))
                      return proyectoData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {proyectoData.nombre_centro_gestor && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border border-blue-200 dark:border-blue-600">
                              <span className="text-blue-700 dark:text-blue-300 font-medium text-xs block">Centro Gestor</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{proyectoData.nombre_centro_gestor}</span>
                            </div>
                          )}
                          {proyectoData.nombre_programa && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border border-blue-200 dark:border-blue-600">
                              <span className="text-blue-700 dark:text-blue-300 font-medium text-xs block">Programa</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{proyectoData.nombre_programa}</span>
                            </div>
                          )}
                          {proyectoData.nombre_dimension && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border border-blue-200 dark:border-blue-600">
                              <span className="text-blue-700 dark:text-blue-300 font-medium text-xs block">Dimensión</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{proyectoData.nombre_dimension}</span>
                            </div>
                          )}
                          {proyectoData.nombre_fondo && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border border-blue-200 dark:border-blue-600">
                              <span className="text-blue-700 dark:text-blue-300 font-medium text-xs block">Fuente de Financiación</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{proyectoData.nombre_fondo}</span>
                            </div>
                          )}
                          {project.status && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border border-blue-200 dark:border-blue-600">
                              <span className="text-blue-700 dark:text-blue-300 font-medium text-xs block">Estado</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{project.status}</span>
                            </div>
                          )}
                          {project.comuna && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border border-blue-200 dark:border-blue-600">
                              <span className="text-blue-700 dark:text-blue-300 font-medium text-xs block">Comuna</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{project.comuna}</span>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </CollapsibleSection>

                {/* Productos */}
                {(() => {
                  const productos = getProductosByBpin(Number(project.bpin))
                  return productos.length > 0 && (
                    <CollapsibleSection
                      title={
                        <div className="flex items-center justify-between w-full">
                          <span>{`Productos (${productos.length})`}</span>
                          <button
                            onClick={() => {
                              window.location.href = `/?tab=products&bpin=${project.bpin}#products`
                            }}
                            className="ml-4 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            Ver Productos
                          </button>
                        </div>
                      }
                      icon={<Package className="w-4 h-4 text-orange-600" />}
                      defaultOpen={true}
                    >
                      {/* Tabla real de productos */}
                      <div className="overflow-hidden border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50/30 dark:bg-orange-900/10">
                        <table className="min-w-full divide-y divide-orange-200 dark:divide-orange-600">
                          <thead className="bg-orange-50 dark:bg-orange-900/30">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wider w-[70%]">
                                PRODUCTO
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wider w-[30%]">
                                SEGUIMIENTO
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-orange-200 dark:divide-orange-600">
                            {productos.map((producto, index) => {
                              const statusInfo = getProductStatus(producto)
                              const statusColors = {
                                'Completado': 'text-green-600 dark:text-green-400',
                                'En Progreso': 'text-blue-600 dark:text-blue-400',
                                'No Iniciado': 'text-gray-600 dark:text-gray-400'
                              } as const
                              
                              const statusKey = statusInfo.status as keyof typeof statusColors
                              const progresoProducto = (producto.avance_real_producto || 0) * 100
                              const ejecucionProducto = producto.ejecucion_ppto_producto && producto.ppto_inicial_producto 
                                ? (producto.ejecucion_ppto_producto / producto.ppto_inicial_producto) * 100 
                                : 0
                              
                              return (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                  {/* Columna PRODUCTO (70%) */}
                                  <td className="px-4 py-5 align-top w-[70%]">
                                    <div className="space-y-3 text-left">
                                      {/* Título */}
                                      <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight text-left break-words hyphens-auto">
                                          {producto.nombre_producto || 'Sin nombre'}
                                        </h4>
                                      </div>
                                      
                                      {/* Descripción completa */}
                                      {producto.descripcion_avance_producto && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-left break-words hyphens-auto">
                                          {producto.descripcion_avance_producto}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Columna SEGUIMIENTO (30%) */}
                                  <td className="px-4 py-5 align-top border-l border-orange-200 dark:border-orange-600 w-[30%]">
                                    <div className="space-y-3">
                                      {/* Estado */}
                                      <div className="flex flex-col space-y-1">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado:</span>
                                        <span className={`text-xs font-medium ${statusColors[statusKey]} break-words`}>
                                          {statusInfo.status}
                                        </span>
                                      </div>
                                      
                                      {/* Información básica */}
                                      <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Meta:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {producto.cantidad_programada_producto ? producto.cantidad_programada_producto.toLocaleString() : '—'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Periodo:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {formatPeriod(producto.periodo_corte)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Ponderación:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {producto.ponderacion_producto !== undefined ? formatPercentageFromDecimal(producto.ponderacion_producto) : '—'}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Progreso Físico */}
                                      <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progreso Físico</span>
                                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {progresoProducto.toFixed(1)}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                          <div 
                                            className={`${getProgressBarColor('physical', progresoProducto)} h-1.5 rounded-full transition-all duration-300`}
                                            style={{ width: `${Math.min(progresoProducto, 100)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      
                                      {/* Ejecución Presupuestal */}
                                      <div>
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ejecución Presup.</span>
                                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {ejecucionProducto.toFixed(1)}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                          <div 
                                            className={`${getProgressBarColor('financial', ejecucionProducto)} h-1.5 rounded-full transition-all duration-300`}
                                            style={{ width: `${Math.min(ejecucionProducto, 100)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      
                                      {/* Presupuesto */}
                                      <div className="pt-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Total:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {producto.ppto_inicial_producto ? formatCurrency(producto.ppto_inicial_producto) : '—'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Ejecutado:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {producto.ejecucion_ppto_producto ? formatCurrency(producto.ejecucion_ppto_producto) : '—'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CollapsibleSection>
                  )
                })()}

                {/* Actividades */}
                {(() => {
                  const actividades = getActividadesByBpin(Number(project.bpin))
                  return actividades.length > 0 && (
                    <CollapsibleSection
                      title={
                        <div className="flex items-center justify-between w-full">
                          <span>{`Actividades (${actividades.length})`}</span>
                          <button
                            onClick={() => {
                              window.location.href = `/?tab=activities&bpin=${project.bpin}#activities`
                            }}
                            className="ml-4 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            Ver Actividades
                          </button>
                        </div>
                      }
                      icon={<Activity className="w-4 h-4 text-red-600" />}
                      defaultOpen={true}
                    >
                      {/* Tabla de actividades */}
                      <div className="overflow-x-auto bg-red-50/30 dark:bg-red-900/10 border border-red-200 dark:border-red-700 rounded-lg">
                        <table className="w-full border-collapse border border-red-200 dark:border-red-700">
                            <thead>
                              <tr className="bg-red-50 dark:bg-red-900/30">
                                <th className="border border-red-200 dark:border-red-700 px-3 py-2 text-left text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wider w-[70%]">
                                  Actividad
                                </th>
                                <th className="border border-red-200 dark:border-red-700 px-3 py-2 text-left text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wider w-[30%]">
                                  Seguimiento
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-red-200 dark:divide-red-700">
                              {actividades.map((actividad, index) => {
                                const statusInfo = getActivityStatus(actividad)
                                const progresoActividad = (actividad.avance_actividad_acumulado || 0) * 100
                                const ejecucionActividad = actividad.ejecucion_actividad && actividad.ppto_inicial_actividad 
                                  ? (actividad.ejecucion_actividad / actividad.ppto_inicial_actividad) * 100 
                                  : 0
                                
                                // Calcular duración
                                const calculateDuration = () => {
                                  if (!actividad.fecha_inicio_actividad || !actividad.fecha_fin_actividad) {
                                    return '—'
                                  }
                                  const startDate = new Date(actividad.fecha_inicio_actividad)
                                  const endDate = new Date(actividad.fecha_fin_actividad)
                                  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                  return `${diffDays} días`
                                }
                                
                                return (
                                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                                    {/* Información Principal - 70% del ancho */}
                                    <td className="border border-red-200 dark:border-red-700 px-3 py-4 w-[70%]">
                                      <div className="space-y-3 text-left">
                                        {/* Título */}
                                        <div>
                                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight text-left break-words hyphens-auto">
                                            {actividad.nombre_actividad || 'Sin nombre'}
                                          </h4>
                                        </div>
                                        
                                        {/* Descripción completa */}
                                        {actividad.descripcion_actividad && (
                                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-left break-words hyphens-auto">
                                            {actividad.descripcion_actividad}
                                          </p>
                                        )}
                                      </div>
                                    </td>
                                    
                                    {/* Métricas y seguimiento - 30% del ancho */}
                                    <td className="border border-red-200 dark:border-red-700 px-3 py-4 w-[30%]">
                                      <div className="space-y-3">
                                        {/* Estado */}
                                        <div className="flex flex-col space-y-1">
                                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado:</span>
                                          <span className={`text-xs font-medium ${
                                            statusInfo.status === 'Completada' 
                                              ? 'text-green-600 dark:text-green-400' 
                                              : statusInfo.status === 'No Iniciada'
                                              ? 'text-gray-600 dark:text-gray-400'
                                              : statusInfo.status === 'Demorada'
                                              ? 'text-red-600 dark:text-red-400'
                                              : statusInfo.status === 'A Tiempo'
                                              ? 'text-blue-600 dark:text-blue-400'
                                              : 'text-yellow-600 dark:text-yellow-400'
                                          } break-words`}>
                                            {statusInfo.status}
                                          </span>
                                        </div>
                                        
                                        {/* Información de fechas */}
                                        <div className="space-y-2 text-xs">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Inicio:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                              {actividad.fecha_inicio_actividad ? formatDate(actividad.fecha_inicio_actividad) : '—'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Fin:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                              {actividad.fecha_fin_actividad ? formatDate(actividad.fecha_fin_actividad) : '—'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Duración:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                              {calculateDuration()}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Progreso Físico */}
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progreso Físico</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                              {progresoActividad.toFixed(1)}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div 
                                              className={`${getProgressBarColor('physical', progresoActividad)} h-1.5 rounded-full transition-all duration-300`}
                                              style={{ width: `${Math.min(progresoActividad, 100)}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                        
                                        {/* Progreso Financiero */}
                                        <div>
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progreso Financiero</span>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                              {ejecucionActividad.toFixed(1)}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div 
                                              className={`${getProgressBarColor('financial', ejecucionActividad)} h-1.5 rounded-full transition-all duration-300`}
                                              style={{ width: `${Math.min(ejecucionActividad, 100)}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                        
                                        {/* Presupuesto */}
                                        <div className="pt-1 text-xs">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Inicial:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                              {actividad.ppto_inicial_actividad ? formatCurrency(actividad.ppto_inicial_actividad) : '—'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Ejecutado:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                              {actividad.ejecucion_actividad ? formatCurrency(actividad.ejecucion_actividad) : '—'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                    </CollapsibleSection>
                  )
                })()}

                {/* Unidades de Proyecto */}
                {(() => {
                  const unidades = getUnidadesProyecto(Number(project.bpin))
                  return unidades.length > 0 && (
                    <CollapsibleSection
                      title={`Unidades de Proyecto (${unidades.length})`}
                      icon={<MapPin className="w-4 h-4 text-red-600" />}
                      defaultOpen={false}
                    >
                      <div className="space-y-3">
                        {/* Mapa Simplificado */}
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 h-48 flex items-center justify-center border">
                          <div className="text-center">
                            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Mapa de {unidades.length} unidades de proyecto
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              (Visualización simplificada)
                            </p>
                          </div>
                        </div>
                        
                        {/* Lista de Unidades */}
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {unidades.slice(0, 5).map((unidad, index) => (
                            <div key={index} className="bg-white dark:bg-gray-700 p-2 rounded border text-xs">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {unidad.nombre || unidad.nombre_equipamiento || 'Unidad sin nombre'}
                              </div>
                              {unidad.tipo_equipamiento && (
                                <div className="text-gray-500 dark:text-gray-400">
                                  Tipo: {unidad.tipo_equipamiento}
                                </div>
                              )}
                              {(unidad.comuna || unidad.barrio) && (
                                <div className="text-gray-500 dark:text-gray-400">
                                  {unidad.comuna && `Comuna ${unidad.comuna}`}
                                  {unidad.barrio && ` - ${unidad.barrio}`}
                                </div>
                              )}
                            </div>
                          ))}
                          {unidades.length > 5 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                              +{unidades.length - 5} unidades más
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleSection>
                  )
                })()}

              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/70">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                  Ficha generada el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO', { hour12: false })}
                </div>
                <button
                  onClick={handleExportPDF}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg font-medium"
                  title="Exportar ficha de proyecto como PDF"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProjectModal

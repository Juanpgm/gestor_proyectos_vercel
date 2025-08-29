'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, DollarSign, Building, PieChart as PieChartIcon, Activity, Info, ChevronDown, ChevronUp, MapPin, Calendar, Package, Users } from 'lucide-react'
import { Project } from './ProjectsTable'
import { useDataContext } from '../context/DataContext'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import BudgetChart from './BudgetChart'
import { ActivityProgressGauge, ProductProgressGauge, BudgetExecutionGauge } from './GaugeChart'

// Extend jsPDF interface for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

  const getBPFromBPIN = (bpin: string) => {
    // Obtener BP desde el contexto de datos si está disponible
    const proyectoData = dataContext.proyectos?.find(p => p.bpin === Number(bpin))
    return proyectoData?.bp || bpin.substring(0, 8) // Fallback: primeros 8 dígitos del BPIN
  }

  // Función para exportar PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')
      const fileName = `bpin-${project.bpin}-${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}`
      
      // Configuración de estilos
      const primaryColor: [number, number, number] = [59, 130, 246] // Blue-600
      const textColor: [number, number, number] = [31, 41, 55] // Gray-800
      const lightGray: [number, number, number] = [243, 244, 246] // Gray-100
      
      // Header del PDF
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, 210, 30, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('FICHA DE PROYECTO', 20, 15)
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`BPIN: ${project.bpin}`, 20, 22)
      doc.text(`BP: ${getBPFromBPIN(project.bpin)}`, 120, 22)
      
      let yPosition = 40
      
      // Título del proyecto
      doc.setTextColor(...textColor)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      const splitTitle = doc.splitTextToSize(project.name, 170)
      doc.text(splitTitle, 20, yPosition)
      yPosition += splitTitle.length * 5 + 10
      
      // Información básica
      const infoBasica = [
        ['Centro Gestor', project.responsible],
        ['Comuna', project.comuna || 'No especificada'],
        ['Estado', project.status],
        ['Progreso Físico', `${getProgresoFisico(Number(project.bpin)).toFixed(1)}%`],
        ['Progreso Financiero', `${getProgresoFinanciero(Number(project.bpin)).toFixed(1)}%`]
      ]

      doc.autoTable({
        startY: yPosition,
        head: [['Campo', 'Valor']],
        body: infoBasica,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10

      // Información financiera
      const infoFinanciera = [
        ['Presupuesto Total', formatCurrency(project.budget)],
        ['Ejecutado', formatCurrency(project.executed)],
        ['Pagado', formatCurrency(project.pagado)],
        ['Disponible', formatCurrency(project.budget - project.executed)]
      ]

      doc.autoTable({
        startY: yPosition,
        head: [['Concepto', 'Valor']],
        body: infoFinanciera,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, // Green-600
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10

      // Productos
      const productos = getProductosByBpin(Number(project.bpin))
      if (productos.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('PRODUCTOS', 20, yPosition)
        yPosition += 8

        const productosData = productos.slice(0, 10).map((producto, index) => [
          (index + 1).toString(),
          producto.nombre_producto || 'Sin nombre',
          producto.ponderacion_producto ? `${producto.ponderacion_producto}%` : 'N/A'
        ])

        doc.autoTable({
          startY: yPosition,
          head: [['#', 'Nombre del Producto', 'Ponderación']],
          body: productosData,
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246] }, // Purple-600
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
      }

      // Actividades
      const actividades = getActividadesByBpin(Number(project.bpin))
      if (actividades.length > 0) {
        // Nueva página si es necesario
        if (yPosition > 240) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('ACTIVIDADES', 20, yPosition)
        yPosition += 8

        const actividadesData = actividades.slice(0, 10).map((actividad, index) => [
          (index + 1).toString(),
          actividad.nombre_actividad || 'Sin nombre',
          actividad.fecha_inicio_actividad ? formatDate(actividad.fecha_inicio_actividad) : 'N/A',
          actividad.fecha_fin_actividad ? formatDate(actividad.fecha_fin_actividad) : 'N/A',
          actividad.ppto_inicial_actividad ? formatCurrency(actividad.ppto_inicial_actividad) : 'N/A'
        ])

        doc.autoTable({
          startY: yPosition,
          head: [['#', 'Actividad', 'Inicio', 'Fin', 'Presupuesto']],
          body: actividadesData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] }, // Green-600
          styles: { fontSize: 8 },
          columnStyles: { 1: { cellWidth: 60 } },
          margin: { left: 20, right: 20 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} - Página ${i} de ${pageCount}`, 20, 285)
        doc.text('Sistema de Gestión de Proyectos - Alcaldía de Medellín', 20, 290)
      }

      // Guardar el archivo
      doc.save(`${fileName}.pdf`)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor, intente nuevamente.')
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
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            id="project-modal-content"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2 text-white">{project.name}</h2>
                  <div className="flex items-center space-x-4 text-blue-100 text-base mb-2">
                    <span className="flex items-center">
                      <Building className="w-4 h-4 mr-1" />
                      BPIN: {project.bpin}
                    </span>
                    <span className="flex items-center">
                      <Info className="w-4 h-4 mr-1" />
                      BP: {getBPFromBPIN(project.bpin)}
                    </span>
                  </div>
                  <div className="text-blue-200 text-base">
                    <span className="font-medium">Centro Gestor:</span>
                    <span className="text-blue-100 ml-1">{project.responsible}</span>
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
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] bg-white dark:bg-gray-900">
              <div className="p-3 space-y-3">
                
                {/* Progreso */}
                <CollapsibleSection
                  title="Progreso del Proyecto"
                  icon={<Activity className="w-4 h-4 text-green-600" />}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    {/* Progreso Físico */}
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">Progreso Físico</span>
                        <span className="text-base font-semibold text-green-600 dark:text-green-400">
                          {formatPercentage(getProgresoFisico(Number(project.bpin)))}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(getProgresoFisico(Number(project.bpin)), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progreso Financiero */}
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">Progreso Financiero</span>
                        <span className="text-base font-semibold text-blue-600 dark:text-blue-400">
                          {formatPercentage(getProgresoFinanciero(Number(project.bpin)))}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
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

                    {/* Gráficas de ejecución presupuestal */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg border p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <PieChartIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Ejecución Presupuestal del Proyecto
                      </h4>
                      <BudgetChart project={project} />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Información del Proyecto */}
                <CollapsibleSection
                  title="Información del Proyecto"
                  icon={<Info className="w-4 h-4 text-blue-600" />}
                  defaultOpen={true}
                >
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const proyectoData = dataContext.proyectos?.find(p => p.bpin === Number(project.bpin))
                      return proyectoData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {proyectoData.nombre_centro_gestor && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs block">Centro Gestor</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{proyectoData.nombre_centro_gestor}</span>
                            </div>
                          )}
                          {proyectoData.nombre_programa && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs block">Programa</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{proyectoData.nombre_programa}</span>
                            </div>
                          )}
                          {proyectoData.nombre_dimension && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs block">Dimensión</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{proyectoData.nombre_dimension}</span>
                            </div>
                          )}
                          {proyectoData.nombre_fondo && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs block">Fuente de Financiación</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{proyectoData.nombre_fondo}</span>
                            </div>
                          )}
                          {project.status && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs block">Estado</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-xs">{project.status}</span>
                            </div>
                          )}
                          {project.comuna && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs block">Comuna</span>
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
                            className="ml-4 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            Ver Productos
                          </button>
                        </div>
                      }
                      icon={<Package className="w-4 h-4 text-purple-600" />}
                      defaultOpen={true}
                    >
                      <div className="space-y-3">
                        {productos.map((producto, index) => {
                          const statusInfo = getProductStatus(producto)
                          const statusColors = {
                            'Completado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                            'En Progreso': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                            'No Iniciado': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          } as const
                          
                          const statusKey = statusInfo.status as keyof typeof statusColors
                          
                          return (
                            <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {producto.nombre_producto || 'Sin nombre'}
                                </h4>
                                <div className="flex justify-center">
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[statusKey]}`}>
                                    {statusInfo.status}
                                  </span>
                                </div>
                              </div>
                              
                              {producto.descripcion_avance_producto && (
                                <p className="text-base text-gray-700 dark:text-gray-200 mb-3 leading-relaxed">
                                  {producto.descripcion_avance_producto}
                                </p>
                              )}
                              
                              <div className="grid grid-cols-3 gap-6 text-base">
                                <div className="text-center">
                                  <span className="text-gray-600 dark:text-gray-300 block font-medium mb-1">Meta</span>
                                  <span className="text-gray-900 dark:text-white font-semibold">
                                    {producto.cantidad_programada_producto ? producto.cantidad_programada_producto.toLocaleString() : '—'}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-gray-600 dark:text-gray-300 block font-medium mb-1">Periodo</span>
                                  <span className="text-gray-900 dark:text-white font-semibold">
                                    {formatPeriod(producto.periodo_corte)}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-gray-600 dark:text-gray-300 block font-medium mb-1">Ponderación Producto</span>
                                  <span className="text-gray-900 dark:text-white font-semibold">
                                    {producto.ponderacion_producto !== undefined ? formatPercentageFromDecimal(producto.ponderacion_producto) : '—'}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-500">
                                <div className="grid grid-cols-2 gap-6 text-base">
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Avance Producto</div>
                                    {producto.avance_real_producto !== undefined ? (
                                      <ProductProgressGauge 
                                        value={(producto.avance_real_producto || 0) * 100} 
                                        className="mb-2"
                                      />
                                    ) : (
                                      <div className="font-semibold text-gray-900 dark:text-white">—</div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Ejecución Presupuesto Producto</div>
                                    {producto.ejecucion_ppto_producto && producto.ppto_inicial_producto ? (
                                      <BudgetExecutionGauge 
                                        value={(producto.ejecucion_ppto_producto / producto.ppto_inicial_producto) * 100} 
                                        className="mb-2"
                                      />
                                    ) : (
                                      <div className="font-semibold text-gray-900 dark:text-white">
                                        {producto.ejecucion_ppto_producto ? formatCurrency(producto.ejecucion_ppto_producto) : '—'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
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
                            className="ml-4 px-3 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            Ver Actividades
                          </button>
                        </div>
                      }
                      icon={<Activity className="w-4 h-4 text-green-600" />}
                      defaultOpen={true}
                    >
                      <div className="space-y-3">
                        {actividades.map((actividad, index) => {
                          const statusInfo = getActivityStatus(actividad)
                          const statusColors = {
                            'Completada': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                            'No Iniciada': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
                            'Demorada': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            'A Tiempo': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                            'La tarea no posee fecha de inicio o fin': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          } as const
                          
                          const statusKey = statusInfo.status as keyof typeof statusColors
                          
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
                            <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {actividad.nombre_actividad || 'Sin nombre'}
                                </h4>
                                <div className="flex justify-center">
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[statusKey]}`}>
                                    {statusInfo.status}
                                  </span>
                                </div>
                              </div>
                              
                              {actividad.descripcion_actividad && (
                                <p className="text-sm text-gray-700 dark:text-gray-200 mb-3 leading-relaxed">
                                  {actividad.descripcion_actividad}
                                </p>
                              )}
                              
                              <div className="grid grid-cols-3 gap-6 text-sm">
                                <div className="text-center">
                                  <span className="text-gray-600 dark:text-gray-300 block font-medium mb-1">Fecha de Inicio</span>
                                  <span className="text-gray-900 dark:text-white font-semibold">
                                    {actividad.fecha_inicio_actividad ? formatDate(actividad.fecha_inicio_actividad) : '—'}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-gray-600 dark:text-gray-300 block font-medium mb-1">Fecha de Fin</span>
                                  <span className="text-gray-900 dark:text-white font-semibold">
                                    {actividad.fecha_fin_actividad ? formatDate(actividad.fecha_fin_actividad) : '—'}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-gray-600 dark:text-gray-300 block font-medium mb-1">Duración</span>
                                  <span className="text-gray-900 dark:text-white font-semibold">
                                    {calculateDuration()}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-500">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-base">
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Inicial</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      {actividad.ppto_inicial_actividad ? formatCurrency(actividad.ppto_inicial_actividad) : '—'}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Modificado</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      {actividad.ppto_modificado_actividad ? formatCurrency(actividad.ppto_modificado_actividad) : '—'}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Ejecutado</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      {actividad.ejecucion_actividad ? formatCurrency(actividad.ejecucion_actividad) : '—'}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Avance de Actividad</div>
                                    {actividad.avance_actividad_acumulado !== undefined ? (
                                      <ActivityProgressGauge 
                                        value={(actividad.avance_actividad_acumulado || 0) * 100} 
                                        className="mb-2"
                                      />
                                    ) : (
                                      <div className="font-semibold text-gray-900 dark:text-white">—</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Ficha generada el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO', { hour12: false })}
                </div>
                <button
                  onClick={handleExportPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm flex items-center space-x-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
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

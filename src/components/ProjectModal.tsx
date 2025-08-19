'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, DollarSign, Clock, Building, FolderOpen, Printer, User, BarChart3, PieChart as PieChartIcon, Activity, AreaChart as AreaChartIcon, Info } from 'lucide-react'
import { Project } from './ProjectsTable'
import BudgetChart from './BudgetChart'
import { useDataContext } from '../context/DataContext'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}

type ChartType = 'bar' | 'pie' | 'line' | 'area'

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, project }) => {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { seguimientoPa, ejecucionPresupuestal, productosPa, actividadesPa } = useDataContext()
  const dataContext = useDataContext()

  if (!project) return null

  // Debug: verificar datos del proyecto
  console.log('🔍 ProjectModal - Project data:', {
    bpin: project.bpin,
    budget: project.budget,
    executed: project.executed,
    progressFinanciero: project.progressFinanciero,
    progress: project.progress
  })

  const handleExportPDF = () => {
    // Aquí implementaremos la exportación a PDF
    console.log('Exportando ficha a PDF...', project)
    // TODO: Implementar exportación real con jsPDF o similar
    alert('Función de exportación a PDF en desarrollo')
  }

  const handlePrintModal = () => {
    // Función para imprimir el modal
    const printContent = document.getElementById('project-modal-content')
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800')
      printWindow?.document.write('<html><head><title>Ficha de Proyecto</title>')
      printWindow?.document.write('<style>body{font-family:Arial,sans-serif;margin:20px;}</style>')
      printWindow?.document.write('</head><body>')
      printWindow?.document.write(printContent.innerHTML)
      printWindow?.document.write('</body></html>')
      printWindow?.document.close()
      printWindow?.print()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount).replace('COP', '').trim() + ' COP'
  }

  // Funciones para calcular progreso físico y financiero
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

  // Funciones para obtener actividades y productos
  const getActividadesByBpin = (bpin: number) => {
    return actividadesPa?.filter(actividad => actividad.bpin === bpin) || []
  }

  const getProductosByBpin = (bpin: number) => {
    return productosPa?.filter(producto => producto.bpin === bpin) || []
  }

  const formatPercentage = (value: number) => {
    // Si es un número entero, no mostrar decimales
    if (value % 1 === 0) {
      return value.toFixed(0) + '%'
    }
    // Si tiene decimales, mostrar máximo 2 cifras
    return value.toFixed(2).replace(/\.?0+$/, '') + '%'
  }

  // Función para obtener el nombre del centro gestor
  const getCentroGestorName = (bpin: string) => {
    // Simulamos algunos centros gestores basados en el BPIN o proyecto
    const centrosGestores = [
      'Secretaría de Infraestructura y Valorización',
      'Secretaría de Educación Municipal', 
      'Secretaría de Salud Pública',
      'Secretaría de Cultura, Recreación y Deporte',
      'Secretaría de Desarrollo Territorial y Participación',
      'Secretaría de Bienestar Social',
      'Secretaría de Gobierno y Gestión del Territorio',
      'Secretaría de Hacienda Municipal'
    ]
    
    // Usar el BPIN para determinar un centro gestor de forma consistente
    const index = parseInt(bpin.slice(-1)) % centrosGestores.length
    return centrosGestores[index]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En Ejecución':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700'
      case 'Planificación':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
      case 'Completado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
      case 'Suspendido':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700'
      case 'En Evaluación':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
    }
  }

  // Funciones y datos para el análisis presupuestario
  const metricColors = {
    presupuestoTotal: '#3B82F6',
    ejecutado: '#10B981',
    pagado: '#F59E0B',
    pendiente: '#EF4444',
    disponible: '#8B5CF6'
  }

  const formatCurrencyFull = (value: number): string => {
    return `$${value.toLocaleString('de-DE', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  }

  const formatCurrencyShort = (value: number): string => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toLocaleString('de-DE', { 
        minimumFractionDigits: 1, 
        maximumFractionDigits: 1 
      })}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toLocaleString('de-DE', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toLocaleString('de-DE', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}K`;
    } else {
      return `$${value.toLocaleString('de-DE')}`;
    }
  }

  // Generar datos específicos del proyecto para análisis presupuestario
  const generateProjectBudgetData = () => {
    const pendiente = project.budget - project.executed
    const disponible = project.budget - project.pagado
    
    // Datos para gráfico de barras/pie
    const budgetBreakdown = [
      { name: 'Presupuesto Total', value: project.budget, color: metricColors.presupuestoTotal },
      { name: 'Ejecutado', value: project.executed, color: metricColors.ejecutado },
      { name: 'Pagado', value: project.pagado, color: metricColors.pagado },
      { name: 'Pendiente Ejecución', value: pendiente, color: metricColors.pendiente },
      { name: 'Disponible', value: disponible, color: metricColors.disponible }
    ]

    // Generar datos temporales basados en las fechas del proyecto
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    const currentDate = new Date()
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsedTime = currentDate.getTime() - startDate.getTime()
    const timeProgress = Math.min(Math.max(elapsedTime / totalDuration, 0), 1)

    const monthlyData = []
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    for (let i = 0; i < 8; i++) {
      const progressFactor = (i + 1) / 8
      const executedAmount = project.executed * progressFactor
      const paidAmount = project.pagado * progressFactor
      const monthIndex = (startDate.getMonth() + i) % 12
      
      monthlyData.push({
        month: monthNames[monthIndex],
        presupuestoTotal: project.budget,
        ejecutado: executedAmount,
        pagado: paidAmount,
        pendiente: project.budget - executedAmount,
        disponible: project.budget - paidAmount
      })
    }

    return { budgetBreakdown, monthlyData }
  }

  const { budgetBreakdown, monthlyData } = generateProjectBudgetData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrencyShort(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderBudgetChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-sm text-gray-600 dark:text-gray-400" />
              <YAxis 
                className="text-sm text-gray-600 dark:text-gray-400"
                tickFormatter={formatCurrencyShort}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ejecutado" fill={metricColors.ejecutado} name="Ejecutado" />
              <Bar dataKey="pagado" fill={metricColors.pagado} name="Pagado" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={budgetBreakdown.filter(item => item.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {budgetBreakdown.filter(item => item.value > 0).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? '#ffffff' : 'none'}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const percentage = ((data.value / project.budget) * 100).toFixed(1);
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">{data.name}</p>
                        <p className="text-sm" style={{ color: data.payload.color }}>
                          Valor: {formatCurrencyFull(data.value)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {percentage}% del Presupuesto Total
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-sm text-gray-600 dark:text-gray-400" />
              <YAxis 
                className="text-sm text-gray-600 dark:text-gray-400"
                tickFormatter={formatCurrencyShort}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="ejecutado" stroke={metricColors.ejecutado} strokeWidth={3} name="Ejecutado" />
              <Line type="monotone" dataKey="pagado" stroke={metricColors.pagado} strokeWidth={3} name="Pagado" />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-sm text-gray-600 dark:text-gray-400" />
              <YAxis 
                className="text-sm text-gray-600 dark:text-gray-400"
                tickFormatter={formatCurrencyShort}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ejecutado" stackId="1" stroke={metricColors.ejecutado} fill={metricColors.ejecutado + '80'} name="Ejecutado" />
              <Area type="monotone" dataKey="pagado" stackId="1" stroke={metricColors.pagado} fill={metricColors.pagado + '80'} name="Pagado" />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-6 border-b border-blue-500 dark:border-blue-600">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 text-white">{project.name}</h2>
                  <div className="flex items-center space-x-4 text-blue-100 dark:text-blue-200 mb-3">
                    <span className="flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      BPIN: {project.bpin}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-200 dark:text-blue-300 text-sm">
                    <div>
                      <span className="font-medium block">Centro Gestor:</span>
                      <span className="text-blue-100 font-semibold text-base">{project.responsible}</span>
                    </div>
                    <div>
                      <span className="font-medium block">Comuna:</span>
                      <span className="text-blue-100 font-semibold text-base">{project.comuna || 'No especificada'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportPDF}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    aria-label="Exportar ficha"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Exportar</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 dark:hover:text-gray-300 transition-colors p-2 hover:bg-white/10 dark:hover:bg-white/20 rounded-full"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] bg-white dark:bg-gray-900">
              <div className="p-3 space-y-3">
                {/* Información General */}
                <div className="space-y-3">
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    {/* Progreso Físico */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso Físico</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {getProgresoFisico(Number(project.bpin)).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(getProgresoFisico(Number(project.bpin)), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progreso Financiero */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso Financiero</span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {getProgresoFinanciero(Number(project.bpin)).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(getProgresoFinanciero(Number(project.bpin)), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Información del Proyecto - Formato texto simple */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Info className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Información del Proyecto
                    </h3>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const proyectoData = dataContext.proyectos?.find(p => p.bpin === Number(project.bpin))
                        return proyectoData && (
                          <>
                            {proyectoData.nombre_centro_gestor && (
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Centro Gestor:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{proyectoData.nombre_centro_gestor}</span>
                              </div>
                            )}
                            {proyectoData.nombre_programa && (
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Programa:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{proyectoData.nombre_programa}</span>
                              </div>
                            )}
                            {proyectoData.nombre_dimension && (
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Dimensión:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{proyectoData.nombre_dimension}</span>
                              </div>
                            )}
                            {proyectoData.nombre_linea_estrategica && (
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Línea Estratégica:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{proyectoData.nombre_linea_estrategica}</span>
                              </div>
                            )}
                            {proyectoData.nombre_fondo && (
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Fuente de Financiación:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{proyectoData.nombre_fondo}</span>
                              </div>
                            )}
                            {proyectoData.tipo_gasto && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Tipo de Gasto:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  proyectoData.tipo_gasto === 'Inversión' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                  {proyectoData.tipo_gasto}
                                </span>
                              </div>
                            )}
                            {proyectoData.clasificacion_fondo && (
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Clasificación del Fondo:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{proyectoData.clasificacion_fondo}</span>
                              </div>
                            )}
                            {proyectoData.nombre_area_funcional && (
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Área Funcional:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{proyectoData.nombre_area_funcional}</span>
                              </div>
                            )}
                            {proyectoData.anio && (
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Año:</span>
                                <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{proyectoData.anio}</span>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Descripción del Proyecto - Movida aquí */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <Building className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                      Descripción del Proyecto
                    </h3>
                    
                    {/* Grid de contenido - Una sola columna */}
                    <div className="space-y-3">
                      {/* Descripción General */}
                      {project.descripcion && (
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-sm">Descripción General</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-700 p-2 rounded-lg border">
                            {project.descripcion}
                          </p>
                        </div>
                      )}

                      {project.texto1 && (
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-sm">Alcance y Beneficios</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-700 p-2 rounded-lg border">
                            {project.texto1}
                          </p>
                        </div>
                      )}

                      {project.texto2 && (
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-sm">Componentes Adicionales</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-700 p-2 rounded-lg border">
                            {project.texto2}
                          </p>
                        </div>
                      )}

                      {/* Productos */}
                      {(() => {
                        const productos = getProductosByBpin(Number(project.bpin))
                        return productos.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-sm flex items-center">
                              <PieChartIcon className="w-4 h-4 mr-1 text-purple-600" />
                              Productos ({productos.length})
                            </h4>
                            <div className="bg-white dark:bg-gray-700 p-2 rounded-lg border max-h-32 overflow-y-auto">
                              <div className="space-y-1">
                                {productos.slice(0, 3).map((producto, index) => (
                                  <div key={index} className="border-l-2 border-purple-400 pl-2">
                                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                                      {producto.nombre_producto}
                                    </div>
                                    {producto.descripcion_avance_producto && (
                                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                        {producto.descripcion_avance_producto.substring(0, 100)}...
                                      </p>
                                    )}
                                  </div>
                                ))}
                                {productos.length > 3 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                                    +{productos.length - 3} productos más
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Actividades */}
                      {(() => {
                        const actividades = getActividadesByBpin(Number(project.bpin))
                        return actividades.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-sm flex items-center">
                              <Activity className="w-4 h-4 mr-1 text-green-600" />
                              Actividades ({actividades.length})
                            </h4>
                            <div className="bg-white dark:bg-gray-700 p-2 rounded-lg border max-h-32 overflow-y-auto">
                              <div className="space-y-1">
                                {actividades.slice(0, 3).map((actividad, index) => (
                                  <div key={index} className="border-l-2 border-green-400 pl-2">
                                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                                      {actividad.nombre_actividad}
                                    </div>
                                    {actividad.descripcion_actividad && (
                                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                        {actividad.descripcion_actividad.substring(0, 100)}...
                                      </p>
                                    )}
                                    {actividad.fecha_inicio_actividad && actividad.fecha_fin_actividad && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {new Date(actividad.fecha_inicio_actividad).toLocaleDateString('es-CO')} - {new Date(actividad.fecha_fin_actividad).toLocaleDateString('es-CO')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {actividades.length > 3 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                                    +{actividades.length - 3} actividades más
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>                  {/* Información Financiera */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                      Información Financiera
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ejecutado</div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(project.executed)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {project.budget > 0 && typeof project.progressFinanciero === 'number' 
                            ? formatPercentage(Math.min(project.progressFinanciero, 100))
                            : formatPercentage((project.executed / project.budget) * 100)
                          }
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagado</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(project.pagado)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {formatPercentage((project.pagado / project.budget) * 100)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Presupuesto Disponible</div>
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {formatCurrency(Math.max(0, project.budget - project.executed))}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {formatPercentage(Math.max(0, (project.budget - project.executed) / project.budget) * 100)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Análisis Presupuestario - Métricas del BudgetChart */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <BudgetChart project={project} />
                  </div>
                </div>

                {/* Sección de Descripción */}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/70">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Ficha generada el {new Date().toLocaleDateString('es-CO')}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrintModal}
                    className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 font-medium text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProjectModal

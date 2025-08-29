'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, DollarSign, Clock, Building, FolderOpen, Printer, MapPin, BarChart3, PieChart as PieChartIcon, Activity, AreaChart as AreaChartIcon, Info, Settings } from 'lucide-react'
import { UnidadProyecto } from '../hooks/useUnidadesProyecto'
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

interface ProjectUnitModalProps {
  isOpen: boolean
  onClose: () => void
  projectUnit: UnidadProyecto | null
  feature?: any // Datos adicionales del feature GeoJSON
}

type ChartType = 'bar' | 'pie' | 'line' | 'area'

const ProjectUnitModal: React.FC<ProjectUnitModalProps> = ({ isOpen, onClose, projectUnit, feature }) => {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const dataContext = useDataContext()

  if (!projectUnit) return null

  // Debug: verificar datos de la unidad de proyecto
  console.log('🔍 ProjectUnitModal - Project Unit data:', {
    id: projectUnit.id,
    bpin: projectUnit.bpin,
    name: projectUnit.name,
    budget: projectUnit.budget,
    executed: projectUnit.executed,
    progress: projectUnit.progress,
    feature: feature?.properties
  })

  const handleExportPDF = () => {
    console.log('Exportando ficha de unidad de proyecto a PDF...', projectUnit)
    alert('Función de exportación de unidad de proyecto a PDF en desarrollo')
  }

  const handlePrintModal = () => {
    const printContent = document.getElementById('project-unit-modal-content')
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800')
      printWindow?.document.write('<html><head><title>Ficha de Unidad de Proyecto</title>')
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

  const formatPercentage = (value: number) => {
    if (value % 1 === 0) {
      return value.toFixed(0) + '%'
    }
    return value.toFixed(2).replace(/\.?0+$/, '') + '%'
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

  // Función para obtener colores de progreso basados en la tabla
  const getProgressBarColor = (type: 'physical' | 'financial', progress: number) => {
    if (type === 'physical') {
      if (progress < 30) return 'from-red-500 to-red-600'
      if (progress < 60) return 'from-amber-500 to-amber-600'
      if (progress < 90) return 'from-blue-500 to-blue-600'
      return 'from-emerald-500 to-emerald-600'
    } else {
      if (progress < 30) return 'from-red-600 to-red-700'
      if (progress < 60) return 'from-orange-500 to-orange-600'
      if (progress < 90) return 'from-emerald-600 to-emerald-700'
      return 'from-green-600 to-green-700'
    }
  }

  // Función para obtener color del texto basado en el progreso
  const getProgressTextColor = (type: 'physical' | 'financial', progress: number) => {
    if (type === 'physical') {
      if (progress < 30) return 'text-red-600 dark:text-red-400'
      if (progress < 60) return 'text-amber-600 dark:text-amber-400'
      if (progress < 90) return 'text-blue-600 dark:text-blue-400'
      return 'text-emerald-600 dark:text-emerald-400'
    } else {
      if (progress < 30) return 'text-red-700 dark:text-red-400'
      if (progress < 60) return 'text-orange-600 dark:text-orange-400'
      if (progress < 90) return 'text-emerald-700 dark:text-emerald-400'
      return 'text-green-700 dark:text-green-400'
    }
  }

  // Datos para análisis presupuestario específico de la unidad
  const metricColors = {
    presupuestoTotal: '#3B82F6',
    ejecutado: '#10B981',
    pagado: '#F59E0B',
    pendiente: '#EF4444',
    disponible: '#8B5CF6'
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

  // Generar datos específicos para gráficos de la unidad
  const generateUnitBudgetData = () => {
    const pendiente = projectUnit.budget - projectUnit.executed
    const disponible = projectUnit.budget - projectUnit.pagado
    
    const budgetBreakdown = [
      { name: 'Presupuesto Total', value: projectUnit.budget, color: metricColors.presupuestoTotal },
      { name: 'Ejecutado', value: projectUnit.executed, color: metricColors.ejecutado },
      { name: 'Pagado', value: projectUnit.pagado, color: metricColors.pagado },
      { name: 'Pendiente Ejecución', value: Math.max(0, pendiente), color: metricColors.pendiente }
    ].filter(item => item.value > 0)

    // Generar datos temporales para progreso mensual
    const startDate = new Date(projectUnit.startDate)
    const endDate = new Date(projectUnit.endDate)
    const monthlyData = []
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    for (let i = 0; i < 6; i++) {
      const progressFactor = (i + 1) / 6
      const executedAmount = projectUnit.executed * progressFactor
      const paidAmount = projectUnit.pagado * progressFactor
      const monthIndex = (startDate.getMonth() + i) % 12
      
      monthlyData.push({
        month: monthNames[monthIndex],
        ejecutado: executedAmount,
        pagado: paidAmount,
        presupuesto: projectUnit.budget
      })
    }

    return { budgetBreakdown, monthlyData }
  }

  const { budgetBreakdown, monthlyData } = generateUnitBudgetData()

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

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
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
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={budgetBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {budgetBreakdown.map((entry, index) => (
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
                    const percentage = ((data.value / projectUnit.budget) * 100).toFixed(1);
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">{data.name}</p>
                        <p className="text-sm" style={{ color: data.payload.color }}>
                          Valor: {formatCurrency(data.value)}
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
                wrapperStyle={{ fontSize: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-sm text-gray-600 dark:text-gray-400" />
              <YAxis 
                className="text-sm text-gray-600 dark:text-gray-400"
                tickFormatter={formatCurrencyShort}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="ejecutado" stroke={metricColors.ejecutado} strokeWidth={2} name="Ejecutado" />
              <Line type="monotone" dataKey="pagado" stroke={metricColors.pagado} strokeWidth={2} name="Pagado" />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
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
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            id="project-unit-modal-content"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white p-6 border-b border-purple-500 dark:border-purple-600">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 text-white">{projectUnit.name}</h2>
                  <div className="flex items-center space-x-4 text-purple-100 dark:text-purple-200 mb-3">
                    <span className="flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      ID: {projectUnit.id}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      BPIN: {projectUnit.bpin}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-purple-200 dark:text-purple-300 text-sm">
                    <div>
                      <span className="font-medium block">Centro Gestor:</span>
                      <span className="text-purple-100 font-semibold text-base">{projectUnit.responsible}</span>
                    </div>
                    <div>
                      <span className="font-medium block">Estado:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(projectUnit.status)}`}>
                        {projectUnit.status}
                      </span>
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
            <div className="overflow-y-auto max-h-[calc(95vh-140px)] bg-white dark:bg-gray-900">
              <div className="p-3 space-y-3">
                {/* Información General */}
                <div className="space-y-3">
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    {/* Progreso Físico */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso Físico</span>
                        <span className={`text-sm font-semibold ${getProgressTextColor('physical', projectUnit.progress)}`}>
                          {formatPercentage(projectUnit.progress)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${getProgressBarColor('physical', projectUnit.progress)} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(projectUnit.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progreso Financiero */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso Financiero</span>
                        <span className={`text-sm font-semibold ${getProgressTextColor('financial', (projectUnit.executed / projectUnit.budget) * 100)}`}>
                          {formatPercentage((projectUnit.executed / projectUnit.budget) * 100)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${getProgressBarColor('financial', (projectUnit.executed / projectUnit.budget) * 100)} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min((projectUnit.executed / projectUnit.budget) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Información de la Unidad */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Info className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                      Información de la Unidad de Proyecto
                    </h3>
                    <div className="space-y-2 text-sm">
                      {projectUnit.tipoIntervencion && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Tipo de Intervención:</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{projectUnit.tipoIntervencion}</span>
                        </div>
                      )}
                      {projectUnit.claseObra && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Clase de Obra:</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{projectUnit.claseObra}</span>
                        </div>
                      )}
                      {projectUnit.comuna && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Comuna:</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{projectUnit.comuna}</span>
                        </div>
                      )}
                      {projectUnit.barrio && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Barrio:</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{projectUnit.barrio}</span>
                        </div>
                      )}
                      {projectUnit.corregimiento && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Corregimiento:</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{projectUnit.corregimiento}</span>
                        </div>
                      )}
                      {projectUnit.direccion && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Dirección:</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{projectUnit.direccion}</span>
                        </div>
                      )}
                      {projectUnit.beneficiaries > 0 && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Beneficiarios:</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-right flex-1 ml-2">{projectUnit.beneficiaries.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descripción de la Unidad */}
                  {projectUnit.descripcion && (
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                        <Building className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                        Descripción de la Unidad
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-700 p-2 rounded-lg border">
                        {projectUnit.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Información Financiera */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                      Información Financiera
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Presupuesto</div>
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(projectUnit.budget)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ejecutado</div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(projectUnit.executed)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {formatPercentage((projectUnit.executed / projectUnit.budget) * 100)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagado</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(projectUnit.pagado)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {formatPercentage((projectUnit.pagado / projectUnit.budget) * 100)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Análisis Presupuestario con Gráficos */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                        Análisis Presupuestario
                      </h3>
                      <div className="flex gap-1">
                        {(['bar', 'pie', 'line', 'area'] as ChartType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => setChartType(type)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              chartType === type
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                            }`}
                          >
                            {type === 'bar' ? 'Barras' : type === 'pie' ? 'Torta' : type === 'line' ? 'Línea' : 'Área'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {renderChart()}
                  </div>

                  {/* Fechas del Proyecto */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                      Cronograma
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Fecha de Inicio:</span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {new Date(projectUnit.startDate).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Fecha de Finalización:</span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {new Date(projectUnit.endDate).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/70">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Ficha de unidad de proyecto generada el {new Date().toLocaleDateString('es-CO')}
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
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 font-medium text-sm"
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

export default ProjectUnitModal

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { Calculator, BarChart3, Activity, AreaChart as AreaChartIcon } from 'lucide-react'
import { useDataContext } from '../context/DataContext'

type ChartType = 'bar' | 'line' | 'area'

interface BudgetChartProps {
  className?: string
  project?: any
}

const BudgetChart: React.FC<BudgetChartProps> = ({ 
  className = '', 
  project
}) => {
  const dataContext = useDataContext()
  const { filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = dataContext
  
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timeFrame, setTimeFrame] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly'>('monthly')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Procesar datos: Filtrar por BPIN si hay un proyecto específico, sino mostrar totales generales
  const processedData = useMemo(() => {
    // Filtrar datos por BPIN si hay un proyecto específico
    let dataToProcess = filteredMovimientosPresupuestales
    if (project?.bpin) {
      dataToProcess = filteredMovimientosPresupuestales.filter((item: any) => 
        item.bpin === Number(project.bpin)
      )
    }

    // Agrupar por período
    const periodTotals: { [key: string]: any } = {}
    
    dataToProcess.forEach((item: any) => {
      let period: string
      
      if (timeFrame === 'monthly') {
        period = item.periodo_corte?.substring(0, 7) // YYYY-MM
      } else if (timeFrame === 'quarterly') {
        const quarter = Math.ceil(parseInt(item.periodo_corte?.substring(5, 7) || '1') / 3)
        period = `${item.periodo_corte?.substring(0, 4)}-Q${quarter}`
      } else if (timeFrame === 'semiannual') {
        const semester = parseInt(item.periodo_corte?.substring(5, 7) || '1') <= 6 ? 1 : 2
        period = `${item.periodo_corte?.substring(0, 4)}-S${semester}`
      } else { // yearly
        period = item.periodo_corte?.substring(0, 4) || ''
      }

      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          name: period,
          ppto_inicial: 0,
          ppto_modificado: 0,
          adiciones: 0,
          reducciones: 0
        }
      }

      // Sumar valores para el período
      periodTotals[period].ppto_inicial += item.ppto_inicial || 0
      periodTotals[period].ppto_modificado += item.ppto_modificado || 0
      periodTotals[period].adiciones += item.adiciones || 0
      periodTotals[period].reducciones += item.reducciones || 0
    })

    return Object.values(periodTotals).sort((a: any, b: any) => a.period.localeCompare(b.period))
  }, [filteredMovimientosPresupuestales, timeFrame, project?.bpin])

  // Colores para las métricas
  const metricColors = {
    ppto_inicial: '#3B82F6',
    ppto_modificado: '#10B981',
    adiciones: '#F59E0B',
    reducciones: '#EF4444',
    creditos: '#8B5CF6',
    contracreditos: '#F97316',
    aplazamiento: '#6B7280',
    desaplazamiento: '#14B8A6'
  }

  // Formatear moneda para el eje Y (más compacto para evitar desbordamiento)
  const formatCurrencyAxis = (value: number) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`
    }
    return `$${value.toLocaleString()}`
  }

  // Formatear moneda completa (sin abreviaciones)
  const formatCurrencyComplete = (value: number) => {
    return `$${value.toLocaleString('es-CO')}`
  }

  // Función para obtener el nombre completo de la métrica
  const getMetricDisplayName = (dataKey: string) => {
    const metricNames: { [key: string]: string } = {
      ppto_inicial: 'Presupuesto Inicial',
      ppto_modificado: 'Presupuesto Actual',
      adiciones: 'Total Adiciones',
      reducciones: 'Total Reducciones',
      creditos: 'Créditos',
      contracreditos: 'Contracréditos',
      aplazamiento: 'Aplazamiento',
      desaplazamiento: 'Desaplazamiento'
    }
    return metricNames[dataKey] || dataKey
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{`Período: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {getMetricDisplayName(entry.dataKey)}:{' '}
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {formatCurrencyComplete(entry.value)}
                </span>
              </span>
            </div>
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
          <BarChart data={processedData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              hide={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ppto_inicial" name="Presupuesto Inicial" fill={metricColors.ppto_inicial} />
            <Bar dataKey="ppto_modificado" name="Presupuesto Actual" fill={metricColors.ppto_modificado} />
            <Bar dataKey="adiciones" name="Total Adiciones" fill={metricColors.adiciones} />
            <Bar dataKey="reducciones" name="Total Reducciones" fill={metricColors.reducciones} />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart data={processedData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis 
              hide={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="ppto_inicial" 
              name="Presupuesto Inicial"
              stroke={metricColors.ppto_inicial} 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="ppto_modificado" 
              name="Presupuesto Actual"
              stroke={metricColors.ppto_modificado} 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="adiciones" 
              name="Total Adiciones"
              stroke={metricColors.adiciones} 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="reducciones" 
              name="Total Reducciones"
              stroke={metricColors.reducciones} 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart data={processedData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis 
              hide={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="ppto_inicial" 
              name="Presupuesto Inicial"
              stackId="1"
              stroke={metricColors.ppto_inicial} 
              fill={metricColors.ppto_inicial}
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="ppto_modificado" 
              name="Presupuesto Actual"
              stackId="1"
              stroke={metricColors.ppto_modificado} 
              fill={metricColors.ppto_modificado}
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="adiciones" 
              name="Total Adiciones"
              stackId="1"
              stroke={metricColors.adiciones} 
              fill={metricColors.adiciones}
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="reducciones" 
              name="Total Reducciones"
              stackId="1"
              stroke={metricColors.reducciones} 
              fill={metricColors.reducciones}
              fillOpacity={0.6}
            />
          </AreaChart>
        )
      default:
        return null
    }
  }

  const chartIcons = {
    bar: BarChart3,
    line: Activity,
    area: AreaChartIcon
  }

  return (
    <motion.div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project?.bpin ? `Análisis Presupuestal - BPIN ${project.bpin}` : 'Análisis Presupuestal General'}
            </h3>
          </div>
          
          <div className="flex gap-4 items-center">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gráfico:</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {(['bar', 'line', 'area'] as ChartType[]).map((type) => {
                  const Icon = chartIcons[type]
                  return (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={`p-2 rounded-md transition-colors ${
                        chartType === type
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={type.charAt(0).toUpperCase() + type.slice(1)}
                    >
                      <Icon size={16} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Frame Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="semiannual">Semestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div>No hay datos disponibles</div>}
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {processedData.length > 0 && (() => {
            // Como los datos son acumulativos, tomamos el último período (más reciente)
            const latestData = processedData[processedData.length - 1]
            return (
              <>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Presupuesto Inicial</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrencyComplete(latestData?.ppto_inicial || 0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Presupuesto Actual</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrencyComplete(latestData?.ppto_modificado || 0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Adiciones</div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {formatCurrencyComplete(latestData?.adiciones || 0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Reducciones</div>
                  <div className="text-lg font-semibold text-red-600">
                    {formatCurrencyComplete(latestData?.reducciones || 0)}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      </div>
    </motion.div>
  )
}

export default BudgetChart

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
  AreaChart,
  Legend
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
  const [timeFrame, setTimeFrame] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Procesar solo movimientos presupuestales
  const processedData = useMemo(() => {
    const movimientosData = filteredMovimientosPresupuestales.reduce((acc: any[], item: any) => {
      const period = timeFrame === 'monthly' 
        ? item.periodo_corte?.substring(0, 7) // YYYY-MM
        : timeFrame === 'quarterly'
          ? `${item.periodo_corte?.substring(0, 4)}-Q${Math.ceil(parseInt(item.periodo_corte?.substring(5, 7) || '1') / 3)}`
          : item.periodo_corte?.substring(0, 4) // YYYY

      const existingPeriod = acc.find(p => p.period === period)
      if (existingPeriod) {
        existingPeriod.ppto_inicial += item.ppto_inicial || 0
        existingPeriod.ppto_modificado += item.ppto_modificado || 0
        existingPeriod.adiciones += item.adiciones || 0
        existingPeriod.reducciones += item.reducciones || 0
        existingPeriod.creditos += item.creditos || 0
        existingPeriod.contracreditos += item.contracreditos || 0
        existingPeriod.aplazamiento += item.aplazamiento || 0
        existingPeriod.desaplazamiento += item.desaplazamiento || 0
      } else {
        acc.push({
          period,
          month: period,
          name: period,
          ppto_inicial: item.ppto_inicial || 0,
          ppto_modificado: item.ppto_modificado || 0,
          adiciones: item.adiciones || 0,
          reducciones: item.reducciones || 0,
          creditos: item.creditos || 0,
          contracreditos: item.contracreditos || 0,
          aplazamiento: item.aplazamiento || 0,
          desaplazamiento: item.desaplazamiento || 0
        })
      }
      return acc
    }, [])

    return movimientosData.sort((a, b) => a.period.localeCompare(b.period))
  }, [filteredMovimientosPresupuestales, timeFrame])

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

  // Formatear moneda
  const formatCurrencyFull = (value: number) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`
    }
    return `$${value.toLocaleString()}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{`Período: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {entry.dataKey}: {formatCurrencyFull(entry.value)}
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
          <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrencyFull}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="ppto_inicial" name="Presupuesto Inicial" fill={metricColors.ppto_inicial} />
            <Bar dataKey="ppto_modificado" name="Presupuesto Modificado" fill={metricColors.ppto_modificado} />
            <Bar dataKey="adiciones" name="Adiciones" fill={metricColors.adiciones} />
            <Bar dataKey="reducciones" name="Reducciones" fill={metricColors.reducciones} />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrencyFull}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
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
              name="Presupuesto Modificado"
              stroke={metricColors.ppto_modificado} 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="adiciones" 
              name="Adiciones"
              stroke={metricColors.adiciones} 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrencyFull}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
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
              dataKey="adiciones" 
              name="Adiciones"
              stackId="1"
              stroke={metricColors.adiciones} 
              fill={metricColors.adiciones}
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
              Análisis Presupuestal
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
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div>No hay datos disponibles</div>}
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {processedData.length > 0 && (
            <>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Inicial</div>
                <div className="text-lg font-semibold text-blue-600">
                  {formatCurrencyFull(processedData.reduce((sum, item) => sum + item.ppto_inicial, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Modificado</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrencyFull(processedData.reduce((sum, item) => sum + item.ppto_modificado, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Adiciones</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {formatCurrencyFull(processedData.reduce((sum, item) => sum + item.adiciones, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Reducciones</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrencyFull(processedData.reduce((sum, item) => sum + item.reducciones, 0))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default BudgetChart

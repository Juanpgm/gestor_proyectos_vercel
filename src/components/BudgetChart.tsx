'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { Calculator } from 'lucide-react'
import { useDataContext } from '../context/DataContext'

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
  
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Obtener años disponibles desde los datos
  const availableYears = useMemo(() => {
    let dataToProcess = filteredMovimientosPresupuestales
    if (project?.bpin) {
      dataToProcess = filteredMovimientosPresupuestales.filter((item: any) => 
        item.bpin === Number(project.bpin)
      )
    }

    const years = new Set<string>()
    dataToProcess.forEach((item: any) => {
      if (item.periodo_corte) {
        const year = item.periodo_corte.substring(0, 4)
        years.add(year)
      }
    })

    const yearArray = Array.from(years).sort()
    
    // Si no hay años seleccionados, seleccionar todos por defecto
    if (selectedYears.length === 0 && yearArray.length > 0) {
      setSelectedYears(yearArray)
    }

    return yearArray
  }, [filteredMovimientosPresupuestales, project?.bpin])

  // Función para manejar cambios en la selección de años
  const handleYearToggle = (year: string) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year)
      } else {
        return [...prev, year].sort()
      }
    })
  }

  // Procesar datos: Filtrar por BPIN y años seleccionados
  const processedData = useMemo(() => {
    // Filtrar datos por BPIN si hay un proyecto específico
    let dataToProcess = filteredMovimientosPresupuestales
    let ejecucionToProcess = filteredEjecucionPresupuestal
    
    if (project?.bpin) {
      dataToProcess = filteredMovimientosPresupuestales.filter((item: any) => 
        item.bpin === Number(project.bpin)
      )
      ejecucionToProcess = filteredEjecucionPresupuestal.filter((item: any) => 
        item.bpin === Number(project.bpin)
      )
    }

    // Filtrar por años seleccionados
    if (selectedYears.length > 0) {
      dataToProcess = dataToProcess.filter((item: any) => {
        if (!item.periodo_corte) return false
        const year = item.periodo_corte.substring(0, 4)
        return selectedYears.includes(year)
      })
      ejecucionToProcess = ejecucionToProcess.filter((item: any) => {
        if (!item.periodo_corte) return false
        const year = item.periodo_corte.substring(0, 4)
        return selectedYears.includes(year)
      })
    }

    // Agrupar por período mensual
    const periodTotals: { [key: string]: any } = {}
    
    dataToProcess.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) // YYYY-MM

      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          name: period,
          ppto_inicial: 0,
          ppto_modificado: 0,
          adiciones: 0,
          reducciones: 0,
          ejecucion: 0
        }
      }

      // Sumar valores para el período
      periodTotals[period].ppto_inicial += item.ppto_inicial || 0
      periodTotals[period].ppto_modificado += item.ppto_modificado || 0
      periodTotals[period].adiciones += item.adiciones || 0
      periodTotals[period].reducciones += item.reducciones || 0
    })

    // Agregar datos de ejecución
    ejecucionToProcess.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) // YYYY-MM

      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          name: period,
          ppto_inicial: 0,
          ppto_modificado: 0,
          adiciones: 0,
          reducciones: 0,
          ejecucion: 0
        }
      }

      // Sumar ejecución para el período
      periodTotals[period].ejecucion += item.ejecucion || 0
    })

    return Object.values(periodTotals).sort((a: any, b: any) => a.period.localeCompare(b.period))
  }, [filteredMovimientosPresupuestales, filteredEjecucionPresupuestal, selectedYears, project?.bpin])

  // Colores para las métricas
  const metricColors = {
    ppto_inicial: '#3B82F6',
    ppto_modificado: '#10B981',
    adiciones: '#F59E0B',
    reducciones: '#EF4444',
    ejecucion: '#8B5CF6',
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
      ejecucion: 'Ejecución Presupuestal',
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
    return (
      <LineChart data={processedData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600 opacity-30" />
        <XAxis 
          dataKey="name" 
          className="text-xs"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          axisLine={{ stroke: '#d1d5db' }}
          tickLine={{ stroke: '#d1d5db' }}
          angle={-45}
          textAnchor="end"
          height={40}
        />
        <YAxis 
          hide={true}
          tick={{ fill: '#6b7280' }}
          axisLine={{ stroke: '#d1d5db' }}
          tickLine={{ stroke: '#d1d5db' }}
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
          dataKey="ejecucion" 
          name="Ejecución Presupuestal"
          stroke={metricColors.ejecucion} 
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
          
          {/* Year Selector */}
          {availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Años:</span>
              <div className="flex gap-2 flex-wrap">
                {availableYears.map((year) => (
                  <label key={year} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={() => handleYearToggle(year)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{year}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div>No hay datos disponibles</div>}
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ejecución</div>
                  <div className="text-lg font-semibold text-purple-600">
                    {formatCurrencyComplete(latestData?.ejecucion || 0)}
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

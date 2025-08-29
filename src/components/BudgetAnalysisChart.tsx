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
import { TrendingUp } from 'lucide-react'
import { useDataContext } from '../context/DataContext'
import { formatCurrency, formatCurrencyFull } from '../utils/formatCurrency'

interface BudgetAnalysisChartProps {
  className?: string
}

const BudgetAnalysisChart: React.FC<BudgetAnalysisChartProps> = ({ className = '' }) => {
  const dataContext = useDataContext()
  const { filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = dataContext
  
  // Estado para años seleccionados
  const [selectedYears, setSelectedYears] = useState<string[]>(['2024', '2025'])

  // Obtener años disponibles de los datos
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    if (filteredMovimientosPresupuestales) {
      filteredMovimientosPresupuestales.forEach((item: any) => {
        const year = item.periodo_corte?.substring(0, 4)
        if (year) years.add(year)
      })
    }
    if (filteredEjecucionPresupuestal) {
      filteredEjecucionPresupuestal.forEach((item: any) => {
        const year = item.periodo_corte?.substring(0, 4)
        if (year) years.add(year)
      })
    }
    return Array.from(years).sort()
  }, [filteredMovimientosPresupuestales, filteredEjecucionPresupuestal])

  // Filtrar datos por años seleccionados
  const yearFilteredMovimientos = useMemo(() => {
    if (!filteredMovimientosPresupuestales) return []
    return filteredMovimientosPresupuestales.filter((item: any) => {
      const year = item.periodo_corte?.substring(0, 4)
      return year && selectedYears.includes(year)
    })
  }, [filteredMovimientosPresupuestales, selectedYears])

  const yearFilteredEjecucion = useMemo(() => {
    if (!filteredEjecucionPresupuestal) return []
    return filteredEjecucionPresupuestal.filter((item: any) => {
      const year = item.periodo_corte?.substring(0, 4)
      return year && selectedYears.includes(year)
    })
  }, [filteredEjecucionPresupuestal, selectedYears])

  // Procesar datos de líneas presupuestales
  const budgetLineData = useMemo(() => {
    const periodTotals: { [key: string]: any } = {}
    
    // Procesar movimientos presupuestales filtrados por año
    yearFilteredMovimientos?.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) || '' // YYYY-MM

      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          name: period,
          ppto_modificado: 0,
          adiciones: 0,
          reducciones: 0,
          ejecucion: 0,
          pagos: 0
        }
      }

      periodTotals[period].ppto_modificado += item.ppto_modificado || 0
      periodTotals[period].adiciones += item.adiciones || 0
      periodTotals[period].reducciones += item.reducciones || 0
    })

    // Procesar ejecución presupuestal filtrada por año
    yearFilteredEjecucion?.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) || '' // YYYY-MM

      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          name: period,
          ppto_modificado: 0,
          adiciones: 0,
          reducciones: 0,
          ejecucion: 0,
          pagos: 0
        }
      }

      periodTotals[period].ejecucion += item.ejecucion || 0
      periodTotals[period].pagos += item.pagos || 0
    })

    return Object.values(periodTotals).sort((a: any, b: any) => a.period.localeCompare(b.period))
  }, [yearFilteredMovimientos, yearFilteredEjecucion])

  // Calcular totales generales para mostrar debajo del gráfico
  const budgetTotals = useMemo(() => {
    let ppto_inicial = 0
    let ppto_modificado = 0
    let adiciones = 0
    let reducciones = 0
    let ejecucion = 0
    let pagos = 0

    // Obtener los valores del período más reciente para movimientos presupuestales filtrados por año
    if (yearFilteredMovimientos && yearFilteredMovimientos.length > 0) {
      // Encontrar el período más reciente en los datos filtrados por año
      const latestPeriod = yearFilteredMovimientos.reduce((latest, item) => {
        return item.periodo_corte > latest ? item.periodo_corte : latest
      }, '1900-01-01')
      
      // Filtrar solo los registros del período más reciente
      const latestPeriodData = yearFilteredMovimientos.filter(item => item.periodo_corte === latestPeriod)
      
      // Sumar todos los valores del período más reciente
      latestPeriodData.forEach((movimiento: any) => {
        ppto_inicial += movimiento.ppto_inicial || 0
        ppto_modificado += movimiento.ppto_modificado || 0
        adiciones += movimiento.adiciones || 0
        reducciones += movimiento.reducciones || 0
      })
    }

    // Obtener los valores más recientes de ejecución y pagos filtrados por año
    if (yearFilteredEjecucion && yearFilteredEjecucion.length > 0) {
      // Encontrar el período más reciente en los datos filtrados por año
      const latestPeriod = yearFilteredEjecucion.reduce((latest, item) => {
        return item.periodo_corte > latest ? item.periodo_corte : latest
      }, '1900-01-01')
      
      // Filtrar solo los registros del período más reciente
      const latestPeriodData = yearFilteredEjecucion.filter(item => item.periodo_corte === latestPeriod)
      
      // Sumar todos los valores del período más reciente
      latestPeriodData.forEach((ejecucionItem: any) => {
        ejecucion += ejecucionItem.ejecucion || 0
        pagos += ejecucionItem.pagos || 0
      })
    }

    return {
      ppto_inicial,
      ppto_modificado, // Usar la suma correcta en lugar del máximo
      adiciones,
      reducciones,
      ejecucion,
      pagos
    }
  }, [yearFilteredMovimientos, yearFilteredEjecucion])



  // Colores para las líneas
  const lineColors = {
    ppto_modificado: '#10B981',
    adiciones: '#F59E0B', 
    reducciones: '#EF4444',
    ejecucion: '#8B5CF6',
    pagos: '#3B82F6'
  }

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{`Período: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {entry.dataKey}:{' '}
                <span style={{ color: entry.color, fontWeight: 'bold' }}>
                  {formatCurrency(entry.value)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Gráfico de líneas presupuestales */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[500px] flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Análisis Presupuestal
              </h3>
            </div>
            
            {/* Control de filtros por año */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Años:</span>
              <div className="flex gap-2">
                {availableYears.map((year) => (
                  <label key={year} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedYears(prev => [...prev, year])
                        } else {
                          setSelectedYears(prev => prev.filter(y => y !== year))
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{year}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Gráfico */}
        <div className="p-4 flex-1">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={budgetLineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600 opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  className="dark:fill-gray-300"
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  hide={true} 
                  tick={{ fill: '#6b7280' }}
                  className="dark:fill-gray-300"
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomLineTooltip />} />
                
                <Line 
                  type="monotone" 
                  dataKey="ppto_modificado" 
                  stroke={lineColors.ppto_modificado} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Presupuesto Actual"
                />
                <Line 
                  type="monotone" 
                  dataKey="adiciones" 
                  stroke={lineColors.adiciones} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Adiciones"
                />
                <Line 
                  type="monotone" 
                  dataKey="reducciones" 
                  stroke={lineColors.reducciones} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Reducciones"
                />
                <Line 
                  type="monotone" 
                  dataKey="ejecucion" 
                  stroke={lineColors.ejecucion} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Ejecución"
                />
                <Line 
                  type="monotone" 
                  dataKey="pagos" 
                  stroke={lineColors.pagos} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Pagos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Valores numéricos totales */}
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
          <div className="pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">Valores Totales (Cifras Completas)</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Presupuesto Inicial</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrencyFull(budgetTotals.ppto_inicial)}</div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Presupuesto Actual</div>
                <div className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrencyFull(budgetTotals.ppto_modificado)}</div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Adiciones</div>
                <div className="text-lg font-bold text-orange-700 dark:text-orange-400">{formatCurrencyFull(budgetTotals.adiciones)}</div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reducciones</div>
                <div className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrencyFull(budgetTotals.reducciones)}</div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ejecución</div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{formatCurrencyFull(budgetTotals.ejecucion)}</div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pagos</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrencyFull(budgetTotals.pagos)}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BudgetAnalysisChart

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
  ResponsiveContainer
} from 'recharts'
import { Calendar } from 'lucide-react'
import { useDataContext } from '../context/DataContext'
import { formatCurrency } from '../utils/formatCurrency'
import { ANIMATIONS, TYPOGRAPHY, CSS_UTILS, CHART_COLORS } from '@/lib/design-system'

interface BudgetAnalysisChartProps {
  className?: string
  showMetrics?: boolean
  // Props opcionales para datos específicos (para filtrar por proyecto)
  customMovimientos?: any[]
  customEjecucion?: any[]
}

const BudgetAnalysisChart: React.FC<BudgetAnalysisChartProps> = ({ 
  className = '', 
  showMetrics = true,
  customMovimientos,
  customEjecucion
}) => {
  const dataContext = useDataContext()
  
  // Usar datos personalizados si se proporcionan, de lo contrario usar los del contexto
  const movimientosData = customMovimientos || dataContext.filteredMovimientosPresupuestales
  const ejecucionData = customEjecucion || dataContext.filteredEjecucionPresupuestal
  
  // Obtener años disponibles de los datos
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    if (movimientosData) {
      movimientosData.forEach((item: any) => {
        const year = item.periodo_corte?.substring(0, 4)
        if (year) years.add(year)
      })
    }
    if (ejecucionData) {
      ejecucionData.forEach((item: any) => {
        const year = item.periodo_corte?.substring(0, 4)
        if (year) years.add(year)
      })
    }
    return Array.from(years).sort()
  }, [movimientosData, ejecucionData])
  
  // Estado para años seleccionados (inicializar con todos los años disponibles)
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  
  // Efecto para inicializar selectedYears con todos los años disponibles
  React.useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0) {
      setSelectedYears(availableYears)
    }
  }, [availableYears])
  
  // Estado para líneas visibles
  const [visibleLines] = useState({
    ppto_modificado: true,
    adiciones: true,
    reducciones: true,
    ejecucion: true,
    pagos: true
  })

  // Estado para tipo de vista en móvil
  const [isMobileView, setIsMobileView] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filtrar datos por años seleccionados
  const yearFilteredMovimientos = useMemo(() => {
    if (!movimientosData) return []
    return movimientosData.filter((item: any) => {
      const year = item.periodo_corte?.substring(0, 4)
      return year && selectedYears.includes(year)
    })
  }, [movimientosData, selectedYears])

  const yearFilteredEjecucion = useMemo(() => {
    if (!ejecucionData) return []
    return ejecucionData.filter((item: any) => {
      const year = item.periodo_corte?.substring(0, 4)
      return year && selectedYears.includes(year)
    })
  }, [ejecucionData, selectedYears])

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



  // Colores para las líneas usando el nuevo sistema
  const lineColors = {
    ppto_modificado: CHART_COLORS[0], // Azul
    adiciones: CHART_COLORS[3],       // Naranja
    reducciones: CHART_COLORS[2],     // Rojo
    ejecucion: CHART_COLORS[4],       // Violeta
    pagos: CHART_COLORS[1]            // Verde
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          className={`${CSS_UTILS.card} p-3 shadow-lg border-0 min-w-[200px]`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={ANIMATIONS.slideUp.transition}
        >
          <p className={`${TYPOGRAPHY.h6} font-semibold text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-gray-600 pb-1`}>
            {`Período: ${label}`}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`${TYPOGRAPHY.bodySmall} text-gray-600 dark:text-gray-300 capitalize`}>
                    {entry.dataKey.replace('_', ' ')}
                  </span>
                </div>
                <span className={`${TYPOGRAPHY.bodySmall} font-semibold`} style={{ color: entry.color }}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )
    }
    return null
  }

  return (
    <motion.div 
      className={`space-y-4 ${className}`}
      initial={ANIMATIONS.fadeIn.initial}
      animate={ANIMATIONS.fadeIn.animate}
      transition={ANIMATIONS.fadeIn.transition}
    >
      {/* Header simplificado */}
      <div className={`${CSS_UTILS.card} p-4 border-l-4 border-l-blue-500`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className={`${TYPOGRAPHY.h4} font-bold text-gray-900 dark:text-white`}>
              Análisis Presupuestal
            </h2>
            <p className={`${TYPOGRAPHY.bodySmall} text-gray-600 dark:text-gray-400`}>
              Evolución temporal del presupuesto municipal
            </p>
          </div>
          
          {/* Solo filtro de años */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className={`${TYPOGRAPHY.caption} text-gray-600 dark:text-gray-400`}>Años:</span>
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
                    className="w-3 h-3 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                  />
                  <span className={`${TYPOGRAPHY.caption} text-gray-700 dark:text-gray-300`}>{year}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas SIN ÍCONOS - COMPACTAS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-700">
            <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Presupuesto Total</div>
            <div className="text-sm font-bold text-blue-800 dark:text-blue-200">{formatCurrency(budgetTotals.ppto_modificado)}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Presupuesto Inicial</div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatCurrency(budgetTotals.ppto_inicial)}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-700">
            <div className="text-xs text-green-700 dark:text-green-300 mb-1">Adiciones</div>
            <div className="text-sm font-bold text-green-800 dark:text-green-200">{formatCurrency(budgetTotals.adiciones)}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 border border-red-200 dark:border-red-700">
            <div className="text-xs text-red-700 dark:text-red-300 mb-1">Reducciones</div>
            <div className="text-sm font-bold text-red-800 dark:text-red-200">{formatCurrency(budgetTotals.reducciones)}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-700">
            <div className="text-xs text-purple-700 dark:text-purple-300 mb-1">Ejecución</div>
            <div className="text-sm font-bold text-purple-800 dark:text-purple-200">{formatCurrency(budgetTotals.ejecucion)}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2 border border-indigo-200 dark:border-indigo-700">
            <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">Pagos</div>
            <div className="text-sm font-bold text-indigo-800 dark:text-indigo-200">{formatCurrency(budgetTotals.pagos)}</div>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE BARRAS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '350px' }}>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Movimientos Presupuestales
          </h3>
        </div>

        <div className="p-4 h-full">
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={budgetLineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600 opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={40}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              
              <Bar dataKey="ppto_modificado" fill="#3b82f6" name="Presupuesto Total" />
              <Bar dataKey="adiciones" fill="#10b981" name="Adiciones" />
              <Bar dataKey="reducciones" fill="#ef4444" name="Reducciones" />
              <Bar dataKey="ejecucion" fill="#8b5cf6" name="Ejecución" />
              <Bar dataKey="pagos" fill="#6366f1" name="Pagos" />
            </BarChart>
          </ResponsiveContainer>
          
          {/* LEYENDA COMPACTA */}
          <div className="flex flex-wrap justify-center gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Presupuesto Total</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Adiciones</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Reducciones</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">Ejecución</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded bg-indigo-500" />
              <span className="text-gray-600 dark:text-gray-400">Pagos</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BudgetAnalysisChart

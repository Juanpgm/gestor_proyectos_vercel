'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'
import { EmprestitoData } from '@/hooks/useEmprestito'

interface EmprestitoTimeSeriesProps {
  data: EmprestitoData
  loading?: boolean
}

const EmprestitoTimeSeries: React.FC<EmprestitoTimeSeriesProps> = ({
  data,
  loading = false
}) => {
  // Procesar datos para serie de tiempo acumulativa
  const timeSeriesData = React.useMemo(() => {
    if (!data.hechos || Object.keys(data.hechos).length === 0) {
      return []
    }

    // Recopilar todos los periodos únicos
    const periodosSet = new Set<string>()
    Object.values(data.hechos).forEach(proyecto => {
      Object.keys(proyecto).forEach(periodo => periodosSet.add(periodo))
    })

    const periodosOrdenados = Array.from(periodosSet).sort()

    // Primera pasada: calcular todos los valores del periodo para obtener máximos
    const valoresPeriodo = periodosOrdenados.map(periodo => {
      let desembolsoPeriodo = 0
      let desembolsoRealPeriodo = 0

      Object.values(data.hechos).forEach(proyecto => {
        if (proyecto[periodo]) {
          const periodData = proyecto[periodo]
          desembolsoPeriodo += periodData.desembolso || 0
          desembolsoRealPeriodo += periodData.desembolso_real || 0
        }
      })

      return { desembolsoPeriodo, desembolsoRealPeriodo }
    })

    const maxDesembolsoPeriodo = Math.max(...valoresPeriodo.map(v => v.desembolsoPeriodo))
    const maxDesembolsoRealPeriodo = Math.max(...valoresPeriodo.map(v => v.desembolsoRealPeriodo))

    // Función para calcular intensidad de color
    const getBlueIntensity = (value: number, maxValue: number) => {
      if (maxValue === 0) return '#93C5FD'
      const intensity = Math.max(0.3, value / maxValue)
      const base = [59, 130, 246] // #3B82F6
      const light = [147, 197, 253] // #93C5FD
      const r = Math.round(light[0] + (base[0] - light[0]) * intensity)
      const g = Math.round(light[1] + (base[1] - light[1]) * intensity)
      const b = Math.round(light[2] + (base[2] - light[2]) * intensity)
      return `rgb(${r}, ${g}, ${b})`
    }

    const getRedIntensity = (value: number, maxValue: number) => {
      if (maxValue === 0) return '#FCA5A5'
      const intensity = Math.max(0.3, value / maxValue)
      const base = [239, 68, 68] // #EF4444
      const light = [252, 165, 165] // #FCA5A5
      const r = Math.round(light[0] + (base[0] - light[0]) * intensity)
      const g = Math.round(light[1] + (base[1] - light[1]) * intensity)
      const b = Math.round(light[2] + (base[2] - light[2]) * intensity)
      return `rgb(${r}, ${g}, ${b})`
    }

    // Calcular datos acumulativos por periodo
    let desembolsoAcumulado = 0
    let desembolsoRealAcumulado = 0
    let avanceAcumulado = 0
    let avanceRealAcumulado = 0

    const seriesData = periodosOrdenados.map(periodo => {
      let desembolsoPeriodo = 0
      let desembolsoRealPeriodo = 0
      let avancePeriodo = 0
      let avanceRealPeriodo = 0
      let proyectosActivos = 0

      // Sumar todos los valores del periodo
      Object.values(data.hechos).forEach(proyecto => {
        if (proyecto[periodo]) {
          const periodData = proyecto[periodo]
          desembolsoPeriodo += periodData.desembolso || 0
          desembolsoRealPeriodo += periodData.desembolso_real || 0
          avancePeriodo += periodData.avance || 0
          avanceRealPeriodo += periodData.avance_real || 0
          proyectosActivos++
        }
      })

      // Acumular valores
      desembolsoAcumulado += desembolsoPeriodo
      desembolsoRealAcumulado += desembolsoRealPeriodo

      // Para avance, calculamos el promedio del periodo
      const avancePromedioPeriodo = proyectosActivos > 0 ? avancePeriodo / proyectosActivos : 0
      const avanceRealPromedioPeriodo = proyectosActivos > 0 ? avanceRealPeriodo / proyectosActivos : 0

      return {
        periodo: periodo.replace('-', '/'),
        periodoOriginal: periodo,
        // Barras - Montos del periodo (sin acumular)
        desembolsoPeriodo,
        desembolsoRealPeriodo,
        // Colores dinámicos basados en valores
        desembolsoPeriodoColor: getBlueIntensity(desembolsoPeriodo, maxDesembolsoPeriodo),
        desembolsoRealPeriodoColor: getRedIntensity(desembolsoRealPeriodo, maxDesembolsoRealPeriodo),
        // Líneas - Montos acumulados
        desembolsoAcumulado,
        desembolsoRealAcumulado,
        // Avances promedio del periodo para tooltips
        avancePromedio: avancePromedioPeriodo * 100, // Convertir a porcentaje
        avanceRealPromedio: avanceRealPromedioPeriodo * 100,
        proyectosActivos,
        // Formateo para tooltips
        desembolsoAcumuladoFormatted: formatNumber(desembolsoAcumulado, 'currency'),
        desembolsoRealAcumuladoFormatted: formatNumber(desembolsoRealAcumulado, 'currency'),
        desembolsoPeriodoFormatted: formatNumber(desembolsoPeriodo, 'currency'),
        desembolsoRealPeriodoFormatted: formatNumber(desembolsoRealPeriodo, 'currency')
      }
    }).slice(-60) // Últimos 60 meses (incluye proyecciones 2025-2027)

    return seriesData
  }, [data.hechos])

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">Desembolsos del Periodo:</div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-blue-600 dark:text-blue-400">Planeado:</span>
              <span className="font-medium">{data.desembolsoPeriodoFormatted}</span>
            </div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-red-600 dark:text-red-400">Real:</span>
              <span className="font-medium">{data.desembolsoRealPeriodoFormatted}</span>
            </div>
            
            <div className="text-gray-600 dark:text-gray-400 font-medium mb-1 mt-3">Desembolsos Acumulados:</div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-blue-600 dark:text-blue-400">Planeado:</span>
              <span className="font-medium">{data.desembolsoAcumuladoFormatted}</span>
            </div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-red-600 dark:text-red-400">Real:</span>
              <span className="font-medium">{data.desembolsoRealAcumuladoFormatted}</span>
            </div>
            
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Proyectos Activos:</span>
                <span className="font-medium">{data.proyectosActivos}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="h-96 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </motion.div>
    )
  }

  if (timeSeriesData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Serie de Tiempo - Empréstito
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Evolución temporal de métricas acumulativas
            </p>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
          <p>No hay datos de serie de tiempo disponibles</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Serie de Tiempo - Empréstito
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Desembolsos del periodo (barras) y acumulados (líneas) - últimos 60 meses incluyendo proyecciones
          </p>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={timeSeriesData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="periodo" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value, 'currency')}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value, 'currency')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Barras para desembolsos del periodo (sin acumular) - Eje derecho con escala ajustada */}
            <Bar 
              yAxisId="right"
              dataKey="desembolsoPeriodo" 
              name="Desembolso Planeado (Periodo)"
              opacity={0.8}
            >
              {timeSeriesData.map((entry, index) => (
                <Cell key={`cell-planeado-${index}`} fill={entry.desembolsoPeriodoColor} />
              ))}
            </Bar>
            <Bar 
              yAxisId="right"
              dataKey="desembolsoRealPeriodo" 
              name="Desembolso Real (Periodo)"
              opacity={0.8}
            >
              {timeSeriesData.map((entry, index) => (
                <Cell key={`cell-real-${index}`} fill={entry.desembolsoRealPeriodoColor} />
              ))}
            </Bar>
            
            {/* Líneas para desembolsos acumulados - Eje izquierdo */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="desembolsoAcumulado" 
              stroke="#3B82F6"
              strokeWidth={3}
              name="Desembolso Planeado (Acumulado)"
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="desembolsoRealAcumulado" 
              stroke="#EF4444"
              strokeWidth={3}
              name="Desembolso Real (Acumulado)"
              dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export default EmprestitoTimeSeries

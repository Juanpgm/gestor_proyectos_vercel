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
  Legend
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'
import { EmprestitoData } from '@/hooks/useEmprestito'

interface EmprestitoContractsChartProps {
  data: EmprestitoData
  loading?: boolean
}

const EmprestitoContractsChart: React.FC<EmprestitoContractsChartProps> = ({
  data,
  loading = false
}) => {
  // Procesar datos de foundational_facts para crear series temporales
  const chartData = React.useMemo(() => {
    if (!data.hechos || Object.keys(data.hechos).length === 0) {
      return []
    }

    // Recopilar todos los periodos únicos
    const periodosSet = new Set<string>()
    Object.values(data.hechos).forEach(proyecto => {
      Object.keys(proyecto).forEach(periodo => periodosSet.add(periodo))
    })

    const periodosOrdenados = Array.from(periodosSet).sort()

    // Crear datos agregados por periodo
    return periodosOrdenados.map(periodo => {
      let totalDesembolso = 0
      let totalDesembolsoReal = 0
      let totalAvance = 0
      let totalAvanceReal = 0
      let proyectosConDatos = 0

      Object.values(data.hechos).forEach(proyecto => {
        if (proyecto[periodo]) {
          totalDesembolso += proyecto[periodo].desembolso || 0
          totalDesembolsoReal += proyecto[periodo].desembolso_real || 0
          totalAvance += proyecto[periodo].avance || 0
          totalAvanceReal += proyecto[periodo].avance_real || 0
          
          // Contar solo proyectos que tienen datos reales
          if (proyecto[periodo].desembolso_real > 0 || proyecto[periodo].avance_real > 0) {
            proyectosConDatos++
          }
        }
      })

      const avancePromedio = proyectosConDatos > 0 
        ? (totalAvanceReal / proyectosConDatos) * 100 
        : 0

      return {
        periodo: periodo.replace('-', '/'),
        periodoCompleto: periodo,
        desembolsoReal: totalDesembolsoReal,
        desembolsoPlaneado: totalDesembolso,
        avancePromedio: Math.round(avancePromedio * 100) / 100,
        proyectosActivos: proyectosConDatos,
        // Formatear para tooltips
        desembolsoRealFormatted: formatNumber(totalDesembolsoReal, 'currency'),
        desembolsoPlaneadoFormatted: formatNumber(totalDesembolso, 'currency')
      }
    }).filter(item => item.proyectosActivos > 0 || item.desembolsoReal > 0) // Solo periodos con datos
     .slice(-12) // Últimos 12 meses
  }, [data.hechos])

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {entry.dataKey === 'desembolsoReal' ? 'Desembolso Real:' :
                 entry.dataKey === 'desembolsoPlaneado' ? 'Desembolso Planeado:' :
                 entry.dataKey === 'avancePromedio' ? 'Avance Promedio:' :
                 entry.dataKey === 'proyectosActivos' ? 'Proyectos Activos:' : entry.dataKey}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {entry.dataKey === 'avancePromedio' 
                  ? `${entry.value}%`
                  : entry.dataKey === 'proyectosActivos'
                  ? entry.value
                  : formatNumber(entry.value, 'currency')
                }
              </span>
            </div>
          ))}
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-64"></div>
            </div>
          </div>
          <div className="h-96 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </motion.div>
    )
  }

  if (chartData.length === 0) {
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
              Contratos de Empréstito
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Evolución temporal de desembolsos y avances
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay datos de contratos disponibles</p>
          </div>
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
            Contratos de Empréstito
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Evolución temporal de desembolsos y avances ({chartData.length} períodos)
          </p>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            
            <XAxis 
              dataKey="periodo" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            
            {/* Eje Y izquierdo para desembolsos */}
            <YAxis 
              yAxisId="desembolso"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value, 'currency')}
            />
            
            {/* Eje Y derecho para porcentajes */}
            <YAxis 
              yAxisId="porcentaje"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{
                paddingTop: '20px'
              }}
            />

            {/* Barras para desembolsos */}
            <Bar 
              yAxisId="desembolso"
              dataKey="desembolsoReal" 
              fill={CATEGORIES.emprestito.color.primary}
              name="Desembolso Real"
              opacity={0.8}
              radius={[2, 2, 0, 0]}
            />
            
            <Bar 
              yAxisId="desembolso"
              dataKey="desembolsoPlaneado" 
              fill={CATEGORIES.emprestito.color.light}
              name="Desembolso Planeado"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
            />

            {/* Línea para avance promedio */}
            <Line 
              yAxisId="porcentaje"
              type="monotone" 
              dataKey="avancePromedio" 
              stroke="#F59E0B"
              strokeWidth={3}
              name="Avance Promedio (%)"
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />

            {/* Línea para proyectos activos */}
            <Line 
              yAxisId="porcentaje"
              type="monotone" 
              dataKey="proyectosActivos" 
              stroke="#8B5CF6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Proyectos Activos"
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Resumen de datos */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Períodos</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {chartData.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Desembolso Total</p>
            <p className="text-lg font-semibold text-teal-600 dark:text-teal-400">
              {formatNumber(chartData.reduce((sum, item) => sum + item.desembolsoReal, 0), 'currency')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avance Promedio</p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {Math.round(chartData.reduce((sum, item) => sum + item.avancePromedio, 0) / chartData.length)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pico Proyectos</p>
            <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {Math.max(...chartData.map(item => item.proyectosActivos))}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EmprestitoContractsChart

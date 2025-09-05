'use client'

import React from 'react'
import { motion } from 'framer-motion'
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
  Cell
} from 'recharts'
import { Building2, PieChart as PieChartIcon } from 'lucide-react'
import { CATEGORIES, CHART_COLORS, formatNumber } from '@/lib/design-system'
import { EmprestitoData } from '@/hooks/useEmprestito'

interface EmprestitoChartsProps {
  data: EmprestitoData
  loading?: boolean
}

const EmprestitoCharts: React.FC<EmprestitoChartsProps> = ({
  data,
  loading = false
}) => {
  // Datos para gráfico de barras - Valor por banco
  const valorPorBanco = React.useMemo(() => {
    const bancoValues = data.contratos.reduce((acc, contrato) => {
      acc[contrato.banco] = (acc[contrato.banco] || 0) + contrato.valor_contrato
      return acc
    }, {} as Record<string, number>)

    return Object.entries(bancoValues)
      .map(([banco, valor]) => ({
        banco,
        valor,
        valorFormatted: formatNumber(valor, 'currency')
      }))
      .sort((a, b) => b.valor - a.valor)
  }, [data.contratos])

  // Datos para gráfico circular - Proyectos por banco
  const proyectosPorBanco = React.useMemo(() => {
    const bancoCount = data.contratos.reduce((acc, contrato) => {
      acc[contrato.banco] = (acc[contrato.banco] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(bancoCount)
      .map(([banco, count]) => ({
        banco: banco.length > 30 ? banco.substring(0, 30) + '...' : banco,
        bancoCompleto: banco,
        count,
        percentage: ((count / data.contratos.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
  }, [data.contratos])



  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Gráfico de Barras - Valor por Banco */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 lg:col-span-2"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Valor de Contratos por Banco
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Distribución del valor total de contratos
            </p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valorPorBanco} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="banco" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => formatNumber(value, 'currency')}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => [formatNumber(value, 'currency'), 'Valor']}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Bar 
                dataKey="valor" 
                fill={CATEGORIES.emprestito.color.primary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Gráfico Circular - Proyectos por Banco */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
            <PieChartIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Proyectos por Banco
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Distribución por entidad bancaria
            </p>
          </div>
        </div>

        <div className="h-[420px] flex flex-col">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={proyectosPorBanco}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  dataKey="count"
                  label={false}
                  labelLine={false}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {proyectosPorBanco.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number, name, props: any) => [
                    `${value} proyectos (${props.payload.percentage}%)`,
                    props.payload.bancoCompleto
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Leyenda personalizada */}
          <div className="mt-4 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {proyectosPorBanco.map((item, index) => (
                <div key={item.banco} className="flex items-center text-sm">
                  <div 
                    className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    <span className="font-medium">{item.bancoCompleto}</span>: {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default EmprestitoCharts

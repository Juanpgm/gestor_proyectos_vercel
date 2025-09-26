/**
 * Dashboard de Resumen de Unidades de Proyecto
 * @description Componente principal del dashboard con métricas, gráficos y tabla de atributos
 */

'use client'

import React, { memo } from 'react'
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
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  RefreshCw,
  Info,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'

// Componente de tarjeta de métrica
const MetricCard = memo<{
  title: string
  value: string
  icon: string
  description?: string
  index: number
}>(({ title, value, icon, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </span>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {value}
        </p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-300">
        <TrendingUp className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
))

MetricCard.displayName = 'MetricCard'

// Componente de gráfico personalizado
const ChartCard = memo<{
  title: string
  data: any[]
  type: 'bar' | 'pie' | 'area' | 'line'
  icon: React.ReactNode
  index: number
}>(({ title, data, type, icon, index }) => {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                fontSize={12} 
                tick={{ fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                fill="url(#barGradient)"
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: '#6b7280' }} />
              <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#areaGradient)"
              />
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.length} elementos
        </div>
      </div>
      <div className="h-64">
        {renderChart()}
      </div>
    </motion.div>
  )
})

ChartCard.displayName = 'ChartCard'

// Componente de tabla de atributos
const AttributesTable = memo<{
  data: any[]
  title: string
}>(({ data, title }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg">
          <Info className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Atributo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Descripción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => (
            <motion.tr
              key={item.categoria}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icono}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.categoria}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {item.valor}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.descripcion}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
))

AttributesTable.displayName = 'AttributesTable'

// Componente principal del dashboard
export const DashboardSummary: React.FC = () => {
  const { metrics, charts, isLoading, error, lastUpdated, refreshData } = useDashboardData()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center"
      >
        <div className="text-red-600 dark:text-red-400 mb-2">
          <Building2 className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Error al cargar el dashboard</h3>
          <p className="text-sm mt-2">{error}</p>
        </div>
        <button
          onClick={refreshData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard de Resumen
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Métricas generales y distribuciones de unidades de proyecto
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Actualizado: {lastUpdated.toLocaleTimeString('es-CO')}
            </span>
          )}
          <button
            onClick={refreshData}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.categoria}
            title={metric.categoria}
            value={String(metric.valor)}
            icon={metric.icono}
            description={metric.descripcion}
            index={index}
          />
        ))}
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Distribución por Comuna/Corregimiento"
          data={charts.comunas}
          type="bar"
          icon={<MapPin className="w-5 h-5 text-white" />}
          index={0}
        />
        <ChartCard
          title="Evolución por Año"
          data={charts.anos}
          type="area"
          icon={<Calendar className="w-5 h-5 text-white" />}
          index={1}
        />
        <ChartCard
          title="Fuentes de Financiación (Top 8)"
          data={charts.fuentes}
          type="pie"
          icon={<DollarSign className="w-5 h-5 text-white" />}
          index={2}
        />
        <ChartCard
          title="Distribución por Barrio/Vereda (Top 12)"
          data={charts.barrios}
          type="bar"
          icon={<PieChartIcon className="w-5 h-5 text-white" />}
          index={3}
        />
      </div>

      {/* Tabla de Atributos */}
      <AttributesTable 
        data={metrics} 
        title="Tabla de Atributos Principales" 
      />
    </div>
  )
}

export default DashboardSummary
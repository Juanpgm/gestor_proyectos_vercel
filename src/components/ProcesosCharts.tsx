'use client'

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
import { formatNumber, CHART_COLORS, ANIMATIONS } from '@/lib/design-system'

export interface ProcesosChartsProps {
  procesosPorEstado: Record<string, number>
  procesosPorFase: Record<string, number>
  procesosPorModalidad: Record<string, number>
  procesosPorMes: Record<string, number>
  procesosPorEntidad: Record<string, number>
}

export default function ProcesosCharts({
  procesosPorEstado,
  procesosPorFase,
  procesosPorModalidad,
  procesosPorMes,
  procesosPorEntidad
}: ProcesosChartsProps) {

  // Preparar datos para grÃ¡ficos
  const estadosData = Object.entries(procesosPorEstado)
    .map(([estado, cantidad]) => ({ estado, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)

  const fasesData = Object.entries(procesosPorFase)
    .map(([fase, cantidad]) => ({ fase, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 8) // Top 8 fases

  const modalidadesData = Object.entries(procesosPorModalidad)
    .map(([modalidad, cantidad]) => ({ modalidad, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6) // Top 6 modalidades

  const evolucionData = Object.entries(procesosPorMes)
    .map(([mes, cantidad]) => ({ mes, cantidad }))
    .sort((a, b) => a.mes.localeCompare(b.mes))

  const topEntidadesData = Object.entries(procesosPorEntidad)
    .map(([entidad, cantidad]) => ({ 
      entidad: entidad.length > 40 ? entidad.substring(0, 40) + '...' : entidad, 
      cantidad 
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 8) // Top 8 entidades

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {`Procesos: ${payload[0].value.toLocaleString('es-CO')}`}
          </p>
        </div>
      )
    }
    return null
  }

  const formatXAxisTick = (value: string) => {
    if (value.includes('-')) {
      const [year, month] = value.split('-')
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      return `${monthNames[parseInt(month) - 1]} ${year}`
    }
    return value.length > 15 ? value.substring(0, 15) + '...' : value
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Estados de Procesos */}
      <motion.div
        initial={ANIMATIONS.slideUp.initial}
        animate={ANIMATIONS.slideUp.animate}
        transition={ANIMATIONS.slideUp.transition}
        className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          DistribuciÃ³n por Estado
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={estadosData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="cantidad"
              nameKey="estado"
              label={({ estado, percent }) => `${estado}: ${(percent * 100).toFixed(1)}%`}
            >
              {estadosData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Fases de Procesos */}
      <motion.div
        initial={ANIMATIONS.slideUp.initial}
        animate={ANIMATIONS.slideUp.animate}
        transition={{ ...ANIMATIONS.slideUp.transition, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          DistribuciÃ³n por Fase
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fasesData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              type="number" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="category" 
              dataKey="fase" 
              stroke="#6B7280"
              tick={{ fontSize: 11 }}
              width={120}
              tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
            />
            <Tooltip content={CustomTooltip} />
            <Bar dataKey="cantidad" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* EvoluciÃ³n Temporal */}
      <motion.div
        initial={ANIMATIONS.slideUp.initial}
        animate={ANIMATIONS.slideUp.animate}
        transition={{ ...ANIMATIONS.slideUp.transition, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          EvoluciÃ³n Temporal de Procesos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={evolucionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="mes" 
              stroke="#6B7280"
              tick={{ fontSize: 11 }}
              tickFormatter={formatXAxisTick}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={CustomTooltip} />
            <Area 
              type="monotone" 
              dataKey="cantidad" 
              stroke={CHART_COLORS[2]} 
              fill={CHART_COLORS[2]}
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Modalidades de ContrataciÃ³n */}
      <motion.div
        initial={ANIMATIONS.slideUp.initial}
        animate={ANIMATIONS.slideUp.animate}
        transition={{ ...ANIMATIONS.slideUp.transition, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Top Modalidades de ContrataciÃ³n
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={modalidadesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="modalidad" 
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
              tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={CustomTooltip} />
            <Bar dataKey="cantidad" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Entidades - Span completo */}
      <motion.div
        initial={ANIMATIONS.slideUp.initial}
        animate={ANIMATIONS.slideUp.animate}
        transition={{ ...ANIMATIONS.slideUp.transition, delay: 0.4 }}
        className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Top Entidades por NÃºmero de Procesos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topEntidadesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="entidad" 
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={CustomTooltip} />
            <Bar dataKey="cantidad" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}

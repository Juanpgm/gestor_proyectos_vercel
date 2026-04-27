'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line
} from 'recharts'
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Calendar
} from 'lucide-react'
import { CATEGORIES, formatNumber, CHART_COLORS, ANIMATIONS } from '@/lib/design-system'
import { Contrato } from '@/hooks/useContratos'

interface ContratosChartsProps {
  contratos: Contrato[]
  loading?: boolean
}

const ContratosCharts: React.FC<ContratosChartsProps> = ({
  contratos,
  loading = false
}) => {
  // Procesar datos para grÃ¡ficos simplificados
  const chartData = React.useMemo(() => {
    if (!contratos.length) return null

    // 1. Contratos por estado (PieChart)
    const contratosPorEstado = contratos.reduce((acc, contrato) => {
      const estado = contrato.estado_contrato || 'Sin Estado'
      if (!acc[estado]) {
        acc[estado] = { count: 0, valor: 0 }
      }
      acc[estado].count += 1
      acc[estado].valor += contrato.valor_contrato || 0
      return acc
    }, {} as Record<string, { count: number; valor: number }>)

    const estadosData = Object.entries(contratosPorEstado).map(([estado, data]) => ({
      name: estado,
      value: data.count,
      valueFormatted: formatNumber(data.valor, 'currency')
    }))

    // 2. Valor por modalidad de contrataciÃ³n (BarChart)
    const contratosPorModalidad = contratos.reduce((acc, contrato) => {
      const modalidad = contrato.modalidad_contratacion || 'Sin Modalidad'
      if (!acc[modalidad]) {
        acc[modalidad] = { count: 0, valor: 0 }
      }
      acc[modalidad].count += 1
      acc[modalidad].valor += contrato.valor_contrato || 0
      return acc
    }, {} as Record<string, { count: number; valor: number }>)

    const modalidadData = Object.entries(contratosPorModalidad)
      .map(([modalidad, data]) => ({
        name: modalidad.length > 30 ? modalidad.substring(0, 30) + '...' : modalidad,
        fullName: modalidad,
        count: data.count,
        valor: data.valor,
        valueFormatted: formatNumber(data.valor, 'currency')
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8) // Solo las top 8 modalidades

    // 3. EvoluciÃ³n temporal de contratos (ComposedChart)
    const contratosPorMes = contratos.reduce((acc, contrato) => {
      if (contrato.fecha_firma) {
        const fecha = new Date(contrato.fecha_firma)
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        if (!acc[mes]) {
          acc[mes] = { count: 0, valor: 0 }
        }
        acc[mes].count += 1
        acc[mes].valor += contrato.valor_contrato || 0
      }
      return acc
    }, {} as Record<string, { count: number; valor: number }>)

    const temporalData = Object.entries(contratosPorMes)
      .map(([mes, data]) => ({
        mes,
        contratos: data.count,
        valor: data.valor,
        valorPromedio: data.count > 0 ? data.valor / data.count : 0
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-12) // Ãšltimos 12 meses

    // 4. Top entidades por valor de contratos (BarChart)
    const contratosPorEntidad = contratos.reduce((acc, contrato) => {
      const entidad = contrato.nombre_entidad || 'Sin Entidad'
      if (!acc[entidad]) {
        acc[entidad] = { count: 0, valor: 0 }
      }
      acc[entidad].count += 1
      acc[entidad].valor += contrato.valor_contrato || 0
      return acc
    }, {} as Record<string, { count: number; valor: number }>)

    const entidadesData = Object.entries(contratosPorEntidad)
      .map(([entidad, data]) => ({
        name: entidad.length > 40 ? entidad.substring(0, 40) + '...' : entidad,
        fullName: entidad,
        count: data.count,
        valor: data.valor,
        valueFormatted: formatNumber(data.valor, 'currency')
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10) // Top 10 entidades

    return {
      estadosData,
      modalidadData,
      temporalData,
      entidadesData
    }
  }, [contratos])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
          >
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700">
        <p className="text-center text-gray-500 dark:text-gray-400">No hay datos de contratos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Primera fila - GrÃ¡ficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Estados de Contratos - PieChart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...ANIMATIONS.fadeIn }}
          className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estados de Contratos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">DistribuciÃ³n por estado</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.estadosData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
              >
                {chartData.estadosData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name, props) => [
                  formatNumber(value),
                  'Contratos'
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 2. Valor por Modalidad - BarChart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...ANIMATIONS.fadeIn }}
          className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Valor por Modalidad</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top modalidades de contrataciÃ³n</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.modalidadData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                type="number"
                tickFormatter={(value) => formatNumber(value, 'currency')}
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="name"
                width={120}
                fontSize={11}
              />
              <Tooltip
                formatter={(value: number) => [formatNumber(value, 'currency'), 'Valor Total']}
                labelFormatter={(label) => `Modalidad: ${label}`}
              />
              <Bar dataKey="valor" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Segunda fila - AnÃ¡lisis temporal y entidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3. EvoluciÃ³n Temporal - ComposedChart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...ANIMATIONS.fadeIn }}
          className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">EvoluciÃ³n Temporal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ãšltimos 12 meses</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData.temporalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="mes"
                fontSize={12}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-')
                  return `${month}/${year.slice(-2)}`
                }}
              />
              <YAxis yAxisId="contratos" orientation="left" fontSize={12} />
              <YAxis 
                yAxisId="valor" 
                orientation="right" 
                fontSize={12}
                tickFormatter={(value) => formatNumber(value, 'currency')}
              />
              <Tooltip
                formatter={(value: number, name) => {
                  if (name === 'valor') return [formatNumber(value, 'currency'), 'Valor Total']
                  return [formatNumber(value), 'Contratos']
                }}
              />
              <Legend />
              <Bar yAxisId="contratos" dataKey="contratos" fill="#10B981" name="Contratos" />
              <Line 
                yAxisId="valor" 
                type="monotone" 
                dataKey="valor" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="Valor"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 4. Top Entidades - BarChart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...ANIMATIONS.fadeIn }}
          className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Entidades</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Por valor de contratos</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.entidadesData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                type="number"
                tickFormatter={(value) => formatNumber(value, 'currency')}
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="name"
                width={150}
                fontSize={10}
              />
              <Tooltip
                formatter={(value: number) => [formatNumber(value, 'currency'), 'Valor Total']}
                labelFormatter={(label) => `Entidad: ${label}`}
              />
              <Bar dataKey="valor" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}

export default ContratosCharts

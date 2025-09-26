'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  Line
} from 'recharts'
import type { UnidadesProyectoMetrics } from '@/hooks/useUnidadesProyectoAPI'

interface UnidadesProyectoChartsProps {
  metrics: UnidadesProyectoMetrics | null
  loading: boolean
}

// Paleta de colores consistente
const COLORS = {
  primary: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
  secondary: ['#DBEAFE', '#FEE2E2', '#D1FAE5', '#FEF3C7', '#EDE9FE', '#FCE7F3', '#CFFAFE', '#ECFCCB'],
  gradient: [
    'from-blue-500 to-blue-600',
    'from-red-500 to-red-600',
    'from-green-500 to-green-600',
    'from-yellow-500 to-yellow-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-lime-500 to-lime-600'
  ]
}

// Componente de tooltip personalizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Función para formatear valores monetarios en los gráficos
const formatCurrency = (value: number) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}B`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}Mm`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value}`
}

export default function UnidadesProyectoCharts({ metrics, loading }: UnidadesProyectoChartsProps) {
  // Preparar datos para los gráficos
  const chartsData = useMemo(() => {
    if (!metrics) return null

    // Datos para distribución por tipo de intervención
    const tipoIntervencionData = Object.entries(metrics.distribuciones.porTipoIntervencion)
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8) // Top 8

    // Datos para distribución por clase de obra
    const claseObraData = Object.entries(metrics.distribuciones.porClaseObra)
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8) // Top 8

    // Datos para distribución por año
    const anoData = Object.entries(metrics.distribuciones.porAno)
      .map(([ano, cantidad]) => ({ ano, cantidad }))
      .sort((a, b) => a.ano.localeCompare(b.ano))

    // Datos para distribución por centro gestor (top 10)
    const centroGestorData = Object.entries(metrics.distribuciones.porCentroGestor)
      .map(([centro, cantidad]) => ({ 
        centro: centro.length > 20 ? centro.substring(0, 20) + '...' : centro, 
        cantidad,
        centroCompleto: centro 
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    // Datos para distribución por comunas/corregimientos (top 12)
    const comunaData = Object.entries(metrics.distribuciones.porComunaCorregimiento)
      .map(([comuna, cantidad]) => ({ comuna, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 12)

    // Datos para rangos de presupuesto
    const presupuestoRangosData = [
      { rango: 'Bajo (< $100M)', cantidad: metrics.rangosPresupuesto.bajo, color: COLORS.primary[0] },
      { rango: 'Medio ($100M - $1B)', cantidad: metrics.rangosPresupuesto.medio, color: COLORS.primary[1] },
      { rango: 'Alto (> $1B)', cantidad: metrics.rangosPresupuesto.alto, color: COLORS.primary[2] }
    ]

    // Datos para rangos de avance
    const avanceRangosData = [
      { estado: 'Sin Iniciar', cantidad: metrics.rangosAvance.sinIniciar, color: COLORS.primary[3] },
      { estado: 'En Proceso', cantidad: metrics.rangosAvance.enProceso, color: COLORS.primary[4] },
      { estado: 'Completado', cantidad: metrics.rangosAvance.completado, color: COLORS.primary[5] }
    ]

    return {
      tipoIntervencionData,
      claseObraData,
      anoData,
      centroGestorData,
      comunaData,
      presupuestoRangosData,
      avanceRangosData
    }
  }, [metrics])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!metrics || !chartsData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          No hay datos disponibles para mostrar gráficos
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Primera fila: Distribuciones principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Tipo de Intervención */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución por Tipo de Intervención
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartsData.tipoIntervencionData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="nombre" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                className="fill-gray-600 dark:fill-gray-300"
              />
              <YAxis className="fill-gray-600 dark:fill-gray-300" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" fill={COLORS.primary[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribución por Clase de Obra */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución por Clase de Obra
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartsData.claseObraData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nombre, percent }) => `${nombre}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {chartsData.claseObraData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Segunda fila: Análisis temporal y geográfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Año */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Proyectos por Año
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartsData.anoData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="ano"
                className="fill-gray-600 dark:fill-gray-300"
              />
              <YAxis className="fill-gray-600 dark:fill-gray-300" />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="cantidad" 
                stroke={COLORS.primary[2]} 
                fill={COLORS.primary[2]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Comunas/Corregimientos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Comunas/Corregimientos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartsData.comunaData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" className="fill-gray-600 dark:fill-gray-300" />
              <YAxis 
                type="category" 
                dataKey="comuna" 
                width={100}
                fontSize={11}
                className="fill-gray-600 dark:fill-gray-300"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" fill={COLORS.primary[3]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Tercera fila: Análisis de presupuesto y avance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rangos de Presupuesto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución por Rangos de Presupuesto
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartsData.presupuestoRangosData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ rango, percent }) => `${rango}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="cantidad"
              >
                {chartsData.presupuestoRangosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Estado de Avance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estado de Avance de Proyectos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartsData.avanceRangosData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="estado"
                className="fill-gray-600 dark:fill-gray-300"
              />
              <YAxis className="fill-gray-600 dark:fill-gray-300" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                {chartsData.avanceRangosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Cuarta fila: Análisis por Centro Gestor */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top 10 Centros Gestores
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartsData.centroGestorData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="centro"
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={11}
                className="fill-gray-600 dark:fill-gray-300"
              />
              <YAxis className="fill-gray-600 dark:fill-gray-300" />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900 dark:text-white">{data.centroCompleto}</p>
                        <p className="text-sm" style={{ color: payload[0].color }}>
                          Cantidad: {payload[0].value?.toLocaleString()}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="cantidad" fill={COLORS.primary[4]} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
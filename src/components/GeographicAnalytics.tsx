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
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
// Removed import of UnidadProyectoGeo as Unidades de Proyecto section was deleted
// import { type UnidadProyectoGeo } from '@/hooks/useUnidadesProyectoGeo'
import {
  TrendingUp,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react'

interface GeographicAnalyticsProps {
  unidades: any[] // Replaced UnidadProyectoGeo with any[] since the type was removed
  loading?: boolean
}

// Colores para los gráficos
const COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
]

// Función para formatear valores monetarios
const formatCurrency = (value: number): string => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export const GeographicAnalytics: React.FC<GeographicAnalyticsProps> = ({
  unidades,
  loading = false
}) => {
  // Análisis por comuna/corregimiento
  const analysisByLocation = useMemo(() => {
    const locationMap = new Map()
    
    unidades.forEach(unidad => {
      const location = unidad.comuna || unidad.corregimiento || 'Sin especificar'
      const existing = locationMap.get(location) || {
        nombre: location,
        count: 0,
        presupuesto_total: 0,
        avance_promedio: 0,
        projetos_completados: 0
      }
      
      existing.count += 1
      existing.presupuesto_total += unidad.presupuesto_base
      existing.avance_promedio += unidad.avance_obra
      if (unidad.avance_obra >= 90) existing.projetos_completados += 1
      
      locationMap.set(location, existing)
    })
    
    return Array.from(locationMap.values())
      .map(item => ({
        ...item,
        avance_promedio: (item.avance_promedio / item.count) / 100 // Convertir de 0-100 a 0-1
      }))
      .sort((a, b) => b.presupuesto_total - a.presupuesto_total)
      .slice(0, 10) // Top 10
  }, [unidades])

  // Análisis por tipo de intervención
  const analysisByType = useMemo(() => {
    const typeMap = new Map()
    
    unidades.forEach(unidad => {
      const type = unidad.tipo_intervencion
      const existing = typeMap.get(type) || {
        tipo: type,
        count: 0,
        presupuesto_total: 0,
        avance_promedio: 0
      }
      
      existing.count += 1
      existing.presupuesto_total += unidad.presupuesto_base
      existing.avance_promedio += unidad.avance_obra
      
      typeMap.set(type, existing)
    })
    
    return Array.from(typeMap.values())
      .map(item => ({
        ...item,
        avance_promedio: (item.avance_promedio / item.count) / 100 // Convertir de 0-100 a 0-1
      }))
      .sort((a, b) => b.count - a.count)
  }, [unidades])

  // Análisis temporal por año
  const analysisByYear = useMemo(() => {
    const yearMap = new Map()
    
    unidades.forEach(unidad => {
      const year = unidad.ano
      const existing = yearMap.get(year) || {
        ano: year,
        count: 0,
        presupuesto_total: 0,
        avance_promedio: 0,
        completados: 0
      }
      
      existing.count += 1
      existing.presupuesto_total += unidad.presupuesto_base
      existing.avance_promedio += unidad.avance_obra
      if (unidad.avance_obra >= 90) existing.completados += 1
      
      yearMap.set(year, existing)
    })
    
    return Array.from(yearMap.values())
      .map(item => ({
        ...item,
        avance_promedio: (item.avance_promedio / item.count) / 100, // Convertir de 0-100 a 0-1
        tasa_completado: (item.completados / item.count) * 100
      }))
      .sort((a, b) => a.ano.localeCompare(b.ano))
  }, [unidades])

  // Análisis por rangos de avance
  const analysisByProgress = useMemo(() => {
    const ranges = [
      { name: 'Sin Avance (0%)', min: 0, max: 0, count: 0 },
      { name: 'Inicial (1-25%)', min: 1, max: 25, count: 0 },
      { name: 'En Progreso (26-50%)', min: 26, max: 50, count: 0 },
      { name: 'Avanzado (51-75%)', min: 51, max: 75, count: 0 },
      { name: 'Casi Completo (76-99%)', min: 76, max: 99, count: 0 },
      { name: 'Completado (100%)', min: 100, max: 100, count: 0 }
    ]
    
    unidades.forEach(unidad => {
      const avance = unidad.avance_obra
      ranges.forEach(range => {
        if (avance >= range.min && avance <= range.max) {
          range.count += 1
        }
      })
    })
    
    return ranges.filter(range => range.count > 0)
  }, [unidades])

  // Métricas resumidas
  const metrics = useMemo(() => {
    const totalUnidades = unidades.length
    const totalPresupuesto = unidades.reduce((sum, u) => sum + u.presupuesto_base, 0)
    const promedioAvance = totalUnidades > 0 ? (unidades.reduce((sum, u) => sum + u.avance_obra, 0) / totalUnidades) / 100 : 0 // Convertir de 0-100 a 0-1
    const unidadesCompletadas = unidades.filter(u => u.avance_obra >= 90).length
    const tasaCompletado = totalUnidades > 0 ? (unidadesCompletadas / totalUnidades) * 100 : 0
    
    return {
      totalUnidades,
      totalPresupuesto,
      promedioAvance,
      unidadesCompletadas,
      tasaCompletado
    }
  }, [unidades])

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Unidades</p>
              <p className="text-2xl font-bold">{metrics.totalUnidades.toLocaleString()}</p>
            </div>
            <Building className="w-8 h-8 text-emerald-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Presupuesto Total</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalPresupuesto)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avance Promedio</p>
              <p className="text-2xl font-bold">{metrics.promedioAvance.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Tasa Completado</p>
              <p className="text-2xl font-bold">{metrics.tasaCompletado.toFixed(1)}%</p>
            </div>
            <Activity className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>
      </div>

      {/* Gráficos de Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis por Ubicación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            Top 10 Ubicaciones por Presupuesto
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisByLocation}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="nombre" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis tickFormatter={formatCurrency} fontSize={12} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'presupuesto_total' ? formatCurrency(value as number) : value,
                  name === 'presupuesto_total' ? 'Presupuesto' : 
                  name === 'count' ? 'Proyectos' : 'Avance Promedio'
                ]}
              />
              <Bar dataKey="presupuesto_total" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Análisis por Tipo de Intervención */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            Distribución por Tipo de Intervención
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysisByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tipo, percent }) => `${tipo}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analysisByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Análisis Temporal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            Evolución Temporal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analysisByYear}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="ano" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'presupuesto_total' ? formatCurrency(value as number) : 
                  name === 'tasa_completado' ? `${(value as number).toFixed(1)}%` : value,
                  name === 'count' ? 'Proyectos' : 
                  name === 'presupuesto_total' ? 'Presupuesto' : 'Tasa Completado'
                ]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="tasa_completado"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Análisis por Rangos de Avance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            Distribución por Avance de Obra
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisByProgress} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" width={120} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {analysisByProgress.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}

export default GeographicAnalytics
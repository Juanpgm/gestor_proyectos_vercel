'use client'

import React, { useState } from 'react'
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
  Line
} from 'recharts'
import { Folder, Calendar, TrendingUp, Users } from 'lucide-react'

interface ProjectsChartProps {
  className?: string
}

const ProjectsChart: React.FC<ProjectsChartProps> = ({ className = '' }) => {
  const [viewType, setViewType] = useState<'status' | 'comuna' | 'timeline'>('status')

  // Datos por estado de proyectos
  const statusData = [
    { name: 'En Ejecución', value: 148, color: '#3B82F6' },
    { name: 'Planificación', value: 87, color: '#F59E0B' },
    { name: 'Completados', value: 234, color: '#10B981' },
    { name: 'Suspendidos', value: 12, color: '#EF4444' },
    { name: 'En Evaluación', value: 28, color: '#8B5CF6' }
  ]

  // Datos por comuna
  const comunaData = [
    { comuna: 'Comuna 1', proyectos: 28, beneficiarios: 15420 },
    { comuna: 'Comuna 2', proyectos: 32, beneficiarios: 18700 },
    { comuna: 'Comuna 3', proyectos: 24, beneficiarios: 12300 },
    { comuna: 'Comuna 4', proyectos: 35, beneficiarios: 21500 },
    { comuna: 'Comuna 5', proyectos: 29, beneficiarios: 16800 },
    { comuna: 'Comuna 6', proyectos: 31, beneficiarios: 19200 },
    { comuna: 'Comuna 7', proyectos: 22, beneficiarios: 11900 },
    { comuna: 'Comuna 8', proyectos: 26, beneficiarios: 14600 }
  ]

  // Datos de timeline
  const timelineData = [
    { mes: 'Ene', iniciados: 12, completados: 8, planificados: 15 },
    { mes: 'Feb', iniciados: 15, completados: 11, planificados: 18 },
    { mes: 'Mar', iniciados: 18, completados: 14, planificados: 22 },
    { mes: 'Abr', iniciados: 22, completados: 16, planificados: 25 },
    { mes: 'May', iniciados: 25, completados: 19, planificados: 28 },
    { mes: 'Jun', iniciados: 28, completados: 22, planificados: 30 },
    { mes: 'Jul', iniciados: 30, completados: 25, planificados: 32 },
    { mes: 'Ago', iniciados: 32, completados: 28, planificados: 35 }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'beneficiarios' && ' beneficiarios'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    switch (viewType) {
      case 'status':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'comuna':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comunaData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="comuna" 
                className="text-sm text-gray-600 dark:text-gray-400"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-sm text-gray-600 dark:text-gray-400" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="proyectos" fill="#3B82F6" name="Proyectos" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'timeline':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="mes" className="text-sm text-gray-600 dark:text-gray-400" />
              <YAxis className="text-sm text-gray-600 dark:text-gray-400" />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="iniciados" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Iniciados"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="completados" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Completados"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="planificados" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="Planificados"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getSummaryStats = () => {
    switch (viewType) {
      case 'status':
        return [
          {
            label: 'Total Proyectos',
            value: statusData.reduce((sum, item) => sum + item.value, 0),
            icon: <Folder className="w-5 h-5 text-blue-500" />
          },
          {
            label: 'Activos',
            value: statusData.find(item => item.name === 'En Ejecución')?.value || 0,
            icon: <TrendingUp className="w-5 h-5 text-green-500" />
          },
          {
            label: 'Completados',
            value: statusData.find(item => item.name === 'Completados')?.value || 0,
            icon: <Calendar className="w-5 h-5 text-purple-500" />
          }
        ]

      case 'comuna':
        return [
          {
            label: 'Comunas Atendidas',
            value: comunaData.length,
            icon: <Folder className="w-5 h-5 text-blue-500" />
          },
          {
            label: 'Proyectos Totales',
            value: comunaData.reduce((sum, item) => sum + item.proyectos, 0),
            icon: <TrendingUp className="w-5 h-5 text-green-500" />
          },
          {
            label: 'Beneficiarios',
            value: comunaData.reduce((sum, item) => sum + item.beneficiarios, 0).toLocaleString(),
            icon: <Users className="w-5 h-5 text-purple-500" />
          }
        ]

      case 'timeline':
        const lastMonth = timelineData[timelineData.length - 1]
        return [
          {
            label: 'Iniciados (Ago)',
            value: lastMonth.iniciados,
            icon: <TrendingUp className="w-5 h-5 text-blue-500" />
          },
          {
            label: 'Completados (Ago)',
            value: lastMonth.completados,
            icon: <Calendar className="w-5 h-5 text-green-500" />
          },
          {
            label: 'Planificados (Ago)',
            value: lastMonth.planificados,
            icon: <Folder className="w-5 h-5 text-orange-500" />
          }
        ]
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Análisis de Proyectos
            </h3>
            <Folder className="text-blue-500 w-5 h-5" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {viewType === 'status' && 'Estado actual de todos los proyectos'}
            {viewType === 'comuna' && 'Distribución de proyectos por comuna'}
            {viewType === 'timeline' && 'Evolución temporal de proyectos'}
          </p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg">
          {[
            { type: 'status' as const, label: 'Estados' },
            { type: 'comuna' as const, label: 'Comunas' },
            { type: 'timeline' as const, label: 'Timeline' }
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewType === type
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {getSummaryStats().map((stat, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80">
        {renderChart()}
      </div>

      {/* Legend for Timeline Chart */}
      {viewType === 'timeline' && (
        <div className="flex justify-center mt-4 space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Iniciados</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Completados</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Planificados</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ProjectsChart
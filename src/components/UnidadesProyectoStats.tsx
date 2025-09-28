'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  TrendingUp, 
  MapPin, 
  DollarSign,
  Users,
  Calendar,
  Activity,
  BarChart3
} from 'lucide-react'
import type { UnidadesProyectoMetrics } from '@/data/mockUnidadesProyecto'

interface UnidadesProyectoStatsProps {
  metrics: UnidadesProyectoMetrics | null
  loading: boolean
}

// Función para formatear valores monetarios
function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}B` // Billones
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}Mm` // Miles de millones
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M` // Millones
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K` // Miles
  return `$${value.toLocaleString()}`
}

// Función para formatear porcentajes
function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

const STAGGER_CHILDREN = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function UnidadesProyectoStats({ metrics, loading }: UnidadesProyectoStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          No hay datos disponibles para mostrar métricas
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Unidades',
      value: metrics.totalUnidades.toLocaleString(),
      icon: Building2,
      color: 'blue',
      description: 'Unidades de proyecto activas'
    },
    {
      title: 'Proyectos Únicos (BPIN)',
      value: metrics.bpinsUnicos.toLocaleString(),
      icon: MapPin,
      color: 'green',
      description: 'Códigos BPIN únicos registrados'
    },
    {
      title: 'Valor Total Proyectos',
      value: formatCurrency(metrics.valorTotalProyectos),
      icon: DollarSign,
      color: 'yellow',
      description: 'Inversión total programada'
    },
    {
      title: 'Valor Promedio',
      value: formatCurrency(metrics.valorPromedioPorProyecto),
      icon: TrendingUp,
      color: 'purple',
      description: 'Inversión promedio por proyecto'
    },
    {
      title: 'Avance Promedio',
      value: formatPercentage(metrics.avancePromedioObra),
      icon: Activity,
      color: 'indigo',
      description: 'Progreso promedio de obra'
    },
    {
      title: 'Presupuesto Alto',
      value: metrics.rangosPresupuesto.alto.toLocaleString(),
      icon: BarChart3,
      color: 'red',
      description: 'Proyectos > $1.000M'
    },
    {
      title: 'Proyectos Completados',
      value: metrics.rangosAvance.completado.toLocaleString(),
      icon: Users,
      color: 'emerald',
      description: 'Obras finalizadas al 100%'
    },
    {
      title: 'En Proceso',
      value: metrics.rangosAvance.enProceso.toLocaleString(),
      icon: Calendar,
      color: 'orange',
      description: 'Proyectos en ejecución'
    }
  ]

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800'
    }
  } as const

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={STAGGER_CHILDREN}
      initial="hidden"
      animate="visible"
    >
      {statsCards.map((card, index) => {
        const Icon = card.icon
        const colors = colorClasses[card.color as keyof typeof colorClasses]
        
        return (
          <motion.div
            key={card.title}
            variants={ANIMATION_VARIANTS}
            className={`
              bg-white dark:bg-gray-800 rounded-xl p-6 
              border ${colors.border}
              shadow-sm hover:shadow-md transition-all duration-300
              hover:scale-105 cursor-pointer
            `}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`
                p-2 rounded-lg ${colors.bg}
              `}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                #{index + 1}
              </span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </h3>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {card.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {card.description}
              </p>
            </div>

            {/* Indicador visual adicional */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-1">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`w-1.5 h-1.5 rounded-full ${colors.icon.replace('text-', 'bg-')}`}
                  />
                ))}
              </div>
              <TrendingUp className={`w-3 h-3 ${colors.icon} opacity-50`} />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
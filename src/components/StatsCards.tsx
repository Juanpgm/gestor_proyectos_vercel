'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FolderOpen, 
  Package, 
  ShoppingCart, 
  Activity,
  FileText,
  DollarSign
} from 'lucide-react'
import { useDashboardStats } from '@/context/DashboardContext'
import { useFilteredStats } from '@/hooks/useDataFilters'
import { formatCurrency } from '../utils/formatCurrency'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  index: number
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  index,
  loading = false
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatValue = (val: string | number) => {
    if (!mounted || loading) {
      return '...'
    }
    
    if (typeof val === 'number') {
      return val.toLocaleString('es-CO', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      }).replace(/,/g, '.')
    }
    
    return val
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 min-h-[130px]"
    >
      <div className="flex flex-col h-full">
        {/* Header con ícono */}
        <div className="flex justify-center mb-3">
          <div className={`p-2.5 rounded-lg ${color} shadow-md`}>
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-5 h-5 text-white'
            })}
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Título */}
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 leading-tight text-center">
            {title}
          </p>
          {/* Cifra principal */}
          <p className={`text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center ${loading ? 'animate-pulse' : ''}`}>
            {formatValue(value)}
          </p>
          {/* Subtítulo */}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight text-center line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const StatsCards: React.FC = () => {
  // Llamada al hook en el nivel superior para respetar las reglas de Hooks
  const { stats, loading, error } = useFilteredStats()

  try {
    if (error) {
      console.warn('Error en useFilteredStats:', error)
      // Mostrar datos en 0 si hay error, sin fallback mock
      const emptyStats = {
        totalProyectos: 0,
        totalUnidadesProyecto: 0,
        totalProductos: 0,
        totalActividades: 0,
        totalContratos: 0
      }
      return renderStatsCards(emptyStats, false, error)
    }

    return renderStatsCards(stats, loading, error)
  } catch (err) {
    console.warn('Error en StatsCards:', err)
    // Mostrar datos en 0 si hay error, sin fallback mock
    const emptyStats = {
      totalProyectos: 0,
      totalUnidadesProyecto: 0,
      totalProductos: 0,
      totalActividades: 0,
      totalContratos: 0
    }
    return renderStatsCards(emptyStats, false, err)
  }
}

// Función auxiliar para renderizar las cards
function renderStatsCards(stats: any, loading: boolean, error: any) {

  // Función para formatear porcentajes (mantenida para compatibilidad futura)
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  // Configuración de las tarjetas con datos dinámicos
  const statsData = [
    {
      title: 'Proyectos',
      value: stats ? stats.totalProyectos : 0,
      subtitle: 'Proyectos que coinciden con los filtros aplicados',
      icon: <FolderOpen className="w-6 h-6 text-white" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Unidades de Proyecto',
      value: stats ? stats.totalUnidadesProyecto : 0,
      subtitle: 'Equipamientos e infraestructura vial',
      icon: <Package className="w-6 h-6 text-white" />,
      color: 'bg-green-500'
    },
    {
      title: 'Productos',
      value: stats ? stats.totalProductos : 0,
      subtitle: 'Productos del seguimiento del plan de acción',
      icon: <ShoppingCart className="w-6 h-6 text-white" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Actividades',
      value: stats ? stats.totalActividades : 0,
      subtitle: 'Actividades del seguimiento del plan de acción',
      icon: <Activity className="w-6 h-6 text-white" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Contratos',
      value: stats ? stats.totalContratos : 0,
      subtitle: 'Contratos registrados en el sistema',
      icon: <FileText className="w-6 h-6 text-white" />,
      color: 'bg-teal-500'
    }
  ]

  // Mostrar error si hay problema cargando las estadísticas
  if (error) {
    console.warn('Error cargando estadísticas del dashboard:', error)
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {statsData.map((stat, index) => (
        <StatCard 
          key={stat.title} 
          {...stat} 
          index={index} 
          loading={loading}
        />
      ))}
    </div>
  )
}

export default StatsCards
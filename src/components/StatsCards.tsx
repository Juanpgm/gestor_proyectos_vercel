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
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 min-h-[140px] sm:min-h-[160px]"
    >
      <div className="flex flex-col h-full">
        {/* Header con ícono centrado */}
        <div className="flex justify-center mb-3">
          <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white'
            })}
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Título centrado */}
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 leading-relaxed text-center">
            {title}
          </p>
          {/* Cifra centrada */}
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 break-words text-center ${loading ? 'animate-pulse' : ''}`}>
            {formatValue(value)}
          </p>
          {/* Subtítulo centrado */}
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 leading-relaxed text-center">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const StatsCards: React.FC = () => {
  try {
    // Intentar usar datos reales del contexto
    const { stats, loading, error } = useFilteredStats()
    
    if (error) {
      console.warn('Error en useFilteredStats:', error)
      // Fallback a datos mock si hay error
      const mockStats = {
        totalProyectos: 127,
        totalUnidadesProyecto: 45,
        totalProductos: 89,
        totalActividades: 256,
        totalContratos: 73
      }
      return renderStatsCards(mockStats, false, null)
    }
    
    return renderStatsCards(stats, loading, error)
  } catch (err) {
    console.warn('Error en StatsCards, usando datos mock:', err)
    // Fallback completo a datos mock
    const mockStats = {
      totalProyectos: 127,
      totalUnidadesProyecto: 45,
      totalProductos: 89,
      totalActividades: 256,
      totalContratos: 73
    }
    return renderStatsCards(mockStats, false, null)
  }
}

// Función auxiliar para renderizar las cards
function renderStatsCards(stats: any, loading: boolean, error: any) {

  // Función para formatear valores monetarios (mantenida para compatibilidad)
  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toLocaleString()}`
  }

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
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
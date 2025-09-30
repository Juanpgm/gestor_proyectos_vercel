'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  BarChart3,
  Target,
  Activity,
  DollarSign,
  Layers,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import ModernBudgetAnalysis from './ModernBudgetAnalysis'
import dynamic from 'next/dynamic'

import { useDataContext } from '../context/DataContext'
import { formatCurrencyCompact } from '../utils/formatCurrency'

interface IntegratedAnalysisProps {
  className?: string
}

type ViewMode = 'budget'

const IntegratedAnalysisDashboard: React.FC<IntegratedAnalysisProps> = ({
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('budget')
  const [selectedComuna, setSelectedComuna] = useState<string | null>(null)
  const { filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = useDataContext()

  // Procesar métricas rápidas para overlay
  const quickMetrics = useMemo(() => {
    if (!filteredMovimientosPresupuestales || !filteredEjecucionPresupuestal) {
      return {
        totalPresupuesto: 0,
        totalEjecucion: 0,
        totalPagos: 0,
        eficiencia: 0
      }
    }

    // Obtener valores más recientes
    const latestMovimientos = filteredMovimientosPresupuestales.reduce((latest, item) => {
      return item.periodo_corte > latest.periodo_corte ? item : latest
    }, filteredMovimientosPresupuestales[0])

    const latestEjecucion = filteredEjecucionPresupuestal.reduce((latest, item) => {
      return item.periodo_corte > latest.periodo_corte ? item : latest
    }, filteredEjecucionPresupuestal[0])

    // Sumar todos los valores del período más reciente
    const totalPresupuesto = filteredMovimientosPresupuestales
      .filter(item => item.periodo_corte === latestMovimientos?.periodo_corte)
      .reduce((sum, item) => sum + (item.ppto_modificado || 0), 0)

    const totalEjecucion = filteredEjecucionPresupuestal
      .filter(item => item.periodo_corte === latestEjecucion?.periodo_corte)
      .reduce((sum, item) => sum + (item.ejecucion || 0), 0)

    const totalPagos = filteredEjecucionPresupuestal
      .filter(item => item.periodo_corte === latestEjecucion?.periodo_corte)
      .reduce((sum, item) => sum + (item.pagos || 0), 0)

    const eficiencia = totalPresupuesto > 0 ? (totalEjecucion / totalPresupuesto) * 100 : 0

    return {
      totalPresupuesto,
      totalEjecucion,
      totalPagos,
      eficiencia
    }
  }, [filteredMovimientosPresupuestales, filteredEjecucionPresupuestal])

  const QuickMetric: React.FC<{
    title: string
    value: number | string
    icon: React.ElementType
    trend?: 'up' | 'down' | 'neutral'
    color: string
  }> = ({ title, value, icon: Icon, trend, color }) => (
    <motion.div
      className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {typeof value === 'number' ? formatCurrencyCompact(value) : value}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {title}
            </p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' ? 'bg-green-100 text-green-700' :
            trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
          </div>
        )}
      </div>
    </motion.div>
  )

  const viewModes = [
    { id: 'budget', name: 'Presupuesto', icon: BarChart3, description: 'Análisis presupuestal completo' }
  ]

  const renderContent = () => {
    return (
      <div className="h-full">
        <ModernBudgetAnalysis height="600px" showControls={true} />
      </div>
    )
  }

  return (
    <motion.div 
      className={`space-y-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header con selector de modo de vista */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard Integrado
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Análisis presupuestal y geográfico unificado
              </p>
            </div>
          </div>
          
          {/* Selector de modo de vista */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === mode.id
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title={mode.description}
              >
                <mode.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{mode.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal con transiciones suaves */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="min-h-[600px]"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default IntegratedAnalysisDashboard

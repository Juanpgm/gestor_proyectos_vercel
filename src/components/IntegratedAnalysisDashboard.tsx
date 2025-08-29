'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Map as MapIcon, 
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
import ChoroplethMapInteractive from './ChoroplethMapInteractive'
import { useDataContext } from '../context/DataContext'
import { formatCurrencyCompact } from '../utils/formatCurrency'

interface IntegratedAnalysisProps {
  className?: string
}

type ViewMode = 'split' | 'budget' | 'map' | 'overlay'

const IntegratedAnalysisDashboard: React.FC<IntegratedAnalysisProps> = ({
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split')
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
    { id: 'split', name: 'División', icon: Layers, description: 'Vista lado a lado' },
    { id: 'budget', name: 'Presupuesto', icon: BarChart3, description: 'Solo análisis presupuestal' },
    { id: 'map', name: 'Mapa', icon: MapIcon, description: 'Solo vista geográfica' },
    { id: 'overlay', name: 'Integrado', icon: Target, description: 'Métricas sobre mapa' }
  ]

  const renderContent = () => {
    switch (viewMode) {
      case 'split':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Análisis Presupuestal
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tendencias financieras municipales
                    </p>
                  </div>
                </div>
                <ModernBudgetAnalysis height="400px" showControls={true} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <MapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Vista Geográfica
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Distribución territorial de proyectos
                    </p>
                  </div>
                </div>
                <ChoroplethMapInteractive height="400px" showControls={true} />
              </div>
            </div>
          </div>
        )

      case 'budget':
        return (
          <div className="h-full">
            <ModernBudgetAnalysis height="600px" showControls={true} />
          </div>
        )

      case 'map':
        return (
          <div className="h-full">
            <ChoroplethMapInteractive height="600px" showControls={true} />
          </div>
        )

      case 'overlay':
        return (
          <div className="relative h-full">
            <ChoroplethMapInteractive height="600px" showControls={true} />
            
            {/* Overlay de métricas */}
            <div className="absolute top-4 left-4 z-[1000] space-y-3 max-w-sm">
              <QuickMetric
                title="Presupuesto Total"
                value={quickMetrics.totalPresupuesto}
                icon={DollarSign}
                trend="neutral"
                color="bg-blue-500"
              />
              
              <QuickMetric
                title="Ejecutado"
                value={quickMetrics.totalEjecucion}
                icon={Target}
                trend={quickMetrics.eficiencia > 70 ? 'up' : quickMetrics.eficiencia > 40 ? 'neutral' : 'down'}
                color="bg-green-500"
              />
              
              <QuickMetric
                title="Eficiencia"
                value={`${quickMetrics.eficiencia.toFixed(1)}%`}
                icon={Activity}
                trend={quickMetrics.eficiencia > 70 ? 'up' : quickMetrics.eficiencia > 40 ? 'neutral' : 'down'}
                color="bg-purple-500"
              />
            </div>

            {/* Mini gráfico flotante en la esquina inferior derecha */}
            <motion.div
              className="absolute bottom-4 right-4 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50 max-w-xs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Tendencia Rápida
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Pagos</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrencyCompact(quickMetrics.totalPagos)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((quickMetrics.totalPagos / quickMetrics.totalEjecucion) * 100, 100)}%` 
                    }}
                  />
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {quickMetrics.totalEjecucion > 0 ? 
                    `${((quickMetrics.totalPagos / quickMetrics.totalEjecucion) * 100).toFixed(1)}% de lo ejecutado` : 
                    'Sin datos de ejecución'}
                </p>
              </div>
            </motion.div>
          </div>
        )

      default:
        return null
    }
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

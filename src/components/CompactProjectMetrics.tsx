'use client'

import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, CheckCircle, Clock, AlertTriangle, Pause, Search } from 'lucide-react'
import { BudgetExecutionGauge } from './GaugeChart'

interface CompactProjectMetricsProps {
  data: any[]
  className?: string
}

// Colores y iconos para los estados
const STATE_CONFIG = {
  'En Ejecución': { color: '#10B981', icon: TrendingUp },
  'Completado': { color: '#059669', icon: CheckCircle },
  'Planificación': { color: '#3B82F6', icon: Clock },
  'Suspendido': { color: '#EF4444', icon: Pause },
  'En Evaluación': { color: '#F59E0B', icon: Search }
}

const CompactProjectMetrics: React.FC<CompactProjectMetricsProps> = ({ 
  data, 
  className = '' 
}) => {
  
  // Calcular métricas consolidadas
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalProjects: 0,
        averageProgress: 0,
        statusData: [],
        progressData: [],
        budgetExecuted: 0,
        totalBudget: 0,
        uniqueCentrosGestores: 0,
        budgetExecutionPercentage: 0
      }
    }

    // Métricas básicas
    const totalProjects = data.length
    const validProgress = data.filter(item => typeof item.progress === 'number' && item.progress >= 0 && item.progress <= 100)
    const averageProgress = validProgress.length > 0 
      ? validProgress.reduce((sum, item) => sum + item.progress, 0) / validProgress.length 
      : 0

    // Contar centros gestores únicos
    const centrosGestoresSet = new Set<string>()
    data.forEach(item => {
      const centroGestor = item.responsible || item.centro_gestor || item.nombre_centro_gestor
      if (centroGestor && centroGestor.trim() !== '' && centroGestor !== 'No especificado') {
        centrosGestoresSet.add(centroGestor.trim())
      }
    })
    const uniqueCentrosGestores = centrosGestoresSet.size

    // Contar por estados
    const statusMap = new Map<string, number>()
    data.forEach(item => {
      if (item.status) {
        statusMap.set(item.status, (statusMap.get(item.status) || 0) + 1)
      }
    })

    const statusData = Array.from(statusMap.entries()).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATE_CONFIG[status as keyof typeof STATE_CONFIG]?.color || '#6B7280',
      percentage: Math.round((count / totalProjects) * 100)
    })).filter(item => item.value > 0)

    // Métricas presupuestales
    const totalBudget = data.reduce((sum, item) => sum + (item.budget || 0), 0)
    const budgetExecuted = data.reduce((sum, item) => sum + (item.executed || 0), 0)
    const budgetExecutionPercentage = totalBudget > 0 ? (budgetExecuted / totalBudget) * 100 : 0

    // Datos de progreso para mini gauge - usar ejecución presupuestal
    const progressData = [
      { name: 'Ejecutado', value: budgetExecutionPercentage, color: budgetExecutionPercentage >= 75 ? '#059669' : budgetExecutionPercentage >= 50 ? '#10B981' : budgetExecutionPercentage >= 25 ? '#F59E0B' : '#EF4444' },
      { name: 'Pendiente', value: 100 - budgetExecutionPercentage, color: '#E5E7EB' }
    ]

    return {
      totalProjects,
      averageProgress: Math.round(averageProgress),
      statusData,
      progressData,
      budgetExecuted,
      totalBudget,
      uniqueCentrosGestores,
      budgetExecutionPercentage: Math.round(budgetExecutionPercentage)
    }
  }, [data])

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.value} proyecto{data.value !== 1 ? 's' : ''} ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Función para formatear montos
  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${amount.toFixed(0)}`
  }

  if (metrics.totalProjects === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay proyectos disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4 ${className}`}>
      
      {/* Header con resumen */}
      <div className="border-b pb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard Proyectos</h3>
        <p className="text-base text-gray-600 dark:text-gray-400">
          {metrics.totalProjects} proyectos • {metrics.averageProgress}% progreso promedio
        </p>
      </div>

      {/* Fila superior - Métricas principales */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Mini gauge de ejecución presupuestal */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Ejecución Presupuestal</h4>
          <div className="flex justify-center">
            <BudgetExecutionGauge 
              value={metrics.budgetExecutionPercentage} 
              size="small"
            />
          </div>
        </div>

        {/* Resumen presupuestal */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Presupuesto</h4>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Centros Gestores:</span>
              <span className="font-medium text-gray-800 dark:text-white text-base">
                {metrics.uniqueCentrosGestores}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Ejecutado:</span>
              <span className="font-medium text-green-600 text-base">
                {formatCurrency(metrics.budgetExecuted)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((metrics.budgetExecuted / metrics.totalBudget) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estados de proyectos */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Estados de Proyectos</h4>
        
        {/* Gráfico de estados */}
        <div className="flex items-center gap-5">
          
          {/* Mini pie chart */}
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={50}
                  dataKey="value"
                  stroke="none"
                >
                  {metrics.statusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de estados */}
          <div className="flex-1 space-y-1.5">
            {metrics.statusData.slice(0, 4).map((status) => {
              const IconComponent = STATE_CONFIG[status.name as keyof typeof STATE_CONFIG]?.icon || Clock
              return (
                <div key={status.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <IconComponent className="w-4 h-4 flex-shrink-0" style={{ color: status.color }} />
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 break-words">
                      {status.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {status.value}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({status.percentage}%)
                    </span>
                  </div>
                </div>
              )
            })}
            {metrics.statusData.length > 4 && (
              <div className="text-sm text-gray-500 text-center pt-1">
                +{metrics.statusData.length - 4} más...
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export default CompactProjectMetrics

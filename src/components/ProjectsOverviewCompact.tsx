'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useDataContext } from '../context/DataContext'
import { formatCurrency } from '../utils/formatCurrency'

interface ProjectsOverviewCompactProps {
  className?: string
}

const ProjectsOverviewCompact: React.FC<ProjectsOverviewCompactProps> = ({ className = '' }) => {
  const dataContext = useDataContext()
  const { proyectos, filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = dataContext

  // Procesar datos de proyectos y presupuesto
  const projectsMetrics = useMemo(() => {
    if (!proyectos || proyectos.length === 0) {
      return {
        total: 0,
        byState: [],
        totalPptoModificado: 0,
        totalEjecucion: 0,
        ejecutionPercentage: 0,
        avgDuration: 0
      }
    }

    // Agrupar por estado
    const stateGroups: { [key: string]: number } = {}
    let totalDuration = 0
    let projectsWithDuration = 0

    proyectos.forEach((project: any) => {
      const state = project.estado_proyecto || 'Sin estado'
      stateGroups[state] = (stateGroups[state] || 0) + 1
      
      // Calcular duración si hay fechas
      if (project.fecha_inicio && project.fecha_fin) {
        const start = new Date(project.fecha_inicio)
        const end = new Date(project.fecha_fin)
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) // días
        totalDuration += duration
        projectsWithDuration++
      }
    })

    // Calcular totales presupuestales usando valores del período más reciente
    let totalPptoModificado = 0
    let totalEjecucion = 0

    // Obtener los valores del período más reciente para movimientos presupuestales
    if (filteredMovimientosPresupuestales && filteredMovimientosPresupuestales.length > 0) {
      // Encontrar el período más reciente en los datos filtrados
      const latestPeriod = filteredMovimientosPresupuestales.reduce((latest, item) => {
        return item.periodo_corte > latest ? item.periodo_corte : latest
      }, '1900-01-01')
      
      // Filtrar solo los registros del período más reciente
      const latestPeriodData = filteredMovimientosPresupuestales.filter(item => item.periodo_corte === latestPeriod)
      
      // Sumar todos los valores del período más reciente
      latestPeriodData.forEach((movimiento: any) => {
        totalPptoModificado += movimiento.ppto_modificado || 0
      })
    }

    // Obtener los valores del período más reciente para ejecución presupuestal
    if (filteredEjecucionPresupuestal && filteredEjecucionPresupuestal.length > 0) {
      // Encontrar el período más reciente en los datos filtrados
      const latestPeriod = filteredEjecucionPresupuestal.reduce((latest, item) => {
        return item.periodo_corte > latest ? item.periodo_corte : latest
      }, '1900-01-01')
      
      // Filtrar solo los registros del período más reciente
      const latestPeriodData = filteredEjecucionPresupuestal.filter(item => item.periodo_corte === latestPeriod)
      
      // Sumar todos los valores del período más reciente
      latestPeriodData.forEach((ejecucion: any) => {
        totalEjecucion += ejecucion.ejecucion || 0
      })
    }

    const ejecutionPercentage = totalPptoModificado > 0 ? (totalEjecucion / totalPptoModificado) * 100 : 0

    const byState = Object.entries(stateGroups).map(([state, count]) => ({
      name: state,
      value: count,
      percentage: ((count / proyectos.length) * 100).toFixed(1)
    }))

    return {
      total: proyectos.length,
      byState,
      totalPptoModificado,
      totalEjecucion,
      ejecutionPercentage,
      avgDuration: projectsWithDuration > 0 ? totalDuration / projectsWithDuration : 0
    }
  }, [proyectos, filteredMovimientosPresupuestales, filteredEjecucionPresupuestal])

  return (
    <motion.div 
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-3 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between">
        {/* Stats rápidas */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total</div>
            <div className="text-lg font-bold text-blue-600">
              {projectsMetrics.total}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Presupuesto Actual</div>
            <div className="text-sm font-bold text-green-600">
              {formatCurrency(projectsMetrics.totalPptoModificado)}
            </div>
          </div>
          {projectsMetrics.avgDuration > 0 && (
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Duración Prom.</div>
              <div className="text-sm font-bold text-purple-600">
                {Math.round(projectsMetrics.avgDuration)}d
              </div>
            </div>
          )}
        </div>

        {/* Círculo de progreso de ejecución */}
        <div className="w-16 h-12 flex items-center justify-center">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-gray-200 dark:stroke-gray-700"
                fill="none"
                strokeWidth="3"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-blue-600"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${projectsMetrics.ejecutionPercentage * 0.8}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {Math.round(projectsMetrics.ejecutionPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProjectsOverviewCompact

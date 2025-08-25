'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Calendar } from 'lucide-react'
import { Actividad } from '@/hooks/useActividades'

interface ActividadesChartsProps {
  actividades: Actividad[]
  loading?: boolean
}

export default function ActividadesCharts({ actividades, loading = false }: ActividadesChartsProps) {
  // Análisis por período
  const porPeriodo = useMemo(() => {
    const grupos = actividades.reduce((acc, actividad) => {
      const periodo = actividad.periodo_corte || 'Sin período'
      if (!acc[periodo]) {
        acc[periodo] = {
          total: 0,
          completadas: 0,
          enProgreso: 0,
          noIniciadas: 0,
          presupuesto: 0
        }
      }
      
      acc[periodo].total++
      acc[periodo].presupuesto += actividad.ppto_modificado_actividad
      
      if (actividad.avance_actividad === 1) {
        acc[periodo].completadas++
      } else if (actividad.avance_actividad > 0) {
        acc[periodo].enProgreso++
      } else {
        acc[periodo].noIniciadas++
      }
      
      return acc
    }, {} as Record<string, any>)
    
    return Object.entries(grupos).map(([periodo, datos]) => ({
      periodo,
      ...datos
    })).sort((a, b) => a.periodo.localeCompare(b.periodo))
  }, [actividades])

  // Análisis por rango de presupuesto
  const porPresupuesto = useMemo(() => {
    const rangos = [
      { label: '0 - 50M', min: 0, max: 50000000, count: 0, color: 'bg-blue-500' },
      { label: '50M - 200M', min: 50000000, max: 200000000, count: 0, color: 'bg-green-500' },
      { label: '200M - 500M', min: 200000000, max: 500000000, count: 0, color: 'bg-yellow-500' },
      { label: '500M+', min: 500000000, max: Infinity, count: 0, color: 'bg-red-500' }
    ]
    
    actividades.forEach(actividad => {
      const presupuesto = actividad.ppto_modificado_actividad
      const rango = rangos.find(r => presupuesto >= r.min && presupuesto < r.max)
      if (rango) rango.count++
    })
    
    return rangos.filter(r => r.count > 0)
  }, [actividades])

  // Análisis por estado de avance
  const porEstado = useMemo(() => {
    const estados = [
      { label: 'Completadas', count: 0, color: 'bg-green-500' },
      { label: 'En Progreso', count: 0, color: 'bg-blue-500' },
      { label: 'No Iniciadas', count: 0, color: 'bg-gray-400' }
    ]
    
    actividades.forEach(actividad => {
      if (actividad.avance_actividad === 1) {
        estados[0].count++
      } else if (actividad.avance_actividad > 0) {
        estados[1].count++
      } else {
        estados[2].count++
      }
    })
    
    return estados
  }, [actividades])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const maxTotal = Math.max(...porPeriodo.map(p => p.total), 1)
  const maxPresupuesto = Math.max(...porPeriodo.map(p => p.presupuesto), 1)
  const maxCount = Math.max(...porPresupuesto.map(p => p.count), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Gráfico por período */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Actividades por Período
          </h3>
        </div>
        
        <div className="space-y-4">
          {porPeriodo.map((periodo, index) => (
            <div key={periodo.periodo} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {periodo.periodo}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {periodo.total} actividades
                </span>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(periodo.total / maxTotal) * 100}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="bg-blue-500 h-3 rounded-full"
                  />
                </div>
                
                {/* Desglose por estado */}
                <div className="flex mt-1 space-x-1">
                  <div 
                    className="bg-green-400 h-1 rounded"
                    style={{ width: `${periodo.total > 0 ? (periodo.completadas / periodo.total) * 100 : 0}%` }}
                    title={`${periodo.completadas} completadas`}
                  />
                  <div 
                    className="bg-yellow-400 h-1 rounded"
                    style={{ width: `${periodo.total > 0 ? (periodo.enProgreso / periodo.total) * 100 : 0}%` }}
                    title={`${periodo.enProgreso} en progreso`}
                  />
                  <div 
                    className="bg-gray-400 h-1 rounded"
                    style={{ width: `${periodo.total > 0 ? (periodo.noIniciadas / periodo.total) * 100 : 0}%` }}
                    title={`${periodo.noIniciadas} no iniciadas`}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(periodo.presupuesto)}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gráfico por rango de presupuesto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Distribución por Presupuesto
          </h3>
        </div>
        
        <div className="space-y-4">
          {porPresupuesto.map((rango, index) => (
            <div key={rango.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {rango.label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {rango.count} actividades
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(rango.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`${rango.color} h-3 rounded-full`}
                />
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {((rango.count / actividades.length) * 100).toFixed(1)}% del total
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gráfico circular por estado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Estado de Actividades
          </h3>
        </div>
        
        <div className="space-y-4">
          {porEstado.map((estado, index) => (
            <div key={estado.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${estado.color}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {estado.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {estado.count}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${actividades.length > 0 ? (estado.count / actividades.length) * 100 : 0}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`${estado.color} h-3 rounded-full`}
                />
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {actividades.length > 0 ? ((estado.count / actividades.length) * 100).toFixed(1) : 0}% del total
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export { ActividadesCharts }
export type { ActividadesChartsProps }

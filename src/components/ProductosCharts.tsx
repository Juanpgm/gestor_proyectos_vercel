'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PieChart, BarChart3, TrendingUp, Target } from 'lucide-react'
import { Producto } from '@/hooks/useProductos'

interface ProductosChartsProps {
  productos: Producto[]
  loading?: boolean
}

export default function ProductosCharts({ productos, loading = false }: ProductosChartsProps) {
  // Análisis por tipo de producto
  const porTipo = useMemo(() => {
    const grupos = productos.reduce((acc, producto) => {
      const tipo = producto.nombre_producto || 'Tipo no especificado'
      if (!acc[tipo]) {
        acc[tipo] = {
          total: 0,
          completados: 0,
          enProgreso: 0,
          noIniciados: 0,
          presupuesto: 0,
          avancePromedio: 0
        }
      }
      
      acc[tipo].total++
      acc[tipo].presupuesto += producto.ejecucion_ppto_producto
      
      const progreso = producto.cantidad_programada_producto > 0 
        ? producto.avance_producto / producto.cantidad_programada_producto 
        : 0
      
      acc[tipo].avancePromedio += progreso
      
      if (progreso >= 1) {
        acc[tipo].completados++
      } else if (progreso > 0) {
        acc[tipo].enProgreso++
      } else {
        acc[tipo].noIniciados++
      }
      
      return acc
    }, {} as Record<string, any>)
    
    return Object.entries(grupos)
      .map(([tipo, datos]) => ({
        tipo,
        ...datos,
        avancePromedio: datos.total > 0 ? datos.avancePromedio / datos.total : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6) // Top 6 tipos
  }, [productos])

  // Análisis por período
  const porPeriodo = useMemo(() => {
    const grupos = productos.reduce((acc, producto) => {
      const periodo = producto.periodo_corte || 'Sin período'
      if (!acc[periodo]) {
        acc[periodo] = {
          total: 0,
          presupuesto: 0,
          avancePromedio: 0
        }
      }
      
      acc[periodo].total++
      acc[periodo].presupuesto += producto.ejecucion_ppto_producto
      
      const progreso = producto.cantidad_programada_producto > 0 
        ? producto.avance_producto / producto.cantidad_programada_producto 
        : 0
      acc[periodo].avancePromedio += progreso
      
      return acc
    }, {} as Record<string, any>)
    
    return Object.entries(grupos).map(([periodo, datos]) => ({
      periodo,
      ...datos,
      avancePromedio: datos.total > 0 ? datos.avancePromedio / datos.total : 0
    })).sort((a, b) => a.periodo.localeCompare(b.periodo))
  }, [productos])

  // Análisis por rango de avance
  const porAvance = useMemo(() => {
    const rangos = [
      { label: '0%', min: 0, max: 0, count: 0, color: 'bg-red-500' },
      { label: '1-25%', min: 0.01, max: 0.25, count: 0, color: 'bg-orange-500' },
      { label: '26-50%', min: 0.26, max: 0.50, count: 0, color: 'bg-yellow-500' },
      { label: '51-75%', min: 0.51, max: 0.75, count: 0, color: 'bg-blue-500' },
      { label: '76-99%', min: 0.76, max: 0.99, count: 0, color: 'bg-indigo-500' },
      { label: '100%', min: 1, max: 1, count: 0, color: 'bg-green-500' }
    ]
    
    productos.forEach(producto => {
      const progreso = producto.cantidad_programada_producto > 0 
        ? producto.avance_producto / producto.cantidad_programada_producto 
        : 0
      
      const rango = rangos.find(r => progreso >= r.min && progreso <= r.max)
      if (rango) rango.count++
    })
    
    return rangos.filter(r => r.count > 0)
  }, [productos])

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

  const maxTipoTotal = Math.max(...porTipo.map(t => t.total), 1)
  const maxPeriodoTotal = Math.max(...porPeriodo.map(p => p.total), 1)
  const maxAvanceCount = Math.max(...porAvance.map(a => a.count), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Gráfico por tipo de producto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <PieChart className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Tipos de Productos
          </h3>
        </div>
        
        <div className="space-y-4">
          {porTipo.map((tipo, index) => {
            const colors = [
              'bg-purple-500', 'bg-blue-500', 'bg-green-500', 
              'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'
            ]
            
            return (
              <div key={tipo.tipo} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 pr-2">
                    {tipo.tipo}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {tipo.total}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(tipo.total / maxTipoTotal) * 100}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`${colors[index % colors.length]} h-3 rounded-full`}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Progreso: {(tipo.avancePromedio * 100).toFixed(1)}%</span>
                  <span>{((tipo.total / productos.length) * 100).toFixed(1)}% del total</span>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Gráfico por período */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Productos por Período
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
                  {periodo.total} productos
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(periodo.total / maxPeriodoTotal) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bg-blue-500 h-3 rounded-full"
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progreso: {(periodo.avancePromedio * 100).toFixed(1)}%</span>
                <span>{formatCurrency(periodo.presupuesto)}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gráfico por rango de avance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Distribución por Avance
          </h3>
        </div>
        
        <div className="space-y-4">
          {porAvance.map((avance, index) => (
            <div key={avance.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${avance.color}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {avance.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {avance.count}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(avance.count / maxAvanceCount) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`${avance.color} h-3 rounded-full`}
                />
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {productos.length > 0 ? ((avance.count / productos.length) * 100).toFixed(1) : 0}% del total
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export { ProductosCharts }
export type { ProductosChartsProps }

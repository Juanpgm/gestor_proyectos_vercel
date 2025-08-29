'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock
} from 'lucide-react'
import { Actividad } from '@/hooks/useActividades'

interface ActividadesTableProps {
  actividades: Actividad[]
  filteredActividades: Actividad[]
  loading?: boolean
  onViewActivity?: (actividad: Actividad) => void
}

type SortKey = keyof Actividad
type SortDirection = 'asc' | 'desc'

export default function ActividadesTable({ 
  actividades,
  filteredActividades,
  loading = false,
  onViewActivity
}: ActividadesTableProps) {
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>('nombre_actividad')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Funciones de utilidad
  const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return '$0'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const calculateDuration = (startDate: string | null, endDate: string | null): string => {
    if (!startDate || !endDate) return 'N/A'
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 30) return `${diffDays} días`
      if (diffDays < 365) return `${Math.round(diffDays / 30)} meses`
      return `${Math.round(diffDays / 365)} años`
    } catch {
      return 'N/A'
    }
  }

  const getActivityState = (actividad: Actividad): { label: string, color: string } => {
    const progress = actividad.avance_actividad || 0
    const startDate = actividad.fecha_inicio_actividad ? new Date(actividad.fecha_inicio_actividad) : null
    const endDate = actividad.fecha_fin_actividad ? new Date(actividad.fecha_fin_actividad) : null

    // Si no tiene fechas para comparar (cualquiera de las dos fechas faltante)
    if (!startDate || !endDate) {
      return { 
        label: 'La tarea no posee fecha de inicio o fin', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
      }
    }

    if (!progress) return { label: 'No Iniciada', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' }
    if (progress === 1) return { label: 'Completada', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
    if (progress >= 0.8) return { label: 'Cercana a Terminar', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' }
    return { label: 'En Ejecución', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' }
  }

  // Ordenamiento
  const sortedActividades = useMemo(() => {
    return [...filteredActividades].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1)
    })
  }, [filteredActividades, sortKey, sortDirection])

  // Paginación
  const totalPages = Math.ceil(sortedActividades.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedActividades = sortedActividades.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (column: SortKey) => {
    if (sortKey === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortKey) => {
    if (sortKey !== column) return <ArrowUpDown className="w-4 h-4" />
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actividades
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {sortedActividades.length} actividades encontradas
            </p>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Columna principal: Información de actividad */}
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  style={{ width: '42%' }}
                  onClick={() => handleSort('nombre_actividad')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Actividad</span>
                    {getSortIcon('nombre_actividad')}
                  </div>
                </th>
                
                {/* Columna de fechas */}
                <th 
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  style={{ width: '20%' }}
                  onClick={() => handleSort('fecha_inicio_actividad')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Fechas</span>
                    {getSortIcon('fecha_inicio_actividad')}
                  </div>
                </th>

                {/* Columna de estado y progreso */}
                <th 
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  style={{ width: '22%' }}
                  onClick={() => handleSort('avance_actividad')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Estado y Progreso</span>
                    {getSortIcon('avance_actividad')}
                  </div>
                </th>

                {/* Columna de acción */}
                <th 
                  className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  style={{ width: '6%' }}
                >
                  VER
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedActividades.map((actividad) => {
                const activityState = getActivityState(actividad)
                const progress = (actividad.avance_actividad || 0) * 100
                
                return (
                  <motion.tr
                    key={`${actividad.bpin}-${actividad.cod_actividad}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {/* Columna principal: Información de actividad */}
                    <td className="px-3 py-3 align-top" style={{ width: '42%' }}>
                      <div>
                        {/* Nombre de la actividad */}
                        <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-1 break-words">
                          {actividad.nombre_actividad || 'Actividad sin nombre'}
                        </div>
                        
                        {/* BPIN y Código */}
                        <div className="text-xs mb-1 space-y-0.5">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">BPIN:</span>
                            <span className="ml-1 text-blue-700 dark:text-blue-300 font-medium">{actividad.bpin}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Código:</span>
                            <span className="ml-1 text-purple-700 dark:text-purple-300 font-medium">{actividad.cod_actividad}</span>
                          </div>
                        </div>

                        {/* Presupuesto */}
                        <div className="mb-1">
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(actividad.ppto_modificado_actividad)}
                          </div>
                        </div>
                        
                        {/* Descripción */}
                        {actividad.descripcion_actividad && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium italic break-words line-clamp-2">
                            {actividad.descripcion_actividad}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Columna de fechas */}
                    <td className="px-2 py-3 align-middle text-center" style={{ width: '20%' }}>
                      <div className="space-y-1">
                        <div className="text-xs">
                          <div className="text-green-600 dark:text-green-400 font-medium">
                            Inicio: {formatDate(actividad.fecha_inicio_actividad)}
                          </div>
                          <div className="text-red-600 dark:text-red-400 font-medium">
                            Fin: {formatDate(actividad.fecha_fin_actividad)}
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {calculateDuration(actividad.fecha_inicio_actividad, actividad.fecha_fin_actividad)}
                        </div>
                      </div>
                    </td>

                    {/* Columna de estado y progreso */}
                    <td className="px-2 py-3 align-middle" style={{ width: '22%' }}>
                      <div className="space-y-2">
                        {/* Estado */}
                        <div className="flex justify-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activityState.color}`}>
                            {activityState.label}
                          </span>
                        </div>
                        
                        {/* Progreso */}
                        <div>
                          <div className="text-xs font-medium text-gray-900 dark:text-white text-center mb-1">
                            {progress.toFixed(1)}%
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(progress, 100)}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Columna de acción */}
                    <td className="px-1 py-3 text-center align-middle" style={{ width: '6%' }}>
                      <button
                        onClick={() => onViewActivity?.(actividad)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedActividades.length)} de {sortedActividades.length} resultados
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import type { UnidadProyectoFilters } from '@/services/unidadesProyectoApi'

interface SimpleFiltersProps {
  filters: UnidadProyectoFilters
  onFiltersChange: (filters: UnidadProyectoFilters) => void
  availableOptions: {
    estados: string[]
    comunas: string[]
    centrosGestor: string[]
    tiposIntervencion: string[]
  }
}

const SimpleFilters: React.FC<SimpleFiltersProps> = ({
  filters,
  onFiltersChange,
  availableOptions
}) => {
  const updateFilter = (key: keyof UnidadProyectoFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '')
  ).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda por texto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="BPIN, nombre, centro gestor..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            value={filters.estado || ''}
            onChange={(e) => updateFilter('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            {availableOptions.estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>

        {/* Filtro por comuna */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Comuna
          </label>
          <select
            value={filters.comuna || ''}
            onChange={(e) => updateFilter('comuna', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las comunas</option>
            {availableOptions.comunas.map(comuna => (
              <option key={comuna} value={comuna}>{comuna}</option>
            ))}
          </select>
        </div>

        {/* Filtro por centro gestor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Centro Gestor
          </label>
          <select
            value={filters.centro_gestor || ''}
            onChange={(e) => updateFilter('centro_gestor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los centros</option>
            {availableOptions.centrosGestor.map(centro => (
              <option key={centro} value={centro}>{centro}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default SimpleFilters
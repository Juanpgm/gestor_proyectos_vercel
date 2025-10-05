/**
 * Componente de filtros mejorado para Unidades de Proyecto
 * Incluye nuevos filtros por comuna_corregimiento y barrio_vereda
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, RefreshCw, X, ChevronDown } from 'lucide-react';
import { type FilterData, type FilterParams } from '@/services/unidades-proyecto.service';

interface UnidadesProyectoFiltersProps {
  filterData: FilterData | null;
  filters: FilterParams & { searchTerm: string };
  onFiltersChange: (filters: FilterParams) => void;
  onSearchChange: (term: string) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

// Componente de selector personalizado
const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  disabled?: boolean;
}> = ({ value, onChange, options, placeholder, label, disabled = false }) => {
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => a.localeCompare(b, 'es'));
  }, [options]);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <option value="">{placeholder}</option>
          {sortedOptions.map(option => (
            <option key={option} value={option}>
              {option.length > 30 ? `${option.substring(0, 30)}...` : option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

// Componente principal de filtros
const UnidadesProyectoFilters: React.FC<UnidadesProyectoFiltersProps> = ({
  filterData,
  filters,
  onFiltersChange,
  onSearchChange,
  onClearFilters,
  isLoading = false,
  className = ''
}) => {
  const handleFilterChange = (key: keyof FilterParams, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value && value !== '');
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value !== '').length;
  }, [filters]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros de Búsqueda
            </h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Búsqueda General
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción, UPID..."
              value={filters.searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors"
            />
            {isLoading && (
              <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Grid de filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Estado */}
          <FilterSelect
            label="Estado"
            value={filters.estado || ''}
            onChange={(value) => handleFilterChange('estado', value)}
            options={filterData?.estados || []}
            placeholder="Todos los estados"
            disabled={isLoading}
          />

          {/* Tipo de intervención */}
          <FilterSelect
            label="Tipo de Intervención"
            value={filters.tipo_intervencion || ''}
            onChange={(value) => handleFilterChange('tipo_intervencion', value)}
            options={filterData?.tipos_intervencion || []}
            placeholder="Todos los tipos"
            disabled={isLoading}
          />

          {/* Centro gestor */}
          <FilterSelect
            label="Centro Gestor"
            value={filters.centro_gestor || ''}
            onChange={(value) => handleFilterChange('centro_gestor', value)}
            options={filterData?.centros_gestores || []}
            placeholder="Todos los centros"
            disabled={isLoading}
          />

          {/* Comuna/Corregimiento - NUEVO */}
          <FilterSelect
            label="Comuna/Corregimiento"
            value={filters.comuna_corregimiento || ''}
            onChange={(value) => handleFilterChange('comuna_corregimiento', value)}
            options={filterData?.comunas_corregimientos || []}
            placeholder="Todas las comunas"
            disabled={isLoading}
          />

          {/* Barrio/Vereda - NUEVO */}
          <FilterSelect
            label="Barrio/Vereda"
            value={filters.barrio_vereda || ''}
            onChange={(value) => handleFilterChange('barrio_vereda', value)}
            options={filterData?.barrios_veredas || []}
            placeholder="Todos los barrios"
            disabled={isLoading}
          />

          {/* Fuente de financiación */}
          <FilterSelect
            label="Fuente de Financiación"
            value={filters.fuente_financiacion || ''}
            onChange={(value) => handleFilterChange('fuente_financiacion', value)}
            options={filterData?.fuentes_financiacion || []}
            placeholder="Todas las fuentes"
            disabled={isLoading}
          />

          {/* Año */}
          <FilterSelect
            label="Año"
            value={filters.ano?.toString() || ''}
            onChange={(value) => handleFilterChange('ano', value || '')}
            options={filterData?.anos?.map(ano => ano.toString()) || []}
            placeholder="Todos los años"
            disabled={isLoading}
          />
        </div>

        {/* Información de resultados */}
        {!isLoading && filterData && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>Estados: {filterData.estados.length}</span>
              <span>Tipos: {filterData.tipos_intervencion.length}</span>
              <span>Centros: {filterData.centros_gestores.length}</span>
              <span>Comunas: {filterData.comunas_corregimientos.length}</span>
              <span>Barrios: {filterData.barrios_veredas.length}</span>
              <span>Años: {filterData.anos.length}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UnidadesProyectoFilters;
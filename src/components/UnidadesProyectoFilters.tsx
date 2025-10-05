/**
 * Componente de filtros mejorado para Unidades de Proyecto
 * Con searchbars y dropdown mejorados (manteniendo compatibilidad con FilterParams)
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, X, ChevronDown, Check } from 'lucide-react';
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

// Componente de selector mejorado con searchbar y checkboxes
const EnhancedFilterSelect: React.FC<{
  value: string | number | undefined;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  disabled?: boolean;
  multiSelect?: boolean;
  selectedItems?: string[];
  onMultiChange?: (values: string[]) => void;
}> = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label, 
  disabled = false,
  multiSelect = false,
  selectedItems = [],
  onMultiChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Convert value to string for consistent handling
  const stringValue = value?.toString() || '';

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    const sorted = [...options].sort((a, b) => a.localeCompare(b, 'es'));
    if (!searchTerm) return sorted;
    return sorted.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  // Handle multi-select checkbox changes
  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (!onMultiChange) return;
    
    if (checked) {
      onMultiChange([...selectedItems, option]);
    } else {
      onMultiChange(selectedItems.filter(item => item !== option));
    }
  };

  // Handle select all / clear all
  const handleSelectAll = () => {
    if (!onMultiChange) return;
    onMultiChange(filteredOptions);
  };

  const handleClearAll = () => {
    if (!onMultiChange) return;
    onMultiChange([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(''); // Clear search when closing
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (option: string) => {
    if (multiSelect) {
      // In multi-select mode, toggle the option
      const isSelected = selectedItems.includes(option);
      handleCheckboxChange(option, !isSelected);
    } else {
      // Single select mode
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleClear = () => {
    if (multiSelect && onMultiChange) {
      onMultiChange([]);
    } else {
      onChange('');
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const displayText = useMemo(() => {
    if (multiSelect) {
      if (selectedItems.length === 0) return placeholder;
      if (selectedItems.length === 1) {
        const item = selectedItems[0];
        return item.length > 25 ? `${item.substring(0, 25)}...` : item;
      }
      return `${selectedItems.length} seleccionados`;
    } else {
      if (!stringValue) return placeholder;
      return stringValue.length > 25 ? `${stringValue.substring(0, 25)}...` : stringValue;
    }
  }, [multiSelect, selectedItems, stringValue, placeholder]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left hover:border-gray-400 dark:hover:border-gray-500"
      >
        <span className="truncate">
          {displayText}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden"
          >
            {/* Search bar */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear option and multi-select controls */}
            {multiSelect ? (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex divide-x divide-gray-200 dark:divide-gray-700">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Seleccionar todo
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex-1 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Limpiar todo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
              >
                <span className="italic">{placeholder}</span>
              </button>
            )}

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No se encontraron opciones
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = multiSelect ? selectedItems.includes(option) : stringValue === option;
                  
                  return (
                    <div
                      key={option}
                      className={`flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : ''
                      }`}
                    >
                      {multiSelect ? (
                        <>
                          <input
                            type="checkbox"
                            id={`${label}-${option}`}
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label
                            htmlFor={`${label}-${option}`}
                            className="ml-3 text-sm text-gray-900 dark:text-white cursor-pointer flex-1 truncate"
                          >
                            {option}
                          </label>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectOption(option)}
                          className={`w-full text-left text-sm transition-colors flex items-center ${
                            isSelected 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          <span className="truncate block flex-1">
                            {option}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  // Estado para manejar filtros múltiples
  const [multiFilters, setMultiFilters] = useState<{
    estados: string[];
    tipos_intervencion: string[];
    centros_gestores: string[];
    comunas_corregimientos: string[];
    barrios_veredas: string[];
    fuentes_financiacion: string[];
    anos: string[];
  }>({
    estados: [],
    tipos_intervencion: [],
    centros_gestores: [],
    comunas_corregimientos: [],
    barrios_veredas: [],
    fuentes_financiacion: [],
    anos: []
  });

  // Toggle entre modo single y multi-select
  const [isMultiMode, setIsMultiMode] = useState(false);

  const handleFilterChange = (key: keyof FilterParams, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleMultiFilterChange = (key: keyof typeof multiFilters, values: string[]) => {
    setMultiFilters(prev => ({
      ...prev,
      [key]: values
    }));
    
    // Si hay valores seleccionados, aplicar el filtro con el primer valor como fallback
    // En el futuro, el backend debería soportar múltiples valores
    if (values.length > 0) {
      const mappedKey = key === 'estados' ? 'estado' :
                       key === 'tipos_intervencion' ? 'tipo_intervencion' :
                       key === 'centros_gestores' ? 'centro_gestor' :
                       key === 'comunas_corregimientos' ? 'comuna_corregimiento' :
                       key === 'barrios_veredas' ? 'barrio_vereda' :
                       key === 'fuentes_financiacion' ? 'fuente_financiacion' :
                       'ano';
      
      onFiltersChange({
        ...filters,
        [mappedKey]: values[0] // Por ahora usar el primer valor hasta que el backend soporte arrays
      });
    } else {
      // Limpiar el filtro si no hay valores seleccionados
      const mappedKey = key === 'estados' ? 'estado' :
                       key === 'tipos_intervencion' ? 'tipo_intervencion' :
                       key === 'centros_gestores' ? 'centro_gestor' :
                       key === 'comunas_corregimientos' ? 'comuna_corregimiento' :
                       key === 'barrios_veredas' ? 'barrio_vereda' :
                       key === 'fuentes_financiacion' ? 'fuente_financiacion' :
                       'ano';
      
      onFiltersChange({
        ...filters,
        [mappedKey]: undefined
      });
    }
  };

  const hasActiveFilters = useMemo(() => {
    const hasRegularFilters = Object.entries(filters).some(([key, value]) => {
      if (key === 'searchTerm') return false; // Exclude searchTerm from active filters count
      return value && value !== '';
    });
    
    const hasMultiFilters = Object.values(multiFilters).some(values => values.length > 0);
    
    return hasRegularFilters || hasMultiFilters;
  }, [filters, multiFilters]);

  const activeFiltersCount = useMemo(() => {
    const regularFiltersCount = Object.entries(filters).filter(([key, value]) => {
      if (key === 'searchTerm') return false; // Exclude searchTerm from active filters count
      return value && value !== '';
    }).length;
    
    const multiFiltersCount = Object.values(multiFilters).reduce((acc, values) => {
      return acc + (values.length > 0 ? values.length : 0);
    }, 0);
    
    return regularFiltersCount + multiFiltersCount;
  }, [filters, multiFilters]);

  const handleClearAllFilters = () => {
    setMultiFilters({
      estados: [],
      tipos_intervencion: [],
      centros_gestores: [],
      comunas_corregimientos: [],
      barrios_veredas: [],
      fuentes_financiacion: [],
      anos: []
    });
    onClearFilters();
  };

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
          
          <div className="flex items-center space-x-2">
            {/* Toggle de modo multi-select */}
            <button
              onClick={() => setIsMultiMode(!isMultiMode)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isMultiMode 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Check className="w-4 h-4 mr-1" />
              Filtros múltiples
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar filtros
              </button>
            )}
          </div>
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
          <EnhancedFilterSelect
            label="Estado"
            value={filters.estado}
            onChange={(value) => handleFilterChange('estado', value)}
            options={filterData?.estados || []}
            placeholder="Todos los estados"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.estados}
            onMultiChange={(values) => handleMultiFilterChange('estados', values)}
          />

          {/* Tipo de intervención */}
          <EnhancedFilterSelect
            label="Tipo de Intervención"
            value={filters.tipo_intervencion}
            onChange={(value) => handleFilterChange('tipo_intervencion', value)}
            options={filterData?.tipos_intervencion || []}
            placeholder="Todos los tipos"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.tipos_intervencion}
            onMultiChange={(values) => handleMultiFilterChange('tipos_intervencion', values)}
          />

          {/* Centro gestor */}
          <EnhancedFilterSelect
            label="Centro Gestor"
            value={filters.centro_gestor}
            onChange={(value) => handleFilterChange('centro_gestor', value)}
            options={filterData?.centros_gestores || []}
            placeholder="Todos los centros"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.centros_gestores}
            onMultiChange={(values) => handleMultiFilterChange('centros_gestores', values)}
          />

          {/* Comuna/Corregimiento */}
          <EnhancedFilterSelect
            label="Comuna/Corregimiento"
            value={filters.comuna_corregimiento}
            onChange={(value) => handleFilterChange('comuna_corregimiento', value)}
            options={filterData?.comunas_corregimientos || []}
            placeholder="Todas las comunas"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.comunas_corregimientos}
            onMultiChange={(values) => handleMultiFilterChange('comunas_corregimientos', values)}
          />

          {/* Barrio/Vereda */}
          <EnhancedFilterSelect
            label="Barrio/Vereda"
            value={filters.barrio_vereda}
            onChange={(value) => handleFilterChange('barrio_vereda', value)}
            options={filterData?.barrios_veredas || []}
            placeholder="Todos los barrios"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.barrios_veredas}
            onMultiChange={(values) => handleMultiFilterChange('barrios_veredas', values)}
          />

          {/* Fuente de financiación */}
          <EnhancedFilterSelect
            label="Fuente de Financiación"
            value={filters.fuente_financiacion}
            onChange={(value) => handleFilterChange('fuente_financiacion', value)}
            options={filterData?.fuentes_financiacion || []}
            placeholder="Todas las fuentes"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.fuentes_financiacion}
            onMultiChange={(values) => handleMultiFilterChange('fuentes_financiacion', values)}
          />

          {/* Año */}
          <EnhancedFilterSelect
            label="Año"
            value={filters.ano}
            onChange={(value) => handleFilterChange('ano', value)}
            options={filterData?.anos?.map(ano => ano.toString()) || []}
            placeholder="Todos los años"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.anos}
            onMultiChange={(values) => handleMultiFilterChange('anos', values)}
          />
        </div>

        {/* Filtros múltiples activos */}
        {isMultiMode && Object.values(multiFilters).some(values => values.length > 0) && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Filtros activos:
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(multiFilters).map(([key, values]) => {
                const labels = {
                  estados: 'Estados',
                  tipos_intervencion: 'Tipos',
                  centros_gestores: 'Centros',
                  comunas_corregimientos: 'Comunas',
                  barrios_veredas: 'Barrios',
                  fuentes_financiacion: 'Fuentes',
                  anos: 'Años'
                };
                
                return values.map(value => (
                  <span
                    key={`${key}-${value}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                  >
                    <span className="mr-1 text-blue-600 dark:text-blue-300">
                      {labels[key as keyof typeof labels]}:
                    </span>
                    {value}
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = values.filter(v => v !== value);
                        handleMultiFilterChange(key as keyof typeof multiFilters, newValues);
                      }}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ));
              })}
            </div>
          </div>
        )}

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
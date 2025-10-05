"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Calendar,
  AlertCircle,
  BarChart3,
  Map,
  Filter as FilterIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { CSS_UTILS } from '@/lib/design-system';
import dynamic from 'next/dynamic';

// Componentes dinámicos para evitar problemas de SSR
const UnidadesProyectoMapSimple = dynamic(() => import('./UnidadesProyectoMapSimple'), { ssr: false });
const UnidadesProyectoDashboard = dynamic(() => import('./UnidadesProyectoDashboard'), { ssr: false });
const UnidadesProyectoFilters = dynamic(() => import('./UnidadesProyectoFilters'), { ssr: false });

// Hooks mejorados
import { useUnidadesProyecto, useUnidadesProyectoDashboard } from '@/hooks/useUnidadesProyectoEnhanced';

// Tipos
import { type FilterParams } from '@/services/unidades-proyecto.service';


// Estados de vista
type ViewMode = 'dashboard' | 'map' | 'split';

// Componente de Loading
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center h-64 space-y-4"
  >
    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
    <p className="text-gray-600 dark:text-gray-400">{message}</p>
  </motion.div>
);

// Componente de Error
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center h-64 space-y-4 p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
  >
    <AlertCircle className="w-12 h-12 text-red-500" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
        Error al cargar los datos
      </h3>
      <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  </motion.div>
);

// Componente de métricas compactas
const CompactMetrics: React.FC<{
  metrics: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    avgProgress: number;
    totalBudget: number;
  };
}> = ({ metrics }) => {
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString('es-CO')}`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.total}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Total Proyectos</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.avgProgress.toFixed(1)}%</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Avance Promedio</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(metrics.byStatus).length}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Estados</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(metrics.totalBudget)}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Presupuesto Total</div>
      </div>
    </div>
  );
};

// Componente principal
const UnidadesProyecto: React.FC = () => {
  // Estados locales
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showFilters, setShowFilters] = useState(true);

  // Hook principal con configuración mejorada
  const {
    state,
    filteredData,
    filteredGeometry,
    metrics,
    actions,
    filters
  } = useUnidadesProyecto({
    enableLocalFiltering: true,
    autoRefresh: false,
    initialFilters: {}
  });

  // Hook específico para dashboard - TEMPORALMENTE DESHABILITADO
  const dashboardData = null;
  const dashboardLoading = false;
  const dashboardError = null;
  const refetchDashboard = () => console.log('Dashboard refetch disabled');
  
  // const {
  //   data: dashboardData,
  //   loading: dashboardLoading,
  //   error: dashboardError,
  //   refetch: refetchDashboard
  // } = useUnidadesProyectoDashboard(filters);

  // Handlers de eventos
  const handleFiltersChange = (newFilters: FilterParams) => {
    actions.setFilters(newFilters);
  };

  const handleSearchChange = (term: string) => {
    actions.setSearchTerm(term);
  };

  const handleClearFilters = () => {
    console.log('🧹 Limpiando filtros desde componente principal...');
    actions.clearFilters();
    // Forzar un refresh adicional para asegurar que se recarguen los datos
    setTimeout(() => {
      actions.refetch();
    }, 100);
  };

  const handleRefresh = () => {
    actions.refetch();
    refetchDashboard();
  };

  // Memorizar componentes pesados
  const memoizedMap = useMemo(() => (
    <UnidadesProyectoMapSimple
      geometryData={filteredGeometry}
      filteredData={filteredData}
      className="h-full"
    />
  ), [filteredGeometry, filteredData]);

  const memoizedDashboard = useMemo(() => (
    <UnidadesProyectoDashboard
      data={dashboardData}
      isLoading={dashboardLoading}
      className="h-full overflow-y-auto"
    />
  ), [dashboardData, dashboardLoading]);

  // Renderizar loading principal
  if (state.loading) {
    return (
      <main className="space-y-6">
        <section className={`${CSS_UTILS.card} p-6`}>
          <LoadingSpinner message="Cargando datos de unidades de proyecto..." />
        </section>
      </main>
    );
  }

  // Renderizar error principal
  if (state.error) {
    return (
      <main className="space-y-6">
        <section className={`${CSS_UTILS.card} p-6`}>
          <ErrorDisplay error={state.error} onRetry={handleRefresh} />
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Header con controles */}
      <section className={`${CSS_UTILS.card} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Información principal */}
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Unidades de Proyecto
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {filteredData.length} de {state.attributeData.length}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Sistema integrado de seguimiento y análisis de proyectos
            </p>
          </div>

          {/* Controles de vista y acciones */}
          <div className="flex items-center space-x-3">
            {/* Selector de vista */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'dashboard' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'split' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
                <span>Mixto</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Mapa</span>
              </button>
            </div>

            {/* Botón limpiar filtros - más visible */}
            {(Object.values(filters).some(value => value && value !== '') || filters.searchTerm) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Limpiar ({Object.values(filters).filter(v => v && v !== '').length + (filters.searchTerm ? 1 : 0)})</span>
              </button>
            )}

            {/* Toggle filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FilterIcon className="w-4 h-4" />
              <span>Filtros</span>
              {showFilters ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Botón refresh */}
            <button
              onClick={handleRefresh}
              disabled={state.loading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Timestamp */}
          {state.lastUpdate && (
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>Actualizado: {state.lastUpdate.toLocaleString('es-CO')}</span>
            </div>
          )}
        </div>

        {/* Métricas compactas */}
        <div className="mt-6">
          <CompactMetrics metrics={metrics} />
        </div>
      </section>

      {/* Filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <UnidadesProyectoFilters
              filterData={state.filterData}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearchChange={handleSearchChange}
              onClearFilters={handleClearFilters}
              isLoading={state.loading}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Contenido principal basado en vista */}
      <section className="space-y-6">
        {viewMode === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${CSS_UTILS.card} p-6`}
          >
            {dashboardError ? (
              <ErrorDisplay error={dashboardError} onRetry={refetchDashboard} />
            ) : (
              memoizedDashboard
            )}
          </motion.div>
        )}

        {viewMode === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${CSS_UTILS.card} p-4`}
          >
            <div className="h-[600px] rounded-lg overflow-hidden">
              {memoizedMap}
            </div>
          </motion.div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Mapa */}
            <motion.div
              key="split-map"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${CSS_UTILS.card} p-4`}
            >
              <div className="h-[500px] rounded-lg overflow-hidden">
                {memoizedMap}
              </div>
            </motion.div>

            {/* Dashboard */}
            <motion.div
              key="split-dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${CSS_UTILS.card} p-6`}
            >
              <div className="h-[500px]">
                {dashboardError ? (
                  <ErrorDisplay error={dashboardError} onRetry={refetchDashboard} />
                ) : (
                  memoizedDashboard
                )}
              </div>
            </motion.div>
          </div>
        )}
      </section>
    </main>
  );
};

export default UnidadesProyecto;
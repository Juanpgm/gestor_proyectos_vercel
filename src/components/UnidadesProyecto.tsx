"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Calendar,
  AlertCircle,
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
const UnidadesProyectoFilters = dynamic(() => import('./UnidadesProyectoFilters'), { ssr: false });
const UnidadesProyectoAttributesTable = dynamic(() => import('./UnidadesProyectoAttributesTable'), { ssr: false });

// Hooks mejorados
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyectoEnhanced';

// Tipos
import { type FilterParams } from '@/services/unidades-proyecto.service';
import { type AttributeData } from '@/hooks/useUnidadesProyecto';


// Estados de vista
type ViewMode = 'map' | 'split';

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

// Componente Modal de Detalles del Proyecto
const ProjectDetailsModal: React.FC<{
  item: AttributeData | undefined;
  onClose: () => void;
}> = ({ item, onClose }) => {
  if (!item) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateProjectDuration = (fechaInicio: string, fechaFin: string) => {
    if (!fechaInicio || !fechaFin) {
      return {
        duration: 'N/A',
        status: 'sin-fecha',
        dateRange: 'Fechas no disponibles'
      };
    }

    try {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);
      const today = new Date();

      const diffTime = endDate.getTime() - startDate.getTime();
      const daysTotal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const monthsTotal = Math.ceil(daysTotal / 30);

      let status = 'planificado';
      if (today >= startDate && today <= endDate) {
        status = 'en-curso';
      } else if (today > endDate) {
        status = 'finalizado';
      }

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      };

      let duration = '';
      if (monthsTotal > 12) {
        const years = Math.floor(monthsTotal / 12);
        const remainingMonths = monthsTotal % 12;
        duration = `${years} año${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}` : ''}`;
      } else if (monthsTotal >= 1) {
        duration = `${monthsTotal} mes${monthsTotal > 1 ? 'es' : ''}`;
      } else {
        duration = `${daysTotal} día${daysTotal > 1 ? 's' : ''}`;
      }

      return {
        duration,
        status,
        dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`
      };
    } catch (error) {
      return {
        duration: 'Error',
        status: 'error',
        dateRange: 'Error al calcular fechas'
      };
    }
  };

  const projectDuration = calculateProjectDuration(item.fecha_inicio, item.fecha_fin);
  const progress = Math.round(item.avance_obra || 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
      {/* Header mejorado */}
      <div className="relative bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
        
        <div className="pr-8">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2 leading-tight line-clamp-2">
            {item.nombre_up}
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono text-sm">
              {item.upid}
            </span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300 text-sm font-medium">
              {item.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Content scrolleable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-4">
          {/* Progreso mejorado */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Progreso</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  progress >= 70 ? 'bg-green-500' : 
                  progress >= 40 ? 'bg-amber-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className={`text-sm font-semibold w-8 text-right ${
              progress >= 70 ? 'text-green-600' : 
              progress >= 40 ? 'text-amber-600' : 
              'text-red-600'
            }`}>
              {progress}%
            </span>
          </div>

          {/* Información con tipografía balanceada */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Centro</span>
              <span className="text-sm text-gray-900 dark:text-white font-medium leading-relaxed">
                {item.nombre_centro_gestor || 'No especificado'}
              </span>
            </div>
            
            {item.nombre_up_detalle && (
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Detalle</span>
                <span className="text-sm text-gray-900 dark:text-white leading-relaxed">
                  {item.nombre_up_detalle}
                </span>
              </div>
            )}
            
            {item.identificador && (
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">ID</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono text-xs leading-relaxed">
                  {item.identificador}
                </span>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Ubicación</span>
              <div className="text-sm text-gray-900 dark:text-white leading-relaxed">
                <div className="font-medium">{item.barrio_vereda || 'N/A'}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">{item.comuna_corregimiento || 'N/A'}</div>
              </div>
            </div>

            {item.presupuesto_base && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Presupuesto</span>
                <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                  {formatCurrency(item.presupuesto_base)}
                </span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Tipo</span>
              <span className="text-sm text-gray-900 dark:text-white leading-relaxed">
                {item.tipo_intervencion}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Año</span>
              <span className="text-sm text-gray-900 dark:text-white font-medium">
                {item.ano}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Duración</span>
              <div className="text-sm text-gray-900 dark:text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{projectDuration.duration}</span>
                  <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                    projectDuration.status === 'en-curso' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : projectDuration.status === 'finalizado'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  }`}>
                    {projectDuration.status === 'en-curso' ? 'En Curso' : 
                     projectDuration.status === 'finalizado' ? 'Finalizado' : 'Planificado'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{projectDuration.dateRange}</div>
              </div>
            </div>

            {item.fuente_financiacion && (
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Fuente</span>
                <span className="text-sm text-gray-900 dark:text-white leading-relaxed">
                  {item.fuente_financiacion}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fuente de financiación - solo si existe */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ubicación</h3>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Barrio/Vereda</h4>
                <p className="text-gray-900 dark:text-white font-medium">{item.barrio_vereda || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Comuna/Corregimiento</h4>
                <p className="text-gray-900 dark:text-white font-medium">{item.comuna_corregimiento || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        {item.descripcion_intervencion && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Descripción de la Intervención</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {item.descripcion_intervencion}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
  const formatCurrency = (amount: number, compact: boolean = false): string => {
    // Solo usar formato compacto si se especifica explícitamente
    if (compact) {
      if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(1).replace('.', ',')} B`; // Billones
      if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1).replace('.', ',')} MM`; // Miles de millones
      if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1).replace('.', ',')} M`; // Millones
      if (amount >= 1000) return `$${(amount / 1000).toFixed(1).replace('.', ',')} K`; // Miles
    }
    
    // Formato completo con notación colombiana (por defecto)
    return `$${amount.toLocaleString('es-CO', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.total}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Total Intervenciones</div>
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
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [showOnlyFocused, setShowOnlyFocused] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<string | null>(null);

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

  // Handlers para enfoque
  const handleItemFocus = (upid: string) => {
    if (upid === '') {
      // Limpiar enfoque
      setFocusedItem(null);
      setShowOnlyFocused(false);
    } else {
      setFocusedItem(upid);
      // Si no hay item enfocado previamente, no cambiar showOnlyFocused
      // Si ya había un item enfocado, mantener el estado actual
    }
  };

  const handleToggleShowOnlyFocused = () => {
    setShowOnlyFocused(!showOnlyFocused);
  };

  const handleShowDetails = (upid: string) => {
    setSelectedItemForModal(upid);
  };

  const handleCloseModal = () => {
    setSelectedItemForModal(null);
  };

  // Memorizar componentes pesados
  const memoizedMap = useMemo(() => (
    <UnidadesProyectoMapSimple
      geometryData={filteredGeometry}
      filteredData={filteredData}
      className="h-full"
      focusedItem={focusedItem}
      showOnlyFocused={showOnlyFocused}
      onItemClick={handleItemFocus}
    />
  ), [filteredGeometry, filteredData, focusedItem, showOnlyFocused]);

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
    <main className="space-y-6 overflow-x-auto pb-4">
      {/* Header con controles - Responsive con scroll horizontal en tablets */}
      <section className={`${CSS_UTILS.card} p-4 md:p-6`}>
        <div className="min-w-[640px] md:min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-3">
            {/* Información principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Unidades de Proyecto
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                  {filteredData.length} de {state.attributeData.length}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Sistema integrado de seguimiento y análisis de proyectos
              </p>
            </div>

            {/* Controles de vista y acciones */}
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              {/* Selector de vista */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    viewMode === 'split' 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="w-3 h-3 md:w-4 md:h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                  <span className="hidden sm:inline">Mixto</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Map className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Mapa</span>
                </button>
              </div>

              {/* Botón limpiar filtros - más visible */}
              {(Object.values(filters).some(value => value && value !== '') || filters.searchTerm) && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors whitespace-nowrap"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Limpiar</span>
                  <span className="inline sm:hidden">({Object.values(filters).filter(v => v && v !== '').length + (filters.searchTerm ? 1 : 0)})</span>
                  <span className="hidden sm:inline">({Object.values(filters).filter(v => v && v !== '').length + (filters.searchTerm ? 1 : 0)})</span>
                </button>
              )}
            </div>

            {/* Timestamp - Oculto en móvil, visible en tablet+ */}
            {state.lastUpdate && (
              <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span className="whitespace-nowrap">Actualizado: {state.lastUpdate.toLocaleString('es-CO')}</span>
              </div>
            )}
          </div>

          {/* Métricas compactas */}
          <div className="mt-4 md:mt-6">
            <CompactMetrics metrics={metrics} />
          </div>
        </div>
      </section>

      {/* Filtros solamente para vista de mapa (excluimos dashboard) */}
      <AnimatePresence>
        {showFilters && viewMode === 'map' && (
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
      <section className="space-y-6 overflow-x-auto">
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
          <div className="space-y-6">
            {/* Layout horizontal: Mapa + Filtros - Responsive con scroll */}
            <motion.div
              key="split-map-filters"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-x-auto"
            >
              <div className="min-w-[768px] md:min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                {/* Mapa - 3 columnas en tablet+ */}
                <div className={`${CSS_UTILS.card} p-4 md:col-span-3`}>
                  <div className="h-[500px] md:h-[650px] rounded-lg overflow-hidden">
                    {memoizedMap}
                  </div>
                </div>

                {/* Filtros - 1 columna, colapsable en móvil */}
                <div className="md:col-span-1 relative z-40">
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="h-[400px] md:h-[650px] overflow-y-auto relative z-40"
                        style={{ zIndex: 40 }}
                      >
                        <UnidadesProyectoFilters
                          filterData={state.filterData}
                          filters={filters}
                          onFiltersChange={handleFiltersChange}
                          onSearchChange={handleSearchChange}
                          onClearFilters={handleClearFilters}
                          isLoading={state.loading}
                          compact={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Tabla de Atributos - Con scroll horizontal en tablets */}
            <motion.div
              key="split-attributes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${CSS_UTILS.card} p-0 overflow-x-auto`}
            >
              <div className="min-w-[640px]">
                <UnidadesProyectoAttributesTable
                  data={filteredData}
                  className="h-[600px] md:h-[700px]"
                  maxHeight="550px"
                  pageSize={20}
                  onRowClick={handleItemFocus}
                  focusedItem={focusedItem}
                  onShowDetails={handleShowDetails}
                />
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* Indicador de elemento enfocado - Esquina inferior derecha (más abajo para no tapar controles) */}
      {focusedItem && (
        <motion.div
          initial={{ opacity: 0, x: 20, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20, y: 20 }}
          className="fixed bottom-16 right-4 z-30 bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          Enfocado: {focusedItem}
        </motion.div>
      )}

      {/* Modal de detalles */}
      <AnimatePresence>
        {selectedItemForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4"
            onClick={handleCloseModal}
            style={{ zIndex: 9998 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <ProjectDetailsModal
                item={filteredData.find(item => item.upid === selectedItemForModal)}
                onClose={handleCloseModal}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default UnidadesProyecto;
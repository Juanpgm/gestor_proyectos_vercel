"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
// import UnifiedMapComponent from './UnifiedMapComponent' // Temporalmente comentado
import { IconButton } from "@/components/atoms";
import { MapToolbar } from "@/components/molecules";

// Componente temporal de reemplazo
const UnifiedMapComponent = ({ className, ...props }: any) => (
  <section
    className={`${className} bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center`}
  >
    <p className="text-gray-500 dark:text-gray-400">
      Mapa no disponible temporalmente
    </p>
  </section>
);
import UnifiedFilters, { type FilterState } from "./UnifiedFilters";
// Removed import of UnidadProyectoGeo and UnidadProyectoFilters as Unidades de Proyecto section was deleted
import { MapPin, Filter, Layers, Maximize2, X } from "lucide-react";

// ===============================================
// INTERFACES
// ===============================================

interface UnifiedMapWithFiltersProps {
  className?: string;
  height?: number;
  showFiltersPanel?: boolean;
  showAnalytics?: boolean;
  onUnidadClick?: (unidad: any) => void; // Replaced UnidadProyectoGeo with any since the type was removed
  isDarkMode?: boolean;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================

const UnifiedMapWithFilters: React.FC<UnifiedMapWithFiltersProps> = ({
  className = "w-full",
  height = 600,
  showFiltersPanel = true,
  showAnalytics = true,
  onUnidadClick,
  isDarkMode = false,
}) => {
  // ===============================================
  // ESTADOS
  // ===============================================

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<FilterState>({
    search: "",
    estado: "all",
    filtrosPersonalizados: [],
    centroGestor: [],
    comunas: [],
    barrios: [],
    corregimientos: [],
    veredas: [],
    fuentesFinanciamiento: [],
    fechaInicio: null,
    fechaFin: null,
    periodos: [],
  });

  // ===============================================
  // CONVERSIÓN DE FILTROS
  // ===============================================

  // Convertir filtros del dashboard a filtros de la API
  const apiFilters = useMemo((): any => {
    const filters: any = {};

    // Búsqueda global
    if (dashboardFilters.search && dashboardFilters.search.trim()) {
      filters.search = dashboardFilters.search.trim();
    }

    // Estado
    if (dashboardFilters.estado && dashboardFilters.estado !== "all") {
      filters.estado = dashboardFilters.estado;
    }

    // Comuna (tomar la primera seleccionada)
    if (dashboardFilters.comunas && dashboardFilters.comunas.length > 0) {
      filters.comuna = dashboardFilters.comunas[0];
    }

    // Centro gestor (tomar el primero seleccionado)
    if (
      dashboardFilters.centroGestor &&
      dashboardFilters.centroGestor.length > 0
    ) {
      filters.centro_gestor = dashboardFilters.centroGestor[0];
    }

    // Año (tomar el primer período seleccionado)
    if (dashboardFilters.periodos && dashboardFilters.periodos.length > 0) {
      filters.ano = dashboardFilters.periodos[0];
    }

    // Fuente financiamiento (tomar la primera seleccionada)
    if (
      dashboardFilters.fuentesFinanciamiento &&
      dashboardFilters.fuentesFinanciamiento.length > 0
    ) {
      filters.fuente_financiacion = dashboardFilters.fuentesFinanciamiento[0];
    }

    return filters;
  }, [dashboardFilters]);

  // ===============================================
  // HANDLERS
  // ===============================================

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setDashboardFilters(newFilters);
  }, []);

  const handleUnidadClick = useCallback(
    (unidad: any) => {
      // Replaced UnidadProyectoGeo with any since the type was removed
      onUnidadClick?.(unidad);
    },
    [onUnidadClick],
  );

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleApiFiltersChange = useCallback((newApiFilters: any) => {
    // Sincronizar cambios desde el mapa hacia los filtros del dashboard

    // Actualizar solo los campos relevantes sin sobrescribir todo
    setDashboardFilters((prev) => ({
      ...prev,
      search: newApiFilters.search || prev.search,
      estado: newApiFilters.estado || prev.estado,
      comunas: newApiFilters.comuna ? [newApiFilters.comuna] : prev.comunas,
      centroGestor: newApiFilters.centro_gestor
        ? [newApiFilters.centro_gestor]
        : prev.centroGestor,
      periodos: newApiFilters.ano ? [newApiFilters.ano] : prev.periodos,
    }));
  }, []);

  // ===============================================
  // CONTADOR DE FILTROS ACTIVOS
  // ===============================================

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dashboardFilters.search) count++;
    if (dashboardFilters.estado !== "all") count++;
    if (dashboardFilters.comunas.length > 0) count++;
    if (dashboardFilters.centroGestor.length > 0) count++;
    if (dashboardFilters.periodos.length > 0) count++;
    if (dashboardFilters.fuentesFinanciamiento.length > 0) count++;
    return count;
  }, [dashboardFilters]);

  // ===============================================
  // RENDER
  // ===============================================

  if (isFullscreen) {
    return (
      <main className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
        <UnifiedMapComponent
          className="w-full h-full"
          height={window.innerHeight}
          filters={apiFilters}
          onUnidadClick={handleUnidadClick}
          onFiltersChange={handleApiFiltersChange}
          showAnalytics={showAnalytics}
          showFilters={false}
          showControls={true}
          isDarkMode={isDarkMode}
          isFullscreen={true}
          onFullscreenToggle={handleFullscreenToggle}
        />
      </main>
    );
  }

  return (
    <main className={className}>
      {/* Header con información y controles */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <MapToolbar
          title="Mapa territorial unificado"
          subtitle="Visualizacion institucional con filtros estandarizados"
          actions={
            <>
              {activeFiltersCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-700 rounded-md text-[11px] uppercase tracking-wide font-medium dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-300">
                  <Filter size={12} strokeWidth={1.5} />
                  <span>{activeFiltersCount} activos</span>
                </span>
              )}

              <IconButton
                icon={<Filter size={14} strokeWidth={1.5} />}
                label="Filtros"
                className="md:hidden"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              />

              <IconButton
                icon={<Maximize2 size={14} strokeWidth={1.5} />}
                label="Pantalla completa"
                onClick={handleFullscreenToggle}
              />
            </>
          }
        />
      </motion.div>

      {/* Layout responsivo */}
      <section className="flex flex-col lg:flex-row gap-4">
        {/* Panel de filtros */}
        {showFiltersPanel && (
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:w-80 ${showMobileFilters ? "block" : "hidden lg:block"}`}
          >
            <section className="sticky top-4">
              <article className="bg-white dark:bg-gray-800 rounded-md shadow-none border border-gray-200 dark:border-gray-700 p-4">
                <header className="flex items-center justify-between mb-4">
                  <hgroup className="flex items-center gap-2">
                    <Filter
                      size={16}
                      strokeWidth={1.5}
                      className="text-blue-700"
                    />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Filtros
                    </h3>
                  </hgroup>
                  {showMobileFilters && (
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </header>

                <UnifiedFilters
                  filters={dashboardFilters}
                  onFiltersChange={handleFiltersChange}
                  activeTab="project_units"
                  className="space-y-4"
                />
              </article>
            </section>
          </motion.aside>
        )}

        {/* Mapa principal */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1"
        >
          <UnifiedMapComponent
            className="w-full"
            height={height}
            filters={apiFilters}
            onUnidadClick={handleUnidadClick}
            onFiltersChange={handleApiFiltersChange}
            showAnalytics={showAnalytics}
            showFilters={false} // Usamos el panel lateral en su lugar
            showControls={true}
            isDarkMode={isDarkMode}
            isFullscreen={false}
            onFullscreenToggle={handleFullscreenToggle}
          />
        </motion.section>
      </section>

      {/* Panel móvil de filtros (overlay) */}
      {showMobileFilters && (
        <aside className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <motion.article
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
          >
            <header className="p-4 border-b border-gray-200 dark:border-gray-700">
              <hgroup className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter
                    size={16}
                    strokeWidth={1.5}
                    className="text-blue-700"
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Filtros
                  </h3>
                </span>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </hgroup>
            </header>

            <section className="p-4">
              <UnifiedFilters
                filters={dashboardFilters}
                onFiltersChange={handleFiltersChange}
                activeTab="project_units"
                className="space-y-4"
              />
            </section>
          </motion.article>
        </aside>
      )}
    </main>
  );
};

export default UnifiedMapWithFilters;

// ===============================================
// EXPORTS PARA COMPATIBILIDAD
// ===============================================

export type { UnifiedMapWithFiltersProps };
export { UnifiedMapComponent };

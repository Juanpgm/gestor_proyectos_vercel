'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
// import UnifiedMapComponent from './UnifiedMapComponent' // Temporalmente comentado

// Componente temporal de reemplazo
const UnifiedMapComponent = ({ className, ...props }: any) => (
  <div className={`${className} bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center`}>
    <div className="text-gray-500 dark:text-gray-400">Mapa no disponible temporalmente</div>
  </div>
)
import UnifiedFilters, { type FilterState } from './UnifiedFilters'
import type { UnidadProyectoGeo, UnidadProyectoFilters } from '@/services/unidadesProyectoApi'
import { 
  MapPin, 
  Filter,
  BarChart3,
  Layers,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react'

// ===============================================
// INTERFACES
// ===============================================

interface UnifiedMapWithFiltersProps {
  className?: string
  height?: number
  showFiltersPanel?: boolean
  showAnalytics?: boolean
  onUnidadClick?: (unidad: UnidadProyectoGeo) => void
  isDarkMode?: boolean
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
  isDarkMode = false
}) => {
  // ===============================================
  // ESTADOS
  // ===============================================
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [dashboardFilters, setDashboardFilters] = useState<FilterState>({
    search: '',
    estado: 'all',
    filtrosPersonalizados: [],
    centroGestor: [],
    comunas: [],
    barrios: [],
    corregimientos: [],
    veredas: [],
    fuentesFinanciamiento: [],
    fechaInicio: null,
    fechaFin: null,
    periodos: []
  })

  // ===============================================
  // CONVERSIÓN DE FILTROS
  // ===============================================

  // Convertir filtros del dashboard a filtros de la API
  const apiFilters = useMemo((): UnidadProyectoFilters => {
    const filters: UnidadProyectoFilters = {}

    // Búsqueda global
    if (dashboardFilters.search && dashboardFilters.search.trim()) {
      filters.search = dashboardFilters.search.trim()
    }

    // Estado
    if (dashboardFilters.estado && dashboardFilters.estado !== 'all') {
      filters.estado = dashboardFilters.estado
    }

    // Comuna (tomar la primera seleccionada)
    if (dashboardFilters.comunas && dashboardFilters.comunas.length > 0) {
      filters.comuna = dashboardFilters.comunas[0]
    }

    // Centro gestor (tomar el primero seleccionado)
    if (dashboardFilters.centroGestor && dashboardFilters.centroGestor.length > 0) {
      filters.centro_gestor = dashboardFilters.centroGestor[0]
    }

    // Año (tomar el primer período seleccionado)
    if (dashboardFilters.periodos && dashboardFilters.periodos.length > 0) {
      filters.ano = dashboardFilters.periodos[0]
    }

    // Fuente financiamiento (tomar la primera seleccionada)
    if (dashboardFilters.fuentesFinanciamiento && dashboardFilters.fuentesFinanciamiento.length > 0) {
      filters.fuente_financiacion = dashboardFilters.fuentesFinanciamiento[0]
    }

    return filters
  }, [dashboardFilters])

  // ===============================================
  // HANDLERS
  // ===============================================

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    console.log('🔄 [UnifiedMapWithFilters] Filtros actualizados:', newFilters)
    setDashboardFilters(newFilters)
  }, [])

  const handleUnidadClick = useCallback((unidad: UnidadProyectoGeo) => {
    console.log('🎯 [UnifiedMapWithFilters] Unidad seleccionada:', {
      nombre: unidad.nombre,
      bpin: unidad.bpin,
      comuna: unidad.comuna,
      estado: unidad.estado
    })
    onUnidadClick?.(unidad)
  }, [onUnidadClick])

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const handleApiFiltersChange = useCallback((newApiFilters: UnidadProyectoFilters) => {
    // Sincronizar cambios desde el mapa hacia los filtros del dashboard
    console.log('🔄 [UnifiedMapWithFilters] Filtros de API actualizados:', newApiFilters)
    
    // Actualizar solo los campos relevantes sin sobrescribir todo
    setDashboardFilters(prev => ({
      ...prev,
      search: newApiFilters.search || prev.search,
      estado: newApiFilters.estado || prev.estado,
      comunas: newApiFilters.comuna ? [newApiFilters.comuna] : prev.comunas,
      centroGestor: newApiFilters.centro_gestor ? [newApiFilters.centro_gestor] : prev.centroGestor,
      periodos: newApiFilters.ano ? [newApiFilters.ano] : prev.periodos
    }))
  }, [])

  // ===============================================
  // CONTADOR DE FILTROS ACTIVOS
  // ===============================================

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (dashboardFilters.search) count++
    if (dashboardFilters.estado !== 'all') count++
    if (dashboardFilters.comunas.length > 0) count++
    if (dashboardFilters.centroGestor.length > 0) count++
    if (dashboardFilters.periodos.length > 0) count++
    if (dashboardFilters.fuentesFinanciamiento.length > 0) count++
    return count
  }, [dashboardFilters])

  // ===============================================
  // RENDER
  // ===============================================

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
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
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header con información y controles */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Mapa Territorial Unificado
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualización interactiva con Plotly y filtros integrados
            </p>
          </div>
        </div>

        {/* Controles de la interfaz */}
        <div className="flex items-center gap-2">
          {/* Contador de filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              <Filter className="w-4 h-4" />
              <span>{activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Toggle filtros en móvil */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Filtros"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Pantalla completa */}
          <button
            onClick={handleFullscreenToggle}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Layout responsivo */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Panel de filtros */}
        {showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:w-80 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}
          >
            <div className="sticky top-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
                  </div>
                  {showMobileFilters && (
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <UnifiedFilters
                  filters={dashboardFilters}
                  onFiltersChange={handleFiltersChange}
                  activeTab="project_units"
                  className="space-y-4"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Mapa principal */}
        <motion.div
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
        </motion.div>
      </div>

      {/* Panel móvil de filtros (overlay) */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
                </div>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <UnifiedFilters
                filters={dashboardFilters}
                onFiltersChange={handleFiltersChange}
                activeTab="project_units"
                className="space-y-4"
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default UnifiedMapWithFilters

// ===============================================
// EXPORTS PARA COMPATIBILIDAD
// ===============================================

export type { UnifiedMapWithFiltersProps }
export { UnifiedMapComponent }
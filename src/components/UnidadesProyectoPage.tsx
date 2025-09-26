'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  RefreshCw, 
  Filter, 
  Download,
  MapPin,
  Settings,
  Eye,
  X,
  Search,
  RotateCcw,
  ChevronDown,
  Check,
  Palette,
  BarChart3
} from 'lucide-react'
import { useUnidadesProyectoAPI, type UnidadProyectoAPI, type UnidadProyectoFilters } from '@/hooks/useUnidadesProyectoAPI'
import UnidadesProyectoTable from '@/components/UnidadesProyectoTable'
import UnidadesProyectoMapView from '@/components/UnidadesProyectoMapView'
import { formatCurrencyColombian, formatNumberColombian, getCategoryColor } from '@/utils/currency'

// Tipos para visualización del mapa
type MapVisualizationVariable = 'avance_obra' | 'presupuesto_base' | 'tipo_intervencion' | 'estado' | 'clase_obra'

interface MapVisualizationConfig {
  variable: MapVisualizationVariable
  label: string
  type: 'progress' | 'budget' | 'category'
  getColor: (value: any) => string
  getValue: (item: UnidadProyectoAPI) => any
  formatValue: (value: any) => string
}

// Componente para filtros avanzados
interface FiltersPanelProps {
  filters: UnidadProyectoFilters
  onFiltersChange: (filters: UnidadProyectoFilters) => void
  onClose: () => void
  data: UnidadProyectoAPI[]
}

// Componente para selector múltiple
interface MultiSelectProps {
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder: string
  searchPlaceholder?: string
}

const MultiSelect = ({ options, selectedValues, onSelectionChange, placeholder, searchPlaceholder }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleOption = (option: string) => {
    const newSelection = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option]
    onSelectionChange(newSelection)
  }

  const clearSelection = () => {
    onSelectionChange([])
    setSearchTerm('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left
                   focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                   flex items-center justify-between"
      >
        <span className="truncate">
          {selectedValues.length === 0 
            ? placeholder
            : `${selectedValues.length} seleccionado${selectedValues.length !== 1 ? 's' : ''}`
          }
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder || "Buscar..."}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                           focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            {selectedValues.length > 0 && (
              <button
                onClick={clearSelection}
                className="mt-2 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Limpiar selección
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.map((option) => (
              <label key={option} className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-white truncate" title={option}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const FiltersPanel = ({ filters, onFiltersChange, onClose, data }: FiltersPanelProps) => {
  // Estados para selecciones múltiples
  const [selectedTiposIntervencion, setSelectedTiposIntervencion] = useState<string[]>([])
  const [selectedClasesObra, setSelectedClasesObra] = useState<string[]>([])
  const [selectedEstados, setSelectedEstados] = useState<string[]>([])
  const [selectedCentrosGestores, setSelectedCentrosGestores] = useState<string[]>([])
  const [selectedComunas, setSelectedComunas] = useState<string[]>([])
  const [selectedAnos, setSelectedAnos] = useState<string[]>([])
  const [selectedFuentesFinanciacion, setSelectedFuentesFinanciacion] = useState<string[]>([])
  const [selectedBarriosVeredas, setSelectedBarriosVeredas] = useState<string[]>([])

  // Obtener opciones únicas para los filtros
  const filterOptions = useMemo(() => {
    const tiposIntervencion = Array.from(new Set(data.map(item => item.properties.tipo_intervencion).filter(Boolean))).sort() as string[]
    const clasesObra = Array.from(new Set(data.map(item => item.properties.clase_obra).filter(Boolean))).sort() as string[]
    const estados = Array.from(new Set(data.map(item => item.properties.estado).filter(Boolean))).sort() as string[]
    const centrosGestores = Array.from(new Set(data.map(item => item.properties.nombre_centro_gestor).filter(Boolean))).sort() as string[]
    const comunas = Array.from(new Set(data.map(item => item.properties.comuna_corregimiento).filter(Boolean))).sort() as string[]
    const anos = Array.from(new Set(data.map(item => item.properties.ano).filter(Boolean))).sort() as string[]
    const fuentesFinanciacion = Array.from(new Set(data.map(item => item.properties.fuente_financiacion).filter(Boolean))).sort() as string[]
    const barriosVeredas = Array.from(new Set(data.map(item => item.properties.barrio_vereda).filter(Boolean))).sort() as string[]

    return {
      tiposIntervencion,
      clasesObra,
      estados,
      centrosGestores,
      comunas,
      anos,
      fuentesFinanciacion,
      barriosVeredas
    }
  }, [data])

  const updateFilter = (key: keyof UnidadProyectoFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
    })
  }

  const clearAllFilters = () => {
    // Limpiar estados locales
    setSelectedTiposIntervencion([])
    setSelectedClasesObra([])
    setSelectedEstados([])
    setSelectedCentrosGestores([])
    setSelectedComunas([])
    setSelectedAnos([])
    setSelectedFuentesFinanciacion([])
    setSelectedBarriosVeredas([])
    
    // Limpiar filtros
    onFiltersChange({})
  }

  const applyFilters = () => {
    const newFilters: UnidadProyectoFilters = { ...filters }
    
    // Aplicar filtros de selección múltiple como strings separados por coma
    if (selectedTiposIntervencion.length > 0) {
      newFilters.tipo_intervencion = selectedTiposIntervencion.join(',')
    }
    if (selectedClasesObra.length > 0) {
      newFilters.clase_obra = selectedClasesObra.join(',')
    }
    if (selectedEstados.length > 0) {
      newFilters.estado = selectedEstados.join(',')
    }
    if (selectedCentrosGestores.length > 0) {
      newFilters.centro_gestor = selectedCentrosGestores.join(',')
    }
    if (selectedComunas.length > 0) {
      newFilters.comuna = selectedComunas.join(',')
    }
    if (selectedAnos.length > 0) {
      newFilters.ano = selectedAnos.join(',')
    }
    if (selectedFuentesFinanciacion.length > 0) {
      newFilters.fuente_financiacion = selectedFuentesFinanciacion.join(',')
    }
    if (selectedBarriosVeredas.length > 0) {
      newFilters.barrio = selectedBarriosVeredas.join(',')
    }

    onFiltersChange(newFilters)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-[480px] bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtros Avanzados
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearAllFilters}
              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              title="Reiniciar Filtros"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Búsqueda general */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Búsqueda General
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Buscar por nombre, BPIN, descripción..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* BPIN específico */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              BPIN
            </label>
            <input
              type="text"
              value={filters.bpin || ''}
              onChange={(e) => updateFilter('bpin', e.target.value)}
              placeholder="Código BPIN específico"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* UPID específico */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              UPID
            </label>
            <input
              type="text"
              value={filters.upid || ''}
              onChange={(e) => updateFilter('upid', e.target.value)}
              placeholder="Código UPID específico"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Tipo de Intervención - Selección múltiple */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              Tipo de Intervención
            </label>
            <MultiSelect
              options={filterOptions.tiposIntervencion}
              selectedValues={selectedTiposIntervencion}
              onSelectionChange={setSelectedTiposIntervencion}
              placeholder="Seleccionar tipos de intervención"
              searchPlaceholder="Buscar tipos..."
            />
          </div>

          {/* Clase de Obra - Selección múltiple */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              Clase de Obra
            </label>
            <MultiSelect
              options={filterOptions.clasesObra}
              selectedValues={selectedClasesObra}
              onSelectionChange={setSelectedClasesObra}
              placeholder="Seleccionar clases de obra"
              searchPlaceholder="Buscar clases..."
            />
          </div>

          {/* Estado - Selección múltiple */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              Estado
            </label>
            <MultiSelect
              options={filterOptions.estados}
              selectedValues={selectedEstados}
              onSelectionChange={setSelectedEstados}
              placeholder="Seleccionar estados"
              searchPlaceholder="Buscar estados..."
            />
          </div>

          {/* Centro Gestor - Selección múltiple */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              Centro Gestor
            </label>
            <MultiSelect
              options={filterOptions.centrosGestores}
              selectedValues={selectedCentrosGestores}
              onSelectionChange={setSelectedCentrosGestores}
              placeholder="Seleccionar centros gestores"
              searchPlaceholder="Buscar centros..."
            />
          </div>

          {/* Comuna - Selección múltiple */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              Comuna/Corregimiento
            </label>
            <MultiSelect
              options={filterOptions.comunas}
              selectedValues={selectedComunas}
              onSelectionChange={setSelectedComunas}
              placeholder="Seleccionar comunas"
              searchPlaceholder="Buscar comunas..."
            />
          </div>

          {/* Barrio/Vereda - Selección múltiple */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              Barrio/Vereda
            </label>
            <MultiSelect
              options={filterOptions.barriosVeredas}
              selectedValues={selectedBarriosVeredas}
              onSelectionChange={setSelectedBarriosVeredas}
              placeholder="Seleccionar barrios/veredas"
              searchPlaceholder="Buscar barrios..."
            />
          </div>

          {/* Año - Selección múltiple */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
              Año
            </label>
            <MultiSelect
              options={filterOptions.anos}
              selectedValues={selectedAnos}
              onSelectionChange={setSelectedAnos}
              placeholder="Seleccionar años"
              searchPlaceholder="Buscar años..."
            />
          </div>

          {/* Fuente de Financiación - Selección múltiple */}
          {filterOptions.fuentesFinanciacion.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                Fuente de Financiación
              </label>
              <MultiSelect
                options={filterOptions.fuentesFinanciacion}
                selectedValues={selectedFuentesFinanciacion}
                onSelectionChange={setSelectedFuentesFinanciacion}
                placeholder="Seleccionar fuentes de financiación"
                searchPlaceholder="Buscar fuentes..."
              />
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="mt-8 space-y-3 sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={applyFilters}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 
                       transition-colors font-medium"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={clearAllFilters}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 
                       rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                       flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar Filtros</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Componente de modal para detalles del item
interface ItemDetailModalProps {
  item: UnidadProyectoAPI
  onClose: () => void
}

const ItemDetailModal = ({ item, onClose }: ItemDetailModalProps) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}B`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}Mm`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
    return `$${value.toLocaleString()}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Detalles del Proyecto
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">BPIN</label>
                <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {item.properties.bpin}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">UPID</label>
                <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {item.properties.upid}
                </div>
              </div>
            </div>

            {/* Nombre del proyecto */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nombre del Proyecto</label>
              <div className="mt-1 text-lg text-gray-900 dark:text-white">
                {item.properties.nombre_up || item.properties.nombre_up_detalle || 'Sin nombre'}
              </div>
            </div>

            {/* Descripción */}
            {item.properties.descripcion_intervencion && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {item.properties.descripcion_intervencion}
                </div>
              </div>
            )}

            {/* Información del proyecto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Intervención</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {item.properties.tipo_intervencion}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Clase de Obra</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {item.properties.clase_obra}
                </div>
              </div>
            </div>

            {/* Estado y avance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {item.properties.estado || 'Sin estado'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Avance de Obra</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {((item.properties.avance_obra || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Información financiera */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Presupuesto Base</label>
              <div className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(item.properties.presupuesto_base || 0)}
              </div>
            </div>

            {/* Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Comuna/Corregimiento</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {item.properties.comuna_corregimiento}
                </div>
              </div>
              {item.properties.barrio_vereda && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Barrio/Vereda</label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {item.properties.barrio_vereda}
                  </div>
                </div>
              )}
            </div>

            {/* Dirección */}
            {item.properties.direccion && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Dirección</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {item.properties.direccion}
                </div>
              </div>
            )}

            {/* Centro gestor */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Centro Gestor</label>
              <div className="mt-1 text-gray-900 dark:text-white">
                {item.properties.nombre_centro_gestor}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.properties.fecha_inicio && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Inicio</label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {item.properties.fecha_inicio}
                  </div>
                </div>
              )}
              {item.properties.fecha_fin && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Fin</label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {item.properties.fecha_fin}
                  </div>
                </div>
              )}
            </div>

            {/* Coordenadas geográficas */}
            {item.has_geometry && item.geometry?.coordinates && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Coordenadas</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  Lat: {item.geometry.coordinates[1].toFixed(6)}, Lng: {item.geometry.coordinates[0].toFixed(6)}
                </div>
              </div>
            )}

            {/* Enlaces */}
            {item.properties.url_proceso && (
              <div>
                <a
                  href={item.properties.url_proceso}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Ver Proceso</span>
                  <MapPin className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function UnidadesProyectoPage() {
  const [filters, setFilters] = useState<UnidadProyectoFilters>({})
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [selectedItem, setSelectedItem] = useState<UnidadProyectoAPI | null>(null)
  const [mapVisualization, setMapVisualization] = useState<MapVisualizationVariable>('avance_obra')

  // Usar el hook principal para cargar datos
  const { data, metrics, loading, error, totalCount, lastUpdated, refresh, applyFilters } = useUnidadesProyectoAPI(filters)

  // Configuraciones de visualización del mapa
  const mapVisualizationConfigs: Record<MapVisualizationVariable, MapVisualizationConfig> = useMemo(() => ({
    avance_obra: {
      variable: 'avance_obra',
      label: 'Avance de Obra',
      type: 'progress',
      getColor: (value) => getCategoryColor(value, 'progress'),
      getValue: (item) => item.properties.avance_obra || 0,
      formatValue: (value) => `${(value * 100).toFixed(1)}%`
    },
    presupuesto_base: {
      variable: 'presupuesto_base',
      label: 'Presupuesto Base',
      type: 'budget',
      getColor: (value) => getCategoryColor(value, 'budget'),
      getValue: (item) => item.properties.presupuesto_base || 0,
      formatValue: (value) => formatCurrencyColombian(value, { abbreviated: true })
    },
    tipo_intervencion: {
      variable: 'tipo_intervencion',
      label: 'Tipo de Intervención',
      type: 'category',
      getColor: (value) => getCategoryColor(value, 'type'),
      getValue: (item) => item.properties.tipo_intervencion || 'Sin definir',
      formatValue: (value) => String(value)
    },
    estado: {
      variable: 'estado',
      label: 'Estado',
      type: 'category',
      getColor: (value) => getCategoryColor(value, 'status'),
      getValue: (item) => item.properties.estado || 'Sin estado',
      formatValue: (value) => String(value)
    },
    clase_obra: {
      variable: 'clase_obra',
      label: 'Clase de Obra',
      type: 'category',
      getColor: (value) => getCategoryColor(value, 'type'),
      getValue: (item) => item.properties.clase_obra || 'Sin clasificar',
      formatValue: (value) => String(value)
    }
  }), [])

  // Datos filtrados y procesados
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      visualizationColor: mapVisualizationConfigs[mapVisualization].getColor(
        mapVisualizationConfigs[mapVisualization].getValue(item)
      ),
      visualizationValue: mapVisualizationConfigs[mapVisualization].getValue(item),
      visualizationLabel: mapVisualizationConfigs[mapVisualization].formatValue(
        mapVisualizationConfigs[mapVisualization].getValue(item)
      )
    }))
  }, [data, mapVisualization, mapVisualizationConfigs])

  // Aplicar filtros cuando cambien
  const handleFiltersChange = useCallback((newFilters: UnidadProyectoFilters) => {
    setFilters(newFilters)
    applyFilters(newFilters)
  }, [applyFilters])

  // Estadísticas calculadas localmente para evitar problemas con datos de la API
  const localStats = useMemo(() => {
    if (!data || data.length === 0) return null

    const totalProjects = data.length
    const projectsWithLocation = data.filter(item => item.has_geometry).length
    const averageProgress = data.reduce((sum, item) => sum + (item.properties.avance_obra || 0), 0) / totalProjects
    
    return {
      totalProjects,
      projectsWithLocation,
      averageProgress: (averageProgress * 100).toFixed(1)
    }
  }, [data])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Unidades de Proyecto
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión integral de unidades de proyecto desde la API
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Última actualización: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 dark:text-red-400">
              ⚠️ Error: {error}
            </div>
          </div>
        </div>
      )}

      {/* Map View */}
      <UnidadesProyectoMapView 
        data={processedData} 
        loading={loading} 
        onPointClick={setSelectedItem}
        visualizationConfig={mapVisualizationConfigs[mapVisualization]}
      />

      {/* Table */}
      <UnidadesProyectoTable 
        data={data} 
        loading={loading} 
        onItemSelect={setSelectedItem}
      />

      {/* Filters Panel */}
      {showFiltersPanel && (
        <FiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFiltersPanel(false)}
          data={data}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
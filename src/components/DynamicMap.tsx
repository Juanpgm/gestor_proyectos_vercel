'use client'

import React, { 
  useState, 
  useCallback, 
  useEffect, 
  useMemo, 
  memo,
  lazy,
  Suspense
} from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/context/ThemeContext'
import { 
  Layers, 
  Filter, 
  BarChart3, 
  MapPin, 
  Search, 
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react'

// =====================================================================
// CONSTANTS & TYPES (Funcional - Inmutables)
// =====================================================================

type LayerConfig = {
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly color: string
  readonly fillOpacity: number
  readonly weight: number
  readonly category: string
  readonly filterFields: readonly string[]
}

type LayerVisibility = Record<string, boolean>

const CALI_COORDINATES = {
  CENTER_LAT_LNG: [3.4516, -76.5320] as [number, number],
  DEFAULT_ZOOM: 12
} as const

// Configuración de tiles para modo claro/oscuro
const TILE_CONFIGS = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'CartoDB Positron (Claro)'
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", 
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'CartoDB Dark Matter (Oscuro)'
  }
} as const

/**
 * SISTEMA DE TILES RESPONSIVO AL TEMA
 * ====================================
 * 
 * El mapa ahora cambia automáticamente entre tiles claros y oscuros según:
 * 1. La clase 'dark' en el elemento html (para temas manuales)
 * 2. La preferencia del sistema (prefers-color-scheme: dark)
 * 
 * Tiles utilizados:
 * - Modo claro: CartoDB Positron (fondo claro, texto oscuro)
 * - Modo oscuro: CartoDB Dark Matter (fondo oscuro, texto claro)
 * 
 * Funcionalidades:
 * - Detección automática del tema del sistema
 * - Botón manual para alternar tema (Sol/Luna en el header)
 * - Actualización en tiempo real sin recargar el mapa
 * - Estilos responsivos para todos los componentes del dashboard
 */

const LAYER_CONFIG: Record<string, LayerConfig> = {
  comunas: {
    name: 'Comunas',
    description: 'División administrativa por comunas',
    icon: '🏘️',
    color: '#3B82F6',
    fillOpacity: 0.3,
    weight: 2,
    category: 'geografia',
    filterFields: ['NOMBRE', 'COMUNA', 'codigo']
  },
  barrios: {
    name: 'Barrios',
    description: 'División por barrios',
    icon: '🏠',
    color: '#10B981',
    fillOpacity: 0.25,
    weight: 1,
    category: 'geografia',
    filterFields: ['NOMBRE', 'BARRIO', 'codigo']
  },
  equipamientos: {
    name: 'Equipamientos',
    description: 'Infraestructura de equipamientos urbanos',
    icon: '🏢',
    color: '#F59E0B',
    fillOpacity: 0.4,
    weight: 2,
    category: 'proyectos',
    filterFields: ['NOMBRE', 'tipo', 'estado']
  },
  infraestructura_vial: {
    name: 'Vías',
    description: 'Red de infraestructura vial',
    icon: '🛣️',
    color: '#8B5CF6',
    fillOpacity: 0.5,
    weight: 3,
    category: 'proyectos',
    filterFields: ['NOMBRE', 'tipo', 'categoria']
  },
  centros_gravedad: {
    name: 'Centros de Gravedad',
    description: 'Puntos de análisis y concentración',
    icon: '📍',
    color: '#EF4444',
    fillOpacity: 0.6,
    weight: 4,
    category: 'analisis',
    filterFields: ['NOMBRE', 'tipo', 'importancia']
  }
}

// =====================================================================
// PURE FUNCTIONAL UTILITIES
// =====================================================================

// Función pura para filtrar datos
const filterFeatures = (features: any[], filters: {
  category: string
  comuna: string
  barrio: string
  search: string
}, config: any) => {
  if (!features?.length) return []
  
  return features.filter(feature => {
    const props = feature.properties || {}
    
    // Filtro por categoría
    if (filters.category !== 'all' && config.category !== filters.category) {
      return false
    }
    
    // Filtro por comuna
    if (filters.comuna !== 'all') {
      const comunaField = props.COMUNA || props.comuna || props.NOMBRE_COMUNA
      if (comunaField && comunaField !== filters.comuna) return false
    }
    
    // Filtro por barrio
    if (filters.barrio !== 'all') {
      const barrioField = props.BARRIO || props.barrio || props.NOMBRE_BARRIO
      if (barrioField && barrioField !== filters.barrio) return false
    }
    
    // Filtro por búsqueda de texto
    if (filters.search) {
      const searchableText = config.filterFields
        .map((field: string) => props[field] || '')
        .join(' ')
        .toLowerCase()
      if (!searchableText.includes(filters.search.toLowerCase())) return false
    }
    
    return true
  })
}

// Función pura para calcular estadísticas
const calculateStats = (filteredData: Record<string, any>) => {
  const initialStats = {
    totalFeatures: 0,
    byCategory: {} as Record<string, number>,
    byComunas: {} as Record<string, number>,
    byType: {} as Record<string, number>
  }
  
  return Object.entries(filteredData).reduce((stats, [layerId, data]) => {
    const config = LAYER_CONFIG[layerId as keyof typeof LAYER_CONFIG]
    const count = data.features?.length || 0
    
    stats.totalFeatures += count
    stats.byCategory[config.category] = (stats.byCategory[config.category] || 0) + count
    stats.byType[config.name] = count
    
    // Contar por comunas
    data.features?.forEach((feature: any) => {
      const props = feature.properties || {}
      const comuna = props.COMUNA || props.comuna || props.NOMBRE_COMUNA || 'Sin comuna'
      stats.byComunas[comuna] = (stats.byComunas[comuna] || 0) + 1
    })
    
    return stats
  }, initialStats)
}

// Función pura para extraer opciones de filtro
const extractFilterOptions = (allData: Record<string, any>) => {
  const initialOptions = { comunas: new Set<string>(), barrios: new Set<string>() }
  
  const options = Object.values(allData).reduce((acc, data) => {
    data.features?.forEach((feature: any) => {
      const props = feature.properties || {}
      const comuna = props.COMUNA || props.comuna || props.NOMBRE_COMUNA
      const barrio = props.BARRIO || props.barrio || props.NOMBRE_BARRIO
      
      if (comuna) acc.comunas.add(comuna)
      if (barrio) acc.barrios.add(barrio)
    })
    return acc
  }, initialOptions)
  
  return {
    comunas: Array.from(options.comunas).sort(),
    barrios: Array.from(options.barrios).sort()
  }
}

// =====================================================================
// CUSTOM HOOKS
// =====================================================================

// Función para alternar el tema del documento
// Hook para detectar tema del sistema (claro/oscuro)
const useThemeDetector = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') return

    // Función para verificar el tema
    const checkTheme = () => {
      // Verificar si hay una clase 'dark' en el documento (aplicada por ThemeProvider)
      const hasDarkClass = document.documentElement.classList.contains('dark')
      
      // Debug logging para troubleshooting
      console.log('Theme Detection:', {
        hasDarkClass,
        currentClasses: document.documentElement.className,
        computedIsDark: hasDarkClass
      })
      
      setIsDarkTheme(hasDarkClass)
    }

    // Verificar tema inicial
    checkTheme()

    // Observar cambios en la clase 'dark' del documento
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [])

  return isDarkTheme
}

// =====================================================================
// DYNAMIC IMPORTS (Optimizados)
// =====================================================================

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => <MapLoadingComponent />
  }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
)

// =====================================================================
// MEMOIZED COMPONENTS (Functional)
// =====================================================================

// Componente optimizado para TileLayer con tema automático
const ThemeAwareTileLayer = memo(({ isDarkTheme }: { isDarkTheme: boolean }) => {
  const tileConfig = useMemo(() => {
    const config = isDarkTheme ? TILE_CONFIGS.dark : TILE_CONFIGS.light
    console.log('TileLayer Config:', { isDarkTheme, config })
    return config
  }, [isDarkTheme])

  // Crear un timestamp único para cada cambio de tema
  const themeTimestamp = useMemo(() => {
    const timestamp = Date.now()
    console.log('Theme timestamp generated:', { isDarkTheme, timestamp })
    return timestamp
  }, [isDarkTheme])

  // Usar un key que combine el tema y un timestamp para forzar recarga completa
  const layerKey = `tile-layer-${isDarkTheme ? 'dark' : 'light'}-${themeTimestamp}`

  return (
    <TileLayer
      url={tileConfig.url}
      attribution={tileConfig.attribution}
      key={layerKey} // Force complete re-render and tile reload when theme changes
      maxZoom={19}
      subdomains={['a', 'b', 'c']}
      updateWhenIdle={false}
      updateWhenZooming={false}
      keepBuffer={0} // No mantener buffer de tiles antiguos
    />
  )
})

ThemeAwareTileLayer.displayName = 'ThemeAwareTileLayer'

const MapLoadingComponent = memo(() => (
  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
    <div className="text-center p-6">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <div className="text-blue-700 font-bold text-lg">🗺️ Cargando Dashboard</div>
      <div className="text-blue-600 text-sm">Inicializando mapa interactivo...</div>
    </div>
  </div>
))

const MetricCard = memo<{
  title: string
  value: number
  icon: React.ReactNode
  color: string
}>(({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-300">
    <div className="flex items-center gap-2 mb-2">
      <div style={{ color }}>{icon}</div>
      <div className="text-xs font-medium text-gray-600 dark:text-gray-300">{title}</div>
    </div>
    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</div>
  </div>
))

const LayerIcon = memo<{
  icon: string
  color: string
  size?: number
  active?: boolean
}>(({ icon, color, size = 20, active = true }) => (
  <div 
    className={`flex items-center justify-center rounded transition-all ${
      active ? 'opacity-100' : 'opacity-50'
    }`}
    style={{ 
      width: size, 
      height: size,
      backgroundColor: active ? `${color}20` : '#f3f4f6'
    }}
  >
    <span style={{ fontSize: size * 0.6 }}>{icon}</span>
  </div>
))

// =====================================================================
// CUSTOM HOOKS (Optimizados)
// =====================================================================

// Hook optimizado para cargar datos GeoJSON
const useGeoJSONData = () => {
  const [allData, setAllData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLayer = useCallback(async (layerId: string) => {
    if (allData[layerId]) return // Ya cargado
    
    setLoading(true)
    try {
      const response = await fetch(`/data/geodata/${layerId}.geojson`)
      if (!response.ok) throw new Error(`Error cargando ${layerId}`)
      
      const data = await response.json()
      setAllData(prev => ({ ...prev, [layerId]: data }))
    } catch (err) {
      setError(`Error cargando ${layerId}: ${err}`)
    } finally {
      setLoading(false)
    }
  }, [allData])

  const loadAllLayers = useCallback(async () => {
    const layerIds = Object.keys(LAYER_CONFIG)
    await Promise.all(layerIds.map(loadLayer))
  }, [loadLayer])

  return { allData, loading, error, loadLayer, loadAllLayers }
}

// Hook para manejar filtros con debounce
const useFilters = () => {
  const [filters, setFilters] = useState({
    category: 'all',
    comuna: 'all',
    barrio: 'all',
    search: ''
  })

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      category: 'all',
      comuna: 'all',
      barrio: 'all',
      search: ''
    })
  }, [])

  return { filters, updateFilter, clearFilters }
}

// =====================================================================
// MAIN COMPONENT INTERFACE
// =====================================================================

export interface DynamicMapProps {
  className?: string
  initialCenter?: [number, number]
  initialZoom?: number
  onFeatureClick?: (feature: any, layer: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

// =====================================================================
// OPTIMIZED MAIN COMPONENT
// =====================================================================

const DynamicMapOptimized: React.FC<DynamicMapProps> = memo((props) => {
  const {
    className = 'w-full h-full',
    initialCenter = CALI_COORDINATES.CENTER_LAT_LNG,
    initialZoom = CALI_COORDINATES.DEFAULT_ZOOM,
    onFeatureClick,
    onLayerToggle
  } = props

  // Estados locales
  const [isClient, setIsClient] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<LayerVisibility>(() => 
    Object.keys(LAYER_CONFIG).reduce((acc, key) => ({ ...acc, [key]: true }), {} as LayerVisibility)
  )
  const [showDashboard, setShowDashboard] = useState(true)
  const [activeView, setActiveView] = useState<'map' | 'stats' | 'filters'>('map')

  // Hooks optimizados
  const { allData, loading, error, loadLayer, loadAllLayers } = useGeoJSONData()
  const { filters, updateFilter, clearFilters } = useFilters()
  
  // Hook para tema usando el contexto global
  const { theme, setTheme } = useTheme()
  const isDarkTheme = useThemeDetector()

  // Función para alternar tema usando el contexto
  const toggleTheme = useCallback(() => {
    if (theme === 'dark') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      // Si está en 'system', cambiar a modo manual
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(systemPrefersDark ? 'light' : 'dark')
    }
  }, [theme, setTheme])

  // Efectos optimizados
  useEffect(() => {
    setIsClient(true)
    
    // Cargar CSS de Leaflet de manera optimizada
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
      
      // Cargar todas las capas al inicializar
      loadAllLayers()
    }
  }, [loadAllLayers])

  // Datos filtrados (memoizado)
  const filteredData = useMemo(() => {
    const filtered: Record<string, any> = {}
    
    Object.entries(allData).forEach(([layerId, data]) => {
      if (!data?.features) return
      
      const config = LAYER_CONFIG[layerId]
      const features = filterFeatures(data.features, filters, config)
      
      if (features.length > 0) {
        filtered[layerId] = { ...data, features }
      }
    })
    
    return filtered
  }, [allData, filters])

  // Estadísticas (memoizadas)
  const dashboardStats = useMemo(() => 
    calculateStats(filteredData), 
    [filteredData]
  )

  // Opciones de filtro (memoizadas)
  const filterOptions = useMemo(() => 
    extractFilterOptions(allData), 
    [allData]
  )

  // Handlers optimizados
  const toggleLayer = useCallback(async (layerId: string) => {
    setVisibleLayers((prev: LayerVisibility) => {
      const newState = { ...prev, [layerId]: !prev[layerId] }
      if (newState[layerId] && !allData[layerId]) {
        loadLayer(layerId)
      }
      onLayerToggle?.(layerId, newState[layerId])
      return newState
    })
  }, [allData, loadLayer, onLayerToggle])

  const handleFeatureClick = useCallback((feature: any, layer: any) => {
    onFeatureClick?.(feature, layer)
  }, [onFeatureClick])

  // Renderizado condicional para cliente
  if (!isClient) {
    return <MapLoadingComponent />
  }

  return (
    <div className={`${className} relative bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      {/* Header optimizado */}
      <DashboardHeader 
        activeView={activeView}
        setActiveView={setActiveView}
        showDashboard={showDashboard}
        setShowDashboard={setShowDashboard}
        totalFeatures={dashboardStats.totalFeatures}
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
      />

      {/* Panel lateral */}
      {showDashboard && (
        <DashboardSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          dashboardStats={dashboardStats}
          filters={filters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          filterOptions={filterOptions}
          visibleLayers={visibleLayers}
          toggleLayer={toggleLayer}
          filteredData={filteredData}
          loading={loading}
          error={error}
        />
      )}

      {/* Mapa principal */}
      <div className="absolute inset-0 pt-20" style={{ left: showDashboard ? '336px' : '0' }}>
        <Suspense fallback={<MapLoadingComponent />}>
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            {/* TileLayer con tema automático */}
            <ThemeAwareTileLayer isDarkTheme={isDarkTheme} />
            
            {/* Capas GeoJSON optimizadas */}
            {Object.entries(filteredData).map(([layerId, data]) => (
              <GeoJSONLayer
                key={`${layerId}-${data.features.length}`}
                layerId={layerId}
                data={data}
                visible={visibleLayers[layerId] ?? false}
                onFeatureClick={handleFeatureClick}
              />
            ))}
          </MapContainer>
        </Suspense>
      </div>

      {/* Indicador de filtros activos */}
      <FilterIndicator filters={filters} totalFeatures={dashboardStats.totalFeatures} />
    </div>
  )
})

// =====================================================================
// SUB-COMPONENTS (Memoizados y optimizados)
// =====================================================================

const DashboardHeader = memo<{
  activeView: string
  setActiveView: (view: 'map' | 'stats' | 'filters') => void
  showDashboard: boolean
  setShowDashboard: (show: boolean) => void
  totalFeatures: number
  isDarkTheme: boolean
  toggleTheme: () => void
}>(({ activeView, setActiveView, showDashboard, setShowDashboard, totalFeatures, isDarkTheme, toggleTheme }) => (
  <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Dashboard Geográfico - Cali
        </h1>
        
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { id: 'map', label: 'Mapa', icon: Layers },
            { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
            { id: 'filters', label: 'Filtros', icon: Filter }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === id 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Botón para alternar tema */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
          title={isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        
        <button
          onClick={() => setShowDashboard(!showDashboard)}
          className="p-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
        >
          {showDashboard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        
        <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
          {totalFeatures.toLocaleString()} elementos
        </div>
      </div>
    </div>
  </div>
))

const DashboardSidebar = memo<{
  activeView: string
  setActiveView: (view: 'map' | 'stats' | 'filters') => void
  dashboardStats: any
  filters: any
  updateFilter: (key: string, value: string) => void
  clearFilters: () => void
  filterOptions: any
  visibleLayers: any
  toggleLayer: (layerId: string) => void
  filteredData: any
  loading: boolean
  error: string | null
}>(({ 
  activeView, 
  setActiveView, 
  dashboardStats, 
  filters, 
  updateFilter, 
  clearFilters,
  filterOptions,
  visibleLayers,
  toggleLayer,
  filteredData,
  loading,
  error
}) => (
  <div className="absolute top-20 left-4 bottom-4 z-[999] w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
    <div className="h-full flex flex-col">
      {activeView === 'stats' && (
        <StatsView dashboardStats={dashboardStats} />
      )}
      
      {activeView === 'filters' && (
        <FiltersView 
          filters={filters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          filterOptions={filterOptions}
          setActiveView={setActiveView}
        />
      )}
      
      {activeView === 'map' && (
        <LayersView
          visibleLayers={visibleLayers}
          toggleLayer={toggleLayer}
          filteredData={filteredData}
          loading={loading}
          error={error}
        />
      )}
    </div>
  </div>
))

const GeoJSONLayer = memo<{
  layerId: string
  data: any
  visible: boolean
  onFeatureClick: (feature: any, layer: any) => void
}>(({ layerId, data, visible, onFeatureClick }) => {
  const config = LAYER_CONFIG[layerId]
  
  if (!config || !visible || !data?.features) return null
  
  return (
    <GeoJSON
      key={`${layerId}-${data.features.length}`}
      data={data}
      style={{
        color: config.color,
        fillColor: config.color,
        fillOpacity: config.fillOpacity,
        weight: config.weight
      }}
      onEachFeature={(feature, layer) => {
        layer.on('click', () => onFeatureClick(feature, layer))
        
        if (feature.properties) {
          const props = feature.properties
          const name = props.NOMBRE || props.nombre || props.NAME || 'Sin nombre'
          
          const popupContent = `
            <div class="p-2 min-w-48">
              <div class="flex items-center gap-2 mb-2 pb-2 border-b">
                <span style="font-size: 16px;">${config.icon}</span>
                <strong class="text-gray-800">${config.name}</strong>
              </div>
              <div class="font-semibold text-gray-900 mb-2">${name}</div>
              <div class="text-xs text-gray-600 space-y-1">
                ${Object.entries(props)
                  .filter(([key, value]) => value && !key.includes('geometry'))
                  .slice(0, 4)
                  .map(([key, value]) => `<div><span class="font-medium">${key}:</span> ${value}</div>`)
                  .join('')}
              </div>
            </div>
          `
          layer.bindPopup(popupContent, { maxWidth: 300 })
        }
      }}
    />
  )
})

// Componentes adicionales optimizados
const StatsView = memo<{ dashboardStats: any }>(({ dashboardStats }) => (
  <div className="p-4 space-y-4 overflow-y-auto">
    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">📊 Estadísticas Generales</h3>
    
    {/* Métricas principales */}
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        title="Total Elementos"
        value={dashboardStats.totalFeatures}
        icon={<MapPin className="w-5 h-5" />}
        color="#3B82F6"
      />
      <MetricCard
        title="Comunas Activas"
        value={Object.keys(dashboardStats.byComunas).length}
        icon={<Layers className="w-5 h-5" />}
        color="#10B981"
      />
    </div>
    
    {/* Por categoría */}
    <div>
      <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">Por Categoría</h4>
      <div className="space-y-2">
        {Object.entries(dashboardStats.byCategory).map(([category, count]) => (
          <div key={category} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors duration-300">
            <span className="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">{category}</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{String(count)}</span>
          </div>
        ))}
      </div>
    </div>
    
    {/* Top comunas */}
    <div>
      <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">Top Comunas</h4>
      <div className="space-y-2">
        {Object.entries(dashboardStats.byComunas)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([comuna, count]) => (
            <div key={comuna} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors duration-300">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{comuna}</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{String(count)}</span>
            </div>
          ))}
      </div>
    </div>
  </div>
))

const FiltersView = memo<{
  filters: any
  updateFilter: (key: string, value: string) => void
  clearFilters: () => void
  filterOptions: any
  setActiveView: (view: 'map' | 'stats' | 'filters') => void
}>(({ filters, updateFilter, clearFilters, filterOptions, setActiveView }) => (
  <div className="p-4 space-y-4 overflow-y-auto">
    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">🔍 Filtros Avanzados</h3>
    
    {/* Búsqueda por texto */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">
        Búsqueda General
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Buscar proyectos, nombres..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300"
        />
      </div>
    </div>
    
    {/* Filtro por categoría */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">
        Categoría
      </label>
      <select
        value={filters.category}
        onChange={(e) => updateFilter('category', e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
      >
        <option value="all">Todas las categorías</option>
        <option value="geografia">Geografía</option>
        <option value="proyectos">Proyectos</option>
        <option value="analisis">Análisis</option>
      </select>
    </div>
    
    {/* Filtro por comuna */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">
        Comuna
      </label>
      <select
        value={filters.comuna}
        onChange={(e) => updateFilter('comuna', e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
      >
        <option value="all">Todas las comunas</option>
        {filterOptions.comunas.map((comuna: string) => (
          <option key={comuna} value={comuna}>{comuna}</option>
        ))}
      </select>
    </div>
    
    {/* Filtro por barrio */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">
        Barrio
      </label>
      <select
        value={filters.barrio}
        onChange={(e) => updateFilter('barrio', e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
      >
        <option value="all">Todos los barrios</option>
        {filterOptions.barrios.map((barrio: string) => (
          <option key={barrio} value={barrio}>{barrio}</option>
        ))}
      </select>
    </div>
    
    {/* Botones de acción */}
    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600 transition-colors duration-300">
      <button
        onClick={clearFilters}
        className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
      >
        Limpiar
      </button>
      <button
        onClick={() => setActiveView('map')}
        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
      >
        Ver Mapa
      </button>
    </div>
  </div>
))

const LayersView = memo<{
  visibleLayers: LayerVisibility
  toggleLayer: (layerId: string) => void
  filteredData: any
  loading: boolean
  error: string | null
}>(({ visibleLayers, toggleLayer, filteredData, loading, error }) => (
  <div className="p-4 space-y-4 overflow-y-auto">
    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">🗺️ Control de Capas</h3>
    
    <div className="space-y-3">
      {Object.entries(LAYER_CONFIG).map(([layerId, config]) => (
        <div key={layerId} className="group">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800/50">
            <input
              type="checkbox"
              checked={visibleLayers[layerId] || false}
              onChange={() => toggleLayer(layerId)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            
            <LayerIcon
              icon={config.icon}
              color={config.color}
              size={24}
              active={visibleLayers[layerId]}
            />
            
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">{config.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{config.description}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {filteredData[layerId]?.features?.length || 0} elementos
              </div>
            </div>
            
            <div className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 capitalize">
              {config.category}
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {/* Estado de carga */}
    {loading && (
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors duration-300">
        <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Cargando datos...</span>
      </div>
    )}
    
    {error && (
      <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg transition-colors duration-300">
        <div className="text-sm text-red-700 dark:text-red-300 font-medium">⚠️ Error</div>
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</div>
      </div>
    )}
  </div>
))

const FilterIndicator = memo<{
  filters: any
  totalFeatures: number
}>(({ filters, totalFeatures }) => {
  const hasActiveFilters = filters.category !== 'all' || filters.comuna !== 'all' || 
                          filters.barrio !== 'all' || filters.search
  
  if (!hasActiveFilters) return null
  
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-600 rounded-lg p-3 transition-colors duration-300">
      <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtros activos</span>
      </div>
      <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">
        {totalFeatures.toLocaleString()} elementos mostrados
      </div>
    </div>
  )
})

export default DynamicMapOptimized
export { DynamicMapOptimized }
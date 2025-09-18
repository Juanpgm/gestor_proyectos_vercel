'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { 
  Layers, 
  Filter, 
  BarChart3, 
  PieChart, 
  MapPin, 
  Search, 
  Settings, 
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react'

// Cargar react-leaflet de manera dinámica
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-blue-700 font-bold text-lg">🗺️ Cargando Dashboard</div>
          <div className="text-blue-600 text-sm">Inicializando mapa interactivo...</div>
        </div>
      </div>
    )
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

// Coordenadas de Cali
const CALI_COORDINATES = {
  CENTER_LAT_LNG: [3.4516, -76.5320] as [number, number],
  DEFAULT_ZOOM: 12
}

// Configuración de capas con metadatos completos
const LAYER_CONFIG = {
  'comunas': {
    url: '/data/geodata/cartografia_base/comunas.geojson',
    name: 'Comunas',
    category: 'geografia',
    color: '#3B82F6',
    fillOpacity: 0.2,
    weight: 2,
    visible: true,
    icon: '🏛️',
    description: 'División administrativa de comunas',
    filterFields: ['NOMBRE', 'CODIGO']
  },
  'barrios': {
    url: '/data/geodata/cartografia_base/barrios.geojson',
    name: 'Barrios',
    category: 'geografia',
    color: '#10B981',
    fillOpacity: 0.2,
    weight: 1,
    visible: false,
    icon: '🏘️',
    description: 'División de barrios por comuna',
    filterFields: ['NOMBRE', 'COMUNA', 'CODIGO']
  },
  'corregimientos': {
    url: '/data/geodata/cartografia_base/corregimientos.geojson',
    name: 'Corregimientos',
    category: 'geografia',
    color: '#F59E0B',
    fillOpacity: 0.2,
    weight: 2,
    visible: false,
    icon: '🌾',
    description: 'Zonas rurales de la ciudad',
    filterFields: ['NOMBRE', 'CODIGO']
  },
  'veredas': {
    url: '/data/geodata/cartografia_base/veredas.geojson',
    name: 'Veredas',
    category: 'geografia',
    color: '#EF4444',
    fillOpacity: 0.2,
    weight: 1,
    visible: false,
    icon: '🏞️',
    description: 'Subdivisiones rurales',
    filterFields: ['NOMBRE', 'CORREGIMIENTO']
  },
  'equipamientos': {
    url: '/data/geodata/unidades_proyecto/equipamientos.geojson',
    name: 'Equipamientos',
    category: 'proyectos',
    color: '#8B5CF6',
    fillOpacity: 0.7,
    weight: 2,
    visible: true,
    icon: '🏢',
    description: 'Infraestructura pública y equipamientos',
    filterFields: ['NOMBRE', 'TIPO', 'ESTADO', 'COMUNA']
  },
  'infraestructura_vial': {
    url: '/data/geodata/unidades_proyecto/infraestructura_vial.geojson',
    name: 'Infraestructura Vial',
    category: 'proyectos',
    color: '#F97316',
    fillOpacity: 0.6,
    weight: 3,
    visible: true,
    icon: '🛣️',
    description: 'Proyectos de vías e infraestructura',
    filterFields: ['NOMBRE', 'TIPO_VIA', 'ESTADO', 'LONGITUD']
  },
  'centros_gravedad': {
    url: '/data/geodata/centros_gravedad/centros_gravedad_unificado.geojson',
    name: 'Centros de Gravedad',
    category: 'analisis',
    color: '#EC4899',
    fillOpacity: 0.8,
    weight: 3,
    visible: true,
    icon: '🎯',
    description: 'Puntos estratégicos de la ciudad',
    filterFields: ['NOMBRE', 'TIPO', 'IMPORTANCIA']
  }
} as const

// Componente de icono minimalista
const LayerIcon: React.FC<{ 
  icon: string
  color: string
  size?: number
  active?: boolean 
}> = ({ icon, color, size = 20, active = true }) => (
  <div 
    className={`flex items-center justify-center rounded-lg border-2 transition-all ${
      active ? 'border-white shadow-md' : 'border-gray-300 opacity-50'
    }`}
    style={{ 
      backgroundColor: color, 
      width: `${size}px`, 
      height: `${size}px`,
      fontSize: `${size * 0.6}px`
    }}
  >
    {icon}
  </div>
)

// Componente de métrica del dashboard
const MetricCard: React.FC<{
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
  change?: string
}> = ({ title, value, icon, color, change }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className="text-xs text-green-600 mt-1">{change}</p>
        )}
      </div>
      <div 
        className="p-3 rounded-lg"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
    </div>
  </div>
)

// ===== INTERFACES =====
export interface DynamicMapProps {
  geoJsonPaths?: string[]
  className?: string
  showControls?: boolean
  showLayerPanel?: boolean
  enableFiltering?: boolean
  theme?: 'light' | 'dark' | 'auto'
  initialCenter?: [number, number]
  initialZoom?: number
  onFeatureClick?: (feature: any, layer: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

// Hook para cargar y gestionar datos GeoJSON
function useGeoJSONDashboard() {
  const [allData, setAllData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadedLayers, setLoadedLayers] = useState<Set<string>>(new Set())

  const loadLayer = useCallback(async (layerId: string) => {
    if (loadedLayers.has(layerId)) return

    const config = LAYER_CONFIG[layerId as keyof typeof LAYER_CONFIG]
    if (!config) return

    try {
      console.log(`� Cargando ${config.name} desde ${config.url}`)
      const response = await fetch(config.url)
      if (!response.ok) throw new Error(`Error ${response.status}`)
      
      const data = await response.json()
      console.log(`✅ ${config.name}: ${data.features?.length || 0} features`)
      
      setAllData(prev => ({ ...prev, [layerId]: data }))
      setLoadedLayers(prev => new Set(Array.from(prev).concat([layerId])))
    } catch (err) {
      console.error(`❌ Error cargando ${config.name}:`, err)
      setError(`Error cargando ${config.name}`)
    }
  }, [loadedLayers])

  useEffect(() => {
    const loadInitialLayers = async () => {
      setLoading(true)
      const initialLayers = Object.entries(LAYER_CONFIG)
        .filter(([_, config]) => config.visible)
        .map(([layerId]) => layerId)

      await Promise.all(initialLayers.map(loadLayer))
      setLoading(false)
    }

    loadInitialLayers()
  }, [loadLayer])

  return { allData, loading, error, loadLayer, loadedLayers }
}

// Componente principal del Dashboard
export const DynamicMapDashboard: React.FC<DynamicMapProps> = (props) => {
  const {
    className = 'w-full h-full',
    initialCenter = CALI_COORDINATES.CENTER_LAT_LNG,
    initialZoom = CALI_COORDINATES.DEFAULT_ZOOM,
    onFeatureClick,
    onLayerToggle
  } = props
  
  // Estados del dashboard
  const [isClient, setIsClient] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    comunas: true,
    equipamientos: true,
    infraestructura_vial: true,
    centros_gravedad: true
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedComuna, setSelectedComuna] = useState<string>('all')
  const [selectedBarrio, setSelectedBarrio] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDashboard, setShowDashboard] = useState(true)
  const [activeView, setActiveView] = useState<'map' | 'stats' | 'filters'>('map')

  // Hook de datos
  const { allData, loading, error, loadLayer } = useGeoJSONDashboard()

  useEffect(() => {
    setIsClient(true)
    
    // Cargar CSS de Leaflet
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }
  }, [])

  // Datos filtrados
  const filteredData = useMemo(() => {
    const filtered: Record<string, any> = {}
    
    Object.entries(allData).forEach(([layerId, data]) => {
      if (!data?.features) return
      
      const config = LAYER_CONFIG[layerId as keyof typeof LAYER_CONFIG]
      
      let features = data.features.filter((feature: any) => {
        const props = feature.properties || {}
        
        // Filtro por categoría
        if (selectedCategory !== 'all' && config.category !== selectedCategory) {
          return false
        }
        
        // Filtro por comuna
        if (selectedComuna !== 'all') {
          const comunaField = props.COMUNA || props.comuna || props.NOMBRE_COMUNA
          if (comunaField && comunaField !== selectedComuna) return false
        }
        
        // Filtro por barrio
        if (selectedBarrio !== 'all') {
          const barrioField = props.BARRIO || props.barrio || props.NOMBRE_BARRIO
          if (barrioField && barrioField !== selectedBarrio) return false
        }
        
        // Filtro por búsqueda de texto
        if (searchQuery) {
          const searchableText = config.filterFields
            .map(field => props[field] || '')
            .join(' ')
            .toLowerCase()
          if (!searchableText.includes(searchQuery.toLowerCase())) return false
        }
        
        return true
      })
      
      if (features.length > 0) {
        filtered[layerId] = { ...data, features }
      }
    })
    
    return filtered
  }, [allData, selectedCategory, selectedComuna, selectedBarrio, searchQuery])

  // Estadísticas del dashboard
  const dashboardStats = useMemo(() => {
    const stats = {
      totalFeatures: 0,
      byCategory: {} as Record<string, number>,
      byComunas: {} as Record<string, number>,
      byType: {} as Record<string, number>
    }
    
    Object.entries(filteredData).forEach(([layerId, data]) => {
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
    })
    
    return stats
  }, [filteredData])

  // Opciones para filtros
  const filterOptions = useMemo(() => {
    const comunas = new Set<string>()
    const barrios = new Set<string>()
    
    Object.values(allData).forEach(data => {
      data.features?.forEach((feature: any) => {
        const props = feature.properties || {}
        const comuna = props.COMUNA || props.comuna || props.NOMBRE_COMUNA
        const barrio = props.BARRIO || props.barrio || props.NOMBRE_BARRIO
        
        if (comuna) comunas.add(comuna)
        if (barrio) barrios.add(barrio)
      })
    })
    
    return {
      comunas: Array.from(comunas).sort(),
      barrios: Array.from(barrios).sort()
    }
  }, [allData])

  // Funciones de control
  const toggleLayer = useCallback(async (layerId: string) => {
    setVisibleLayers(prev => {
      const newState = { ...prev, [layerId]: !prev[layerId] }
      if (newState[layerId] && !allData[layerId]) {
        loadLayer(layerId)
      }
      if (onLayerToggle) {
        onLayerToggle(layerId, newState[layerId])
      }
      return newState
    })
  }, [allData, loadLayer, onLayerToggle])

  const handleFeatureClick = useCallback((feature: any, layer: any) => {
    console.log('🔍 Feature clickeado:', feature.properties)
    if (onFeatureClick) {
      onFeatureClick(feature, layer)
    }
  }, [onFeatureClick])

  // Solo renderizar en el cliente
  if (!isClient) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-6">
          <div className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-700 font-bold text-lg">🔄 Inicializando Dashboard</div>
          <div className="text-gray-600 text-sm">Preparando componentes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative bg-gray-50`}>
      {/* Header del Dashboard */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Dashboard Geográfico - Cali
            </h1>
            
            {/* Tabs de navegación */}
            <div className="flex bg-gray-100 rounded-lg p-1">
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
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Controles principales */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
            >
              {showDashboard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              {dashboardStats.totalFeatures} elementos
            </div>
          </div>
        </div>
      </div>

      {/* Panel lateral del dashboard */}
      {showDashboard && (
        <div className="absolute top-20 left-4 bottom-4 z-[999] w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="h-full flex flex-col">
            
            {/* Vista de Estadísticas */}
            {activeView === 'stats' && (
              <div className="p-4 space-y-4 overflow-y-auto">
                <h3 className="font-bold text-gray-800 mb-4">📊 Estadísticas Generales</h3>
                
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
                  <h4 className="font-semibold text-gray-700 mb-2">Por Categoría</h4>
                  <div className="space-y-2">
                    {Object.entries(dashboardStats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium capitalize">{category}</span>
                        <span className="text-sm font-bold text-blue-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Top comunas */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Top Comunas</h4>
                  <div className="space-y-2">
                    {Object.entries(dashboardStats.byComunas)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([comuna, count]) => (
                        <div key={comuna} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{comuna}</span>
                          <span className="text-sm font-bold text-green-600">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Vista de Filtros */}
            {activeView === 'filters' && (
              <div className="p-4 space-y-4 overflow-y-auto">
                <h3 className="font-bold text-gray-800 mb-4">🔍 Filtros Avanzados</h3>
                
                {/* Búsqueda por texto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Búsqueda General
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar proyectos, nombres..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Filtro por categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las categorías</option>
                    <option value="geografia">Geografía</option>
                    <option value="proyectos">Proyectos</option>
                    <option value="analisis">Análisis</option>
                  </select>
                </div>
                
                {/* Filtro por comuna */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comuna
                  </label>
                  <select
                    value={selectedComuna}
                    onChange={(e) => setSelectedComuna(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las comunas</option>
                    {filterOptions.comunas.map(comuna => (
                      <option key={comuna} value={comuna}>{comuna}</option>
                    ))}
                  </select>
                </div>
                
                {/* Filtro por barrio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barrio
                  </label>
                  <select
                    value={selectedBarrio}
                    onChange={(e) => setSelectedBarrio(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los barrios</option>
                    {filterOptions.barrios.map(barrio => (
                      <option key={barrio} value={barrio}>{barrio}</option>
                    ))}
                  </select>
                </div>
                
                {/* Botones de acción */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedComuna('all')
                      setSelectedBarrio('all')
                      setSearchQuery('')
                    }}
                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => setActiveView('map')}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Ver Mapa
                  </button>
                </div>
              </div>
            )}
            
            {/* Vista de Capas del Mapa */}
            {activeView === 'map' && (
              <div className="p-4 space-y-4 overflow-y-auto">
                <h3 className="font-bold text-gray-800 mb-4">🗺️ Control de Capas</h3>
                
                <div className="space-y-3">
                  {Object.entries(LAYER_CONFIG).map(([layerId, config]) => (
                    <div key={layerId} className="group">
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
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
                          <div className="font-medium text-gray-900">{config.name}</div>
                          <div className="text-xs text-gray-500">{config.description}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {filteredData[layerId]?.features?.length || 0} elementos
                          </div>
                        </div>
                        
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 capitalize">
                          {config.category}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Estado de carga */}
                {loading && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-700 font-medium">Cargando datos...</span>
                  </div>
                )}
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-700 font-medium">⚠️ Error</div>
                    <div className="text-xs text-red-600 mt-1">{error}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mapa principal */}
      <div className="absolute inset-0 pt-20" style={{ left: showDashboard ? '336px' : '0' }}>
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Renderizar capas filtradas */}
          {Object.entries(filteredData).map(([layerId, data]) => {
            const config = LAYER_CONFIG[layerId as keyof typeof LAYER_CONFIG]
            if (!config || !visibleLayers[layerId] || !data?.features) return null
            
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
                  layer.on('click', () => handleFeatureClick(feature, layer))
                  
                  // Popup mejorado
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
          })}
        </MapContainer>
      </div>

      {/* Indicador de filtros activos */}
      {(selectedCategory !== 'all' || selectedComuna !== 'all' || selectedBarrio !== 'all' || searchQuery) && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-orange-100 border border-orange-300 rounded-lg p-3">
          <div className="flex items-center gap-2 text-orange-800">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros activos</span>
          </div>
          <div className="text-xs text-orange-700 mt-1">
            {dashboardStats.totalFeatures} elementos mostrados
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicMapDashboard
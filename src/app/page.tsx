'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import StatsCards from '@/components/StatsCards'
import BudgetChart from '@/components/BudgetChart'
import dynamic from 'next/dynamic'
import ProjectMapWithPanels from '@/components/ProjectMapWithPanels'
import SimpleMapLayout from '@/components/SimpleMapLayout'
import ProjectsTable, { Project } from '@/components/ProjectsTable'
import ProjectsUnitsTable, { ProjectUnit } from '@/components/ProjectsUnitsTable'
import GeoJSONDiagnostics from '@/components/GeoJSONDiagnostics'
import UnifiedFilters, { FilterState } from '@/components/UnifiedFilters'
import { useDashboard, useDashboardFilters } from '@/context/DashboardContext'
import { DataProvider, useDataContext } from '@/context/DataContext'
import { loadAllUnidadesProyecto } from '@/utils/geoJSONLoader'
import { type UnidadProyecto } from '@/hooks/useUnidadesProyecto'
import { 
  BarChart3, 
  Map as MapIcon, 
  Table, 
  Filter,
  TrendingUp,
  PieChart,
  FileText,
  Activity,
  Package
} from 'lucide-react'

// Componentes dinámicos
const ChoroplethMapInteractive = dynamic(() => import('@/components/ChoroplethMapInteractive'), { ssr: false })

type ActiveTab = 'overview' | 'projects' | 'project_units' | 'contracts' | 'activities' | 'products' | 'diagnostics'

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  )
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  
  // Usar el contexto global del dashboard
  const { state, getFilteredCount, exportData } = useDashboard()
  const { filters, updateFilters, activeFiltersCount } = useDashboardFilters()

  // Conectar los filtros del dashboard con el DataContext
  const { setFilters: setDataContextFilters } = useDataContext()

  // Estado para datos de unidades de proyecto - usando geoJSONLoader directo como el mapa
  const [unidadesProyecto, setUnidadesProyecto] = useState<UnidadProyecto[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  // Cargar datos directamente como lo hace el mapa
  useEffect(() => {
    const loadUnidadesData = async () => {
      try {
        console.log('🔄 === INICIANDO CARGA TABLA UNIDADES DE PROYECTO ===')
        setDataLoading(true)
        setDataError(null)
        
        // Usar exactamente la misma función que usa el mapa
        const allGeoJSONData = await loadAllUnidadesProyecto({
          processCoordinates: true,
          cache: true
        })
        
        console.log('✅ Datos cargados para tabla:', allGeoJSONData)
        
        // Convertir GeoJSON a formato de tabla (mismo proceso que usa el hook)
        const allFeatures: UnidadProyecto[] = []

        Object.entries(allGeoJSONData).forEach(([fileName, geoJSONData]) => {
          if (geoJSONData && geoJSONData.features && Array.isArray(geoJSONData.features)) {
            console.log(`📊 Procesando ${fileName}: ${geoJSONData.features.length} features`)
            
            const source = fileName.includes('equipamientos') ? 'equipamientos' : 'infraestructura'
            const features = geoJSONData.features.map((feature: any, index: number) => {
              const props = feature.properties || {}
              
              return {
                id: props.identificador?.toString() || props.id_via?.toString() || `${fileName}-${index}`,
                bpin: props.bpin?.toString() || '0',
                name: props.nickname || props.nombre_unidad_proyecto || props.seccion_via || `Unidad ${props.identificador || index}`,
                status: 'En Ejecución' as const,
                comuna: props.comuna_corregimiento,
                barrio: props.barrio_vereda,
                budget: props.ppto_base || 0,
                executed: props.pagos_realizados || 0,
                pagado: props.pagos_realizados || 0,
                beneficiaries: props.usuarios_beneficiarios || 0,
                startDate: props.fecha_inicio_real || props.fecha_inicio_planeado || '2024-01-01',
                endDate: props.fecha_fin_real || props.fecha_fin_planeado || '2024-12-31',
                responsible: props.nombre_centro_gestor || 'No especificado',
                progress: (props.avance_físico_obra || 0) * 100,
                tipoIntervencion: 'Construcción' as const,
                claseObra: props.clase_obra,
                descripcion: props.descripcion_intervencion,
                direccion: props.direccion,
                geometry: feature.geometry,
                source: source as 'equipamientos' | 'infraestructura'
              }
            })
            
            allFeatures.push(...features)
          }
        })

        console.log(`🎯 Total unidades procesadas para tabla: ${allFeatures.length}`)
        
        // Debug: Mostrar ejemplos de comunas para verificar formato
        const comunasEjemplos = allFeatures.slice(0, 10).map(u => ({
          name: u.name,
          comuna: u.comuna,
          raw_comuna: u.comuna
        }))
        console.log('📍 Ejemplos de comunas en datos:', comunasEjemplos)
        
        setUnidadesProyecto(allFeatures)
        
      } catch (error) {
        console.error('❌ Error cargando datos para tabla:', error)
        setDataError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setDataLoading(false)
      }
    }

    loadUnidadesData()
  }, [])

  // Debug logs
  useEffect(() => {
    console.log('🔍 DEBUG page.tsx - Datos cargados:', {
      unidadesProyectoLength: unidadesProyecto.length,
      loading: dataLoading,
      error: dataError,
      primerasUnidades: unidadesProyecto.slice(0, 3)
    })
  }, [unidadesProyecto, dataLoading, dataError])

  // Sincronizar filtros entre DashboardContext y DataContext
  useEffect(() => {
    // Convertir filtros del dashboard al formato del DataContext
    const dataContextFilters = {
      search: filters.search || '',
      bpin: '',
      periodo: '',
      periodos: filters.periodos || [],
      centroGestor: filters.centroGestor || [],
      comunas: filters.comunas || [],
      barrios: filters.barrios || [],
      corregimientos: filters.corregimientos || [],
      veredas: filters.veredas || [],
      fuentesFinanciamiento: filters.fuentesFinanciamiento || [],
      estado: filters.estado === 'all' ? '' : filters.estado || ''
    }
    
    setDataContextFilters(dataContextFilters)
  }, [filters, setDataContextFilters])

  // Lógica de filtrado para unidades de proyecto usando datos reales
  const filteredProjectUnits: UnidadProyecto[] = useMemo(() => {
    return unidadesProyecto.filter(unit => {
      // Filtro por búsqueda de texto (solo se aplica si NO hay filtros específicos activos)
      if (filters.search && filters.comunas.length === 0 && filters.barrios.length === 0 && filters.corregimientos.length === 0) {
        const searchTerm = filters.search.toLowerCase()
        const searchFields = [
          unit.name,
          unit.bpin,
          unit.responsible,
          unit.comuna,
          unit.barrio,
          unit.corregimiento,
          unit.vereda,
          unit.tipoIntervencion,
          unit.claseObra,
          unit.descripcion
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(searchTerm)) return false
      }

      // Filtro por estado
      if (filters.estado !== 'all' && unit.status !== filters.estado) {
        return false
      }

      // Filtro por centro gestor
      if (filters.centroGestor.length > 0 && unit.responsible) {
        if (!filters.centroGestor.includes(unit.responsible)) return false
      }

      // Filtro por comunas - COMPARACIÓN EXACTA
      if (filters.comunas.length > 0) {
        if (!unit.comuna || !filters.comunas.some(filterComuna => 
          unit.comuna?.trim().toLowerCase() === filterComuna.trim().toLowerCase()
        )) {
          return false
        }
      }

      // Filtro por barrios - COMPARACIÓN EXACTA
      if (filters.barrios.length > 0) {
        if (!unit.barrio || !filters.barrios.some(filterBarrio => 
          unit.barrio?.trim().toLowerCase() === filterBarrio.trim().toLowerCase()
        )) {
          return false
        }
      }

      // Filtro por corregimientos - COMPARACIÓN EXACTA
      if (filters.corregimientos.length > 0) {
        if (!unit.corregimiento || !filters.corregimientos.some(filterCorregimiento => 
          unit.corregimiento?.trim().toLowerCase() === filterCorregimiento.trim().toLowerCase()
        )) {
          return false
        }
      }

      // Filtro por veredas - COMPARACIÓN EXACTA
      if (filters.veredas.length > 0) {
        if (!unit.vereda || !filters.veredas.some(filterVereda => 
          unit.vereda?.trim().toLowerCase() === filterVereda.trim().toLowerCase()
        )) {
          return false
        }
      }

      return true
    })
  }, [filters, unidadesProyecto])

  // Debug logs para datos filtrados
  useEffect(() => {
    console.log('🔍 DEBUG filteredProjectUnits:', {
      originalLength: unidadesProyecto.length,
      filteredLength: filteredProjectUnits.length,
      filters: filters,
      comunasFiltradas: filters.comunas,
      primerosFiltrados: filteredProjectUnits.slice(0, 5).map(u => ({
        name: u.name,
        comuna: u.comuna,
        barrio: u.barrio
      }))
    })
  }, [filteredProjectUnits, unidadesProyecto, filters])

  const tabs = [
    { id: 'overview' as const, label: 'Vista General', icon: BarChart3 },
    { id: 'projects' as const, label: 'Proyectos', icon: Table },
    { id: 'project_units' as const, label: 'Unidades de Proyecto', icon: MapIcon },
    { id: 'activities' as const, label: 'Actividades', icon: Activity },
    { id: 'products' as const, label: 'Productos', icon: Package },
    { id: 'contracts' as const, label: 'Contratos', icon: FileText, disabled: true },
    { id: 'diagnostics' as const, label: 'Diagnósticos GeoJSON', icon: FileText }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            <StatsCards />
            
            {/* Charts Row */}
            <div className="w-full">
              <BudgetChart />
            </div>
            
            {/* Mapa Coroplético Principal */}
            <div className="w-full">
              <ChoroplethMapInteractive />
            </div>
          </div>
        )

      case 'projects':
        return (
          <div className="space-y-8">
            <ProjectsTable />
          </div>
        )

      case 'project_units':
        return (
          <div className="space-y-8">
            {/* Mapa con paneles integrado */}
            <div className="w-full">
              <ProjectMapWithPanels 
                className="w-full" 
                height="800px"
              />
            </div>
            
            {/* Tabla de unidades de proyecto */}
            <div className="w-full">
              <ProjectsUnitsTable 
                projectUnits={unidadesProyecto} 
                filteredProjectUnits={filteredProjectUnits} 
              />
            </div>
          </div>
        )

      case 'contracts':
        return (
          <div className="space-y-8">
            <div className="w-full">
              <BudgetChart />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <ChoroplethMapInteractive />
              </div>
              <div>
                <StatsCards />
              </div>
            </div>
          </div>
        )

      case 'activities':
        return (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Activity className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Actividades</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 dark:text-white">Filtros Activos:</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <li>Búsqueda: {filters.search || 'Sin filtro'}</li>
                      <li>Estado: {filters.estado === 'all' ? 'Todos' : filters.estado}</li>
                      <li>Comunas: {filters.comunas.length > 0 ? filters.comunas.join(', ') : 'Todas'}</li>
                      <li>Barrios: {filters.barrios.length > 0 ? filters.barrios.join(', ') : 'Todos'}</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200">Total Actividades</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">245</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800 dark:text-green-200">Completadas</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">189</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Lista de actividades que se actualizarán automáticamente según los filtros seleccionados.
                </p>
              </div>
            </div>
          </div>
        )

      case 'products':
        return (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Productos</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 dark:text-white">Filtros Activos:</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <li>Búsqueda: {filters.search || 'Sin filtro'}</li>
                      <li>Estado: {filters.estado === 'all' ? 'Todos' : filters.estado}</li>
                      <li>Períodos: {filters.periodos?.length > 0 ? filters.periodos.join(', ') : 'Todos'}</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800 dark:text-purple-200">Total Productos</h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">156</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-orange-800 dark:text-orange-200">En Desarrollo</h3>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">67</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Catálogo de productos que se actualizarán automáticamente según los filtros seleccionados.
                </p>
              </div>
            </div>
          </div>
        )

      case 'diagnostics':
        return (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Diagnósticos GeoJSON</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verificación de archivos GeoJSON en unidades de proyecto
                </p>
              </div>
              <GeoJSONDiagnostics />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      
      <main className={`px-6 py-8 ${activeTab === 'project_units' ? 'max-w-none mx-4' : 'container mx-auto'}`}>
        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg border border-gray-100 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isDisabled = tab.disabled
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isDisabled
                      ? 'text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'
                      : activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={isDisabled ? 'Disponible próximamente' : ''}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {isDisabled && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full ml-1">
                      Próximamente
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Filtros Transversales - Aparecen en todas las pestañas */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <UnifiedFilters 
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  )
}
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import StatsCards from '@/components/StatsCards'
import BudgetAnalysisChart from '@/components/BudgetAnalysisChart'
import ModernBudgetAnalysis from '@/components/ModernBudgetAnalysis'
import IntegratedAnalysisDashboard from '@/components/IntegratedAnalysisDashboard'
import OptimizedProjectSection from '@/components/OptimizedProjectSection'
import dynamic from 'next/dynamic'
import SimpleMapLayout from '@/components/SimpleMapLayout'
import ProjectsTable, { Project } from '@/components/ProjectsTable'
import UnifiedFilters from '@/components/UnifiedFilters'
import { useDashboard, useDashboardFilters } from '@/context/DashboardContext'
import { DataProvider, useDataContext } from '@/context/DataContext'
import { useUnidadesProyecto, type UnidadProyecto } from '@/hooks/useUnidadesProyectoWorking'
import IntegratedProjectsContracts from '@/components/IntegratedProjectsContracts'
// import { useGlobalDataPreloader } from '@/hooks/useGlobalDataPreloader'
// import { useUnidadesProyectoSimple } from '@/hooks/useUnidadesProyectoSimple'
// import { useUnidadesProyectoForced } from '@/hooks/useUnidadesProyectoForced'
import { useActividades, type Actividad } from '@/hooks/useActividades'
import { useProductos, type Producto } from '@/hooks/useProductos'
import { useContratos, useContratosMetrics, type Contrato } from '@/hooks/useContratos'
import { useEmprestito, useEmprestitoMetrics } from '@/hooks/useEmprestito'
import { useFlujoCaja } from '@/hooks/useFlujoCaja'
import { useProcesos, useProcesosMetrics, type Proceso } from '@/hooks/useProcesos'
import ActividadesTable from '@/components/ActividadesTable'
import ActividadesStats from '@/components/ActividadesStats'
import ActividadesCharts from '@/components/ActividadesCharts'
import ProductosTable from '@/components/ProductosTable'
import ProductosStats from '@/components/ProductosStats'
import ProductosCharts from '@/components/ProductosCharts'
import ContratosTable from '@/components/ContratosTable'
import ContratosStats from '@/components/ContratosStats'
import ContratosCharts from '@/components/ContratosCharts'
import EmprestitoStats from '@/components/EmprestitoStats'
import EmprestitoCharts from '@/components/EmprestitoCharts'
import EmprestitoContractsChart from '@/components/EmprestitoContractsChart'
import EmprestitoTabs from '@/components/EmprestitoTabs'
import ProcesosTable from '@/components/ProcesosTable'
import ProcesosStats from '@/components/ProcesosStats'
import ProcesosCharts from '@/components/ProcesosCharts'
import { 
  BarChart3, 
  Table, 
  Filter,
  TrendingUp,
  PieChart,
  ChevronDown
} from 'lucide-react'
import { CATEGORIES, ANIMATIONS } from '@/lib/design-system'
import MobileNavigation from '@/components/MobileNavigation'

// Componentes dinámicos
const ChoroplethMapInteractive = dynamic(() => import('@/components/ChoroplethMapInteractive'), { ssr: false })

type ActiveTab = 'projects' | 'contracts' | 'activities' | 'products' | 'emprestito' | 'procesos'

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  )
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects') // Proyectos por defecto
  
  // Detectar parámetros URL para activar el fix
  const [useFix, setUseFix] = useState(false)
  
  // Usar el contexto global del dashboard
  const { state, getFilteredCount, exportData } = useDashboard()
  const { filters, updateFilters, activeFiltersCount } = useDashboardFilters()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setUseFix(urlParams.has('fix'))
      
      // Manejar parámetros de navegación desde el modal
      const tabParam = urlParams.get('tab')
      const bpinParam = urlParams.get('bpin')
      
      if (tabParam && ['activities', 'products'].includes(tabParam)) {
        setActiveTab(tabParam as ActiveTab)
        
        // Si hay BPIN, aplicar filtro
        if (bpinParam) {
          updateFilters({
            ...filters,
            search: bpinParam // Usar búsqueda para filtrar por BPIN
          })
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Estado para la unidad de proyecto seleccionada desde la tabla
  const [selectedProjectUnitFromTable, setSelectedProjectUnitFromTable] = useState<UnidadProyecto | null>(null)
  
  // Estado para mostrar/ocultar la sección de Análisis de Intervenciones (oculta por defecto)
  const [showInterventionAnalysis, setShowInterventionAnalysis] = useState(false)
  
  // Estado para BPIN filtrados desde Empréstito
  const [filteredBpinsFromContracts, setFilteredBpinsFromContracts] = useState<number[] | undefined>(undefined)
  
  // Función para manejar cuando se hace clic en el ojito en la tabla
  const handleViewProjectUnitInPanel = (projectUnit: UnidadProyecto) => {
    console.log('👁️ Mostrando unidad de proyecto en panel:', projectUnit)
    setSelectedProjectUnitFromTable(projectUnit)
  }

  // Función para manejar cambios en BPIN filtrados desde Empréstito
  const handleFilteredBpinsChange = (bpins: number[] | undefined) => {
    console.log('🔍 BPIN filtrados actualizados:', bpins)
    setFilteredBpinsFromContracts(bpins)
  }

  // TEMPORALMENTE COMENTADO: Pre-carga de datos al iniciar la aplicación
  // const globalPreloader = useGlobalDataPreloader()
  // console.log('🌍 MAIN: Global preloader result:', {
  //   loading: globalPreloader.loading,
  //   unidades: globalPreloader.unidadesProyecto.length,
  //   geoJSONKeys: Object.keys(globalPreloader.allGeoJSONData),
  //   error: globalPreloader.error
  // })

  // Conectar los filtros del dashboard con el DataContext y obtener proyectos
  const { 
    setFilters: setDataContextFilters, 
    proyectos = [], 
    loading: proyectosLoading 
  } = useDataContext()

  // Usar el hook principal para obtener datos de unidades de proyecto
  const unidadesState = useUnidadesProyecto()
  const { unidadesProyecto, loading: dataLoading, error: dataError } = unidadesState

  // TEMPORALMENTE COMENTADO: Hook optimizado
  // const optimizedUnidades = useUnidadesProyectoOptimized()
  // console.log('🎯 MAIN: Hook optimizado result:', {
  //   loading: optimizedUnidades.loading,
  //   error: optimizedUnidades.error,
  //   unidades: optimizedUnidades.unidadesProyecto.length,
  //   dataKeys: Object.keys(optimizedUnidades.allGeoJSONData)
  // })

  // TEMPORALMENTE COMENTADO: Hook simple para verificar useEffect
  // const simpleTest = useUnidadesProyectoSimple()
  // console.log('🟢 MAIN: Simple hook result:', simpleTest)

  // Hooks para actividades y productos
  const actividadesState = useActividades()
  const productosState = useProductos()
  
  // Hook para empréstito
  const emprestitoState = useEmprestito()
  const emprestitoMetrics = useEmprestitoMetrics(emprestitoState.data)
  
  // Hook para flujo de caja (específico para serie de tiempo)
  const flujoCajaState = useFlujoCaja()

  // Hook para contratos
  const contratosState = useContratos()

  // Hook para procesos
  const procesosState = useProcesos()
  const procesosMetrics = useProcesosMetrics(procesosState.data.procesos)

  // Sincronizar filtros entre DashboardContext y DataContext
  useEffect(() => {
    // Convertir filtros del dashboard al formato del DataContext
    const dataContextFilters = {
      search: filters.search || '',
      bpin: '',
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

  // Lógica de filtrado para unidades de proyecto usando datos del hook principal
  const filteredProjectUnits: UnidadProyecto[] = useMemo(() => {
    // Usar datos del hook principal
    const sourceUnidades = unidadesProyecto
    
    return sourceUnidades.filter((unit: UnidadProyecto) => {
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

  // Lógica de filtrado avanzada para actividades
  const filteredActividades: Actividad[] = useMemo(() => {
    return actividadesState.actividades.filter(activity => {
      // Obtener el proyecto relacionado por BPIN para aplicar filtros de proyecto
      const relatedProject = proyectos.find(p => p.bpin === activity.bpin)

      // Filtro por búsqueda de texto (incluye datos del proyecto)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchFields = [
          activity.nombre_actividad,
          activity.descripcion_actividad,
          activity.cod_centro_gestor?.toString(),
          activity.bpin?.toString(),
          // Incluir datos del proyecto relacionado
          relatedProject?.nombre_proyecto,
          relatedProject?.nombre_centro_gestor
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(searchTerm)) return false
      }

      // Filtro por centro gestor (usando proyecto relacionado)
      if (filters.centroGestor && filters.centroGestor.length > 0 && relatedProject?.nombre_centro_gestor) {
        if (!filters.centroGestor.includes(relatedProject.nombre_centro_gestor)) return false
      }

      // Filtro por estado del proyecto (si hay proyecto relacionado)
      if (filters.estado !== 'all' && relatedProject?.estado) {
        if (relatedProject.estado !== filters.estado) return false
      }

      // Filtro por fuentes de financiamiento (usando proyecto relacionado)
      if (filters.fuentesFinanciamiento && filters.fuentesFinanciamiento.length > 0 && relatedProject?.nombre_fondo) {
        if (!filters.fuentesFinanciamiento.some(fuente => 
          relatedProject.nombre_fondo?.toLowerCase().includes(fuente.toLowerCase())
        )) return false
      }

      // Filtro por estado de actividad
      if (filters.estado && filters.estado !== 'all') {
        const activityState = activity.avance_actividad === 0 ? 'no_iniciada' :
                             activity.avance_actividad === 1 ? 'completada' :
                             activity.avance_actividad >= 0.8 ? 'cercana_terminar' : 'en_ejecucion'
        
        if (filters.estado !== activityState) return false
      }

      return true
    })
  }, [filters, actividadesState.actividades, proyectos])

  // Lógica de filtrado avanzada para productos
  const filteredProductos: Producto[] = useMemo(() => {
    return productosState.productos.filter(product => {
      // Obtener el proyecto relacionado por BPIN para aplicar filtros de proyecto
      const relatedProject = proyectos.find(p => p.bpin === product.bpin)

      // Filtro por búsqueda de texto (incluye datos del proyecto)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchFields = [
          product.nombre_producto,
          product.descripcion_avance_producto,
          product.tipo_meta_producto,
          product.bpin?.toString(),
          // Incluir datos del proyecto relacionado
          relatedProject?.nombre_proyecto,
          relatedProject?.nombre_centro_gestor
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(searchTerm)) return false
      }

      // Filtro por centro gestor (usando proyecto relacionado)
      if (filters.centroGestor && filters.centroGestor.length > 0 && relatedProject?.nombre_centro_gestor) {
        if (!filters.centroGestor.includes(relatedProject.nombre_centro_gestor)) return false
      }
      // Filtro por estado del proyecto (si hay proyecto relacionado) o estado de producto
      if (filters.estado !== 'all') {
        // Si estamos en la sección de productos, aplicar lógica específica de estado de producto
        if (activeTab === 'products') {
          const productState = product.avance_producto === 0 ? 'no_iniciado' :
                              product.avance_producto === 1 ? 'completado' : 'en_proceso'
          
          if (filters.estado !== productState) return false
        } else if (relatedProject?.estado) {
          // Para otras secciones, usar el estado del proyecto relacionado
          if (relatedProject.estado !== filters.estado) return false
        }
      }

      // Filtro por fuentes de financiamiento (usando proyecto relacionado)
      if (filters.fuentesFinanciamiento && filters.fuentesFinanciamiento.length > 0 && relatedProject?.nombre_fondo) {
        if (!filters.fuentesFinanciamiento.some(fuente => 
          relatedProject.nombre_fondo?.toLowerCase().includes(fuente.toLowerCase())
        )) return false
      }

      return true
    })
  }, [filters, productosState.productos, proyectos, activeTab])

  // Calcular métricas filtradas para actividades
  const filteredActividadesMetrics = useMemo(() => {
    if (filteredActividades.length === 0) {
      return {
        totalActividades: 0,
        completedActivities: 0,
        inProgressActivities: 0,
        notStartedActivities: 0,
        activitiesWithoutDates: 0,
        averageProgress: 0
      }
    }

    // Separar actividades sin fechas
    const activitiesWithoutDates = filteredActividades.filter(a => 
      !a.fecha_inicio_actividad || !a.fecha_fin_actividad
    ).length
    
    // Para el resto de métricas, considerar solo actividades con fechas
    const activitiesWithDates = filteredActividades.filter(a => 
      a.fecha_inicio_actividad && a.fecha_fin_actividad
    )

    const completedActivities = activitiesWithDates.filter(a => a.avance_actividad === 1).length
    const inProgressActivities = activitiesWithDates.filter(a => a.avance_actividad > 0 && a.avance_actividad < 1).length
    const notStartedActivities = activitiesWithDates.filter(a => a.avance_actividad === 0).length
    const averageProgress = filteredActividades.reduce((sum, a) => sum + a.avance_actividad, 0) / filteredActividades.length

    return {
      totalActividades: filteredActividades.length,
      completedActivities,
      inProgressActivities,
      notStartedActivities,
      activitiesWithoutDates,
      averageProgress
    }
  }, [filteredActividades])

  // Calcular métricas filtradas para productos
  const filteredProductosMetrics = useMemo(() => {
    if (filteredProductos.length === 0) {
      return {
        totalProductos: 0,
        completedProducts: 0,
        inProgressProducts: 0,
        notStartedProducts: 0,
        averageProgress: 0,
        productsByType: {}
      }
    }

    const completedProducts = filteredProductos.filter(p => p.avance_producto >= p.cantidad_programada_producto).length
    const inProgressProducts = filteredProductos.filter(p => p.avance_producto > 0 && p.avance_producto < p.cantidad_programada_producto).length
    const notStartedProducts = filteredProductos.filter(p => p.avance_producto === 0).length
    
    const averageProgress = filteredProductos.reduce((sum, p) => {
      const progress = p.cantidad_programada_producto > 0 ? p.avance_producto / p.cantidad_programada_producto : 0
      return sum + Math.min(progress, 1)
    }, 0) / filteredProductos.length

    // Agrupación por tipo de producto (filtrado)
    const productsByType = filteredProductos.reduce((acc, producto) => {
      const type = producto.nombre_producto
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalProductos: filteredProductos.length,
      completedProducts,
      inProgressProducts,
      notStartedProducts,
      averageProgress,
      productsByType
    }
  }, [filteredProductos])

  // Lógica de filtrado para contratos
  const filteredContratos: Contrato[] = useMemo(() => {
    return contratosState.data.contratos.filter(contrato => {
      // Filtro por búsqueda de texto
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchFields = [
          contrato.referencia_contrato,
          contrato.proveedor_adjudicado,
          contrato.descripcion_proceso,
          contrato.nombre_entidad,
          contrato.sector,
          contrato.bpin?.toString()
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(searchTerm)) return false
      }

      // Filtro por estado del proyecto relacionado (si existe)
      if (filters.estado !== 'all') {
        const relatedProject = proyectos.find(p => String(p.bpin) === String(contrato.bpin))
        if (relatedProject && relatedProject.estado !== filters.estado) {
          return false
        }
      }

      return true
    })
  }, [filters, contratosState.data.contratos, proyectos])

  // Calcular métricas filtradas para contratos usando el hook
  const filteredContratosMetrics = useContratosMetrics(filteredContratos)



  const renderContent = () => {
    // Mostrar estado de carga unificado - usar preloader global como fuente principal
    const isLoading = dataLoading || 
                     (activeTab === 'activities' && actividadesState.loading) || 
                     (activeTab === 'products' && productosState.loading) ||
                     (activeTab === 'emprestito' && emprestitoState.loading) ||
                     (activeTab === 'contracts' && contratosState.loading) ||
                     (activeTab === 'procesos' && procesosState.loading)
                     
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando datos del proyecto...</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              {activeTab === 'activities' && 'Cargando actividades...'}
              {activeTab === 'products' && 'Cargando productos...'}
              {activeTab === 'emprestito' && 'Cargando datos de empréstito...'}
              {activeTab === 'procesos' && 'Cargando procesos...'}
              {activeTab === 'contracts' && 'Cargando contratos...'}
              {!['activities', 'products', 'emprestito', 'procesos', 'contracts'].includes(activeTab) && 'Obteniendo información...'}
            </p>
          </div>
        </div>
      )
    }

    // Mostrar estado de error unificado - usar preloader global como fuente principal
    const hasError = dataError || 
                    (activeTab === 'activities' && actividadesState.error) || 
                    (activeTab === 'products' && productosState.error) ||
                    (activeTab === 'emprestito' && emprestitoState.error) ||
                    (activeTab === 'contracts' && contratosState.error) ||
                    (activeTab === 'procesos' && procesosState.error)
    if (hasError) {
      const errorMessage = dataError || actividadesState.error || productosState.error || emprestitoState.error || contratosState.error || procesosState.error
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 mb-4">Error cargando datos: {errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'projects':
        return (
          <div className="space-y-6">
            {/* Stats Cards mejoradas */}
            <StatsCards />
            
            {/* Layout principal optimizado */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* TABLA DE PROYECTOS - Elemento principal (100% del ancho) */}
              <div className="xl:col-span-4 order-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                  {/* Contenido de la tabla */}
                  <div className="overflow-hidden">
                    <ProjectsTable className="w-full" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sección Optimizada de Análisis de Proyectos */}
            <OptimizedProjectSection />
          </div>
        )

      case 'contracts':
        return (
          <div className="space-y-6">
            {/* Estadísticas de contratos */}
            <ContratosStats 
              totalContratos={filteredContratosMetrics.totalContratos}
              totalValorContratos={filteredContratosMetrics.totalValorContratos}
              valorPagado={filteredContratosMetrics.valorPagado}
              valorPendientePago={filteredContratosMetrics.valorPendientePago}
              valorPendienteEjecucion={filteredContratosMetrics.valorPendienteEjecucion}
              contratosLiquidados={filteredContratosMetrics.contratosLiquidados}
              contratosModificados={filteredContratosMetrics.contratosModificados}
              contratosConPagoAdelantado={filteredContratosMetrics.contratosConPagoAdelantado}
              loading={contratosState.loading}
            />
            
            {/* Gráficos de contratos */}
            <ContratosCharts 
              contratos={filteredContratos}
              loading={contratosState.loading}
            />
            
            {/* Tabla de contratos */}
            <ContratosTable 
              contratos={contratosState.data.contratos}
              filteredContratos={filteredContratos}
              loading={contratosState.loading}
            />
          </div>
        )

      case 'activities':
        return (
          <div className="space-y-8">
            {/* Estadísticas de actividades */}
            <ActividadesStats
              totalActividades={filteredActividadesMetrics.totalActividades}
              completedActivities={filteredActividadesMetrics.completedActivities}
              inProgressActivities={filteredActividadesMetrics.inProgressActivities}
              notStartedActivities={filteredActividadesMetrics.notStartedActivities}
              activitiesWithoutDates={filteredActividadesMetrics.activitiesWithoutDates}
              averageProgress={filteredActividadesMetrics.averageProgress}
              loading={actividadesState.loading}
            />
            
            {/* Gráficos de actividades */}
            <ActividadesCharts
              actividades={filteredActividades}
              loading={actividadesState.loading}
            />
            
            {/* Tabla de actividades */}
            <ActividadesTable
              actividades={actividadesState.actividades}
              filteredActividades={filteredActividades}
              loading={actividadesState.loading}
            />
          </div>
        )

      case 'products':
        return (
          <div className="space-y-8">
            {/* Estadísticas de productos */}
            <ProductosStats
              totalProductos={filteredProductosMetrics.totalProductos}
              completedProducts={filteredProductosMetrics.completedProducts}
              inProgressProducts={filteredProductosMetrics.inProgressProducts}
              notStartedProducts={filteredProductosMetrics.notStartedProducts}
              averageProgress={filteredProductosMetrics.averageProgress}
              productsByType={filteredProductosMetrics.productsByType}
              loading={productosState.loading}
            />
            
            {/* Gráficos de productos */}
            <ProductosCharts
              productos={filteredProductos}
              loading={productosState.loading}
            />
            
            {/* Tabla de productos */}
            <ProductosTable
              productos={productosState.productos}
              filteredProductos={filteredProductos}
              loading={productosState.loading}
            />
          </div>
        )

      case 'emprestito':
        return (
          <div className="space-y-8">
            {/* Componente de tabs con las tres secciones principales */}
            <EmprestitoTabs
              flujoCajaData={flujoCajaState.data}
              flujoCajaLoading={flujoCajaState.loading}
              onFilteredBpinsChange={handleFilteredBpinsChange}
            />
            
            {/* Seguimiento a Proyectos y Contratos de Empréstito - Mantenido fijo por debajo */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <IntegratedProjectsContracts onFilteredBpinsChange={handleFilteredBpinsChange} />
            </div>
          </div>
        )

      case 'procesos':
        return (
          <div className="space-y-8">
            {/* Estadísticas de procesos */}
            <ProcesosStats
              totalProcesos={procesosMetrics.totalProcesos}
              procesosAdjudicados={procesosMetrics.procesosAdjudicados}
              procesosNoAdjudicados={procesosMetrics.procesosNoAdjudicados}
              valorTotalProcesos={procesosMetrics.valorTotalProcesos}
              valorTotalAdjudicado={procesosMetrics.valorTotalAdjudicado}
              promedioVisualizaciones={procesosMetrics.promedioVisualizaciones}
              promedioProveedoresInteres={procesosMetrics.promedioProveedoresInteres}
              procesosPorEstado={procesosMetrics.procesosPorEstado}
            />
            
            {/* Gráficos de procesos */}
            <ProcesosCharts
              procesosPorEstado={procesosMetrics.procesosPorEstado}
              procesosPorFase={procesosMetrics.procesosPorFase}
              procesosPorModalidad={procesosMetrics.procesosPorModalidad}
              procesosPorMes={procesosMetrics.procesosPorMes}
              procesosPorEntidad={procesosMetrics.procesosPorEntidad}
            />
            
            {/* Tabla de procesos */}
            <ProcesosTable
              procesos={procesosState.data.procesos}
              loading={procesosState.loading}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      
      <main className={`px-4 md:px-6 py-6 md:py-8 container mx-auto`}>
        {/* Navigation Tabs - Ahora responsivo */}
        <MobileNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Filtros Transversales - Aparecen en todas las pestañas */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <UnifiedFilters 
            filters={filters}
            onFiltersChange={updateFilters}
            activeTab={activeTab}
            allProjects={proyectos.map(proyecto => ({ proyecto }))}
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
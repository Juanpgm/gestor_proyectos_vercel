'use client'

import UnidadesProyecto from '@/components/UnidadesProyecto'

import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import MainLayout from '@/components/MainLayout'
import StatsCards from '@/components/StatsCards'
import ProjectsTable from '@/components/ProjectsTable'
import { DataProvider, useDataContext } from '@/context/DataContext'

import MobileNavigation from '@/components/MobileNavigation'
// Lazy load del componente EmprestitoTabs para mejorar performance
const EmprestitoTabs = lazy(() => import('@/components/EmprestitoTabs'))
import { useActividades, type Actividad } from '@/hooks/useActividades'
import { useProductos, type Producto } from '@/hooks/useProductos'
import { useContratos, useContratosMetrics, type Contrato } from '@/hooks/useContratos'
import { useEmprestito, useEmprestitoMetrics } from '@/hooks/useEmprestito'
import { useEmprestitoAutoNotifications } from '@/hooks/useEmprestitoNotifications'
import { useAllAutoNotifications } from '@/hooks/useAutoNotifications'
import { useFlujoCaja } from '@/hooks/useFlujoCaja'
import { useProcesos, useProcesosMetrics, type Proceso } from '@/hooks/useProcesos'
import { useDashboard, useDashboardFilters } from '@/context/DashboardContext'
import ActividadesTable from '@/components/ActividadesTable'
import ActividadesStats from '@/components/ActividadesStats'
import ActividadesCharts from '@/components/ActividadesCharts'
import ProductosTable from '@/components/ProductosTable'
import ProductosStats from '@/components/ProductosStats'
import ProductosCharts from '@/components/ProductosCharts'
import ContratosTable from '@/components/ContratosTable'
import ContratosStats from '@/components/ContratosStats'
import ContratosCharts from '@/components/ContratosCharts'
import ProcesosTable from '@/components/ProcesosTable'
import ProcesosStats from '@/components/ProcesosStats'
import SectionFeatureTour from '@/components/SectionFeatureTour'
import { useAuth } from '@/context/AuthContext'

type ActiveTab = 'projects' | 'project_units' | 'contracts' | 'activities' | 'products' | 'emprestito' | 'procesos'

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects')
  const [filteredBpinsFromContracts, setFilteredBpinsFromContracts] = useState<number[] | undefined>(undefined)
  const { state: authState, getHighestRole } = useAuth()
  const highestRole = getHighestRole()
  
  // Usar el contexto global del dashboard
  const { state, getFilteredCount, exportData } = useDashboard()
  const { filters, updateFilters, activeFiltersCount } = useDashboardFilters()

  // Conectar los filtros del dashboard con el DataContext y obtener proyectos
  const { 
    setFilters: setDataContextFilters, 
    proyectos = [], 
    loading: proyectosLoading 
  } = useDataContext()

  // Hooks para todas las secciones
  const actividadesState = useActividades()
  const productosState = useProductos()
  const contratosState = useContratos()
  // OPTIMIZACIÓN: Solo cargar Empréstito cuando esté activo
  const emprestitoState = useEmprestito(activeTab === 'emprestito')
  const emprestitoMetrics = useEmprestitoMetrics(emprestitoState.data)
  const flujoCajaState = useFlujoCaja()
  const procesosState = useProcesos()
  const procesosMetrics = useProcesosMetrics(procesosState.data.procesos)

  // Hook para notificaciones automáticas de empréstito
  useEmprestitoAutoNotifications({
    reportes: emprestitoState.data.contratos, // Los contratos son los reportes
    contratos: emprestitoState.data.contratos,
    enabled: true // Cambiar a false para desactivar notificaciones automáticas
  })

  // Hook para notificaciones automáticas de todos los módulos
  useAllAutoNotifications({
    proyectos: proyectos,
    contratos: contratosState.data.contratos,
    actividades: actividadesState.actividades,
    enabled: true // Cambiar a false para desactivar notificaciones automáticas
  })

  // Función para manejar cambios en BPIN filtrados desde Empréstito
  const handleFilteredBpinsChange = (bpins: number[] | undefined) => {
    setFilteredBpinsFromContracts(bpins)
  }

  // Sincronizar filtros entre DashboardContext y DataContext
  useEffect(() => {
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

  // Lógica de filtrado para actividades
  const filteredActividades: Actividad[] = useMemo(() => {
    return actividadesState.actividades.filter(activity => {
      const relatedProject = proyectos.find(p => p.bpin === activity.bpin)

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchFields = [
          activity.nombre_actividad,
          activity.descripcion_actividad,
          activity.cod_centro_gestor?.toString(),
          activity.bpin?.toString(),
          relatedProject?.nombre_proyecto,
          relatedProject?.nombre_centro_gestor
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(searchTerm)) return false
      }

      if (filters.centroGestor && filters.centroGestor.length > 0 && relatedProject?.nombre_centro_gestor) {
        if (!filters.centroGestor.includes(relatedProject.nombre_centro_gestor)) return false
      }

      if (filters.estado !== 'all' && relatedProject?.estado) {
        if (relatedProject.estado !== filters.estado) return false
      }

      return true
    })
  }, [filters, actividadesState.actividades, proyectos])

  // Lógica de filtrado para productos
  const filteredProductos: Producto[] = useMemo(() => {
    return productosState.productos.filter(product => {
      const relatedProject = proyectos.find(p => p.bpin === product.bpin)

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchFields = [
          product.nombre_producto,
          product.descripcion_avance_producto,
          product.tipo_meta_producto,
          product.bpin?.toString(),
          relatedProject?.nombre_proyecto,
          relatedProject?.nombre_centro_gestor
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(searchTerm)) return false
      }

      if (filters.centroGestor && filters.centroGestor.length > 0 && relatedProject?.nombre_centro_gestor) {
        if (!filters.centroGestor.includes(relatedProject.nombre_centro_gestor)) return false
      }

      if (filters.estado !== 'all') {
        if (activeTab === 'products') {
          const productState = product.avance_producto === 0 ? 'no_iniciado' :
                              product.avance_producto === 1 ? 'completado' : 'en_proceso'
          
          if (filters.estado !== productState) return false
        } else if (relatedProject?.estado) {
          if (relatedProject.estado !== filters.estado) return false
        }
      }

      return true
    })
  }, [filters, productosState.productos, proyectos, activeTab])

  // Lógica de filtrado para contratos
  const filteredContratos: Contrato[] = useMemo(() => {
    return contratosState.data.contratos.filter(contrato => {
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

      if (filters.estado !== 'all') {
        const relatedProject = proyectos.find(p => String(p.bpin) === String(contrato.bpin))
        if (relatedProject && relatedProject.estado !== filters.estado) {
          return false
        }
      }

      return true
    })
  }, [filters, contratosState.data.contratos, proyectos])

  // Calcular métricas filtradas
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

    const activitiesWithoutDates = filteredActividades.filter(a => 
      !a.fecha_inicio_actividad || !a.fecha_fin_actividad
    ).length
    
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

  const filteredContratosMetrics = useContratosMetrics(filteredContratos)

  const renderContent = () => {
    // Mostrar estado de carga unificado
    const isLoading = (activeTab === 'activities' && actividadesState.loading) || 
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
            </p>
          </div>
        </div>
      )
    }

    // Mostrar estado de error unificado
    const hasError = (activeTab === 'activities' && actividadesState.error) || 
                    (activeTab === 'products' && productosState.error) ||
                    (activeTab === 'emprestito' && emprestitoState.error) ||
                    (activeTab === 'contracts' && contratosState.error) ||
                    (activeTab === 'procesos' && procesosState.error)
    if (hasError) {
      const errorMessage = actividadesState.error || productosState.error || emprestitoState.error || contratosState.error || procesosState.error
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
            <div data-tour-id="section-projects-stats">
              <StatsCards />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-4 order-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                  <div className="overflow-hidden" data-tour-id="section-projects-table">
                    <ProjectsTable className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'project_units':
        return (
          <div className="space-y-6">
            <div data-tour-id="section-project-units-main">
              <UnidadesProyecto />
            </div>
          </div>
        )

      case 'contracts':
        return (
          <div className="space-y-6">
            <div data-tour-id="section-contracts-stats">
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
            </div>
            
            <div data-tour-id="section-contracts-charts">
              <ContratosCharts 
                contratos={filteredContratos}
                loading={contratosState.loading}
              />
            </div>
            
            <div data-tour-id="section-contracts-table">
              <ContratosTable 
                contratos={contratosState.data.contratos}
                filteredContratos={filteredContratos}
                loading={contratosState.loading}
              />
            </div>
          </div>
        )

      case 'activities':
        return (
          <div className="space-y-8">
            <div data-tour-id="section-activities-stats">
              <ActividadesStats
                totalActividades={filteredActividadesMetrics.totalActividades}
                completedActivities={filteredActividadesMetrics.completedActivities}
                inProgressActivities={filteredActividadesMetrics.inProgressActivities}
                notStartedActivities={filteredActividadesMetrics.notStartedActivities}
                activitiesWithoutDates={filteredActividadesMetrics.activitiesWithoutDates}
                averageProgress={filteredActividadesMetrics.averageProgress}
                loading={actividadesState.loading}
              />
            </div>
            
            <div data-tour-id="section-activities-charts">
              <ActividadesCharts
                actividades={filteredActividades}
                loading={actividadesState.loading}
              />
            </div>
            
            <div data-tour-id="section-activities-table">
              <ActividadesTable
                actividades={actividadesState.actividades}
                filteredActividades={filteredActividades}
                loading={actividadesState.loading}
              />
            </div>
          </div>
        )

      case 'products':
        return (
          <div className="space-y-8">
            <div data-tour-id="section-products-stats">
              <ProductosStats
                totalProductos={filteredProductosMetrics.totalProductos}
                completedProducts={filteredProductosMetrics.completedProducts}
                inProgressProducts={filteredProductosMetrics.inProgressProducts}
                notStartedProducts={filteredProductosMetrics.notStartedProducts}
                averageProgress={filteredProductosMetrics.averageProgress}
                productsByType={filteredProductosMetrics.productsByType}
                loading={productosState.loading}
              />
            </div>
            
            <div data-tour-id="section-products-charts">
              <ProductosCharts
                productos={filteredProductos}
                loading={productosState.loading}
              />
            </div>
            
            <div data-tour-id="section-products-table">
              <ProductosTable
                productos={productosState.productos}
                filteredProductos={filteredProductos}
                loading={productosState.loading}
              />
            </div>
          </div>
        )

      case 'emprestito':
        return (
          <div className="space-y-8" data-tour-id="section-emprestito-main">
            <Suspense 
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando módulo de Empréstito...</p>
                  </div>
                </div>
              }
            >
              <EmprestitoTabs
                flujoCajaData={flujoCajaState.data}
                flujoCajaLoading={flujoCajaState.loading}
                onFilteredBpinsChange={handleFilteredBpinsChange}
              />
            </Suspense>
          </div>
        )

      case 'procesos':
        return (
          <div className="space-y-8">
            <div data-tour-id="section-procesos-stats">
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
            </div>
            
            <div data-tour-id="section-procesos-table">
              <ProcesosTable
                procesos={procesosState.data.procesos}
                loading={procesosState.loading}
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-blue-500 text-4xl mb-4">🚧</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sección "{activeTab}" en desarrollo
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Esta funcionalidad se agregará pronto
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <main className="px-2 sm:px-4 lg:px-6 py-4">
        {/* Navegación optimizada para todos los dispositivos */}
        <MobileNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex justify-end mb-3">
          <SectionFeatureTour
            activeTab={activeTab}
            highestRole={highestRole}
            userId={authState.user?.uid || authState.user?.email}
          />
        </div>

        {/* Contenido principal con animaciones mejoradas */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DataProvider>
      <MainLayout>
        <DashboardContent />
      </MainLayout>
    </DataProvider>
  )
}
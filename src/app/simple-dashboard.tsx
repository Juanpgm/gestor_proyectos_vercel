'use client'

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { getAllUnidadesProyecto, type UnidadProyectoGeo, type UnidadProyectoFilters } from '@/services/unidadesProyectoApi'
import SimpleFilters from '@/components/SimpleFilters'
import { RefreshCw, MapPin, BarChart3, Eye } from 'lucide-react'

// Import dinámico del mapa simple
const SimpleMap = dynamic(() => import('@/components/SimpleMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Cargando mapa...</div>
    </div>
  )
})

export default function Dashboard() {
  const [data, setData] = useState<UnidadProyectoGeo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UnidadProyectoFilters>({})
  const [selectedFeature, setSelectedFeature] = useState<UnidadProyectoGeo | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const result = await getAllUnidadesProyecto()
        setData(result)
        setError(null)
      } catch (err) {
        console.error('Error cargando datos:', err)
        setError('Error cargando los datos de proyectos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtrar datos basado en los filtros aplicados
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Filtro por búsqueda de texto
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          item.nombre,
          item.bpin?.toString(),
          item.nombre_centro_gestor,
          item.comuna,
          item.barrio
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) return false
      }

      // Filtro por estado
      if (filters.estado && filters.estado !== item.estado) {
        return false
      }

      // Filtro por comuna
      if (filters.comuna && filters.comuna !== item.comuna) {
        return false
      }

      // Filtro por centro gestor
      if (filters.centro_gestor && filters.centro_gestor !== item.nombre_centro_gestor) {
        return false
      }

      return true
    })
  }, [data, filters])

  // Opciones disponibles para los filtros
  const filterOptions = useMemo(() => {
    const estados = Array.from(new Set(data.map(item => item.estado).filter(Boolean))) as string[]
    const comunas = Array.from(new Set(data.map(item => item.comuna).filter(Boolean))) as string[]
    const centrosGestor = Array.from(new Set(data.map(item => item.nombre_centro_gestor).filter(Boolean))) as string[]
    const tiposIntervencion = Array.from(new Set(data.map(item => item.tipo_intervencion).filter(Boolean))) as string[]

    return {
      estados: estados.sort(),
      comunas: comunas.sort(),
      centrosGestor: centrosGestor.sort(),
      tiposIntervencion: tiposIntervencion.sort()
    }
  }, [data])

  // Estadísticas básicas
  const stats = useMemo(() => {
    const total = filteredData.length
    const conEstado = filteredData.filter(item => item.estado).length
    const conUbicacion = filteredData.filter(item => item.coordinates?.lat && item.coordinates?.lng).length
    const presupuestoTotal = filteredData.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0)

    return {
      total,
      conEstado,
      conUbicacion,
      presupuestoTotal
    }
  }, [filteredData])

  const handleFeatureClick = (feature: UnidadProyectoGeo) => {
    setSelectedFeature(feature)
  }

  const refreshData = async () => {
    try {
      setLoading(true)
      const result = await getAllUnidadesProyecto()
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error actualizando datos:', err)
      setError('Error actualizando los datos')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simple */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gestor de Proyectos - Cali
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visualización de unidades de proyecto
                </p>
              </div>
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total proyectos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.total.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Con estado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.conEstado.toLocaleString()}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Con ubicación</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.conUbicacion.toLocaleString()}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Presupuesto total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : `$${(stats.presupuestoTotal / 1000000).toFixed(1)}M`}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <SimpleFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableOptions={filterOptions}
        />

        {/* Mapa */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mapa de Proyectos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {filteredData.length} de {data.length} proyectos
            </p>
          </div>
          
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
                </div>
              </div>
            )}
            
            <SimpleMap
              data={filteredData}
              onFeatureClick={handleFeatureClick}
              height={600}
              className="w-full"
            />
          </div>
        </div>

        {/* Panel de detalles del proyecto seleccionado */}
        {selectedFeature && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalles del Proyecto
              </h3>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedFeature.nombre}
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>BPIN:</strong> {selectedFeature.bpin}</p>
                  <p><strong>Estado:</strong> {selectedFeature.estado}</p>
                  <p><strong>Centro Gestor:</strong> {selectedFeature.nombre_centro_gestor}</p>
                  <p><strong>Tipo:</strong> {selectedFeature.tipo_intervencion}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ubicación</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Comuna:</strong> {selectedFeature.comuna}</p>
                  <p><strong>Barrio:</strong> {selectedFeature.barrio}</p>
                  {selectedFeature.presupuesto_base && (
                    <p><strong>Presupuesto:</strong> ${selectedFeature.presupuesto_base.toLocaleString()}</p>
                  )}
                  {selectedFeature.avance_obra && (
                    <p><strong>Avance:</strong> {(selectedFeature.avance_obra * 100).toFixed(1)}%</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
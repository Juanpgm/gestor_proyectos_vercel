"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Table, Filter, Search, RefreshCw, ChevronDown } from 'lucide-react';
import { CATEGORIES, CSS_UTILS, ANIMATIONS, formatNumber } from '@/lib/design-system';

interface UnidadProyecto {
  upid: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

interface UnidadProyectoAttributes {
  upid: string;
  nombre_up: string;
  estado: string;
  tipo_intervencion: string;
  nombre_centro_gestor: string;
  comuna_corregimiento: string;
  barrio_vereda: string;
  presupuesto_base: string;
  avance_obra: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion_intervencion: string;
}

interface DashboardData {
  resumen_general: {
    total_unidades: number;
    proyectos_activos: number;
    proyectos_finalizados: number;
    tasa_completitud: number;
  };
  distribucion_geografica: {
    por_comuna_corregimiento: {
      conteos: Record<string, number>;
      porcentajes: Record<string, number>;
      top_3: [string, number][];
    };
    por_barrio_vereda: {
      conteos: Record<string, number>;
      porcentajes: Record<string, number>;
      top_3: [string, number][];
    };
  };
  kpis_negocio: {
    proyectos_activos: number;
    proyectos_finalizados: number;
    tasa_completitud: number;
    diversidad_tipos: number;
    centros_gestores_activos: number;
    cobertura_territorial: {
      comunas_corregimientos: number;
      barrios_veredas: number;
    };
  };
}

interface FiltersData {
  estados: string[];
  tipos_intervencion: string[];
  centros_gestores: string[];
  comunas_corregimientos: string[];
  barrios_veredas: string[];
  fuentes_financiacion: string[];
  anos: string[];
}

const UnidadesProyecto: React.FC = () => {
  const [geometryData, setGeometryData] = useState<UnidadProyecto[]>([]);
  const [attributesData, setAttributesData] = useState<UnidadProyectoAttributes[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [filtersData, setFiltersData] = useState<FiltersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [selectedCentro, setSelectedCentro] = useState<string>('');
  const [selectedComuna, setSelectedComuna] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState('tabla');

  // Fetch data from API using proxy
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 UnidadesProyecto: Iniciando carga de datos...');
      
      const [geometry, attributes, dashboard, filters] = await Promise.all([
        fetch('/api/proxy/unidades-proyecto/geometry').then(async res => {
          if (!res.ok) throw new Error(`Error en geometry: ${res.status}`);
          const data = await res.json();
          console.log('✅ Geometry data loaded:', data?.data?.length || 0, 'items');
          return data;
        }),
        fetch('/api/proxy/unidades-proyecto/attributes').then(async res => {
          if (!res.ok) throw new Error(`Error en attributes: ${res.status}`);
          const data = await res.json();
          console.log('✅ Attributes data loaded:', data?.data?.length || 0, 'items');
          return data;
        }),
        fetch('/api/proxy/unidades-proyecto/dashboard').then(async res => {
          if (!res.ok) throw new Error(`Error en dashboard: ${res.status}`);
          const data = await res.json();
          console.log('✅ Dashboard data loaded:', data?.data ? 'OK' : 'Empty');
          return data;
        }),
        fetch('/api/proxy/unidades-proyecto/filters').then(async res => {
          if (!res.ok) throw new Error(`Error en filters: ${res.status}`);
          const data = await res.json();
          console.log('✅ Filters data loaded:', data?.data ? 'OK' : 'Empty');
          return data;
        })
      ]);

      setGeometryData(geometry.data || []);
      setAttributesData(attributes.data || []);
      setDashboardData(dashboard.data);
      setFiltersData(filters.data);
      
      console.log('🎉 UnidadesProyecto: Todos los datos cargados exitosamente');
      
    } catch (err) {
      console.error('❌ UnidadesProyecto: Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data based on selected filters and search term
  const filteredData = useMemo(() => {
    let filtered = attributesData;

    if (selectedEstado) {
      filtered = filtered.filter(item => item.estado === selectedEstado);
    }
    if (selectedTipo) {
      filtered = filtered.filter(item => item.tipo_intervencion === selectedTipo);
    }
    if (selectedCentro) {
      filtered = filtered.filter(item => item.nombre_centro_gestor === selectedCentro);
    }
    if (selectedComuna) {
      filtered = filtered.filter(item => item.comuna_corregimiento === selectedComuna);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.nombre_up?.toLowerCase().includes(term) ||
        item.descripcion_intervencion?.toLowerCase().includes(term) ||
        item.barrio_vereda?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [attributesData, selectedEstado, selectedTipo, selectedCentro, selectedComuna, searchTerm]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedEstado('');
    setSelectedTipo('');
    setSelectedCentro('');
    setSelectedComuna('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando datos de unidades de proyecto...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={`${CSS_UTILS.card} w-96 p-6`}>
          <div className="text-center text-red-600">
            <p className="font-semibold">Error al cargar los datos</p>
            <p className="text-sm mt-2">{error}</p>
            <button 
              onClick={fetchData} 
              className={`${CATEGORIES.projects.className.button} mt-4 px-4 py-2 rounded-lg flex items-center gap-2 mx-auto`}
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${CSS_UTILS.card} p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${CATEGORIES.projects.className.bg}`}>
            <Table className={`w-6 h-6 ${CATEGORIES.projects.className.text}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Unidades de Proyecto
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualización de unidades de proyecto con tabla y análisis
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="xl:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Estado Filter */}
          <div className="relative">
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos los estados</option>
              {filtersData?.estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Tipo Filter */}
          <div className="relative">
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos los tipos</option>
              {filtersData?.tipos_intervencion.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Centro Gestor Filter */}
          <div className="relative">
            <select
              value={selectedCentro}
              onChange={(e) => setSelectedCentro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos los centros</option>
              {filtersData?.centros_gestores.map(centro => (
                <option key={centro} value={centro}>{centro}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Comuna Filter */}
          <div className="relative">
            <select
              value={selectedComuna}
              onChange={(e) => setSelectedComuna(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todas las comunas</option>
              {filtersData?.comunas_corregimientos.map(comuna => (
                <option key={comuna} value={comuna}>{comuna}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className={`${CATEGORIES.projects.className.button} px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Active Filters */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-wrap gap-2">
            {selectedEstado && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm cursor-pointer" onClick={() => setSelectedEstado('')}>
                Estado: {selectedEstado} ×
              </span>
            )}
            {selectedTipo && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm cursor-pointer" onClick={() => setSelectedTipo('')}>
                Tipo: {selectedTipo} ×
              </span>
            )}
            {selectedCentro && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm cursor-pointer" onClick={() => setSelectedCentro('')}>
                Centro: {selectedCentro} ×
              </span>
            )}
            {selectedComuna && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm cursor-pointer" onClick={() => setSelectedComuna('')}>
                Comuna: {selectedComuna} ×
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm cursor-pointer" onClick={() => setSearchTerm('')}>
                Búsqueda: {searchTerm} ×
              </span>
            )}
          </div>
          {(selectedEstado || selectedTipo || selectedCentro || selectedComuna || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredData.length} de {attributesData.length} unidades de proyecto
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className={`${CSS_UTILS.card} p-6`}>
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('tabla')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'tabla'
                ? `${CATEGORIES.projects.className.button}`
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Table className="h-4 w-4" />
            Tabla
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? `${CATEGORIES.projects.className.button}`
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >

        {/* Map Tab */}
        {/* Table Tab */}
        {activeTab === 'tabla' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-600 dark:text-gray-400">Cargando tabla...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">UPID</th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Nombre</th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Estado</th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Tipo</th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Centro Gestor</th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Comuna</th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Avance</th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Presupuesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 50).map((item, index) => (
                      <tr key={item.upid} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 font-mono text-sm text-gray-900 dark:text-white">{item.upid}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">{item.nombre_up}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.estado === 'Finalizado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            item.estado === 'ACTIVO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">{item.tipo_intervencion}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">{item.nombre_centro_gestor}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">{item.comuna_corregimiento}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white">{item.avance_obra}%</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right text-sm text-gray-900 dark:text-white">
                          {item.presupuesto_base ? formatNumber(parseFloat(item.presupuesto_base)) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length > 50 && (
                  <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
                    Mostrando los primeros 50 resultados de {filteredData.length} total
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
                </div>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`${CSS_UTILS.card} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Proyectos Activos</p>
                        <p className="text-2xl font-bold text-green-600">{dashboardData?.kpis_negocio?.proyectos_activos || 0}</p>
                      </div>
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                  <div className={`${CSS_UTILS.card} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Proyectos Finalizados</p>
                        <p className="text-2xl font-bold text-blue-600">{dashboardData?.kpis_negocio?.proyectos_finalizados || 0}</p>
                      </div>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className={`${CSS_UTILS.card} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Completitud</p>
                        <p className="text-2xl font-bold text-purple-600">{dashboardData?.kpis_negocio?.tasa_completitud || 0}%</p>
                      </div>
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Comuna Distribution */}
                  <div className={`${CSS_UTILS.card} p-4`}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top 3 Comunas</h3>
                    <div className="space-y-3">
                      {dashboardData?.distribucion_geografica?.por_comuna_corregimiento?.top_3?.map(([comuna, count], index) => (
                        <div key={comuna} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-3 ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{comuna}</span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cobertura Territorial */}
                  <div className={`${CSS_UTILS.card} p-4`}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cobertura Territorial</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Comunas/Corregimientos:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.kpis_negocio?.cobertura_territorial?.comunas_corregimientos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Barrios/Veredas:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.kpis_negocio?.cobertura_territorial?.barrios_veredas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Centros Gestores:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.kpis_negocio?.centros_gestores_activos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tipos de Intervención:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.kpis_negocio?.diversidad_tipos}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UnidadesProyecto;
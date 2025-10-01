"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  TrendingUp,
  RefreshCw,
  X,
  Layers,
  Satellite,
  ChevronDown
} from 'lucide-react';
import { CSS_UTILS, CATEGORIES } from '@/lib/design-system';
import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ScatterChart, 
  Scatter as RechartsScatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Componente de mapa simplificado
const MapComponent: React.FC<{
  geometryData: GeometryData | null;
  filteredData: AttributeData[];
}> = ({ geometryData, filteredData }) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  
  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
          <button
            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
            className={`p-2 rounded transition-colors ${
              mapType === 'satellite' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={mapType === 'streets' ? 'Vista satelital' : 'Vista de calles'}
          >
            {mapType === 'streets' ? <Satellite className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 text-xs">
          <div className="text-gray-700 dark:text-gray-300 font-medium mb-1">Leyenda</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">80-100%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600 dark:text-gray-400">60-79%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600 dark:text-gray-400">40-59%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">20-39%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-600 dark:text-gray-400">0-19%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder del mapa */}
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Mapa de Unidades de Proyecto
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vista {mapType === 'streets' ? 'de calles' : 'satelital'}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="text-blue-600 dark:text-blue-400 font-semibold">
                {geometryData?.features?.length || 0}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total puntos</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="text-green-600 dark:text-green-400 font-semibold">
                {filteredData.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Filtrados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de cantidad de puntos */}
      <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {filteredData.length} unidades mostradas
        </div>
      </div>
    </div>
  );
};

// Tipos de datos basados en la API
interface GeometryData {
  type: string;
  features: {
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    properties: {
      upid: string;
      avance_obra?: number;
      fuente_financiacion?: string;
      nombre_centro_gestor?: string;
      ano?: number;
      presupuesto_base?: number;
      [key: string]: any;
    };
  }[];
}

interface AttributeData {
  upid: string;
  nombre_up: string;
  estado: string;
  tipo_intervencion: string;
  nombre_centro_gestor: string;
  comuna_corregimiento: string;
  barrio_vereda: string;
  presupuesto_base: number;
  avance_obra: number;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion_intervencion: string;
  fuente_financiacion: string;
  ano: number;
  [key: string]: any;
}

interface FilterData {
  estados: string[];
  tipos_intervencion: string[];
  centros_gestores: string[];
  comunas_corregimientos: string[];
  fuentes_financiacion: string[];
  anos: number[];
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AttributeData | null;
}

// Modal de detalles
const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Detalles de la Unidad de Proyecto
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">UPID</label>
              <p className="text-gray-900 dark:text-white font-mono">{data.upid}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</label>
              <p className="text-gray-900 dark:text-white">{data.nombre_up}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
              <p className="text-gray-900 dark:text-white">{data.estado}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo Intervención</label>
              <p className="text-gray-900 dark:text-white">{data.tipo_intervencion}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Centro Gestor</label>
              <p className="text-gray-900 dark:text-white">{data.nombre_centro_gestor}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Avance Obra</label>
              <p className="text-gray-900 dark:text-white">{data.avance_obra}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Presupuesto Base</label>
              <p className="text-gray-900 dark:text-white">
                ${data.presupuesto_base?.toLocaleString('es-CO')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fuente Financiación</label>
              <p className="text-gray-900 dark:text-white">{data.fuente_financiacion}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</label>
              <p className="text-gray-900 dark:text-white">{data.descripcion_intervencion}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Componente principal
const UnidadesProyecto: React.FC = () => {
  // Estados principales
  const [geometryData, setGeometryData] = useState<GeometryData | null>(null);
  const [attributeData, setAttributeData] = useState<AttributeData[]>([]);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    estado: '',
    tipo_intervencion: '',
    centro_gestor: '',
    comuna: '',
    fuente_financiacion: '',
    ano: ''
  });
  
  // Estados de UI
  const [selectedRecord, setSelectedRecord] = useState<AttributeData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'mapa' | 'tabla' | 'graficos'>('mapa');
  
  // Colores para gráficos
  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  // Función para obtener datos de la API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [geometryResponse, attributesResponse, filtersResponse] = await Promise.all([
        fetch('/api/proxy/unidades-proyecto/geometry'),
        fetch('/api/proxy/unidades-proyecto/attributes'),
        fetch('/api/proxy/unidades-proyecto/filters')
      ]);

      if (geometryResponse.ok) {
        const geometry = await geometryResponse.json();
        setGeometryData(geometry);
      }

      if (attributesResponse.ok) {
        const attributes = await attributesResponse.json();
        setAttributeData(attributes);
      }

      if (filtersResponse.ok) {
        const filters = await filtersResponse.json();
        setFilterData(filters);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Datos filtrados
  const filteredData = useMemo(() => {
    if (!Array.isArray(attributeData)) {
      return [];
    }
    
    return attributeData.filter(item => {
      const matchesSearch = !searchTerm || 
        item.nombre_up?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descripcion_intervencion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.upid?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilters = Object.entries(selectedFilters).every(([key, value]) => {
        if (!value) return true;
        
        switch (key) {
          case 'estado':
            return item.estado === value;
          case 'tipo_intervencion':
            return item.tipo_intervencion === value;
          case 'centro_gestor':
            return item.nombre_centro_gestor === value;
          case 'comuna':
            return item.comuna_corregimiento === value;
          case 'fuente_financiacion':
            return item.fuente_financiacion === value;
          case 'ano':
            return item.ano?.toString() === value;
          default:
            return true;
        }
      });

      return matchesSearch && matchesFilters;
    });
  }, [attributeData, searchTerm, selectedFilters]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    if (!Array.isArray(filteredData) || !filteredData.length) return { bar: [], pie: [], scatter: [] };

    // Datos para gráfico de barras - Avance por Centro Gestor
    const avancePorCentro = filteredData.reduce((acc, item) => {
      const centro = item.nombre_centro_gestor || 'Sin especificar';
      if (!acc[centro]) acc[centro] = { total: 0, count: 0 };
      acc[centro].total += item.avance_obra || 0;
      acc[centro].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const barData = Object.entries(avancePorCentro)
      .map(([centro, data]) => ({
        name: centro.length > 20 ? centro.substring(0, 20) + '...' : centro,
        avance: Math.round(data.total / data.count)
      }))
      .sort((a, b) => b.avance - a.avance)
      .slice(0, 10);

    // Datos para gráfico circular - Distribución por Estado
    const estadoCount = filteredData.reduce((acc, item) => {
      const estado = item.estado || 'Sin especificar';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(estadoCount).map(([estado, count]) => ({
      name: estado,
      value: count
    }));

    // Datos para gráfico de dispersión - Presupuesto vs Avance
    const scatterData = filteredData
      .filter(item => item.presupuesto_base && item.avance_obra)
      .map(item => ({
        x: item.presupuesto_base / 1000000, // En millones
        y: item.avance_obra,
        name: item.nombre_up
      }))
      .slice(0, 100); // Limitar para mejor rendimiento

    return { bar: barData, pie: pieData, scatter: scatterData };
  }, [filteredData]);

  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      estado: '',
      tipo_intervencion: '',
      centro_gestor: '',
      comuna: '',
      fuente_financiacion: '',
      ano: ''
    });
    setSearchTerm('');
  };

  const openModal = (record: AttributeData) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  if (loading) {
    return (
      <main className="space-y-6">
        <section className={`${CSS_UTILS.card} p-6 text-center`}>
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Cargando datos de unidades de proyecto...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Header con fecha de actualización */}
      <section className={`${CSS_UTILS.card} p-4`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Unidades de Proyecto
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredData.length} de {attributeData.length} unidades
            </p>
          </div>
          {lastUpdate && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Última actualización:</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {lastUpdate.toLocaleString('es-CO')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Filtros */}
      <section className={`${CSS_UTILS.card} p-4`}>
        <div className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción, UPID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtros en grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <select
              value={selectedFilters.estado}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Todos los estados</option>
              {filterData?.estados?.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>

            <select
              value={selectedFilters.tipo_intervencion}
              onChange={(e) => handleFilterChange('tipo_intervencion', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Todos los tipos</option>
              {filterData?.tipos_intervencion?.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            <select
              value={selectedFilters.centro_gestor}
              onChange={(e) => handleFilterChange('centro_gestor', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Todos los centros</option>
              {filterData?.centros_gestores?.map(centro => (
                <option key={centro} value={centro}>{centro}</option>
              ))}
            </select>

            <select
              value={selectedFilters.fuente_financiacion}
              onChange={(e) => handleFilterChange('fuente_financiacion', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Todas las fuentes</option>
              {filterData?.fuentes_financiacion?.map(fuente => (
                <option key={fuente} value={fuente}>{fuente}</option>
              ))}
            </select>

            <select
              value={selectedFilters.ano}
              onChange={(e) => handleFilterChange('ano', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Todos los años</option>
              {filterData?.anos?.map(ano => (
                <option key={ano} value={ano.toString()}>{ano}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>
      </section>

      {/* Navegación de pestañas */}
      <section className={`${CSS_UTILS.card} p-1`}>
        <nav className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('mapa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'mapa'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Mapa
          </button>
          <button
            onClick={() => setActiveTab('tabla')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'tabla'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Tabla
          </button>
          <button
            onClick={() => setActiveTab('graficos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'graficos'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Gráficos
          </button>
        </nav>
      </section>

      {/* Contenido de pestañas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'mapa' && (
            <section className={`${CSS_UTILS.card} p-4`}>
              <div className="h-96">
                <MapComponent 
                  geometryData={geometryData}
                  filteredData={filteredData}
                />
              </div>
            </section>
          )}

          {activeTab === 'tabla' && (
            <section className={`${CSS_UTILS.card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        UPID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Avance
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Presupuesto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredData.slice(0, 50).map((item) => (
                      <tr key={item.upid} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">
                          {item.upid}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {item.nombre_up}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.estado === 'Activo' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {item.avance_obra}%
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          ${item.presupuesto_base?.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => openModal(item)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length > 50 && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Mostrando primeros 50 de {filteredData.length} registros
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'graficos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de barras */}
              <section className={`${CSS_UTILS.card} p-4`}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Avance Promedio por Centro Gestor
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.bar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avance" fill={CHART_COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>

              {/* Gráfico circular */}
              <section className={`${CSS_UTILS.card} p-4`}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Distribución por Estado
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.pie}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.pie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </section>

              {/* Gráfico de dispersión */}
              <section className={`${CSS_UTILS.card} p-4 lg:col-span-2`}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Presupuesto vs Avance de Obra
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Presupuesto (Millones COP)"
                      label={{ value: 'Presupuesto (Millones COP)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Avance (%)"
                      label={{ value: 'Avance (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <RechartsScatter 
                      name="Proyectos" 
                      data={chartData.scatter} 
                      fill={CHART_COLORS[2]} 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal de detalles */}
      <DetailModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={selectedRecord}
      />
    </main>
  );
};

export default UnidadesProyecto;

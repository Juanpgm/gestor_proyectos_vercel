"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  RefreshCw,
  X,
  Layers,
  Satellite
} from 'lucide-react';
import { CSS_UTILS } from '@/lib/design-system';
import dynamic from 'next/dynamic';

// Importación dinámica del componente de mapa
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

// Función para formatear valores monetarios de manera elegante
const formatCurrency = (amount: number): { formatted: string; unit: string } => {
  if (!amount || amount === 0) return { formatted: '0', unit: '' };
  
  if (amount >= 1000000000) {
    return {
      formatted: (amount / 1000000000).toFixed(1),
      unit: 'MM'
    };
  } else if (amount >= 1000000) {
    return {
      formatted: (amount / 1000000).toFixed(1),
      unit: 'M'
    };
  } else if (amount >= 1000) {
    return {
      formatted: (amount / 1000).toFixed(0),
      unit: 'K'
    };
  } else {
    return {
      formatted: amount.toLocaleString('es-CO'),
      unit: ''
    };
  }
};

// Componente de mapa real con Leaflet
const MapComponent: React.FC<{
  geometryData: GeometryData | null;
  filteredData: AttributeData[];
}> = ({ geometryData, filteredData }) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Detectar tema
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      setIsDark(htmlElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Observer para cambios de tema
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);




  if (!mounted) {
    return (
      <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
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

      {/* Mapa de Leaflet usando componente dinámico */}
      <LeafletMap
        geometryData={geometryData}
        filteredData={filteredData}
        mapType={mapType}
        isDark={isDark}
      />

      {/* Indicador de cantidad de features */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {geometryData?.features?.length || 0} elementos geográficos
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
  


  // Función para generar filtros dinámicamente desde los datos
  const generateFiltersFromData = (data: AttributeData[]): FilterData => {
    const estados = Array.from(new Set(data.map(item => item.estado).filter(Boolean))).sort();
    const tipos_intervencion = Array.from(new Set(data.map(item => item.tipo_intervencion).filter(Boolean))).sort();
    const centros_gestores = Array.from(new Set(data.map(item => item.nombre_centro_gestor).filter(Boolean))).sort();
    const comunas_corregimientos = Array.from(new Set(data.map(item => item.comuna_corregimiento).filter(Boolean))).sort();
    const fuentes_financiacion = Array.from(new Set(data.map(item => item.fuente_financiacion).filter(Boolean))).sort();
    const anos = Array.from(new Set(data.map(item => item.ano).filter(Boolean))).sort((a, b) => b - a);

    return {
      estados,
      tipos_intervencion,
      centros_gestores,
      comunas_corregimientos,
      fuentes_financiacion,
      anos
    };
  };

  // Función para obtener datos de la API
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('[FRONTEND] Starting data fetch...');
      
      const [geometryResponse, attributesResponse, filtersResponse] = await Promise.all([
        fetch('/api/proxy/unidades-proyecto/geometry'),
        fetch('/api/proxy/unidades-proyecto/attributes'),
        fetch('/api/proxy/unidades-proyecto/filters')
      ]);

      console.log('[FRONTEND] Response statuses:', {
        geometry: geometryResponse.status,
        attributes: attributesResponse.status,
        filters: filtersResponse.status
      });

      if (geometryResponse.ok) {
        const geometry = await geometryResponse.json();
        console.log('[FRONTEND] Geometry data:', geometry?.type, geometry?.features?.length ? `${geometry.features.length} features` : 'No features');
        console.log('[FRONTEND] Geometry count:', geometry?.count, 'Message:', geometry?.message);
        setGeometryData(geometry);
      } else {
        console.error('[FRONTEND] Geometry error:', await geometryResponse.text());
      }

      if (attributesResponse.ok) {
        const apiResponse = await attributesResponse.json();
        console.log('[FRONTEND] Attributes response:', apiResponse?.success ? 'Has success wrapper' : 'Direct data');
        console.log('[FRONTEND] Attributes count:', apiResponse?.count, 'Total before limit:', apiResponse?.total_before_limit);
        
        // Extraer datos de la nueva estructura de respuesta
        const attributes = apiResponse?.success && apiResponse?.data ? apiResponse.data : apiResponse;
        const attributesArray = Array.isArray(attributes) ? attributes : [];
        
        if (attributesArray.length > 0) {
          console.log('[FRONTEND] First attribute sample:', attributesArray[0]);
        }
        
        // Convertir Features a AttributeData plano
        const processedAttributes = attributesArray.map(feature => {
          if (feature.properties) {
            return {
              upid: feature.properties.upid || '',
              nombre_up: feature.properties.nombre_up || '',
              estado: feature.properties.estado || '',
              tipo_intervencion: feature.properties.tipo_intervencion || '',
              nombre_centro_gestor: feature.properties.nombre_centro_gestor || '',
              comuna_corregimiento: feature.properties.comuna_corregimiento || '',
              barrio_vereda: feature.properties.barrio_vereda || '',
              presupuesto_base: parseFloat(feature.properties.presupuesto_base) || 0,
              avance_obra: parseFloat(feature.properties.avance_obra) || 0,
              fecha_inicio: feature.properties.fecha_inicio || '',
              fecha_fin: feature.properties.fecha_fin || '',
              descripcion_intervencion: feature.properties.descripcion_intervencion || '',
              fuente_financiacion: feature.properties.fuente_financiacion || '',
              ano: parseInt(feature.properties.ano) || 0,
              ...feature.properties // Incluir todas las propiedades adicionales
            };
          }
          return feature; // En caso de que ya esté en formato plano
        });
        
        console.log('[FRONTEND] Processed attributes:', processedAttributes.length, 'items from', apiResponse?.count || 'unknown', 'total');
        if (processedAttributes.length > 0) {
          console.log('[FRONTEND] First processed item:', processedAttributes[0]);
        }
        
        console.log('[FRONTEND] Setting attributeData with', processedAttributes.length, 'items');
        setAttributeData(processedAttributes);
        console.log('[FRONTEND] attributeData state updated');
        
        // Generar filtros dinámicamente desde los datos procesados
        if (processedAttributes.length > 0) {
          const generatedFilters = generateFiltersFromData(processedAttributes);
          console.log('[FRONTEND] Generated filters:', Object.keys(generatedFilters).join(', '));
          setFilterData(generatedFilters);
        }
      } else {
        console.error('[FRONTEND] Attributes error:', await attributesResponse.text());
      }

      // Procesar filtros de la API si están disponibles
      if (filtersResponse.ok) {
        const apiResponse = await filtersResponse.json();
        console.log('[FRONTEND] Filters response:', apiResponse?.success ? 'Has success wrapper' : 'Direct data');
        console.log('[FRONTEND] Filters message:', apiResponse?.message);
        
        // Extraer filtros de la nueva estructura de respuesta
        const apiFilters = apiResponse?.success && apiResponse?.filters ? apiResponse.filters : apiResponse;
        
        // Convertir filtros de la API al formato esperado por el componente
        if (apiFilters && typeof apiFilters === 'object') {
          const convertedFilters: FilterData = {
            estados: apiFilters.estados || [],
            tipos_intervencion: apiFilters.tipos_intervencion || [],
            centros_gestores: apiFilters.centros_gestores || [],
            comunas_corregimientos: apiFilters.comunas || apiFilters.comunas_corregimientos || [],
            fuentes_financiacion: apiFilters.fuentes_financiacion || [],
            anos: apiFilters.anos ? apiFilters.anos.map((ano: string) => parseInt(ano)).filter((ano: number) => !isNaN(ano)) : []
          };
          
          console.log('[FRONTEND] Converted API filters:', Object.keys(convertedFilters).map(k => `${k}: ${convertedFilters[k as keyof FilterData].length}`).join(', '));
          
          // Usar filtros de la API si no hay datos procesados o como complemento
          if (!filterData || Object.values(filterData).every(arr => arr.length === 0)) {
            setFilterData(convertedFilters);
          }
        }
      } else {
        console.error('[FRONTEND] Filters error:', await filtersResponse.text());
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('[FRONTEND] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Datos filtrados
  const filteredData = useMemo(() => {
    console.log('[FRONTEND] Filtering data, attributeData:', Array.isArray(attributeData) ? `${attributeData.length} items` : typeof attributeData);
    
    if (!Array.isArray(attributeData)) {
      console.log('[FRONTEND] attributeData is not array, returning empty');
      return [];
    }
    
    if (attributeData.length === 0) {
      console.log('[FRONTEND] attributeData is empty array');
      return [];
    }
    
    const filtered = attributeData.filter(item => {
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
    
    console.log('[FRONTEND] Filtered result:', filtered.length, 'items');
    return filtered;
  }, [attributeData, searchTerm, selectedFilters]);

  // Geometría filtrada basada en los datos de atributos filtrados
  const filteredGeometryData = useMemo(() => {
    if (!geometryData || !geometryData.features || !filteredData) {
      return geometryData;
    }

    const filteredUPIDs = new Set(filteredData.map(item => item.upid));
    
    const filteredFeatures = geometryData.features.filter(feature => {
      return filteredUPIDs.has(feature.properties.upid);
    });

    return {
      ...geometryData,
      features: filteredFeatures
    };
  }, [geometryData, filteredData]);





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
      {/* Header simplificado */}
      <section className={`${CSS_UTILS.card} p-6`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Unidades de Proyecto
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredData?.length || 0} de {attributeData.length} unidades seleccionadas
            </p>
          </div>
          
          {lastUpdate && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>Última actualización:</span>
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-white mt-1">
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



      {/* Mapa principal */}
      <section className={`${CSS_UTILS.card} p-4`}>
        <div className="h-[500px] rounded-lg overflow-hidden">
          <MapComponent 
            geometryData={filteredGeometryData}
            filteredData={filteredData || []}
          />
        </div>
      </section>

      {/* Tabla de atributos mejorada */}
      <section className={`${CSS_UTILS.card} overflow-hidden`}>
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Tabla de Atributos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detalle de las unidades de proyecto filtradas
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700">
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                    UPID
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                    Proyecto
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                    Estado
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                    Ubicación
                  </div>
                </th>
                <th className="px-6 py-4 text-center">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                    Avance de Obra
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                    Presupuesto Base
                  </div>
                </th>
                <th className="px-6 py-4 text-center">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                    Acciones
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(filteredData || []).slice(0, 100).map((item, index) => {
                const currency = formatCurrency(item.presupuesto_base || 0);
                return (
                  <tr key={item.upid} className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                  }`}>
                    {/* UPID */}
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                          {item.upid}
                        </div>
                      </div>
                    </td>

                    {/* Proyecto */}
                    <td className="px-6 py-5">
                      <div className="max-w-sm">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                          {item.nombre_up}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                          <span className="inline-block w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mr-2"></span>
                          {item.tipo_intervencion}
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                        item.estado === 'Activo' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50'
                          : item.estado === 'En Ejecución'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50'
                          : item.estado === 'Finalizado'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50'
                      }`}>
                        {item.estado}
                      </span>
                    </td>

                    {/* Ubicación */}
                    <td className="px-6 py-5">
                      <div className="max-w-44">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.barrio_vereda}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.comuna_corregimiento}
                        </div>
                      </div>
                    </td>

                    {/* Avance de Obra */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center space-y-2">
                        {(() => {
                          const avanceDecimal = item.avance_obra || 0;
                          const avancePercent = Math.round(avanceDecimal * 100);
                          return (
                            <>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
                                <div 
                                  className={`h-2.5 rounded-full shadow-sm transition-all duration-500 ${
                                    avancePercent >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                    avancePercent >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                    avancePercent >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                    avancePercent >= 20 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                                  }`}
                                  style={{ width: `${Math.min(avancePercent, 100)}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-bold ${
                                avancePercent >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                                avancePercent >= 60 ? 'text-blue-600 dark:text-blue-400' :
                                avancePercent >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                                avancePercent >= 20 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {avancePercent}%
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Presupuesto */}
                    <td className="px-6 py-5">
                      <div className="text-right">
                        <div className="flex items-baseline justify-end space-x-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">$</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {currency.formatted}
                          </span>
                          {currency.unit && (
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                              {currency.unit}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-32" title={item.fuente_financiacion}>
                          {item.fuente_financiacion}
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openModal(item)}
                          className="group/btn inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                        >
                          <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Footer/Paginación */}
          {(filteredData?.length || 0) > 100 && (
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-semibold text-blue-600 dark:text-blue-400">1-100</span> de{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredData?.length || 0}</span> resultados
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  Use los filtros para refinar la búsqueda
                </div>
              </div>
            </div>
          )}
          
          {/* Estado vacío */}
          {(filteredData?.length || 0) === 0 && (
            <div className="px-6 py-16 text-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Ajusta los filtros para ver más unidades de proyecto
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

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

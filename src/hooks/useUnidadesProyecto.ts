'use client';

import { useState, useEffect, useMemo } from 'react';

// Tipos de datos basados en la API
export interface GeometryData {
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

export interface AttributeData {
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

export interface FilterData {
  estados: string[];
  tipos_intervencion: string[];
  centros_gestores: string[];
  comunas_corregimientos: string[];
  fuentes_financiacion: string[];
  anos: number[];
}

export interface DashboardData {
  resumen_general: {
    total_proyectos: number;
    con_geometria: number;
    con_atributos: number;
    porcentaje_geo: number;
  };
  distribuciones: {
    por_estado: { conteos: Record<string, number>; porcentajes: Record<string, number> };
    por_tipo_intervencion: { conteos: Record<string, number>; porcentajes: Record<string, number> };
    por_centro_gestor: { conteos: Record<string, number>; porcentajes: Record<string, number> };
    por_comuna_corregimiento: { conteos: Record<string, number>; porcentajes: Record<string, number> };
  };
  kpis_negocio: Record<string, any>;
  analisis_calidad: Record<string, any>;
}

export interface UseUnidadesProyectoResult {
  // Datos
  geometryData: GeometryData | null;
  attributeData: AttributeData[];
  filterData: FilterData | null;
  dashboardData: DashboardData | null;
  
  // Estados
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // Métodos
  refetchData: () => Promise<void>;
  
  // Utilidades
  getFilterOptions: () => FilterData | null;
  getTotalProjects: () => number;
  getProjectsByStatus: () => Record<string, number>;
}

export const useUnidadesProyecto = (): UseUnidadesProyectoResult => {
  // Estados principales
  const [geometryData, setGeometryData] = useState<GeometryData | null>(null);
  const [attributeData, setAttributeData] = useState<AttributeData[]>([]);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Función para obtener datos de la API
  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const [geometryResponse, attributesResponse, filtersResponse, dashboardResponse] = await Promise.all([
        fetch('/api/proxy/unidades-proyecto/geometry'),
        fetch('/api/proxy/unidades-proyecto/attributes'),
        fetch('/api/proxy/unidades-proyecto/filters'),
        fetch('/api/proxy/unidades-proyecto/dashboard')
      ]);

      // Procesar geometría
      if (geometryResponse.ok) {
        const geometry = await geometryResponse.json();
        setGeometryData(geometry);
      }

      // Procesar atributos
      if (attributesResponse.ok) {
        const apiResponse = await attributesResponse.json();
        const attributes = apiResponse?.success && apiResponse?.data ? apiResponse.data : apiResponse;
        const attributesArray = Array.isArray(attributes) ? attributes : [];
        
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
              avance_obra: (parseFloat(feature.properties.avance_obra) || 0) * 100,
              fecha_inicio: feature.properties.fecha_inicio || '',
              fecha_fin: feature.properties.fecha_fin || '',
              descripcion_intervencion: feature.properties.descripcion_intervencion || '',
              fuente_financiacion: feature.properties.fuente_financiacion || '',
              ano: parseInt(feature.properties.ano) || 0,
              ...feature.properties
            };
          }
          return feature;
        });
        
        setAttributeData(processedAttributes);
      }

      // Procesar filtros
      if (filtersResponse.ok) {
        const apiResponse = await filtersResponse.json();
        const apiFilters = apiResponse?.success && apiResponse?.filters ? apiResponse.filters : apiResponse;
        
        if (apiFilters && typeof apiFilters === 'object') {
          const convertedFilters: FilterData = {
            estados: apiFilters.estados || [],
            tipos_intervencion: apiFilters.tipos_intervencion || [],
            centros_gestores: apiFilters.centros_gestores || [],
            comunas_corregimientos: apiFilters.comunas || apiFilters.comunas_corregimientos || [],
            fuentes_financiacion: apiFilters.fuentes_financiacion || [],
            anos: apiFilters.anos ? apiFilters.anos.map((ano: string) => parseInt(ano)).filter((ano: number) => !isNaN(ano)) : []
          };
          
          setFilterData(convertedFilters);
        }
      }

      // Procesar dashboard
      if (dashboardResponse.ok) {
        const apiResponse = await dashboardResponse.json();
        const dashboard = apiResponse?.success && apiResponse?.dashboard ? apiResponse.dashboard : apiResponse;
        setDashboardData(dashboard);
      }

      setLastUpdate(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, []);

  // Función para refrescar datos manualmente
  const refetchData = async (): Promise<void> => {
    await fetchData();
  };

  // Función para obtener opciones de filtros
  const getFilterOptions = (): FilterData | null => {
    return filterData;
  };

  // Función para obtener total de proyectos
  const getTotalProjects = (): number => {
    return attributeData.length;
  };

  // Función para obtener proyectos por estado
  const getProjectsByStatus = (): Record<string, number> => {
    const statusCount: Record<string, number> = {};
    attributeData.forEach(item => {
      const status = item.estado || 'Sin estado';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return statusCount;
  };

  return {
    // Datos
    geometryData,
    attributeData,
    filterData,
    dashboardData,
    
    // Estados
    loading,
    error,
    lastUpdate,
    
    // Métodos
    refetchData,
    
    // Utilidades
    getFilterOptions,
    getTotalProjects,
    getProjectsByStatus
  };
};
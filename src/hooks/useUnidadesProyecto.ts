'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  fetchGeometryData, 
  fetchAttributeData, 
  fetchFilterData,
  type GeometryData,
  type AttributeData,
  type FilterData,
  type FilterParams
} from '@/services/unidades-proyecto.service';

// Re-exportar tipos para compatibilidad
export type { GeometryData, AttributeData, FilterData };

export interface UseUnidadesProyectoResult {
  // Datos
  geometryData: GeometryData | null;
  attributeData: AttributeData[];
  filterData: FilterData | null;
  
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Función para obtener datos de la API usando el servicio refactorizado
  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 useUnidadesProyecto: Iniciando carga de datos...');
      
      // Usar el servicio que ahora usa el endpoint unificado internamente
      const [geometry, attributes, filters] = await Promise.all([
        fetchGeometryData(),
        fetchAttributeData(),
        fetchFilterData()
      ]);
      
      console.log('✅ useUnidadesProyecto: Datos cargados exitosamente');
      
      setGeometryData(geometry);
      setAttributeData(attributes);
      setFilterData(filters);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ useUnidadesProyecto: Error al cargar datos', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al cargar datos');
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
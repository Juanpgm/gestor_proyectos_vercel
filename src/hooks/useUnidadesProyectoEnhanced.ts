/**
 * Hook funcional mejorado para gestión de Unidades de Proyecto
 * Implementa programación funcional con estado inmutable y manejo de errores robusto
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  fetchGeometryData, 
  fetchAttributeData, 
  fetchFilterData, 
  fetchDashboardData,
  generateFiltersFromData,
  filterAttributeData,
  type GeometryData,
  type AttributeData,
  type FilterData,
  type DashboardData,
  type FilterParams 
} from '@/services/unidades-proyecto.service';
import { useDebounce } from './useDebounce';

// Estado del hook
interface UnidadesProyectoState {
  geometryData: GeometryData | null;
  attributeData: AttributeData[];
  filterData: FilterData | null;
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

// Opciones de configuración del hook
interface UseUnidadesProyectoOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableLocalFiltering?: boolean;
  initialFilters?: FilterParams;
}

// Resultado del hook
export interface UseUnidadesProyectoResult {
  // Estado de datos
  state: UnidadesProyectoState;
  
  // Datos computados
  filteredData: AttributeData[];
  filteredGeometry: GeometryData | null;
  
  // Métricas derivadas
  metrics: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    avgProgress: number;
    totalBudget: number;
  };
  
  // Acciones
  actions: {
    refetch: () => Promise<void>;
    setFilters: (filters: FilterParams) => void;
    clearFilters: () => void;
    setSearchTerm: (term: string) => void;
  };
  
  // Estado de filtros
  filters: FilterParams & { searchTerm: string };
}

// Estado inicial
const createInitialState = (): UnidadesProyectoState => ({
  geometryData: null,
  attributeData: [],
  filterData: null,
  dashboardData: null,
  loading: true,
  error: null,
  lastUpdate: null
});

// Hook principal
export const useUnidadesProyecto = (
  options: UseUnidadesProyectoOptions = {}
): UseUnidadesProyectoResult => {
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutos
    enableLocalFiltering = true,
    initialFilters = {}
  } = options;

  // Estados
  const [state, setState] = useState<UnidadesProyectoState>(createInitialState);
  const [filters, setFiltersState] = useState<FilterParams>(initialFilters);
  const [searchTerm, setSearchTermState] = useState<string>('');

  // Función para actualizar el estado de manera inmutable
  const updateState = useCallback((updates: Partial<UnidadesProyectoState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para obtener todos los datos
  const fetchAllData = useCallback(async (currentFilters: FilterParams = {}) => {
    updateState({ loading: true, error: null });

    try {
      // Determinar si usar filtros en el servidor o localmente
      const serverFilters = enableLocalFiltering ? {} : currentFilters;

      const [geometry, attributes, filterOptions, dashboard] = await Promise.all([
        fetchGeometryData(serverFilters).catch(() => null),
        fetchAttributeData(serverFilters).catch(() => []),
        fetchFilterData().catch(() => null),
        fetchDashboardData(serverFilters).catch(() => null)
      ]);

      // Generar filtros desde datos si no se obtuvieron del servidor
      const finalFilterData = filterOptions || (attributes.length > 0 ? generateFiltersFromData(attributes) : null);

      updateState({
        geometryData: geometry,
        attributeData: attributes,
        filterData: finalFilterData,
        dashboardData: dashboard,
        loading: false,
        lastUpdate: new Date()
      });
    } catch (error) {
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido al cargar datos'
      });
    }
  }, [enableLocalFiltering, updateState]);

  // Función pública para refrescar datos
  const refetch = useCallback(() => fetchAllData(filters), [fetchAllData, filters]);

  // Funciones de filtrado
  const setFilters = useCallback((newFilters: FilterParams) => {
    setFiltersState(newFilters);
    if (!enableLocalFiltering) {
      fetchAllData(newFilters);
    }
  }, [enableLocalFiltering, fetchAllData]);

  const clearFilters = useCallback(() => {
    setFiltersState({});
    setSearchTermState('');
    if (!enableLocalFiltering) {
      fetchAllData({});
    }
  }, [enableLocalFiltering, fetchAllData]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  // Datos filtrados (calculados localmente)
  const filteredData = useMemo(() => {
    if (!enableLocalFiltering) return state.attributeData;
    
    return filterAttributeData(state.attributeData, { ...filters, searchTerm });
  }, [state.attributeData, filters, searchTerm, enableLocalFiltering]);

  // Geometría filtrada basada en datos filtrados
  const filteredGeometry = useMemo((): GeometryData | null => {
    if (!state.geometryData || !state.geometryData.features) return state.geometryData;
    
    const filteredUPIDs = new Set(filteredData.map(item => item.upid));
    
    const filteredFeatures = state.geometryData.features.filter(feature => 
      filteredUPIDs.has(feature.properties.upid)
    );

    return {
      ...state.geometryData,
      features: filteredFeatures
    };
  }, [state.geometryData, filteredData]);

  // Métricas computadas
  const metrics = useMemo(() => {
    const data = filteredData;
    
    const byStatus = data.reduce((acc, item) => {
      const status = item.estado || 'Sin estado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = data.reduce((acc, item) => {
      const type = item.tipo_intervencion || 'Sin tipo';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgProgress = data.length > 0 
      ? data.reduce((sum, item) => sum + (item.avance_obra || 0), 0) / data.length
      : 0;

    const totalBudget = data.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0);

    return {
      total: data.length,
      byStatus,
      byType,
      avgProgress: Math.round(avgProgress * 100) / 100, // Redondear a 2 decimales
      totalBudget
    };
  }, [filteredData]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchAllData(initialFilters);
  }, []); // Solo ejecutar una vez al montar

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData(filters);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]); // Solo dependencias estables

  // Resultado del hook
  return {
    state,
    filteredData,
    filteredGeometry,
    metrics,
    actions: {
      refetch,
      setFilters,
      clearFilters,
      setSearchTerm
    },
    filters: { ...filters, searchTerm }
  };
};

// Hook adicional para métricas específicas del dashboard
export const useUnidadesProyectoDashboard = (filters: FilterParams = {}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce filters para evitar llamadas excesivas
  const debouncedFilters = useDebounce(filters, 1000); // 1 segundo de delay

  const fetchDashboard = useCallback(async (currentFilters: FilterParams) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDashboardData(currentFilters);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para evitar re-creación

  useEffect(() => {
    fetchDashboard(debouncedFilters);
  }, [debouncedFilters, fetchDashboard]);

  const refetch = useCallback(() => {
    fetchDashboard(debouncedFilters);
  }, [debouncedFilters, fetchDashboard]);

  return {
    data: dashboardData,
    loading,
    error,
    refetch
  };
};

// Hook para filtros específicos
export const useUnidadesProyectoFilters = () => {
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchFilterData();
      setFilterData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, []);

  return {
    filterData,
    loading,
    error,
    refetch: fetchFilters
  };
};

export default useUnidadesProyecto;
/**
 * Hook funcional para gestión de Intervenciones
 * Gestiona datos del endpoint GET /intervenciones con filtrado local y remoto
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  fetchIntervenciones,
  filterIntervencionesLocally,
  calculateMetrics,
  getUniqueValues,
  type IntervencionesResponse,
  type IntervencionesFilterParams,
  type IntervencionesMetrics as ServiceMetrics
} from '@/services/intervenciones.service';
import type { 
  UnidadConIntervencionesFeature,
  ColorByField 
} from '@/types/intervenciones';
import { useDebounce } from './useDebounce';

// Estado del hook
interface IntervencionesState {
  data: IntervencionesResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

// Opciones de configuración del hook
interface UseIntervencionesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableLocalFiltering?: boolean;
  initialFilters?: IntervencionesFilterParams;
}

// Métricas extendidas con opciones de filtros únicos
export interface IntervencionesMetrics extends ServiceMetrics {
  uniqueValues: {
    estados: string[];
    anos: string[];
    tiposIntervencion: string[];
    centrosGestores: string[];
    frentesActivos: string[];
    comunas: string[];
    barrios: string[];
  };
}

// Resultado del hook
export interface UseIntervencionesResult {
  // Estado de datos
  state: IntervencionesState;
  
  // Datos computados
  filteredData: UnidadConIntervencionesFeature[];
  
  // Métricas derivadas
  metrics: IntervencionesMetrics;
  
  // Acciones
  actions: {
    refetch: () => Promise<void>;
    setFilters: (filters: IntervencionesFilterParams) => void;
    clearFilters: () => void;
    setSearchTerm: (term: string) => void;
    setColorBy: (field: ColorByField) => void;
  };
  
  // Estado de filtros y visualización
  filters: IntervencionesFilterParams & { searchTerm: string };
  colorBy: ColorByField;
}

// Estado inicial
const createInitialState = (): IntervencionesState => ({
  data: null,
  loading: true,
  error: null,
  lastUpdate: null
});

// Hook principal
export const useIntervenciones = (
  options: UseIntervencionesOptions = {}
): UseIntervencionesResult => {
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutos
    enableLocalFiltering = true,
    initialFilters = {}
  } = options;

  // Estados
  const [state, setState] = useState<IntervencionesState>(createInitialState);
  const [filters, setFiltersState] = useState<IntervencionesFilterParams>(initialFilters);
  const [searchTerm, setSearchTermState] = useState<string>('');
  const [colorBy, setColorByState] = useState<ColorByField>('estado');
  const [isLoadingRef, setIsLoadingRef] = useState(false);
  
  // Debounce del término de búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Función para actualizar el estado de manera inmutable
  const updateState = useCallback((updates: Partial<IntervencionesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para obtener todos los datos
  const fetchAllData = useCallback(async (currentFilters: IntervencionesFilterParams = {}) => {
    // Prevenir cargas simultáneas
    if (isLoadingRef) {
      console.log('⏭️ useIntervenciones: Skipping - already loading');
      return;
    }

    setIsLoadingRef(true);
    updateState({ loading: true, error: null });

    try {
      const hasFilters = Object.keys(currentFilters).length > 0;
      
      // ESTRATEGIA HÍBRIDA:
      // 1. Sin filtros o enableLocalFiltering: cargar todo y cachear
      // 2. Con filtros y server-side: usar filtros del servidor
      const useServerFilters = !enableLocalFiltering && hasFilters;
      const serverFilters = useServerFilters ? currentFilters : {};
      
      if (hasFilters) {
        console.log('🔄 useIntervenciones: Loading with', useServerFilters ? 'SERVER-SIDE' : 'CLIENT-SIDE', 'filtering');
      }

      const data = await fetchIntervenciones(serverFilters);

      console.log('✅ useIntervenciones: Data loaded:', {
        features: data?.features?.length || 0,
        totalUnidades: data?.properties?.total_unidades || 0,
        totalIntervenciones: data?.properties?.total_intervenciones || 0
      });

      updateState({
        data,
        loading: false,
        lastUpdate: new Date()
      });
      setIsLoadingRef(false);
    } catch (error) {
      console.error('❌ useIntervenciones: Fatal error:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido al cargar intervenciones'
      });
      setIsLoadingRef(false);
    }
  }, [enableLocalFiltering, updateState, isLoadingRef]);

  // Función pública para refrescar datos
  const refetch = useCallback(() => {
    console.log('🔄 useIntervenciones: Refetching data...');
    return fetchAllData(filters);
  }, [fetchAllData, filters]);

  // Funciones de filtrado
  const setFilters = useCallback((newFilters: IntervencionesFilterParams) => {
    console.log('🎯 useIntervenciones: Setting filters:', JSON.stringify(newFilters, null, 2));
    
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(newFilters);
    if (!filtersChanged) {
      console.log('⏭️ useIntervenciones: Filters unchanged, skipping');
      return;
    }
    
    setFiltersState(newFilters);
    
    // Si el filtrado local está desactivado, recargar con filtros del servidor
    if (!enableLocalFiltering) {
      console.log('🎯 useIntervenciones: Fetching with server filters');
      fetchAllData(newFilters);
    } else {
      console.log('✅ useIntervenciones: Local filtering - no reload');
    }
  }, [filters, enableLocalFiltering, fetchAllData]);

  const clearFilters = useCallback(() => {
    console.log('🧹 useIntervenciones: Clearing filters...');
    
    const alreadyEmpty = Object.keys(filters).length === 0 && searchTerm === '';
    if (alreadyEmpty) {
      console.log('⏭️ useIntervenciones: Filters already empty');
      return;
    }
    
    setFiltersState({});
    setSearchTermState('');
    
    if (!enableLocalFiltering) {
      fetchAllData({});
    }
  }, [enableLocalFiltering, fetchAllData, filters, searchTerm]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const setColorBy = useCallback((field: ColorByField) => {
    console.log('🎨 useIntervenciones: Changing color field to:', field);
    setColorByState(field);
  }, []);

  // Datos filtrados con búsqueda de texto
  const filteredData = useMemo(() => {
    if (!state.data?.features) return [];
    
    let result = state.data.features;
    
    // Si el filtrado local está habilitado, aplicar filtros
    if (enableLocalFiltering && Object.keys(filters).length > 0) {
      // Crear FeatureCollection temporal para filtrar
      const tempCollection: IntervencionesResponse = {
        type: 'FeatureCollection',
        features: result,
        properties: state.data.properties
      };
      const filtered = filterIntervencionesLocally(tempCollection, filters);
      result = filtered.features;
      console.log('📊 useIntervenciones: Filtered by params:', result.length, 'of', state.data.features.length);
    }
    
    // Aplicar búsqueda de texto
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter((feature: UnidadConIntervencionesFeature) => {
        const props = feature.properties;
        return (
          props.upid?.toLowerCase().includes(searchLower) ||
          props.nombre_up?.toLowerCase().includes(searchLower) ||
          props.direccion?.toLowerCase().includes(searchLower) ||
          props.tipo_equipamiento?.toLowerCase().includes(searchLower) ||
          props.nombre_centro_gestor?.toLowerCase().includes(searchLower) ||
          props.comuna_corregimiento?.toLowerCase().includes(searchLower) ||
          props.barrio_vereda?.toLowerCase().includes(searchLower) ||
          props.intervenciones?.some((interv: any) => 
            interv.tipo_intervencion?.toLowerCase().includes(searchLower) ||
            interv.estado?.toLowerCase().includes(searchLower) ||
            interv.descripcion?.toLowerCase().includes(searchLower)
          )
        );
      });
      console.log('🔍 useIntervenciones: Filtered by search:', result.length);
    }
    
    return result;
  }, [state.data, filters, debouncedSearchTerm, enableLocalFiltering]);

  // Métricas computadas
  const metrics = useMemo((): IntervencionesMetrics => {
    if (!state.data?.features || state.data.features.length === 0) {
      return {
        total_intervenciones: 0,
        total_unidades: 0,
        por_estado: {},
        por_ano: {},
        por_tipo: {},
        por_frente_activo: {},
        presupuesto_total: 0,
        avance_promedio: 0,
        uniqueValues: {
          estados: [],
          anos: [],
          tiposIntervencion: [],
          centrosGestores: [],
          frentesActivos: [],
          comunas: [],
          barrios: []
        }
      };
    }

    // Crear FeatureCollection con datos filtrados para calcular métricas
    const filteredCollection: IntervencionesResponse = {
      type: 'FeatureCollection',
      features: filteredData,
      properties: state.data.properties
    };
    
    // Calcular métricas base usando el servicio
    const baseMetrics = calculateMetrics(filteredCollection);
    
    // Crear FeatureCollection con todos los datos para valores únicos
    const allCollection: IntervencionesResponse = {
      type: 'FeatureCollection',
      features: state.data.features,
      properties: state.data.properties
    };
    
    console.log('🔍 useIntervenciones: Calculating metrics...', {
      totalFeatures: state.data.features.length,
      filteredFeatures: filteredData.length,
      baseMetrics
    });

    return {
      ...baseMetrics,
      uniqueValues: {
        estados: getUniqueValues(allCollection, 'estado').filter(Boolean) as string[],
        anos: getUniqueValues(allCollection, 'ano').filter(Boolean).map(String) as string[],
        tiposIntervencion: getUniqueValues(allCollection, 'tipo_intervencion').filter(Boolean) as string[],
        centrosGestores: getUniqueValues(allCollection, 'nombre_centro_gestor').filter(Boolean) as string[],
        frentesActivos: getUniqueValues(allCollection, 'frente_activo').filter(Boolean) as string[],
        comunas: getUniqueValues(allCollection, 'comuna_corregimiento').filter(Boolean) as string[],
        barrios: getUniqueValues(allCollection, 'barrio_vereda').filter(Boolean) as string[]
      }
    };
  }, [filteredData, state.data]);

  // Efecto para cargar datos iniciales
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) {
      console.log('⏭️ useIntervenciones: Already initialized');
      return;
    }

    console.log('🚀 useIntervenciones: Initial load');
    hasInitialized.current = true;
    fetchAllData(filters);
  }, []); // Solo ejecutar una vez

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    console.log(`⏰ useIntervenciones: Setting up auto-refresh (${refreshInterval}ms)`);
    const interval = setInterval(() => {
      console.log('🔄 useIntervenciones: Auto-refresh triggered');
      fetchAllData(filters);
    }, refreshInterval);

    return () => {
      console.log('🛑 useIntervenciones: Clearing auto-refresh');
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchAllData, filters]);

  // Retornar el resultado del hook
  return {
    state,
    filteredData,
    metrics,
    actions: {
      refetch,
      setFilters,
      clearFilters,
      setSearchTerm,
      setColorBy
    },
    filters: { ...filters, searchTerm },
    colorBy
  };
};

// Re-exportar tipos
export type { 
  IntervencionesFilterParams,
  ColorByField 
};

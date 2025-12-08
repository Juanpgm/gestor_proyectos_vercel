/**
 * Hook funcional mejorado para gestión de Unidades de Proyecto
 * Implementa programación funcional con estado inmutable y manejo de errores robusto
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  fetchGeometryData, 
  fetchAttributeData, 
  fetchFilterData,
  generateFiltersFromData,
  filterAttributeData,
  type GeometryData,
  type AttributeData,
  type FilterData,
  type FilterParams 
} from '@/services/unidades-proyecto.service';
import { useDebounce } from './useDebounce';

// Estado del hook
interface UnidadesProyectoState {
  geometryData: GeometryData | null;
  attributeData: AttributeData[];
  filterData: FilterData | null;
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
    activeFronts: number;
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
  const [isLoadingRef, setIsLoadingRef] = useState(false); // Flag para prevenir cargas simultáneas

  // Función para actualizar el estado de manera inmutable
  const updateState = useCallback((updates: Partial<UnidadesProyectoState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para obtener todos los datos
  const fetchAllData = useCallback(async (currentFilters: FilterParams = {}) => {
    // Prevenir cargas simultáneas
    if (isLoadingRef) {
      console.log('⏭️ fetchAllData: Skipping - already loading');
      return;
    }

    setIsLoadingRef(true);
    updateState({ loading: true, error: null });

    try {
      console.log('🔄 fetchAllData: Starting with filters:', currentFilters);
      
      // Determinar si usar filtros en el servidor o localmente
      const serverFilters = enableLocalFiltering ? {} : currentFilters;
      
      console.log('🔄 fetchAllData: Server filters:', serverFilters);

      const [geometry, attributes, filterOptions] = await Promise.all([
        fetchGeometryData(serverFilters).catch((error) => {
          console.warn('⚠️ fetchGeometryData failed:', error);
          return null;
        }),
        fetchAttributeData(serverFilters).catch((error) => {
          console.warn('⚠️ fetchAttributeData failed:', error);
          return [];
        }),
        fetchFilterData().catch((error) => {
          console.warn('⚠️ fetchFilterData failed:', error);
          return null;
        })
      ]);

      // Generar filtros desde datos si no se obtuvieron del servidor
      const finalFilterData = filterOptions || (attributes.length > 0 ? generateFiltersFromData(attributes) : null);

      console.log('✅ fetchAllData: Data loaded successfully', {
        geometry: geometry ? 'loaded' : 'failed',
        attributes: `${attributes.length} items`,
        filters: finalFilterData ? 'loaded' : 'failed'
      });

      updateState({
        geometryData: geometry,
        attributeData: attributes,
        filterData: finalFilterData,
        loading: false,
        lastUpdate: new Date()
      });
      setIsLoadingRef(false);
    } catch (error) {
      console.error('❌ fetchAllData: Fatal error:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido al cargar datos'
      });
      setIsLoadingRef(false);
    }
  }, [enableLocalFiltering, updateState, isLoadingRef]);

  // Función pública para refrescar datos (fuerza recarga completa sin cache)
  const refetch = useCallback(() => {
    console.log('🔄 REFETCH: Forzando recarga completa de datos...');
    console.log('⏰ REFETCH: Timestamp', new Date().toISOString());
    return fetchAllData(filters);
  }, [fetchAllData, filters]);

  // Funciones de filtrado
  const setFilters = useCallback((newFilters: FilterParams) => {
    console.log('🎯 setFilters: Setting new filters:', newFilters);
    
    // Verificar si los filtros realmente cambiaron
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(newFilters);
    if (!filtersChanged) {
      console.log('⏭️ setFilters: Filters unchanged, skipping update');
      return;
    }
    
    setFiltersState(newFilters);
    
    // IMPORTANTE: Siempre recargar geometría con filtros del servidor
    // El filtrado local solo se usa para attributes, pero geometry debe venir filtrada del servidor
    if (!enableLocalFiltering) {
      // Modo sin filtrado local: recargar todo
      fetchAllData(newFilters);
    } else {
      // Modo con filtrado local: solo recargar geometry, attributes se filtran localmente
      fetchGeometryData(newFilters)
        .then(geometry => {
          console.log('✅ Geometry reloaded with filters:', geometry ? `${geometry.features?.length || 0} features` : 'null');
          updateState({ geometryData: geometry });
        })
        .catch(error => {
          console.error('❌ Error reloading geometry:', error);
        });
    }
  }, [enableLocalFiltering, fetchAllData, updateState]);

  const clearFilters = useCallback(() => {
    console.log('🧹 Limpiando todos los filtros...');
    
    // Verificar si ya hay filtros vacíos
    const alreadyEmpty = Object.keys(filters).length === 0 && searchTerm === '';
    if (alreadyEmpty) {
      console.log('⏭️ clearFilters: Filters already empty, skipping reload');
      return;
    }
    
    setFiltersState({});
    setSearchTermState('');
    
    // Recargar datos desde el servidor sin filtros
    if (!enableLocalFiltering) {
      fetchAllData({}); 
    } else {
      // En modo local, solo recargar geometry sin filtros
      fetchGeometryData({})
        .then(geometry => {
          console.log('✅ Geometry reloaded without filters:', geometry ? `${geometry.features?.length || 0} features` : 'null');
          updateState({ geometryData: geometry });
        })
        .catch(error => {
          console.error('❌ Error reloading geometry:', error);
        });
    }
  }, [enableLocalFiltering, fetchAllData, updateState, filters, searchTerm]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  // Datos filtrados (calculados localmente)
  const filteredData = useMemo(() => {
    if (!enableLocalFiltering) return state.attributeData;
    
    // Verificar si hay filtros activos
    const hasActiveFilters = Object.values(filters).some(value => value && value !== '') || 
                            (searchTerm && searchTerm.trim() !== '');
    
    // Si no hay filtros activos, devolver todos los datos
    if (!hasActiveFilters) {
      console.log('📊 No filters active, returning all data:', {
        totalData: state.attributeData.length,
        sampleBudgets: state.attributeData.slice(0, 5).map(item => ({ upid: item.upid, presupuesto: item.presupuesto_base }))
      });
      return state.attributeData;
    }
    
    const filtered = filterAttributeData(state.attributeData, { ...filters, searchTerm });
    
    // Debug filtrado
    console.log('📊 Debug filteredData with active filters:', {
      totalRawData: state.attributeData.length,
      appliedFilters: { ...filters, searchTerm },
      filteredCount: filtered.length,
      sampleRawBudgets: state.attributeData.slice(0, 3).map(item => ({ upid: item.upid, presupuesto: item.presupuesto_base })),
      sampleFilteredBudgets: filtered.slice(0, 3).map(item => ({ upid: item.upid, presupuesto: item.presupuesto_base }))
    });
    
    return filtered;
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

    // Contar frentes activos
    const activeFronts = data.filter(item => item.frente_activo === 'Frente activo').length;

    // Debug logging
    console.log('🔍 Debug avgProgress calculation:', {
      totalItems: data.length,
      sampleAvances: data.slice(0, 5).map(item => ({ upid: item.upid, avance_obra: item.avance_obra })),
      sumAvances: data.reduce((sum, item) => sum + (item.avance_obra || 0), 0),
      avgProgressRaw: avgProgress,
      avgProgressFinal: Math.round(avgProgress * 10) / 10
    });

    // Debug presupuesto total
    const presupuestosNonZero = data.filter(item => (item.presupuesto_base || 0) > 0);
    console.log('💰 Debug totalBudget calculation:', {
      totalItems: data.length,
      itemsWithBudget: presupuestosNonZero.length,
      samplePresupuestos: data.slice(0, 5).map(item => ({ upid: item.upid, presupuesto_base: item.presupuesto_base })),
      sumPresupuestos: totalBudget,
      allPresupuestos: data.map(item => item.presupuesto_base || 0).slice(0, 10),
      maxBudget: Math.max(...data.map(item => item.presupuesto_base || 0)),
      minBudget: Math.min(...data.map(item => item.presupuesto_base || 0))
    });

    return {
      total: data.length,
      byStatus,
      byType,
      avgProgress: Math.round(avgProgress * 10) / 10, // Redondear a 1 decimal (ya viene en escala 0-100 desde el servicio)
      totalBudget,
      activeFronts
    };
  }, [filteredData]);

  // Efecto para cargar datos iniciales
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) {
      console.log('⏭️ Initial load: Already initialized, skipping');
      return;
    }
    console.log('🚀 Initial load: Loading data for first time');
    hasInitialized.current = true;
    fetchAllData(initialFilters);
  }, []); // Solo ejecutar una vez al montar

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh: Reloading data...');
      fetchAllData(filters);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllData]); // fetchAllData ya tiene filters en su closure

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
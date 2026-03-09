/**
 * Hook funcional mejorado para gestión de Unidades de Proyecto
 * Implementa programación funcional con estado inmutable y manejo de errores robusto
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  fetchGeometryData, 
  fetchAttributeData, 
  generateFiltersFromData,
  filterAttributeData,
  consolidateAttributeData,
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
  intervencionesData: IntervencionMetricItem[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  totalIntervencionesCount: number | null; // Conteo real del endpoint /intervenciones
}

interface IntervencionMetricItem {
  upid?: string;
  avance_obra?: number;
  presupuesto_base?: number;
  estado?: string;
  tipo_intervencion?: string;
  nombre_centro_gestor?: string;
  fuente_financiacion?: string;
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
    total: number; // Total de intervenciones (suma de n_intervenciones)
    totalUnidadesProyecto: number; // Total de unidades de proyecto (número de registros)
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
  intervencionesData: [],
  loading: true,
  error: null,
  lastUpdate: null,
  totalIntervencionesCount: null
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

  // Función para obtener todos los datos con estrategia híbrida inteligente
  const fetchAllData = useCallback(async (currentFilters: FilterParams = {}) => {
    // Prevenir cargas simultáneas
    if (isLoadingRef) {
      console.log('⏭️ fetchAllData: Skipping - already loading');
      return;
    }

    setIsLoadingRef(true);
    updateState({ loading: true, error: null });

    try {
      const hasFilters = Object.keys(currentFilters).length > 0;
      
      // ESTRATEGIA HÍBRIDA INTELIGENTE:
      // 1. Sin filtros: cargar todo y cachear (enableLocalFiltering)
      // 2. Con filtros simples: usar server-side
      // 3. Con filtros múltiples: cargar todo y filtrar client-side
      const useServerFilters = !enableLocalFiltering && hasFilters;
      const serverFilters = useServerFilters ? currentFilters : {};
      
      if (hasFilters) {
        console.log('🔄 fetchAllData: Loading with', useServerFilters ? 'SERVER-SIDE' : 'CLIENT-SIDE', 'filtering');
      }

      const [geometry, attributes] = await Promise.all([
        fetchGeometryData(serverFilters).catch((error) => {
          console.warn('⚠️ fetchGeometryData failed:', error);
          return null;
        }),
        fetchAttributeData(serverFilters).catch((error) => {
          console.warn('⚠️ fetchAttributeData failed:', error);
          return [];
        })
      ]);

      // Los filtros se derivan exclusivamente del dataset cargado en frontend.
      const finalFilterData = attributes.length > 0 ? generateFiltersFromData(attributes) : null;

      if (hasFilters) {
        console.log('✅ Data loaded:', {
          geometry: geometry?.features?.length || 0,
          attributes: attributes.length
        });
      }

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
    console.log('🎯 setFilters: Setting new filters:', JSON.stringify(newFilters, null, 2));
    console.log('🎯 setFilters: centro_gestor_multiple =', (newFilters as any).centro_gestor_multiple);
    
    // Verificar si los filtros realmente cambiaron
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(newFilters);
    if (!filtersChanged) {
      console.log('⏭️ setFilters: Filters unchanged, skipping update');
      return;
    }
    
    console.log('🎯 setFilters: Filters changed, updating state...');
    console.log('🎯 setFilters: enableLocalFiltering =', enableLocalFiltering);
    
    setFiltersState(newFilters);
    
    // Si el filtrado local está activado, NO recargar datos del servidor
    // Los datos ya están cargados y el filtrado se hace localmente
    if (!enableLocalFiltering) {
      // Modo sin filtrado local: recargar todo con filtros del servidor
      console.log('🎯 setFilters: Fetching ALL data with server filters');
      fetchAllData(newFilters);
    } else {
      // Modo con filtrado local: solo actualizar el estado, el useMemo se encarga del filtrado
      console.log('✅ setFilters: Local filtering enabled - no server reload needed');
    }
  }, [filters, enableLocalFiltering, fetchAllData]);

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
      return state.attributeData;
    }
    
    const filtered = filterAttributeData(state.attributeData, { ...filters, searchTerm });
    console.log('📊 Filtered:', filtered.length, 'of', state.attributeData.length);
    
    return filtered;
  }, [state.attributeData, filters, searchTerm, enableLocalFiltering]);

  // Geometría filtrada basada en datos filtrados
  const filteredGeometry = useMemo((): GeometryData | null => {
    if (!state.geometryData || !state.geometryData.features) {
      console.log('⚠️ filteredGeometry: No geometry data available');
      return state.geometryData;
    }
    
    console.log('🗺️ filteredGeometry: Starting with', state.geometryData.features.length, 'total features');
    console.log('🗺️ filteredGeometry: Filtering to match', filteredData.length, 'attribute items');
    
    // Normalizar UPIDs para comparación case-insensitive
    const normalizeUpid = (upid: string | null | undefined): string => {
      if (!upid) return '';
      return String(upid).trim().toLowerCase();
    };
    
    const filteredUPIDs = new Set(filteredData.map(item => normalizeUpid(item.upid)));
    
    const filteredFeatures = state.geometryData.features.filter(feature => 
      filteredUPIDs.has(normalizeUpid(feature.properties.upid))
    );

    console.log('✅ filteredGeometry: Result =', filteredFeatures.length, 'features');
    
    if (filteredFeatures.length === 0 && filteredData.length > 0) {
      console.error('❌ filteredGeometry: NO FEATURES MATCH! UPIDs do not align');
      console.error('Sample filtered attribute UPIDs:', Array.from(filteredUPIDs).slice(0, 5));
      console.error('Sample geometry feature UPIDs:', state.geometryData.features.slice(0, 5).map(f => normalizeUpid(f.properties.upid)));
      console.error('Checking if UPIDs are strings:', {
        attributeType: typeof Array.from(filteredUPIDs)[0],
        geometryType: typeof state.geometryData.features[0]?.properties.upid
      });
    }

    return {
      ...state.geometryData,
      features: filteredFeatures
    };
  }, [state.geometryData, filteredData]);

  // Métricas computadas
  const metrics = useMemo(() => {
    const data = consolidateAttributeData(filteredData);
    const allData = consolidateAttributeData(state.attributeData);
    
    // 🔍 DIAGNÓSTICO: Comparar datos totales vs filtrados
    const totalDataCount = allData.length;
    const filteredDataCount = data.length;
    const hasFiltersApplied = totalDataCount !== filteredDataCount;
    
    console.log('🔍 ========== DIAGNÓSTICO DE PRESUPUESTO ==========');
    console.log(`📊 Datos totales cargados: ${totalDataCount}`);
    console.log(`📊 Datos después de filtros: ${filteredDataCount}`);
    console.log(`🎯 Filtros activos: ${hasFiltersApplied ? 'SÍ' : 'NO'}`);
    
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

    const normalizeUpid = (value: string | null | undefined): string =>
      String(value || '').trim().toLowerCase();

    const normalizeValue = (value: string | null | undefined): string =>
      String(value || '').trim().toLowerCase();

    const matchesFilterValue = (
      value: string | null | undefined,
      single: string | null | undefined,
      multi: string[] | null | undefined
    ): boolean => {
      if (Array.isArray(multi) && multi.length > 0) {
        return multi.some(entry => normalizeValue(entry) === normalizeValue(value));
      }
      if (single && String(single).trim() !== '') {
        return normalizeValue(value) === normalizeValue(single);
      }
      return true;
    };

    const filteredUpids = new Set(data.map(item => normalizeUpid(item.upid)));
    // Aplicar filtro por UPIDs siempre que haya CUALQUIER filtro activo a nivel de UP
    // (incluyendo proyectos_estrategicos, tipo_equipamiento, barrio, etc.)
    const hasUpOnlyFilters = data.length !== allData.length || Boolean(
      (filters as any)?.tipo_equipamiento || (filters as any)?.tipo_equipamiento_multiple?.length ||
      (filters as any)?.frente_activo || (filters as any)?.frente_activo_multiple?.length ||
      (filters as any)?.comuna_corregimiento || (filters as any)?.comuna_corregimiento_multiple?.length ||
      (filters as any)?.barrio_vereda || (filters as any)?.barrio_vereda_multiple?.length ||
      (filters as any)?.ano || (filters as any)?.ano_multiple?.length ||
      searchTerm.trim() !== ''
    );

    const interventionItems = state.intervencionesData.length > 0
      ? state.intervencionesData.filter(item => {
          if (hasUpOnlyFilters && !filteredUpids.has(normalizeUpid(item.upid))) {
            return false;
          }

          return (
            matchesFilterValue(item.estado, filters.estado, (filters as any).estado_multiple) &&
            matchesFilterValue(item.tipo_intervencion, filters.tipo_intervencion, (filters as any).tipo_intervencion_multiple) &&
            matchesFilterValue(item.nombre_centro_gestor, filters.centro_gestor, (filters as any).centro_gestor_multiple) &&
            matchesFilterValue(item.fuente_financiacion, filters.fuente_financiacion, (filters as any).fuente_financiacion_multiple)
          );
        })
      : [];

    const avgProgress = interventionItems.length > 0
      ? interventionItems.reduce((sum, item) => sum + (item.avance_obra || 0), 0) / interventionItems.length
      : (data.length > 0
        ? data.reduce((sum, item) => sum + (item.avance_obra || 0), 0) / data.length
        : 0);

    const totalBudget = interventionItems.length > 0
      ? interventionItems.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0)
      : data.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0);
    
    // 🔍 DIAGNÓSTICO: Calcular presupuesto total SIN filtros
    const totalBudgetAllData = allData.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0);
    const budgetDifference = totalBudgetAllData - totalBudget;
    const percentageDifference = totalBudgetAllData > 0 
      ? ((budgetDifference / totalBudgetAllData) * 100).toFixed(2) 
      : '0';
    
    console.log(`💰 Presupuesto TOTAL (sin filtros): $${totalBudgetAllData.toLocaleString('es-CO')}`);
    console.log(`💰 Presupuesto FILTRADO: $${totalBudget.toLocaleString('es-CO')}`);
    console.log(`📉 Diferencia: $${budgetDifference.toLocaleString('es-CO')} (${percentageDifference}%)`);
    console.log('==================================================\n');

    // ✨ NUEVO: Usar el conteo de intervenciones filtradas para que dependa de los filtros aplicados
    const totalIntervenciones = interventionItems.length;
    
    // Total de unidades de proyecto (número de registros)
    const totalUnidadesProyecto = data.length;

    const normalizeCentro = (value: string | null | undefined): string =>
      String(value || '').trim().toLowerCase();

    // Contar frentes activos (unidades de proyecto con frente activo)
    // Excluye la Secretaría de Vivienda Social y Habitat y ciertos tipos de intervención
    const excludedCentro = 'secretaría de vivienda social y habitat';
    const excludedTipos = new Set([
      'mantenimiento',
      'estudios y diseños',
      'demarcación vial'
    ]);
    const requiredEstado = 'en ejecución';
    const activeFronts = data.filter(item =>
      item.frente_activo === 'Frente activo' &&
      normalizeCentro(item.nombre_centro_gestor) !== excludedCentro &&
      !excludedTipos.has(normalizeCentro(item.tipo_intervencion)) &&
      normalizeCentro(item.estado) === requiredEstado
    ).length;

    // Debug logging de intervenciones
    console.log('🔢 Debug totalIntervenciones calculation:', {
      totalUnidadesProyecto,
      totalIntervenciones,
      activeFronts,
      sampleNIntervenciones: data.slice(0, 5).map(item => ({ upid: item.upid, n_intervenciones: item.n_intervenciones })),
      allNIntervenciones: data.map(item => item.n_intervenciones || 0).slice(0, 10),
      frentesActivosData: data.filter(item => item.frente_activo === 'Frente activo').slice(0, 5).map(item => ({ upid: item.upid, frente_activo: item.frente_activo, n_intervenciones: item.n_intervenciones }))
    });

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
      total: totalIntervenciones, // Total de intervenciones desde endpoint /intervenciones
      totalUnidadesProyecto, // Total de unidades de proyecto (número de registros)
      byStatus,
      byType,
      avgProgress: Math.round(avgProgress * 10) / 10, // Redondear a 1 decimal (ya viene en escala 0-100 desde el servicio)
      totalBudget,
      activeFronts
    };
  }, [filteredData, state.attributeData, state.intervencionesData, state.totalIntervencionesCount, filters, searchTerm]);

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

  // Efecto para obtener todas las intervenciones (para métricas agregadas)
  useEffect(() => {
    const fetchIntervencionesData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const url = `${baseUrl}/intervenciones?limit=10000`;

        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const payload = await response.json();
        const data = Array.isArray(payload?.data) ? payload.data : [];

        const mappedIntervenciones = data.map((item: any) => ({
          upid: item?.upid,
          avance_obra: typeof item?.avance_obra === 'number' ? item.avance_obra : parseFloat(item?.avance_obra || 0),
          presupuesto_base: typeof item?.presupuesto_base === 'number' ? item.presupuesto_base : parseFloat(item?.presupuesto_base || 0),
          estado: item?.estado,
          tipo_intervencion: item?.tipo_intervencion,
          nombre_centro_gestor: item?.nombre_centro_gestor,
          fuente_financiacion: item?.fuente_financiacion
        }));

        const allowedUpids = new Set(
          state.attributeData
            .map((item) => String(item?.upid || '').trim().toLowerCase())
            .filter((value) => value.length > 0)
        );

        const intervencionesFiltradas = allowedUpids.size > 0
          ? mappedIntervenciones.filter((item: IntervencionMetricItem) =>
              allowedUpids.has(String(item?.upid || '').trim().toLowerCase())
            )
          : mappedIntervenciones;

        setState(prev => ({
          ...prev,
          intervencionesData: intervencionesFiltradas,
          totalIntervencionesCount: intervencionesFiltradas.length
        }));
      } catch (error) {
        console.error('❌ Error fetching intervenciones data:', error);
      }
    };

    fetchIntervencionesData();
  }, [state.attributeData]);

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
      const data = await fetchAttributeData();
      setFilterData(generateFiltersFromData(data));
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
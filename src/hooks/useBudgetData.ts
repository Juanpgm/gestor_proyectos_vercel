import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  loadEjecucionPresupuestal,
  loadMovimientosPresupuestales,
  loadDatosCaracteristicosProyectos,
  loadCentrosGestores,
  getLatestPeriodData,
  getDataByBpin,
  getDataByPeriod,
  getUniquePeriodsFromEjecucion,
  getUniqueBpinsFromEjecucion,
  clearDataCache,
  getCacheStatus,
  EjecucionPresupuestal,
  MovimientoPresupuestal,
  DatosCaracteristicosProyecto,
  CentroGestor
} from '@/utils/simpleDataLoader';

interface BudgetDataState {
  ejecucionPresupuestal: EjecucionPresupuestal[];
  movimientosPresupuestales: MovimientoPresupuestal[];
  datosCaracteristicos: DatosCaracteristicosProyecto[];
  centrosGestores: CentroGestor | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface BudgetDataFilters {
  bpin?: number;
  periodo?: string;
  centroGestor?: string;
  programa?: string;
  comuna?: string;
  anio?: number;
}

interface UseBudgetDataOptions {
  autoLoad?: boolean;
  filters?: BudgetDataFilters;
  enableCache?: boolean;
}

export const useBudgetData = (options: UseBudgetDataOptions = {}) => {
  const { autoLoad = true, filters = {}, enableCache = true } = options;

  const [state, setState] = useState<BudgetDataState>({
    ejecucionPresupuestal: [],
    movimientosPresupuestales: [],
    datosCaracteristicos: [],
    centrosGestores: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [loadingStates, setLoadingStates] = useState({
    ejecucion: false,
    movimientos: false,
    caracteristicos: false,
    centros: false
  });

  // Load all budget data
  const loadAllData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [ejecucion, movimientos, caracteristicos, centros] = await Promise.all([
        loadEjecucionPresupuestal(),
        loadMovimientosPresupuestales(),
        loadDatosCaracteristicosProyectos(),
        loadCentrosGestores()
      ]);

      setState(prev => ({
        ...prev,
        ejecucionPresupuestal: ejecucion,
        movimientosPresupuestales: movimientos,
        datosCaracteristicos: caracteristicos,
        centrosGestores: centros,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error loading budget data'
      }));
    }
  }, []);

  // Load individual data sets
  const loadEjecucionPresupuestalData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, ejecucion: true }));
    try {
      const data = await loadEjecucionPresupuestal();
      setState(prev => ({ ...prev, ejecucionPresupuestal: data }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading ejecución presupuestal'
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, ejecucion: false }));
    }
  }, []);

  const loadMovimientosPresupuestalesData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, movimientos: true }));
    try {
      const data = await loadMovimientosPresupuestales();
      setState(prev => ({ ...prev, movimientosPresupuestales: data }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading movimientos presupuestales'
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, movimientos: false }));
    }
  }, []);

  const loadDatosCaracteristicosData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, caracteristicos: true }));
    try {
      const data = await loadDatosCaracteristicosProyectos();
      setState(prev => ({ ...prev, datosCaracteristicos: data }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading datos característicos'
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, caracteristicos: false }));
    }
  }, []);

  const loadCentrosGestoresData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, centros: true }));
    try {
      const data = await loadCentrosGestores();
      setState(prev => ({ ...prev, centrosGestores: data }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading centros gestores'
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, centros: false }));
    }
  }, []);

  // Filtered data based on current filters
  const filteredEjecucionData = useMemo(() => {
    let data = state.ejecucionPresupuestal;

    if (filters.bpin) {
      data = data.filter(item => item.bpin === filters.bpin);
    }
    if (filters.periodo) {
      data = data.filter(item => item.periodo_corte === filters.periodo);
    }

    return data;
  }, [state.ejecucionPresupuestal, filters.bpin, filters.periodo]);

  const filteredMovimientosData = useMemo(() => {
    let data = state.movimientosPresupuestales;

    if (filters.bpin) {
      data = data.filter(item => item.bpin === filters.bpin);
    }
    if (filters.periodo) {
      data = data.filter(item => item.periodo_corte === filters.periodo);
    }

    return data;
  }, [state.movimientosPresupuestales, filters.bpin, filters.periodo]);

  const filteredCaracteristicosData = useMemo(() => {
    let data = state.datosCaracteristicos;

    if (filters.bpin) {
      data = data.filter(item => item.bpin === filters.bpin);
    }
    if (filters.centroGestor) {
      data = data.filter(item => item.nombre_centro_gestor === filters.centroGestor);
    }
    if (filters.programa) {
      data = data.filter(item => item.nombre_programa === filters.programa);
    }
    if (filters.comuna) {
      data = data.filter(item => item.comuna === filters.comuna);
    }
    if (filters.anio) {
      data = data.filter(item => item.anio === filters.anio);
    }

    return data;
  }, [
    state.datosCaracteristicos,
    filters.bpin,
    filters.centroGestor,
    filters.programa,
    filters.comuna,
    filters.anio
  ]);

  // Utility functions
  const getLatestPeriodDataUtil = useCallback((data: EjecucionPresupuestal[]) => {
    return getLatestPeriodData(data);
  }, []);

  const getUniquePeriodsUtil = useCallback((data: EjecucionPresupuestal[]) => {
    return getUniquePeriodsFromEjecucion(data);
  }, []);

  const getUniqueBpinsUtil = useCallback((data: EjecucionPresupuestal[]) => {
    return getUniqueBpinsFromEjecucion(data);
  }, []);

  const getDataByBpinUtil = useCallback((data: EjecucionPresupuestal[], bpin: number) => {
    return getDataByBpin(data, bpin);
  }, []);

  const getDataByPeriodUtil = useCallback((data: EjecucionPresupuestal[], periodo: string) => {
    return getDataByPeriod(data, periodo);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    if (enableCache) {
      clearDataCache();
    }
  }, [enableCache]);

  // Get cache status
  const getCacheStatusUtil = useCallback(() => {
    return getCacheStatus();
  }, []);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadAllData();
    }
  }, [autoLoad, loadAllData]);

  // Summary statistics
  const summary = useMemo(() => {
    const totalProjects = new Set(state.ejecucionPresupuestal.map(item => item.bpin)).size;
    const totalExecution = state.ejecucionPresupuestal.reduce((sum, item) => sum + item.ejecucion, 0);
    const totalPayments = state.ejecucionPresupuestal.reduce((sum, item) => sum + item.pagos, 0);
    const uniquePeriods = getUniquePeriodsUtil(state.ejecucionPresupuestal);
    const uniqueCentros = new Set(state.datosCaracteristicos.map(item => item.nombre_centro_gestor)).size;

    return {
      totalProjects,
      totalExecution,
      totalPayments,
      periodsCount: uniquePeriods.length,
      latestPeriod: uniquePeriods[uniquePeriods.length - 1] || null,
      centrosGestoresCount: uniqueCentros
    };
  }, [state.ejecucionPresupuestal, state.datosCaracteristicos, getUniquePeriodsUtil]);

  return {
    // Data
    ejecucionPresupuestal: filteredEjecucionData,
    movimientosPresupuestales: filteredMovimientosData,
    datosCaracteristicos: filteredCaracteristicosData,
    centrosGestores: state.centrosGestores,
    
    // Raw data (unfiltered)
    rawEjecucionPresupuestal: state.ejecucionPresupuestal,
    rawMovimientosPresupuestales: state.movimientosPresupuestales,
    rawDatosCaracteristicos: state.datosCaracteristicos,
    
    // State
    loading: state.loading,
    loadingStates,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Actions
    loadAllData,
    loadEjecucionPresupuestal: loadEjecucionPresupuestalData,
    loadMovimientosPresupuestales: loadMovimientosPresupuestalesData,
    loadDatosCaracteristicos: loadDatosCaracteristicosData,
    loadCentrosGestores: loadCentrosGestoresData,
    
    // Utilities
    getLatestPeriodData: getLatestPeriodDataUtil,
    getUniquePeriodsFromEjecucion: getUniquePeriodsUtil,
    getUniqueBpinsFromEjecucion: getUniqueBpinsUtil,
    getDataByBpin: getDataByBpinUtil,
    getDataByPeriod: getDataByPeriodUtil,
    clearCache,
    getCacheStatus: getCacheStatusUtil,
    
    // Summary
    summary
  };
};
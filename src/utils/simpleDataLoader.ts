// Simple data loader to replace complex budgetDataLoader and avoid ChunkLoadError
// Direct fetch approach without complex singleton patterns

export interface EjecucionPresupuestal {
  bpin: number;
  periodo_corte: string;
  ejecucion: number;
  pagos: number;
  ppto_disponible: number;
  saldos_cdp: number;
  total_acumul_obligac: number;
  total_acumulado_cdp: number;
  total_acumulado_rpc: number;
  dataframe_origen: string;
  archivo_origen: string;
}

export interface MovimientoPresupuestal {
  bpin: number;
  periodo_corte: string;
  adiciones: number;
  aplazamiento: number;
  contracreditos: number;
  creditos: number;
  desaplazamiento: number;
  ppto_inicial: number;
  ppto_modificado: number;
  reducciones: number;
  dataframe_origen: string;
  archivo_origen: string;
}

export interface DatosCaracteristicosProyecto {
  bpin: number;
  bp: string;
  nombre_proyecto: string;
  nombre_actividad: string;
  programa_presupuestal: number;
  nombre_centro_gestor: string;
  nombre_area_funcional: string;
  nombre_fondo: string;
  clasificacion_fondo: string;
  nombre_pospre: string;
  nombre_dimension: string | null;
  nombre_linea_estrategica: string | null;
  nombre_programa: string;
  comuna: string;
  origen: string;
  anio: number;
  tipo_gasto: string;
  cod_sector: string | null;
  cod_producto: string | null;
  validador_cuipo: string | null;
}

export interface CentroGestor {
  centros_gestores: string[];
}

// Simple cache to avoid repeated requests
const dataCache = new Map<string, any>();

// Simple fetch function with basic error handling
async function fetchJsonData<T>(url: string): Promise<T> {
  // Check cache first
  if (dataCache.has(url)) {
    return dataCache.get(url);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    dataCache.set(url, data);
    
    return data;
  } catch (error) {
    console.error(`Error loading ${url}:`, error);
    throw new Error(`Failed to load data from ${url}`);
  }
}

// Direct data loading functions
export async function loadEjecucionPresupuestal(): Promise<EjecucionPresupuestal[]> {
  return fetchJsonData<EjecucionPresupuestal[]>('/data/ejecucion_presupuestal/ejecucion_presupuestal.json');
}

export async function loadMovimientosPresupuestales(): Promise<MovimientoPresupuestal[]> {
  return fetchJsonData<MovimientoPresupuestal[]>('/data/ejecucion_presupuestal/movimientos_presupuestales.json');
}

export async function loadDatosCaracteristicosProyectos(): Promise<DatosCaracteristicosProyecto[]> {
  return fetchJsonData<DatosCaracteristicosProyecto[]>('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json');
}

export async function loadCentrosGestores(): Promise<CentroGestor> {
  return fetchJsonData<CentroGestor>('/data/ejecucion_presupuestal/centro_gestor.json');
}

// Utility functions for data processing
export function getLatestPeriodData(data: EjecucionPresupuestal[]): EjecucionPresupuestal[] {
  if (!data || data.length === 0) return [];
  
  const latestPeriod = data.reduce((latest, current) => {
    return new Date(current.periodo_corte) > new Date(latest.periodo_corte) ? current : latest;
  }).periodo_corte;

  return data.filter(item => item.periodo_corte === latestPeriod);
}

export function getDataByBpin(data: EjecucionPresupuestal[], bpin: number): EjecucionPresupuestal[] {
  return data.filter(item => item.bpin === bpin);
}

export function getDataByPeriod(data: EjecucionPresupuestal[], periodo: string): EjecucionPresupuestal[] {
  return data.filter(item => item.periodo_corte === periodo);
}

export function getUniquePeriodsFromEjecucion(data: EjecucionPresupuestal[]): string[] {
  const periods = new Set(data.map(item => item.periodo_corte));
  return Array.from(periods).sort();
}

export function getUniqueBpinsFromEjecucion(data: EjecucionPresupuestal[]): number[] {
  const bpins = new Set(data.map(item => item.bpin));
  return Array.from(bpins).sort((a, b) => a - b);
}

// Clear cache function
export function clearDataCache(): void {
  dataCache.clear();
}

// Get cache status
export function getCacheStatus(): { [key: string]: boolean } {
  return {
    ejecucion_presupuestal: dataCache.has('/data/ejecucion_presupuestal/ejecucion_presupuestal.json'),
    movimientos_presupuestales: dataCache.has('/data/ejecucion_presupuestal/movimientos_presupuestales.json'),
    datos_caracteristicos: dataCache.has('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json'),
    centros_gestores: dataCache.has('/data/ejecucion_presupuestal/centro_gestor.json')
  };
}
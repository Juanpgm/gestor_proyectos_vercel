// Utility for loading budget execution data directly from JSON files
// This replaces API calls with direct file loading for better performance

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

class BudgetDataLoader {
  private static instance: BudgetDataLoader;
  private cache: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): BudgetDataLoader {
    if (!BudgetDataLoader.instance) {
      BudgetDataLoader.instance = new BudgetDataLoader();
    }
    return BudgetDataLoader.instance;
  }

  private async loadJsonFile<T>(filePath: string): Promise<T> {
    // Check if already loading
    if (this.loadingPromises.has(filePath)) {
      return this.loadingPromises.get(filePath);
    }

    // Check cache first
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }

    // Create loading promise
    const loadingPromise = fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Cache the result
        this.cache.set(filePath, data);
        // Remove from loading promises
        this.loadingPromises.delete(filePath);
        return data;
      })
      .catch(error => {
        // Remove from loading promises on error
        this.loadingPromises.delete(filePath);
        throw error;
      });

    // Store the loading promise
    this.loadingPromises.set(filePath, loadingPromise);

    return loadingPromise;
  }

  async loadEjecucionPresupuestal(): Promise<EjecucionPresupuestal[]> {
    return this.loadJsonFile<EjecucionPresupuestal[]>('/data/ejecucion_presupuestal/ejecucion_presupuestal.json');
  }

  async loadMovimientosPresupuestales(): Promise<MovimientoPresupuestal[]> {
    return this.loadJsonFile<MovimientoPresupuestal[]>('/data/ejecucion_presupuestal/movimientos_presupuestales.json');
  }

  async loadDatosCaracteristicosProyectos(): Promise<DatosCaracteristicosProyecto[]> {
    return this.loadJsonFile<DatosCaracteristicosProyecto[]>('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json');
  }

  async loadCentrosGestores(): Promise<CentroGestor> {
    return this.loadJsonFile<CentroGestor>('/data/ejecucion_presupuestal/centro_gestor.json');
  }

  // Utility methods for data processing
  getLatestPeriodData(data: EjecucionPresupuestal[]): EjecucionPresupuestal[] {
    if (!data || data.length === 0) return [];
    
    // Get the latest period
    const latestPeriod = data.reduce((latest, current) => {
      return new Date(current.periodo_corte) > new Date(latest.periodo_corte) ? current : latest;
    }).periodo_corte;

    return data.filter(item => item.periodo_corte === latestPeriod);
  }

  getDataByBpin(data: EjecucionPresupuestal[], bpin: number): EjecucionPresupuestal[] {
    return data.filter(item => item.bpin === bpin);
  }

  getDataByPeriod(data: EjecucionPresupuestal[], periodo: string): EjecucionPresupuestal[] {
    return data.filter(item => item.periodo_corte === periodo);
  }

  getUniquePeriodsFromEjecucion(data: EjecucionPresupuestal[]): string[] {
    const periods = new Set(data.map(item => item.periodo_corte));
    return Array.from(periods).sort();
  }

  getUniqueBpinsFromEjecucion(data: EjecucionPresupuestal[]): number[] {
    const bpins = new Set(data.map(item => item.bpin));
    return Array.from(bpins).sort((a, b) => a - b);
  }

  // Clear cache method
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // Get cache status
  getCacheStatus(): { [key: string]: boolean } {
    return {
      ejecucion_presupuestal: this.cache.has('/data/ejecucion_presupuestal/ejecucion_presupuestal.json'),
      movimientos_presupuestales: this.cache.has('/data/ejecucion_presupuestal/movimientos_presupuestales.json'),
      datos_caracteristicos: this.cache.has('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json'),
      centros_gestores: this.cache.has('/data/ejecucion_presupuestal/centro_gestor.json')
    };
  }
}

// Export singleton instance
export const budgetDataLoader = BudgetDataLoader.getInstance();

// Export utility functions for direct use
export const loadEjecucionPresupuestal = () => budgetDataLoader.loadEjecucionPresupuestal();
export const loadMovimientosPresupuestales = () => budgetDataLoader.loadMovimientosPresupuestales();
export const loadDatosCaracteristicosProyectos = () => budgetDataLoader.loadDatosCaracteristicosProyectos();
export const loadCentrosGestores = () => budgetDataLoader.loadCentrosGestores();
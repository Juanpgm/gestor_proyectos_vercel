/**
 * Servicio para la gestión de Unidades de Proyecto
 * Implementa programación funcional con manejo de errores robusto
 */

import { z } from 'zod';

// Schemas de validación usando Zod para garantizar tipo de datos
const GeometrySchema = z.object({
  type: z.string(),
  features: z.array(z.object({
    type: z.string(),
    geometry: z.object({
      type: z.string(),
      coordinates: z.union([
        z.tuple([z.number(), z.number()]),
        z.array(z.array(z.tuple([z.number(), z.number()])))
      ])
    }),
    properties: z.record(z.any())
  }))
});

const AttributeSchema = z.object({
  upid: z.string(),
  nombre_up: z.string(),
  estado: z.string(),
  tipo_intervencion: z.string(),
  nombre_centro_gestor: z.string(),
  comuna_corregimiento: z.string(),
  barrio_vereda: z.string(),
  presupuesto_base: z.number(),
  avance_obra: z.number(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  descripcion_intervencion: z.string(),
  fuente_financiacion: z.string(),
  ano: z.number()
});

const FilterSchema = z.object({
  estados: z.array(z.string()),
  tipos_intervencion: z.array(z.string()),
  centros_gestores: z.array(z.string()),
  comunas_corregimientos: z.array(z.string()),
  barrios_veredas: z.array(z.string()),
  fuentes_financiacion: z.array(z.string()),
  anos: z.array(z.number())
});

const DashboardSchema = z.object({
  resumen_general: z.object({
    total_proyectos: z.number(),
    con_geometria: z.number(),
    con_atributos: z.number(),
    porcentaje_geo: z.number(),
    cobertura_datos: z.object({
      completos: z.number(),
      solo_atributos: z.number(),
      solo_geometria: z.number()
    })
  }),
  distribuciones: z.object({
    por_estado: z.object({
      conteos: z.record(z.number()),
      total_categorias: z.number(),
      porcentajes: z.record(z.number()),
      top_3: z.array(z.tuple([z.string(), z.number()]))
    }),
    por_tipo_intervencion: z.object({
      conteos: z.record(z.number()),
      total_categorias: z.number(),
      porcentajes: z.record(z.number()),
      top_3: z.array(z.tuple([z.string(), z.number()]))
    }),
    por_centro_gestor: z.object({
      conteos: z.record(z.number()),
      total_categorias: z.number(),
      porcentajes: z.record(z.number()),
      top_3: z.array(z.tuple([z.string(), z.number()]))
    }),
    por_comuna_corregimiento: z.object({
      conteos: z.record(z.number()),
      total_categorias: z.number(),
      porcentajes: z.record(z.number()),
      top_3: z.array(z.tuple([z.string(), z.number()]))
    }),
    por_barrio_vereda: z.object({
      conteos: z.record(z.number()),
      total_categorias: z.number(),
      porcentajes: z.record(z.number()),
      top_3: z.array(z.tuple([z.string(), z.number()]))
    })
  }),
  metricas_geograficas: z.record(z.any()),
  analisis_calidad: z.record(z.object({
    valores_validos: z.number(),
    valores_faltantes: z.number(),
    completitud_porcentaje: z.number(),
    calidad: z.string()
  })),
  kpis_negocio: z.object({
    proyectos_activos: z.number(),
    proyectos_finalizados: z.number(),
    tasa_completitud: z.number(),
    diversidad_tipos: z.number(),
    centros_gestores_activos: z.number(),
    cobertura_territorial: z.object({
      comunas_corregimientos: z.number(),
      barrios_veredas: z.number()
    })
  }),
  filtros_aplicados: z.record(z.any())
});

// Tipos derivados de los schemas
export type GeometryData = z.infer<typeof GeometrySchema>;
export type AttributeData = z.infer<typeof AttributeSchema>;
export type FilterData = z.infer<typeof FilterSchema>;
export type DashboardData = z.infer<typeof DashboardSchema>;

// Tipo para parámetros de filtrado
export interface FilterParams {
  estado?: string;
  tipo_intervencion?: string;
  centro_gestor?: string;
  comuna_corregimiento?: string;
  barrio_vereda?: string;
  fuente_financiacion?: string;
  ano?: number;
  search?: string;
}

// Tipo para respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  filters?: any;
  dashboard?: any;
}

// Configuración de la API
const API_CONFIG = {
  BASE_PATH: '/api/proxy/unidades-proyecto',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const;

// Utilidad para manejar errores de manera funcional
const handleApiError = (error: unknown): never => {
  if (error instanceof Error) {
    throw new Error(`API Error: ${error.message}`);
  }
  throw new Error('API Error: Unknown error occurred');
};

// Utilidad para delay en reintentos
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Utilidad para hacer fetch con retry
const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  attempts: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    if (attempts > 1) {
      await delay(API_CONFIG.RETRY_DELAY);
      return fetchWithRetry(url, options, attempts - 1);
    }
    throw error;
  }
};

// Función para construir query string de filtros
const buildFilterQuery = (filters: FilterParams): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
};

// Funciones del servicio usando programación funcional

/**
 * Obtiene datos de geometría con filtros opcionales
 */
export const fetchGeometryData = async (filters: FilterParams = {}): Promise<GeometryData> => {
  try {
    const queryString = buildFilterQuery(filters);
    const url = `${API_CONFIG.BASE_PATH}/geometry${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithRetry(url);
    const data = await response.json();
    
    // Validar estructura de datos
    return GeometrySchema.parse(data);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Obtiene datos de atributos con filtros opcionales
 */
export const fetchAttributeData = async (filters: FilterParams = {}): Promise<AttributeData[]> => {
  try {
    const queryString = buildFilterQuery(filters);
    const url = `${API_CONFIG.BASE_PATH}/attributes${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithRetry(url);
    const apiResponse: ApiResponse<any> = await response.json();
    
    // Los datos ahora vienen unwrapped desde el proxy
    const dataArray = Array.isArray(apiResponse) ? apiResponse : [];
    
    // Procesar y validar cada elemento con manejo de errores individuales
    const validatedData: AttributeData[] = [];
    
    dataArray.forEach((item: any, index: number) => {
      try {
        const properties = item.properties || item;
        
        const validatedItem = AttributeSchema.parse({
          upid: properties.upid || '',
          nombre_up: properties.nombre_up || '',
          estado: properties.estado || '',
          tipo_intervencion: properties.tipo_intervencion || '',
          nombre_centro_gestor: properties.nombre_centro_gestor || '',
          comuna_corregimiento: properties.comuna_corregimiento || '',
          barrio_vereda: properties.barrio_vereda || '',
          presupuesto_base: parseFloat(properties.presupuesto_base) || 0,
          avance_obra: (parseFloat(properties.avance_obra) || 0) * 100,
          fecha_inicio: properties.fecha_inicio || '',
          fecha_fin: properties.fecha_fin || '',
          descripcion_intervencion: properties.descripcion_intervencion || '',
          fuente_financiacion: properties.fuente_financiacion || '',
          ano: parseInt(properties.ano) || 0
        });
        
        validatedData.push(validatedItem);
      } catch (validationError) {
        console.warn(`⚠️ Validation failed for item ${index}:`, validationError);
        console.warn('Item data:', item);
        // Continuar con el siguiente elemento sin interrumpir el proceso
      }
    });
    
    console.log(`✅ fetchAttributeData: Processed ${dataArray.length} items, validated ${validatedData.length} items`);
    return validatedData;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Obtiene opciones de filtros disponibles
 */
export const fetchFilterData = async (): Promise<FilterData> => {
  try {
    const response = await fetchWithRetry(`${API_CONFIG.BASE_PATH}/filters`);
    const apiResponse: ApiResponse<any> = await response.json();
    
    const rawFilters = apiResponse.success && apiResponse.filters ? apiResponse.filters : apiResponse;
    
    return FilterSchema.parse({
      estados: rawFilters.estados || [],
      tipos_intervencion: rawFilters.tipos_intervencion || [],
      centros_gestores: rawFilters.centros_gestores || [],
      comunas_corregimientos: rawFilters.comunas_corregimientos || rawFilters.comunas || [],
      barrios_veredas: rawFilters.barrios_veredas || [],
      fuentes_financiacion: rawFilters.fuentes_financiacion || [],
      anos: rawFilters.anos ? rawFilters.anos.map((ano: string) => parseInt(ano)).filter((ano: number) => !isNaN(ano)) : []
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Obtiene datos del dashboard
 */
export const fetchDashboardData = async (filters: FilterParams = {}): Promise<DashboardData> => {
  try {
    const queryString = buildFilterQuery(filters);
    const url = `${API_CONFIG.BASE_PATH}/dashboard${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithRetry(url);
    const apiResponse: ApiResponse<any> = await response.json();
    
    // La API devuelve la estructura en .dashboard
    const rawDashboard = apiResponse.success && apiResponse.dashboard ? apiResponse.dashboard : apiResponse;
    
    return DashboardSchema.parse(rawDashboard);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Función utilitaria para generar filtros desde datos existentes
 */
export const generateFiltersFromData = (data: AttributeData[]): FilterData => {
  const extractUniqueValues = <T>(items: T[], key: keyof T): string[] => 
    Array.from(new Set(items.map(item => String(item[key])).filter(Boolean))).sort();

  const extractUniqueNumbers = <T>(items: T[], key: keyof T): number[] => 
    Array.from(new Set(items.map(item => Number(item[key])).filter(num => !isNaN(num)))).sort((a, b) => b - a);

  return {
    estados: extractUniqueValues(data, 'estado'),
    tipos_intervencion: extractUniqueValues(data, 'tipo_intervencion'),
    centros_gestores: extractUniqueValues(data, 'nombre_centro_gestor'),
    comunas_corregimientos: extractUniqueValues(data, 'comuna_corregimiento'),
    barrios_veredas: extractUniqueValues(data, 'barrio_vereda'),
    fuentes_financiacion: extractUniqueValues(data, 'fuente_financiacion'),
    anos: extractUniqueNumbers(data, 'ano')
  };
};

/**
 * Función para filtrar datos localmente (útil para filtrado en tiempo real)
 */
export const filterAttributeData = (
  data: AttributeData[], 
  filters: FilterParams & { searchTerm?: string }
): AttributeData[] => {
  return data.filter(item => {
    // Filtro de búsqueda por texto
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        item.nombre_up.toLowerCase().includes(searchTermLower) ||
        item.descripcion_intervencion.toLowerCase().includes(searchTermLower) ||
        item.upid.toLowerCase().includes(searchTermLower);
      
      if (!matchesSearch) return false;
    }
    
    // Filtros específicos
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value || value === '' || key === 'searchTerm') return true;
      
      switch (key) {
        case 'estado':
          return item.estado === value;
        case 'tipo_intervencion':
          return item.tipo_intervencion === value;
        case 'centro_gestor':
          return item.nombre_centro_gestor === value;
        case 'comuna_corregimiento':
          return item.comuna_corregimiento === value;
        case 'barrio_vereda':
          return item.barrio_vereda === value;
        case 'fuente_financiacion':
          return item.fuente_financiacion === value;
        case 'ano':
          return item.ano === Number(value);
        default:
          return true;
      }
    });
    
    return matchesFilters;
  });
};

// Exportar configuración para uso en otros lugares
export { API_CONFIG };
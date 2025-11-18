/**
 * Servicio para la gestión de Unidades de Proyecto
 * Implementa programación funcional con manejo de errores robusto
 */

import { z } from 'zod';
import { parseGeometry, createGeoJSONFeatureCollection } from '@/utils/geometryParser';

// Schemas de validación usando Zod para garantizar tipo de datos
const GeometrySchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.object({
    type: z.literal('Feature'),
    geometry: z.object({
      type: z.enum(['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection']),
      coordinates: z.union([
        // Point: [lon, lat]
        z.tuple([z.number(), z.number()]),
        // LineString: [[lon, lat], [lon, lat], ...]
        z.array(z.tuple([z.number(), z.number()])),
        // Polygon: [[[lon, lat], [lon, lat], ...]]
        z.array(z.array(z.tuple([z.number(), z.number()]))),
        // Casos más complejos
        z.array(z.any())
      ]).optional(), // Hacer opcional porque GeometryCollection no tiene coordinates directas
      geometries: z.array(z.any()).optional() // Para GeometryCollection
    }),
    properties: z.record(z.any())
  }))
});

const AttributeSchema = z.object({
  upid: z.string(),
  nombre_up: z.string(),
  nombre_up_detalle: z.string().optional(),
  identificador: z.string().optional(),
  estado: z.string(),
  tipo_intervencion: z.string(),
  tipo_equipamiento: z.string().optional(),
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
  tipos_equipamiento: z.array(z.string()),
  centros_gestores: z.array(z.string()),
  comunas: z.array(z.string()), // La API devuelve 'comunas' no 'comunas_corregimientos'
  barrios_veredas: z.array(z.string()),
  fuentes_financiacion: z.array(z.string()),
  anos: z.array(z.string()) // La API devuelve años como strings
});

// Tipos derivados de los schemas
export type GeometryData = z.infer<typeof GeometrySchema>;
export type AttributeData = z.infer<typeof AttributeSchema>;
export type FilterData = z.infer<typeof FilterSchema>;

// Tipo para parámetros de filtrado
export interface FilterParams {
  estado?: string;
  tipo_intervencion?: string;
  tipo_equipamiento?: string;
  centro_gestor?: string;
  comuna_corregimiento?: string;
  barrio_vereda?: string;
  fuente_financiacion?: string;
  ano?: string; // Cambiar a string para consistencia con la API
  search?: string;
  // Campos para filtros múltiples
  estado_multiple?: string[];
  tipo_intervencion_multiple?: string[];
  tipo_equipamiento_multiple?: string[];
  centro_gestor_multiple?: string[];
  comuna_corregimiento_multiple?: string[];
  barrio_vereda_multiple?: string[];
  fuente_financiacion_multiple?: string[];
  ano_multiple?: string[];
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
    
    // Agregar timestamp único a la URL para evitar cualquier cache
    const separator = url.includes('?') ? '&' : '?';
    const urlWithTimestamp = `${url}${separator}_t=${Date.now()}&_r=${Math.random()}`;
    
    const response = await fetch(urlWithTimestamp, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Bust': Date.now().toString(),
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
      // Manejar arrays (si llega a ser necesario en el futuro)
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, String(item)));
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  const queryString = params.toString();
  console.log(`🔍 BuildFilterQuery: Built query string: ${queryString}`);
  
  return queryString;
};

// Funciones del servicio usando programación funcional

/**
 * Obtiene datos de geometría con filtros opcionales
 */
export const fetchGeometryData = async (filters: FilterParams = {}): Promise<GeometryData> => {
  try {
    const queryString = buildFilterQuery(filters);
    const url = `${API_CONFIG.BASE_PATH}/geometry${queryString ? `?${queryString}` : ''}`;
    
    console.log(`🌐 fetchGeometryData: Requesting FRESH data from ${url}`);
    console.log(`⏰ fetchGeometryData: Timestamp ${new Date().toISOString()}`);
    
    const response = await fetchWithRetry(url);
    console.log(`📦 fetchGeometryData: Cache headers:`, response.headers.get('cache-control'));
    const apiResponse = await response.json();
    
    console.log(`📦 fetchGeometryData: Response structure:`, {
      isGeoJSON: apiResponse.type === 'FeatureCollection',
      hasFeatures: Array.isArray(apiResponse.features),
      featureCount: apiResponse.features?.length || 0,
      hasProperties: !!apiResponse.properties,
      topLevelKeys: Object.keys(apiResponse)
    });
    
    // La API devuelve un GeoJSON FeatureCollection completo con metadatos en properties
    // El proxy no desenvuelve este endpoint, así que viene completo
    let geoJsonData;
    
    if (apiResponse.type === 'FeatureCollection' && Array.isArray(apiResponse.features)) {
      // Respuesta directa como GeoJSON FeatureCollection
      // Extraer solo type y features para el schema, ignorar los metadatos
      geoJsonData = {
        type: apiResponse.type,
        features: apiResponse.features
      };
      
      console.log(`📊 fetchGeometryData: Processing GeoJSON with ${apiResponse.features.length} features`);
      
      // Log información de metadatos si está disponible
      if (apiResponse.properties) {
        console.log(`📋 fetchGeometryData: Metadata:`, {
          success: apiResponse.properties.success,
          count: apiResponse.properties.count,
          message: apiResponse.properties.message,
          filters_applied: apiResponse.properties.filters_applied
        });
      }
      
      // Log de muestra de la primera feature para debugging
      if (apiResponse.features.length > 0) {
        const firstFeature = apiResponse.features[0];
        console.log(`📍 fetchGeometryData: Sample feature:`, {
          upid: firstFeature.properties?.upid,
          geometry_type: firstFeature.geometry?.type,
          has_coordinates: !!firstFeature.geometry?.coordinates,
          has_valid_geometry: firstFeature.properties?.has_valid_geometry,
          coordinates_sample: firstFeature.geometry?.coordinates?.slice(0, 2) // Solo primeras 2 coordenadas para no saturar log
        });
      }
    } else if (apiResponse.data && apiResponse.data.type === 'FeatureCollection') {
      // Respuesta envuelta en un objeto data (caso alternativo)
      geoJsonData = {
        type: apiResponse.data.type,
        features: apiResponse.data.features
      };
      console.log(`📊 fetchGeometryData: Processing wrapped GeoJSON with ${apiResponse.data.features?.length || 0} features`);
    } else {
      // Formato inesperado
      console.warn('⚠️ fetchGeometryData: Unexpected response format:', apiResponse);
      throw new Error('Formato de respuesta de geometría inesperado');
    }
    
    // Procesar geometrías con el parser para manejar strings JSON
    console.log(`🔧 fetchGeometryData: Parsing geometries...`);
    const parsedFeatures = geoJsonData.features.map((feature: any) => {
      const parsedGeometry = parseGeometry(feature.geometry);
      
      if (!parsedGeometry) {
        console.warn(`⚠️ Failed to parse geometry for feature:`, feature.properties?.upid);
        return null;
      }
      
      return {
        type: 'Feature',
        geometry: parsedGeometry,
        properties: feature.properties
      };
    }).filter((f: any) => f !== null);
    
    const parsedGeoJsonData = {
      type: 'FeatureCollection' as const,
      features: parsedFeatures
    };
    
    console.log(`✅ fetchGeometryData: Parsed ${parsedFeatures.length} of ${geoJsonData.features.length} features`);
    
    // Validar estructura de datos con el schema
    const validatedData = GeometrySchema.parse(parsedGeoJsonData);
    
    console.log(`✅ fetchGeometryData: Successfully validated ${validatedData.features.length} features`);
    
    return validatedData;
  } catch (error) {
    console.error('❌ fetchGeometryData error:', error);
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
    
    console.log(`🌐 fetchAttributeData: Requesting FRESH data from ${url}`);
    console.log(`⏰ fetchAttributeData: Timestamp ${new Date().toISOString()}`);
    
    const response = await fetchWithRetry(url);
    const apiResponse = await response.json();
    
    console.log(`📦 fetchAttributeData: Response type:`, typeof apiResponse, Array.isArray(apiResponse) ? 'array' : 'object');
    console.log(`📦 fetchAttributeData: Cache headers:`, response.headers.get('cache-control'));
    
    // Los datos ahora vienen unwrapped desde el proxy
    let dataArray;
    
    if (Array.isArray(apiResponse)) {
      // Respuesta directa como array
      dataArray = apiResponse;
    } else if (apiResponse && apiResponse.success && Array.isArray(apiResponse.data)) {
      // Respuesta envuelta con success: true
      dataArray = apiResponse.data;
    } else if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
      // Respuesta con data pero sin success
      dataArray = apiResponse.data;
    } else {
      // Última opción: tratar la respuesta como array vacío
      console.warn('⚠️ fetchAttributeData: Unexpected response format, defaulting to empty array');
      dataArray = [];
    }
    
    console.log(`📊 fetchAttributeData: Processing ${dataArray.length} raw items`);
    
    // Procesar y validar cada elemento con manejo de errores individuales
    const validatedData: AttributeData[] = [];
    
    dataArray.forEach((item: any, index: number) => {
      try {
        const properties = item.properties || item;
        
        const validatedItem = AttributeSchema.parse({
          upid: properties.upid || '',
          nombre_up: properties.nombre_up || '',
          nombre_up_detalle: properties.nombre_up_detalle || undefined,
          identificador: properties.identificador || undefined,
          estado: properties.estado || '',
          tipo_intervencion: properties.tipo_intervencion || '',
          tipo_equipamiento: properties.tipo_equipamiento || undefined,
          nombre_centro_gestor: properties.nombre_centro_gestor || '',
          comuna_corregimiento: properties.comuna_corregimiento || '',
          barrio_vereda: properties.barrio_vereda || '',
          presupuesto_base: parseFloat(properties.presupuesto_base) || 0,
          avance_obra: parseFloat(properties.avance_obra) || 0,
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
    
    // Debug presupuestos en fetchAttributeData
    const totalPresupuestos = validatedData.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0);
    console.log(`✅ fetchAttributeData: Processed ${dataArray.length} items, validated ${validatedData.length} items`);
    console.log(`💰 fetchAttributeData: Total presupuestos sum = ${totalPresupuestos.toLocaleString()}`);
    
    return validatedData;
  } catch (error) {
    console.error('❌ fetchAttributeData error:', error);
    return handleApiError(error);
  }
};

/**
 * Obtiene opciones de filtros disponibles
 * Siempre genera filtros desde los datos reales de attributes para garantizar consistencia
 */
export const fetchFilterData = async (): Promise<FilterData> => {
  try {
    console.log(`🌐 fetchFilterData: Obteniendo filtros desde datos de attributes`);
    
    // SIEMPRE obtener filtros desde los datos reales de attributes
    const attributeData = await fetchAttributeData();
    
    if (!attributeData || attributeData.length === 0) {
      console.warn('⚠️ No hay datos de attributes disponibles para generar filtros');
      return FilterSchema.parse({
        estados: [],
        tipos_intervencion: [],
        tipos_equipamiento: [],
        centros_gestores: [],
        comunas_corregimientos: [],
        barrios_veredas: [],
        fuentes_financiacion: [],
        anos: []
      });
    }
    
    console.log(`📊 fetchFilterData: Generando filtros desde ${attributeData.length} registros`);
    
    // Generar filtros desde los datos reales
    const generatedFilters = generateFiltersFromData(attributeData);
    
    console.log(`✅ fetchFilterData: Filtros generados exitosamente:`, {
      estados: generatedFilters.estados.length,
      tipos_intervencion: generatedFilters.tipos_intervencion.length,
      tipos_equipamiento: generatedFilters.tipos_equipamiento.length,
      centros_gestores: generatedFilters.centros_gestores.length,
      comunas: generatedFilters.comunas.length,
      barrios_veredas: generatedFilters.barrios_veredas.length,
      fuentes_financiacion: generatedFilters.fuentes_financiacion.length,
      anos: generatedFilters.anos.length
    });
    
    // Log de muestra de valores
    console.log(`📋 fetchFilterData: Muestra de valores únicos:`, {
      estados: generatedFilters.estados.slice(0, 3),
      tipos_intervencion: generatedFilters.tipos_intervencion.slice(0, 3),
      tipos_equipamiento: generatedFilters.tipos_equipamiento.slice(0, 3),
      centros_gestores: generatedFilters.centros_gestores.slice(0, 3),
      comunas: generatedFilters.comunas.slice(0, 3),
      anos: generatedFilters.anos
    });
    
    return generatedFilters;
  } catch (error) {
    console.error('❌ fetchFilterData error:', error);
    return handleApiError(error);
  }
};

/**
 * Función utilitaria para generar filtros desde datos existentes
 * Extrae valores únicos de cada campo, filtrando vacíos y undefined
 */
export const generateFiltersFromData = (data: AttributeData[]): FilterData => {
  const extractUniqueValues = <T>(items: T[], key: keyof T): string[] => {
    const values = items
      .map(item => item[key])
      .filter(val => val !== undefined && val !== null && String(val).trim() !== '')
      .map(val => String(val).trim());
    
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'es'));
  };

  const extractUniqueYears = <T>(items: T[], key: keyof T): string[] => {
    const years = items
      .map(item => String(item[key]).replace('.0', '')) // Remover .0 de los años
      .filter(year => year && year !== 'undefined' && year !== 'null' && !isNaN(Number(year)));
    
    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  };

  const filters = {
    estados: extractUniqueValues(data, 'estado'),
    tipos_intervencion: extractUniqueValues(data, 'tipo_intervencion'),
    tipos_equipamiento: extractUniqueValues(data, 'tipo_equipamiento'),
    centros_gestores: extractUniqueValues(data, 'nombre_centro_gestor'),
    comunas: extractUniqueValues(data, 'comuna_corregimiento'), // Mapear comuna_corregimiento a comunas
    barrios_veredas: extractUniqueValues(data, 'barrio_vereda'),
    fuentes_financiacion: extractUniqueValues(data, 'fuente_financiacion'),
    anos: extractUniqueYears(data, 'ano')
  };
  
  console.log('🔍 generateFiltersFromData: Filtros extraídos:', {
    totalData: data.length,
    estados: filters.estados.length,
    tipos_intervencion: filters.tipos_intervencion.length,
    tipos_equipamiento: filters.tipos_equipamiento.length,
    centros_gestores: filters.centros_gestores.length,
    comunas: filters.comunas.length,
    barrios_veredas: filters.barrios_veredas.length,
    fuentes_financiacion: filters.fuentes_financiacion.length,
    anos: filters.anos.length
  });
  
  return filters;
};

/**
 * Función para filtrar datos localmente (útil para filtrado en tiempo real)
 */
export const filterAttributeData = (
  data: AttributeData[], 
  filters: FilterParams & { searchTerm?: string }
): AttributeData[] => {
  if (!data || data.length === 0) {
    console.log('📊 filterAttributeData: No data to filter');
    return [];
  }

  console.log('📊 filterAttributeData: Starting with', data.length, 'items');
  console.log('📊 filterAttributeData: Applied filters:', filters);

  return data.filter(item => {
    try {
      // Filtro de búsqueda por texto
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          (item.nombre_up && item.nombre_up.toLowerCase().includes(searchTermLower)) ||
          (item.descripcion_intervencion && item.descripcion_intervencion.toLowerCase().includes(searchTermLower)) ||
          (item.upid && item.upid.toLowerCase().includes(searchTermLower));
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      // Filtros específicos
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value || value === '' || key === 'searchTerm') return true;
        
        try {
          // Verificar si existe un filtro múltiple para esta clave
          const multipleKey = `${key}_multiple`;
          const multipleValues = (filters as any)[multipleKey];
          
          if (multipleValues && Array.isArray(multipleValues) && multipleValues.length > 0) {
            // Si hay filtros múltiples, usar esos en lugar del filtro singular
            switch (key) {
              case 'estado':
                return multipleValues.includes(item.estado);
              case 'tipo_intervencion':
                return multipleValues.includes(item.tipo_intervencion);
              case 'tipo_equipamiento':
                return multipleValues.includes(item.tipo_equipamiento);
              case 'centro_gestor':
                return multipleValues.includes(item.nombre_centro_gestor);
              case 'comuna_corregimiento':
                return multipleValues.includes(item.comuna_corregimiento);
              case 'barrio_vereda':
                return multipleValues.includes(item.barrio_vereda);
              case 'fuente_financiacion':
                return multipleValues.includes(item.fuente_financiacion);
              case 'ano':
                return multipleValues.map(v => String(v).replace('.0', '')).includes(String(item.ano).replace('.0', ''));
              default:
                return true;
            }
          } else {
            // Usar filtro singular como antes
            switch (key) {
              case 'estado':
                return item.estado === value;
              case 'tipo_intervencion':
                return item.tipo_intervencion === value;
              case 'tipo_equipamiento':
                return item.tipo_equipamiento === value;
              case 'centro_gestor':
                return item.nombre_centro_gestor === value;
              case 'comuna_corregimiento':
                return item.comuna_corregimiento === value;
              case 'barrio_vereda':
                return item.barrio_vereda === value;
              case 'fuente_financiacion':
                return item.fuente_financiacion === value;
              case 'ano':
                return String(item.ano).replace('.0', '') === String(value).replace('.0', '');
              default:
                return true;
            }
          }
        } catch (filterError) {
          console.warn(`⚠️ Filter error for ${key}:`, filterError);
          return true; // En caso de error, no filtrar este item
        }
      });
      
      return matchesFilters;
    } catch (itemError) {
      console.warn('⚠️ Error filtering item:', itemError, item);
      return true; // En caso de error, incluir el item
    }
  });
};

// Exportar configuración para uso en otros lugares
export { API_CONFIG };
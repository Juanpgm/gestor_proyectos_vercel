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
  n_intervenciones: z.number().optional(),
  estado: z.string(),
  tipo_intervencion: z.string(),
  tipo_equipamiento: z.string().optional(),
  clase_up: z.string().optional(),
  frente_activo: z.string().optional(),
  nombre_centro_gestor: z.string().optional(),
  comuna_corregimiento: z.string(),
  barrio_vereda: z.string(),
  presupuesto_base: z.number(),
  avance_obra: z.number(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  fecha_inauguracion: z.string().optional(),
  duracion_proyecto: z.string().optional(),
  descripcion_intervencion: z.string(),
  fuente_financiacion: z.string(),
  ano: z.number()
});

const FilterSchema = z.object({
  estados: z.array(z.string()),
  tipos_intervencion: z.array(z.string()),
  tipos_equipamiento: z.array(z.string()),
  frentes_activos: z.array(z.string()),
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
  frente_activo?: string;
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
  frente_activo_multiple?: string[];
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

// Cache en memoria para datos inmutables (opcional)
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Utilidad para hacer fetch con retry optimizado
const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  attempts: number = API_CONFIG.RETRY_ATTEMPTS,
  useCache: boolean = false
): Promise<Response> => {
  // Verificar cache si está habilitado
  if (useCache) {
    const cached = memoryCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('💾 Using cached data for:', url.split('?')[0]);
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    // Solo agregar cache-busting si NO estamos usando cache
    const finalUrl = useCache ? url : `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    
    const response = await fetch(finalUrl, {
      ...options,
      signal: controller.signal,
      cache: useCache ? 'default' : 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(useCache ? {} : {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }),
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Guardar en cache si está habilitado
    if (useCache) {
      const data = await response.clone().json();
      memoryCache.set(url, { data, timestamp: Date.now() });
    }
    
    return response;
  } catch (error) {
    if (attempts > 1) {
      await delay(API_CONFIG.RETRY_DELAY);
      return fetchWithRetry(url, options, attempts - 1, useCache);
    }
    throw error;
  }
};

// Mapeo de claves de filtros frontend a backend
const FILTER_KEY_MAP: Record<string, string> = {
  'centro_gestor': 'nombre_centro_gestor',
  'centro_gestor_multiple': 'nombre_centro_gestor',
  'comuna_corregimiento': 'comuna_corregimiento',
  'comuna_corregimiento_multiple': 'comuna_corregimiento'
};

// Función optimizada para construir query string de filtros
const buildFilterQuery = (filters: FilterParams, verbose: boolean = false): string => {
  const params = new URLSearchParams();
  
  if (verbose) console.log('🔍 BuildFilterQuery: Input filters:', filters);
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    
    // Determinar la clave del parámetro para la API
    const apiKey = FILTER_KEY_MAP[key] || key.replace('_multiple', '');
    
    // Manejar arrays
    if (Array.isArray(value) && value.length > 0) {
      value.forEach(item => {
        if (item !== null && item !== undefined && item !== '') {
          params.append(apiKey, String(item));
        }
      });
    } 
    // Manejar valores simples
    else if (!key.endsWith('_multiple')) {
      params.append(apiKey, String(value));
    }
  });
  
  const queryString = params.toString();
  if (verbose && queryString) {
    console.log(`🔍 BuildFilterQuery: ${queryString}`);
  }
  
  return queryString;
};

// Funciones del servicio usando programación funcional

/**
 * Obtiene datos de geometría con filtros opcionales
 */
export const fetchGeometryData = async (filters: FilterParams = {}): Promise<GeometryData> => {
  try {
    const hasFilters = Object.keys(filters).length > 0;
    const queryString = buildFilterQuery(filters, false);
    const url = `${API_CONFIG.BASE_PATH}/geometry${queryString ? `?${queryString}` : ''}`;
    
    // Solo log si hay filtros aplicados
    if (hasFilters) {
      console.log(`🌐 fetchGeometryData: ${url.split('?')[0]} with filters`);
    }
    
    // Usar cache para peticiones sin filtros (datos completos)
    const response = await fetchWithRetry(url, {}, API_CONFIG.RETRY_ATTEMPTS, !hasFilters);
    const apiResponse = await response.json();
    
    // La API devuelve un GeoJSON FeatureCollection completo con metadatos en properties
    let geoJsonData;
    
    if (apiResponse.type === 'FeatureCollection' && Array.isArray(apiResponse.features)) {
      geoJsonData = {
        type: apiResponse.type,
        features: apiResponse.features
      };
      
      // Log conciso solo si hay filtros
      if (hasFilters) {
        console.log(`📊 fetchGeometryData: ${apiResponse.features.length} features loaded`);
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
    const hasFilters = Object.keys(filters).length > 0;
    const queryString = buildFilterQuery(filters, false);
    const url = `${API_CONFIG.BASE_PATH}/attributes${queryString ? `?${queryString}` : ''}`;
    
    // Usar cache para peticiones sin filtros
    const response = await fetchWithRetry(url, {}, API_CONFIG.RETRY_ATTEMPTS, !hasFilters);
    const apiResponse = await response.json();
    
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
        
        // ==========================================
        // MANEJO DE MÚLTIPLES ESTRUCTURAS DE DATOS
        // ==========================================
        // La API puede devolver dos estructuras diferentes:
        // 1) Estructura NUEVA con campo 'intervenciones' (array de intervenciones)
        // 2) Estructura ANTIGUA sin 'intervenciones' (datos directos en el objeto)
        
        const intervenciones = properties.intervenciones || [];
        const esEstructuraNueva = intervenciones.length > 0;
        const primeraIntervencion = esEstructuraNueva ? intervenciones[0] : {};
        
        // 💰 CORRECCIÓN: Sumar presupuestos de TODAS las intervenciones, no solo la primera
        let presupuesto_base = 0;
        if (esEstructuraNueva) {
          presupuesto_base = intervenciones.reduce((sum: number, interv: any) => {
            const presupuesto = parseFloat(interv.presupuesto_base || 0);
            return sum + presupuesto;
          }, 0);
        } else {
          // Estructura antigua: presupuesto directo
          presupuesto_base = parseFloat(properties.presupuesto_base || 0);
        }
        
        // 📊 CORRECCIÓN: Calcular avance promedio ponderado por presupuesto
        let avance_obra = 0;
        if (esEstructuraNueva && intervenciones.length > 0 && presupuesto_base > 0) {
          // Promedio ponderado: (suma de avance * presupuesto) / presupuesto total
          const avancePonderado = intervenciones.reduce((sum: number, interv: any) => {
            const avance = parseFloat(interv.avance_obra || 0);
            const presupuesto = parseFloat(interv.presupuesto_base || 0);
            return sum + (avance * presupuesto);
          }, 0);
          avance_obra = avancePonderado / presupuesto_base;
        } else {
          // Estructura antigua: avance directo
          avance_obra = parseFloat(properties.avance_obra || 0);
        }
        
        // 🔢 CORRECCIÓN: n_intervenciones
        // En estructura nueva: viene en properties
        // En estructura antigua: NO EXISTE, usar 1 como valor por defecto (cada registro = 1 intervención)
        const n_intervenciones = esEstructuraNueva 
          ? (parseInt(properties.n_intervenciones) || intervenciones.length)
          : 1; // Cada registro sin 'intervenciones' representa 1 intervención
        
        // 🚧 CORRECCIÓN: frente_activo
        // En estructura nueva: viene dentro de cada intervención
        // En estructura antigua: NO EXISTE, calcular basándose en el estado
        let frente_activo = 'No aplica';
        if (esEstructuraNueva) {
          // Usar el frente_activo de la primera intervención
          frente_activo = primeraIntervencion.frente_activo || 'No aplica';
        } else {
          // Estructura antigua: inferir del estado
          // Si está en ejecución o activo, considerar como frente activo
          const estado = (properties.estado || '').toLowerCase();
          if (estado.includes('ejecucion') || estado.includes('ejecución') || 
              estado.includes('activ') || estado.includes('proceso')) {
            frente_activo = 'Frente activo';
          } else if (estado.includes('terminado') || estado.includes('finalizado')) {
            frente_activo = 'Terminado';
          } else {
            frente_activo = 'No aplica';
          }
        }
        
        // El campo nombre_centro_gestor puede venir de diferentes lugares
        const centroGestor = properties.nombre_centro_gestor || 
                           primeraIntervencion.nombre_centro_gestor ||
                           undefined;
        
        const validatedItem = AttributeSchema.parse({
          upid: properties.upid || '',
          nombre_up: properties.nombre_up || '',
          nombre_up_detalle: properties.nombre_up_detalle || undefined,
          identificador: properties.identificador || undefined,
          n_intervenciones: n_intervenciones,
          // Campos que pueden venir de la intervención o de properties
          estado: primeraIntervencion.estado || properties.estado || 'Sin estado',
          tipo_intervencion: primeraIntervencion.tipo_intervencion || properties.tipo_intervencion || 'Sin especificar',
          tipo_equipamiento: properties.tipo_equipamiento || undefined,
          clase_up: properties.clase_up || undefined,
          frente_activo: frente_activo,
          nombre_centro_gestor: centroGestor,
          comuna_corregimiento: properties.comuna_corregimiento || '',
          barrio_vereda: properties.barrio_vereda || '',
          presupuesto_base: presupuesto_base,
          avance_obra: avance_obra,
          fecha_inicio: primeraIntervencion.fecha_inicio || properties.fecha_inicio || '',
          fecha_fin: primeraIntervencion.fecha_fin || properties.fecha_fin || '',
          fecha_inauguracion: primeraIntervencion.fecha_inauguracion || properties.fecha_inauguracion || undefined,
          duracion_proyecto: primeraIntervencion.duracion_proyecto || properties.duracion_proyecto || undefined,
          descripcion_intervencion: primeraIntervencion.descripcion_intervencion || properties.descripcion_intervencion || '',
          fuente_financiacion: primeraIntervencion.fuente_financiacion || properties.fuente_financiacion || '',
          ano: parseInt(primeraIntervencion.ano || properties.ano || properties.anio || 0)
        });
        
        validatedData.push(validatedItem);
      } catch (validationError) {
        console.warn(`⚠️ Validation failed for item ${index}:`, validationError);
        console.warn('Item data:', item);
        // Continuar con el siguiente elemento sin interrumpir el proceso
      }
    });
    
    // Log conciso del resultado
    if (hasFilters) {
      console.log(`✅ fetchAttributeData: ${validatedData.length} items loaded with filters`);
    }
    
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
    frentes_activos: extractUniqueValues(data, 'frente_activo'),
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
    frentes_activos: filters.frentes_activos.length,
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
    return [];
  }

  // Log único al inicio con resumen de filtros
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && key !== 'searchTerm')
    .map(([key]) => key);
  
  if (activeFilters.length > 0) {
    console.log('📊 Filtering:', data.length, 'items |', activeFilters.join(', '));
  }

  const filtered = data.filter(item => {
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
      
      // Filtros específicos - primero recopilar todos los filtros únicos (tanto simples como múltiples)
      const allFilterKeys = new Set<string>();
      Object.keys(filters).forEach(key => {
        if (key === 'searchTerm') return;
        if (key.endsWith('_multiple')) {
          allFilterKeys.add(key.replace('_multiple', ''));
        } else {
          allFilterKeys.add(key);
        }
      });

      const matchesFilters = Array.from(allFilterKeys).every(baseKey => {
        try {
          const multipleKey = `${baseKey}_multiple`;
          const multipleValues = (filters as any)[multipleKey];
          const singleValue = (filters as any)[baseKey];
          
          // Si hay filtros múltiples, usarlos (tienen prioridad sobre el filtro singular)
          if (multipleValues && Array.isArray(multipleValues) && multipleValues.length > 0) {
            switch (baseKey) {
              case 'estado':
                return multipleValues.includes(item.estado);
              case 'tipo_intervencion':
                return multipleValues.includes(item.tipo_intervencion);
              case 'tipo_equipamiento':
                return multipleValues.includes(item.tipo_equipamiento);
              case 'frente_activo':
                return multipleValues.includes(item.frente_activo);
              case 'centro_gestor':
              case 'centro_gestor_multiple':
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
          }
          
          // Si no hay filtros múltiples pero hay un valor singular, usarlo
          if (singleValue && singleValue !== '') {
            switch (baseKey) {
              case 'estado':
                return item.estado === singleValue;
              case 'tipo_intervencion':
                return item.tipo_intervencion === singleValue;
              case 'tipo_equipamiento':
                return item.tipo_equipamiento === singleValue;
              case 'frente_activo':
                return item.frente_activo === singleValue;
              case 'centro_gestor':
              case 'centro_gestor_multiple':
                return item.nombre_centro_gestor === singleValue;
              case 'comuna_corregimiento':
                return item.comuna_corregimiento === singleValue;
              case 'barrio_vereda':
                return item.barrio_vereda === singleValue;
              case 'fuente_financiacion':
                return item.fuente_financiacion === singleValue;
              case 'ano':
                return String(item.ano).replace('.0', '') === String(singleValue).replace('.0', '');
              default:
                return true;
            }
          }
          
          // Si no hay ni filtros múltiples ni valor singular, no filtrar por este campo
          return true;
        } catch (filterError) {
          console.warn(`⚠️ Filter error for ${baseKey}:`, filterError);
          return true; // En caso de error, no filtrar este item
        }
      });
      
      return matchesFilters;
    } catch (itemError) {
      console.warn('⚠️ Error filtering item:', itemError, item);
      return true; // En caso de error, incluir el item
    }
  });
  
  // Log del resultado final
  if (activeFilters.length > 0) {
    console.log('✅ filterAttributeData:', filtered.length, 'items after filtering');
  }
  
  return filtered;
};

// Exportar configuración para uso en otros lugares
export { API_CONFIG };
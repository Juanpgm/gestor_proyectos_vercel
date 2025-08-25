'use client'

import React from 'react'
import { processGeoJSONCoordinates } from './coordinateUtils'

/**
 * ===================================
 * UTILIDAD UNIFICADA DE CARGA GEOJSON
 * ===================================
 * 
 * Sistema centralizado y simplificado para la carga de archivos GeoJSON
 * Elimina duplicaciones y consolida toda la lógica en un solo lugar
 */

export interface GeoJSONLoadResult {
  data: any
  error?: string
  loading: boolean
}

export interface GeoJSONLoaderOptions {
  processCoordinates?: boolean
  cache?: boolean
  timeout?: number
}

/**
 * Cache global para evitar recargas innecesarias
 */
const geoJSONCache = new Map<string, any>()

/**
 * Datos de fallback para evitar errores
 */
const FALLBACK_GEOJSON = {
  type: 'FeatureCollection',
  features: []
}

/**
 * Carga archivo GeoJSON con estrategia unificada y fallback
 * 
 * @param fileName - Nombre del archivo (sin extensión)
 * @param options - Opciones de carga
 * @returns Datos GeoJSON procesados
 */
export async function loadGeoJSON(
  fileName: string,
  options: GeoJSONLoaderOptions = {}
): Promise<any> {
  const {
    processCoordinates = true,
    cache = true,
    timeout = 10000
  } = options

  console.log(`🗺️ Cargando GeoJSON: ${fileName}`)

  // Verificar cache si está habilitado
  if (cache && geoJSONCache.has(fileName)) {
    console.log(`📦 Usando cache para: ${fileName}`)
    return geoJSONCache.get(fileName)
  }

  try {
    // Configuración de archivos y rutas
    const fileMapping: Record<string, string> = {
      'infraestructura': 'infraestructura_vial'
    }

    const pathMapping: Record<string, string> = {
      'barrios': '/geodata',
      'comunas': '/geodata', 
      'corregimientos': '/geodata',
      'veredas': '/geodata',
      'equipamientos': '/data/unidades_proyecto',
      'infraestructura_vial': '/data/unidades_proyecto'
    }

    const actualFileName = fileMapping[fileName] || fileName
    const basePath = pathMapping[actualFileName] || '/geodata'
    const fullPath = `${basePath}/${actualFileName}.geojson`

    console.log(`🔍 Cargando archivo: ${fullPath}`)

    // Realizar solicitud con timeout
    const response = await fetch(fullPath, {
      signal: AbortSignal.timeout(timeout)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Validar estructura GeoJSON
    if (!validateGeoJSON(data, fileName)) {
      throw new Error(`Archivo GeoJSON inválido: ${fileName}`)
    }

    console.log(`✅ GeoJSON cargado: ${fileName} (${data.features?.length || 0} features)`)

    // Procesar coordenadas si es necesario
    let processedData = data
    if (processCoordinates && data.features) {
      console.log(`🔄 Procesando coordenadas para: ${fileName}`)
      processedData = processGeoJSONCoordinates(data)
    }

    // Guardar en cache
    if (cache) {
      geoJSONCache.set(fileName, processedData)
    }

    return processedData

  } catch (error) {
    console.error(`❌ Error cargando GeoJSON ${fileName}:`, error)
    
    // Retornar fallback en lugar de lanzar error
    console.warn(`⚠️ Usando fallback para ${fileName}`)
    const fallbackData = { ...FALLBACK_GEOJSON }
    
    if (cache) {
      geoJSONCache.set(fileName, fallbackData)
    }
    
    return fallbackData
  }
}

/**
 * Carga múltiples archivos GeoJSON con manejo robusto de errores
 * 
 * @param fileNames - Array de nombres de archivos
 * @param options - Opciones de carga
 * @returns Object con datos indexados por nombre de archivo
 */
export async function loadMultipleGeoJSON(
  fileNames: string[],
  options: GeoJSONLoaderOptions = {}
): Promise<Record<string, any>> {
  console.log(`🗺️ Cargando múltiples GeoJSON:`, fileNames)

  const results: Record<string, any> = {}

  // Cargar archivos secuencialmente para evitar sobrecarga
  for (const fileName of fileNames) {
    try {
      const data = await loadGeoJSON(fileName, options)
      results[fileName] = data
    } catch (error) {
      console.warn(`⚠️ Error cargando ${fileName}, usando fallback`)
      results[fileName] = { ...FALLBACK_GEOJSON }
    }
  }

  console.log(`✅ Múltiples GeoJSON procesados:`, Object.keys(results))
  return results
}

/**
 * Lista simplificada de archivos predefinidos
 */
const UNIDADES_PROYECTO_FILES = [
  'equipamientos',
  'infraestructura_vial'
]

/**
 * Carga todos los archivos de unidades de proyecto con manejo robusto
 * 
 * @param options - Opciones de carga
 * @returns Object con todos los datos GeoJSON
 */
export async function loadAllUnidadesProyecto(
  options: GeoJSONLoaderOptions = {}
): Promise<Record<string, any>> {
  console.log(`🗺️ === CARGANDO UNIDADES DE PROYECTO ===`)
  
  const results: Record<string, any> = {}
  let successCount = 0

  for (const fileName of UNIDADES_PROYECTO_FILES) {
    try {
      console.log(`🔄 Cargando: ${fileName}...`)
      const data = await loadGeoJSON(fileName, options)
      
      if (data && data.features && Array.isArray(data.features)) {
        results[fileName] = data
        successCount++
        console.log(`✅ ${fileName}: ${data.features.length} features cargadas`)
      } else {
        console.warn(`⚠️ ${fileName}: Datos vacíos, usando fallback`)
        results[fileName] = { ...FALLBACK_GEOJSON }
      }
    } catch (error) {
      console.error(`❌ Error cargando ${fileName}:`, error)
      results[fileName] = { ...FALLBACK_GEOJSON }
    }
  }

  console.log(`📊 Resumen: ${successCount}/${UNIDADES_PROYECTO_FILES.length} archivos cargados exitosamente`)
  return results
}/**
 * Valida la estructura de un archivo GeoJSON
 * 
 * @param data - Datos a validar
 * @param fileName - Nombre del archivo para logging
 * @returns true si es válido, false si no
 */
export function validateGeoJSON(data: any, fileName: string): boolean {
  try {
    if (!data) {
      console.warn(`${fileName}: Datos vacíos`)
      return false
    }
    
    if (typeof data !== 'object') {
      console.warn(`${fileName}: Los datos no son un objeto`)
      return false
    }
    
    if (data.type !== 'FeatureCollection') {
      console.warn(`${fileName}: No es una FeatureCollection (encontrado: ${data.type})`)
      return false
    }
    
    if (!Array.isArray(data.features)) {
      console.warn(`${fileName}: features no es un array`)
      return false
    }
    
    console.log(`✅ Validación GeoJSON exitosa para: ${fileName}`)
    return true
  } catch (error) {
    console.warn(`${fileName}: Error en validación:`, error)
    return false
  }
}

/**
 * Hook React para cargar GeoJSON con estado
 */
export function useGeoJSONLoader(
  fileName: string | null,
  options: GeoJSONLoaderOptions = {}
): GeoJSONLoadResult {
  const [state, setState] = React.useState<GeoJSONLoadResult>({
    data: null,
    loading: false
  })

  const optionsRef = React.useRef(options)
  optionsRef.current = options

  React.useEffect(() => {
    if (!fileName) {
      setState({ data: null, loading: false })
      return
    }

    setState({ data: null, loading: true })

    loadGeoJSON(fileName, optionsRef.current)
      .then(data => {
        setState({ data, loading: false })
      })
      .catch(error => {
        setState({ 
          data: { ...FALLBACK_GEOJSON }, 
          loading: false, 
          error: error.message || 'Error desconocido' 
        })
      })
  }, [fileName])

  return state
}

/**
 * Limpia el cache de GeoJSON
 */
export function clearGeoJSONCache(fileName?: string): void {
  if (fileName) {
    geoJSONCache.delete(fileName)
    console.log(`🗑️ Cache limpiado para: ${fileName}`)
  } else {
    geoJSONCache.clear()
    console.log(`🗑️ Cache GeoJSON completamente limpiado`)
  }
}

/**
 * Obtiene estadísticas del cache
 */
export function getGeoJSONCacheStats(): { size: number; keys: string[] } {
  return {
    size: geoJSONCache.size,
    keys: Array.from(geoJSONCache.keys())
  }
}

/**
 * Función helper para cargar datos con fallback robusto
 * Reemplaza la funcionalidad de mapDataLoader.ts
 */
export async function loadMapDataWithFallback(): Promise<Record<string, any>> {
  console.log('🗺️ Cargando datos del mapa con fallback...')
  
  const results: Record<string, any> = {}
  const filesToLoad = ['equipamientos', 'infraestructura_vial']
  
  for (const fileName of filesToLoad) {
    try {
      const data = await loadGeoJSON(fileName)
      results[fileName] = data
      console.log(`✅ ${fileName} cargado:`, data.features?.length || 0, 'features')
    } catch (error) {
      console.warn(`⚠️ Error cargando ${fileName}, usando fallback:`, error)
      results[fileName] = { ...FALLBACK_GEOJSON }
    }
  }
  
  console.log('📊 Datos del mapa listos:', Object.keys(results))
  return results
}

/**
 * Valida que los datos del mapa son correctos
 */
export function validateMapData(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  
  const hasValidData = Object.values(data).some((geojsonData: any) => 
    geojsonData && 
    geojsonData.type === 'FeatureCollection' && 
    Array.isArray(geojsonData.features)
  )
  
  return hasValidData
}

// Exportar el objeto default sin funciones obsoletas
const geoJSONLoader = {
  loadGeoJSON,
  loadMultipleGeoJSON,
  loadAllUnidadesProyecto,
  validateGeoJSON,
  useGeoJSONLoader,
  clearGeoJSONCache,
  getGeoJSONCacheStats,
  loadMapDataWithFallback,
  validateMapData
}

export default geoJSONLoader

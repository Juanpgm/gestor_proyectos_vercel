'use client'

import { processGeoJSONCoordinates } from './coordinateUtils'

/**
 * ===================================
 * UTILIDAD UNIFICADA DE CARGA GEOJSON
 * ===================================
 * 
 * Sistema centralizado para la carga de archivos GeoJSON
 * Estrategia optimizada por tamaño de archivo:
 * - < 1MB: Importación estática (recomendado para la mayoría)
 * - 1-10MB: API routes  
 * - > 10MB: CDN/bucket externo
 * 
 * Archivos y ubicaciones actuales:
 * /geodata/:
 * - barrios.geojson, comunas.geojson, corregimientos.geojson, veredas.geojson ✅ Estático
 * 
 * /data/unidades_proyecto/:
 * - equipamientos.geojson: 433.4 KB ✅ Estático
 * - infraestructura_vial.geojson: 278.5 KB ✅ Estático
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
 * Carga archivo GeoJSON con estrategia unificada
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
  console.log(`🔧 Opciones:`, { processCoordinates, cache, timeout })

  // Verificar cache si está habilitado
  if (cache && geoJSONCache.has(fileName)) {
    console.log(`📦 Usando cache para: ${fileName}`)
    return geoJSONCache.get(fileName)
  }

  try {
    // Estrategia de carga optimizada por fetch (archivos < 1MB)
    // Todos nuestros archivos actuales califican para esta estrategia
    const validFiles = [
      'barrios', 'comunas', 'corregimientos', 'veredas', 
      'equipamientos', 'infraestructura', 'infraestructura_vial'
    ]

    // Mapeo de nombres alternativos
    const fileMapping: Record<string, string> = {
      'infraestructura': 'infraestructura_vial'
    }

    // Mapeo de rutas por archivo
    const pathMapping: Record<string, string> = {
      'barrios': '/geodata',
      'comunas': '/geodata', 
      'corregimientos': '/geodata',
      'veredas': '/geodata',
      'equipamientos': '/data/unidades_proyecto',
      'infraestructura_vial': '/data/unidades_proyecto'
    }

    const actualFileName = fileMapping[fileName] || fileName
    console.log(`📝 Archivo original: ${fileName} → Archivo final: ${actualFileName}`)

    // Verificar que el archivo es válido
    if (!validFiles.includes(actualFileName)) {
      console.warn(`⚠️ Archivo no reconocido: ${fileName}, intentando carga directa en /geodata`)
    }

    // Determinar la ruta correcta
    const basePath = pathMapping[actualFileName] || '/geodata'
    const fullPath = `${basePath}/${actualFileName}.geojson`

    console.log(`🔍 Buscando archivo en: ${fullPath}`)

    // Carga por fetch (estrategia unificada)
    const response = await fetch(fullPath, {
      signal: AbortSignal.timeout(timeout)
    })

    console.log(`📡 Respuesta HTTP: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Validar estructura GeoJSON
    if (!data || !data.type || !data.features) {
      throw new Error(`Archivo ${fileName} no es un GeoJSON válido`)
    }

    console.log(`✅ GeoJSON cargado: ${fileName} (${data.features.length} features)`)

    // Procesar coordenadas si es necesario
    let processedData = data
    if (processCoordinates) {
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
    throw error
  }
}

/**
 * Carga múltiples archivos GeoJSON en paralelo
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

  try {
    const promises = fileNames.map(async (fileName) => {
      const data = await loadGeoJSON(fileName, options)
      return { fileName, data }
    })

    const results = await Promise.all(promises)
    
    const dataMap: Record<string, any> = {}
    results.forEach(({ fileName, data }) => {
      dataMap[fileName] = data
    })

    console.log(`✅ Múltiples GeoJSON cargados exitosamente:`, Object.keys(dataMap))
    return dataMap

  } catch (error) {
    console.error(`❌ Error cargando múltiples GeoJSON:`, error)
    throw error
  }
}

/**
 * Hook React para carga de GeoJSON con estado
 * 
 * @param fileName - Nombre del archivo a cargar
 * @param options - Opciones de carga
 * @returns Estado de carga con datos, loading y error
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
          data: null, 
          loading: false, 
          error: error.message || 'Error desconocido' 
        })
      })
  }, [fileName])

  return state
}

/**
 * Limpia el cache de GeoJSON
 * Útil para forzar recarga de datos actualizados
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

// Importar React para el hook
import React from 'react'

const geoJSONLoader = {
  loadGeoJSON,
  loadMultipleGeoJSON,
  useGeoJSONLoader,
  clearGeoJSONCache,
  getGeoJSONCacheStats
}

export default geoJSONLoader

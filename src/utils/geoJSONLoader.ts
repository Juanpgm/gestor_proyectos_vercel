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
    validateGeoJSON(data, fileName)

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
 * Lista de archivos GeoJSON disponibles en unidades_proyecto
 * IMPORTANTE: Actualizar esta lista cuando se agreguen nuevos archivos
 */
const UNIDADES_PROYECTO_FILES = [
  'equipamientos',
  'infraestructura_vial'
]

/**
 * Detecta automáticamente archivos GeoJSON en la carpeta unidades_proyecto
 * Intentará cargar archivos comunes que podrían existir
 * 
 * @returns Array de nombres de archivos encontrados
 */
export async function detectUnidadesProyectoFiles(): Promise<string[]> {
  const possibleFiles = [
    ...UNIDADES_PROYECTO_FILES,
    // Agregar aquí otros posibles nombres de archivos que podrían existir
    'espacios_publicos',
    'movilidad',
    'servicios_publicos',
    'educacion',
    'salud',
    'deporte_recreacion',
    'cultura',
    'seguridad',
    'medio_ambiente'
  ]

  const existingFiles: string[] = []
  
  console.log('🔍 Detectando archivos GeoJSON disponibles...')
  
  for (const fileName of possibleFiles) {
    try {
      const basePath = '/data/unidades_proyecto'
      const fullPath = `${basePath}/${fileName}.geojson`
      
      // Intentar un HEAD request para verificar si existe sin descargar
      const response = await fetch(fullPath, { method: 'HEAD' })
      
      if (response.ok) {
        existingFiles.push(fileName)
        console.log(`✅ Encontrado: ${fileName}`)
      }
    } catch (error) {
      // Archivo no existe o error de red, continuar
      console.log(`❌ No encontrado: ${fileName}`)
    }
  }
  
  console.log(`📁 Archivos detectados: ${existingFiles.length}`, existingFiles)
  return existingFiles
}

/**
 * Carga automáticamente todos los archivos GeoJSON de la carpeta unidades_proyecto
 * Detecta automáticamente los archivos disponibles y los carga
 * 
 * @param options - Opciones de carga
 * @param useDetection - Si true, detecta archivos automáticamente. Si false, usa lista predefinida
 * @returns Object con todos los datos GeoJSON indexados por nombre de archivo
 */
export async function loadAllUnidadesProyecto(
  options: GeoJSONLoaderOptions = {},
  useDetection: boolean = false  // CAMBIO: false por defecto para usar lista predefinida
): Promise<Record<string, any>> {
  console.log(`🗺️ === CARGANDO TODAS LAS UNIDADES DE PROYECTO ===`)
  
  let filesToLoad: string[]
  
  if (useDetection) {
    try {
      filesToLoad = await detectUnidadesProyectoFiles()
      console.log(`� Detección automática exitosa: ${filesToLoad.length} archivos`)
    } catch (error) {
      console.warn(`⚠️ Error en detección automática, usando lista predefinida:`, error)
      filesToLoad = UNIDADES_PROYECTO_FILES
    }
  } else {
    filesToLoad = UNIDADES_PROYECTO_FILES
  }
  
  console.log(`📂 Archivos a cargar:`, filesToLoad)

  const results: Record<string, any> = {}
  const errors: Record<string, string> = {}
  const successful: string[] = []

  // Cargar cada archivo y manejar errores individualmente
  for (const fileName of filesToLoad) {
    try {
      console.log(`🔄 Cargando: ${fileName}...`)
      const data = await loadGeoJSON(fileName, options)
      results[fileName] = data
      successful.push(fileName)
      console.log(`✅ ${fileName}: ${data.features?.length || 0} features`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      errors[fileName] = errorMsg
      console.error(`❌ Error cargando ${fileName}:`, errorMsg)
      // Continuar con el siguiente archivo en lugar de fallar completamente
      results[fileName] = null
    }
  }

  // Mostrar resumen detallado
  console.log(`📊 === RESUMEN DE CARGA ===`)
  console.log(`✅ Exitosos (${successful.length}):`, successful)
  if (Object.keys(errors).length > 0) {
    console.log(`❌ Fallidos (${Object.keys(errors).length}):`, Object.keys(errors))
    console.log(`🔍 Errores detallados:`, errors)
  }
  
  // Estadísticas de features cargadas
  const totalFeatures = successful.reduce((total, fileName) => {
    return total + (results[fileName]?.features?.length || 0)
  }, 0)
  console.log(`📈 Total features cargadas: ${totalFeatures}`)
  
  // Notificar errores pero no fallar completamente si hay al menos un archivo exitoso
  if (successful.length === 0) {
    throw new Error(`❌ No se pudo cargar ningún archivo GeoJSON. Errores: ${JSON.stringify(errors)}`)
  }
  
  if (Object.keys(errors).length > 0) {
    console.warn(`⚠️ Algunos archivos fallaron pero la carga continúa con ${successful.length} archivos exitosos`)
  }

  return results
}

/**
 * Valida la estructura de un archivo GeoJSON
 * 
 * @param data - Datos a validar
 * @param fileName - Nombre del archivo para logging
 * @returns true si es válido, throws Error si no
 */
export function validateGeoJSON(data: any, fileName: string): boolean {
  if (!data) {
    throw new Error(`${fileName}: Datos vacíos`)
  }
  
  if (typeof data !== 'object') {
    throw new Error(`${fileName}: Los datos no son un objeto`)
  }
  
  if (data.type !== 'FeatureCollection') {
    throw new Error(`${fileName}: No es una FeatureCollection (encontrado: ${data.type})`)
  }
  
  if (!Array.isArray(data.features)) {
    throw new Error(`${fileName}: features no es un array`)
  }
  
  // Validar algunas features para asegurar estructura correcta
  if (data.features.length > 0) {
    const firstFeature = data.features[0]
    
    if (!firstFeature.type || firstFeature.type !== 'Feature') {
      throw new Error(`${fileName}: La primera feature no es de tipo 'Feature'`)
    }
    
    if (!firstFeature.geometry) {
      throw new Error(`${fileName}: La primera feature no tiene geometría`)
    }
    
    if (!firstFeature.properties) {
      throw new Error(`${fileName}: La primera feature no tiene propiedades`)
    }
  }
  
  console.log(`✅ Validación GeoJSON exitosa para: ${fileName}`)
  return true
}
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
  loadAllUnidadesProyecto,
  detectUnidadesProyectoFiles,
  validateGeoJSON,
  useGeoJSONLoader,
  clearGeoJSONCache,
  getGeoJSONCacheStats
}

export default geoJSONLoader

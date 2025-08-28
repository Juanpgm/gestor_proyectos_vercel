'use client'

import { loadGeoJSON, loadMultipleGeoJSON } from './geoJSONLoader'

/**
 * ==========================================
 * CARGADOR OPTIMIZADO DE DATOS GEOGRÁFICOS
 * ==========================================
 * 
 * Sistema centralizado para cargar todos los datos geográficos
 * de manera eficiente y organizada
 */

// Configuración de archivos disponibles por categoría
export const GEODATA_CONFIG = {
  cartografia_base: [
    'barrios',
    'comunas', 
    'corregimientos',
    'veredas'
  ],
  unidades_proyecto: [
    'equipamientos',
    'infraestructura_vial'
  ],
  centros_gravedad: [
    'centros_gravedad_unificado'
  ]
}

// Prioridades de carga (menor número = mayor prioridad)
const LOAD_PRIORITIES: Record<string, number> = {
  'equipamientos': 1,           // Datos principales
  'infraestructura_vial': 2,    // Datos principales
  'comunas': 3,                 // Cartografía importante
  'barrios': 4,                 // Cartografía importante
  'centros_gravedad_unificado': 5,
  'corregimientos': 6,
  'veredas': 7
}

// Configuración de timeouts específicos
const TIMEOUT_CONFIG: Record<string, number> = {
  'equipamientos': 45000,       // 45s - archivo grande
  'infraestructura_vial': 30000, // 30s - archivo mediano
  'barrios': 25000,             // 25s - archivo mediano
  'comunas': 15000,             // 15s - archivo pequeño
  'centros_gravedad_unificado': 10000,
  'corregimientos': 10000,
  'veredas': 10000
}

export interface GeodataLoadOptions {
  categories?: Array<'cartografia_base' | 'unidades_proyecto' | 'centros_gravedad'>
  specificFiles?: string[]
  priorityFirst?: boolean
  processCoordinates?: boolean
  showProgress?: boolean
}

export interface GeodataLoadResult {
  data: Record<string, any>
  loadedFiles: string[]
  failedFiles: string[]
  stats: {
    totalRequested: number
    totalLoaded: number
    totalFeatures: number
    loadTime: number
  }
}

/**
 * Carga datos geográficos de manera optimizada
 */
export async function loadOptimizedGeodata(
  options: GeodataLoadOptions = {}
): Promise<GeodataLoadResult> {
  const startTime = Date.now()
  console.log('🗺️ === INICIO CARGA OPTIMIZADA DE GEODATOS ===')

  const {
    categories = ['cartografia_base', 'unidades_proyecto'],
    specificFiles,
    priorityFirst = true,
    processCoordinates = true,
    showProgress = false
  } = options

  // Determinar archivos a cargar
  let filesToLoad: string[] = []
  
  if (specificFiles && specificFiles.length > 0) {
    filesToLoad = specificFiles
  } else {
    // Cargar por categorías
    categories.forEach(category => {
      if (GEODATA_CONFIG[category]) {
        filesToLoad.push(...GEODATA_CONFIG[category])
      }
    })
  }

  // Ordenar por prioridad si está habilitado
  if (priorityFirst) {
    filesToLoad.sort((a, b) => (LOAD_PRIORITIES[a] || 999) - (LOAD_PRIORITIES[b] || 999))
  }

  console.log(`📋 Archivos a cargar (${filesToLoad.length}):`, filesToLoad)

  // Resultados
  const results: Record<string, any> = {}
  const loadedFiles: string[] = []
  const failedFiles: string[] = []
  let totalFeatures = 0

  // Cargar archivos secuencialmente para evitar sobrecarga
  for (let i = 0; i < filesToLoad.length; i++) {
    const fileName = filesToLoad[i]
    const progress = ((i + 1) / filesToLoad.length * 100).toFixed(1)
    
    if (showProgress) {
      console.log(`📊 Progreso: ${progress}% - Cargando ${fileName}...`)
    }

    try {
      const timeout = TIMEOUT_CONFIG[fileName] || 15000
      const data = await loadGeoJSON(fileName, {
        processCoordinates,
        cache: true,
        timeout
      })

      if (data && data.features && Array.isArray(data.features)) {
        results[fileName] = data
        loadedFiles.push(fileName)
        totalFeatures += data.features.length
        
        console.log(`✅ ${fileName}: ${data.features.length} features cargadas`)
      } else {
        console.warn(`⚠️ ${fileName}: Sin features válidas`)
        failedFiles.push(fileName)
      }
    } catch (error) {
      console.error(`❌ Error cargando ${fileName}:`, error)
      failedFiles.push(fileName)
    }
  }

  const loadTime = Date.now() - startTime
  const stats = {
    totalRequested: filesToLoad.length,
    totalLoaded: loadedFiles.length,
    totalFeatures,
    loadTime
  }

  console.log('📊 === RESUMEN DE CARGA ===')
  console.log(`✅ Archivos cargados: ${stats.totalLoaded}/${stats.totalRequested}`)
  console.log(`📍 Total features: ${stats.totalFeatures}`)
  console.log(`⏱️ Tiempo de carga: ${(loadTime / 1000).toFixed(2)}s`)
  
  if (failedFiles.length > 0) {
    console.warn(`⚠️ Archivos fallidos:`, failedFiles)
  }

  return {
    data: results,
    loadedFiles,
    failedFiles,
    stats
  }
}

/**
 * Carga rápida solo de archivos esenciales
 */
export async function loadEssentialGeodata(): Promise<GeodataLoadResult> {
  return loadOptimizedGeodata({
    specificFiles: ['equipamientos', 'infraestructura_vial', 'comunas'],
    priorityFirst: true,
    processCoordinates: true,
    showProgress: true
  })
}

/**
 * Carga completa de todos los archivos disponibles
 */
export async function loadCompleteGeodata(): Promise<GeodataLoadResult> {
  return loadOptimizedGeodata({
    categories: ['cartografia_base', 'unidades_proyecto', 'centros_gravedad'],
    priorityFirst: true,
    processCoordinates: true,
    showProgress: true
  })
}

/**
 * Carga solo cartografía base
 */
export async function loadCartografiaBase(): Promise<GeodataLoadResult> {
  return loadOptimizedGeodata({
    categories: ['cartografia_base'],
    priorityFirst: false,
    processCoordinates: true
  })
}

/**
 * Carga solo unidades de proyecto
 */
export async function loadUnidadesProyecto(): Promise<GeodataLoadResult> {
  return loadOptimizedGeodata({
    categories: ['unidades_proyecto'],
    priorityFirst: true,
    processCoordinates: true
  })
}

/**
 * Precarga archivos en segundo plano
 */
export async function preloadGeodata(filesToPreload: string[] = []) {
  const files = filesToPreload.length > 0 
    ? filesToPreload 
    : ['equipamientos', 'infraestructura_vial', 'comunas', 'barrios']

  console.log('🚀 Iniciando precarga de datos geográficos:', files)

  // Cargar en paralelo con timeouts reducidos
  const promises = files.map(fileName => 
    loadGeoJSON(fileName, { 
      cache: true, 
      timeout: 10000,
      processCoordinates: false // No procesar en precarga para mayor velocidad
    }).catch(error => {
      console.warn(`⚠️ Precarga fallida para ${fileName}:`, error)
      return null
    })
  )

  await Promise.allSettled(promises)
  console.log('✅ Precarga completada')
}

/**
 * Valida la disponibilidad de archivos geográficos
 */
export async function validateGeodataAvailability(): Promise<{
  available: string[]
  unavailable: string[]
  summary: string
}> {
  console.log('🔍 Validando disponibilidad de archivos geográficos...')

  const allFiles = [
    ...GEODATA_CONFIG.cartografia_base,
    ...GEODATA_CONFIG.unidades_proyecto,
    ...GEODATA_CONFIG.centros_gravedad
  ]

  const available: string[] = []
  const unavailable: string[] = []

  // Validar cada archivo con HEAD request rápido
  await Promise.all(
    allFiles.map(async (fileName) => {
      try {
        const timeout = 3000 // 3s para validación rápida
        const result = await loadGeoJSON(fileName, { 
          cache: false, 
          timeout,
          processCoordinates: false
        })
        
        if (result && result.features && Array.isArray(result.features)) {
          available.push(fileName)
        } else {
          unavailable.push(fileName)
        }
      } catch (error) {
        unavailable.push(fileName)
      }
    })
  )

  const summary = `${available.length}/${allFiles.length} archivos disponibles`
  
  console.log('📊 Validación completada:', summary)
  console.log('✅ Disponibles:', available)
  if (unavailable.length > 0) {
    console.warn('❌ No disponibles:', unavailable)
  }

  return { available, unavailable, summary }
}

/**
 * Obtiene estadísticas de un dataset cargado
 */
export function getGeodataStats(data: Record<string, any>): {
  layers: number
  totalFeatures: number
  byLayer: Record<string, number>
  memoryEstimate: string
} {
  const byLayer: Record<string, number> = {}
  let totalFeatures = 0

  Object.entries(data).forEach(([layerId, geoData]) => {
    const featureCount = geoData?.features?.length || 0
    byLayer[layerId] = featureCount
    totalFeatures += featureCount
  })

  // Estimación muy básica de memoria (promedio ~1KB por feature)
  const memoryEstimateKB = totalFeatures * 1
  const memoryEstimate = memoryEstimateKB > 1024 
    ? `${(memoryEstimateKB / 1024).toFixed(1)} MB`
    : `${memoryEstimateKB} KB`

  return {
    layers: Object.keys(data).length,
    totalFeatures,
    byLayer,
    memoryEstimate
  }
}

export default {
  loadOptimizedGeodata,
  loadEssentialGeodata,
  loadCompleteGeodata,
  loadCartografiaBase,
  loadUnidadesProyecto,
  preloadGeodata,
  validateGeodataAvailability,
  getGeodataStats,
  GEODATA_CONFIG
}

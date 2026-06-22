'use client'

/**
 * Sistema de Cache Inteligente con Horarios Programados
 * Optimizado con programación funcional para reducir llamadas a API
 * 
 * Horarios permitidos: 5:00, 12:00, 16:00, 20:00
 */

// Tipos para el sistema de cache
export interface CacheEntry<T> {
  data: T
  timestamp: number
  nextUpdate: number
  source: 'cache' | 'api'
  isStale: boolean
}

export interface CacheConfig {
  allowedHours: number[]
  cacheDurationMs: number
  maxRetries: number
  retryDelayMs: number
}

// Configuración del cache
const CACHE_CONFIG: CacheConfig = {
  allowedHours: [5, 12, 16, 20], // Horarios permitidos para llamadas API
  cacheDurationMs: 4 * 60 * 60 * 1000, // 4 horas de cache
  maxRetries: 3,
  retryDelayMs: 1000
}

// Cache global en memoria
const cache = new Map<string, CacheEntry<any>>()
const pendingRequests = new Map<string, Promise<any>>()

// Contadores para el reporte
let apiCallsCount = 0
let cacheHitsCount = 0
let cacheMissesCount = 0
let lastApiCallTime: number | null = null
let apiCallsHistory: Array<{ timestamp: number, hour: number, success: boolean }> = []

/**
 * Funciones puras para cálculos de tiempo
 */
const getCurrentHour = (): number => new Date().getHours()
const getCurrentTimestamp = (): number => Date.now()
const getNextAllowedTime = (currentHour: number, allowedHours: number[]): number => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Encontrar la próxima hora permitida
  const nextHour = allowedHours.find(hour => hour > currentHour) || allowedHours[0]
  const nextDay = nextHour <= currentHour ? 1 : 0
  
  const nextTime = new Date(today.getTime() + nextDay * 24 * 60 * 60 * 1000)
  nextTime.setHours(nextHour, 0, 0, 0)
  
  return nextTime.getTime()
}

/**
 * Predicados funcionales
 */
const isWithinAllowedHours = (hour: number, allowedHours: number[]): boolean =>
  allowedHours.includes(hour)

const isCacheValid = (entry: CacheEntry<any>, currentTime: number): boolean =>
  entry && (currentTime - entry.timestamp) < CACHE_CONFIG.cacheDurationMs

const shouldMakeApiCall = (cacheKey: string, currentTime: number): boolean => {
  const entry = cache.get(cacheKey)
  const currentHour = getCurrentHour()
  
  return isWithinAllowedHours(currentHour, CACHE_CONFIG.allowedHours) &&
         (!entry || !isCacheValid(entry, currentTime))
}

/**
 * Funciones de transformación de datos
 */
const createCacheEntry = <T>(data: T, source: 'cache' | 'api'): CacheEntry<T> => ({
  data,
  timestamp: getCurrentTimestamp(),
  nextUpdate: getNextAllowedTime(getCurrentHour(), CACHE_CONFIG.allowedHours),
  source,
  isStale: false
})

const markAsStale = <T>(entry: CacheEntry<T>): CacheEntry<T> => ({
  ...entry,
  isStale: true
})

/**
 * Función principal de cache con programación funcional
 */
export const cachedApiCall = async <T>(
  cacheKey: string,
  apiFunction: () => Promise<T>,
  fallbackData?: T
): Promise<CacheEntry<T>> => {
  const currentTime = getCurrentTimestamp()
  const currentHour = getCurrentHour()
  
  // Verificar cache existente
  const existingEntry = cache.get(cacheKey)
  if (existingEntry && isCacheValid(existingEntry, currentTime)) {
    cacheHitsCount++
    return existingEntry
  }
  
  // Si hay cache pero está obsoleto, marcarlo como stale pero usarlo temporalmente
  if (existingEntry && !isCacheValid(existingEntry, currentTime)) {
    cache.set(cacheKey, markAsStale(existingEntry))
  }
  
  // Verificar si estamos en horario permitido para API
  if (!isWithinAllowedHours(currentHour, CACHE_CONFIG.allowedHours)) {
    cacheMissesCount++
    const nextUpdate = getNextAllowedTime(currentHour, CACHE_CONFIG.allowedHours)
    
    // Usar cache stale si existe, o fallback data
    if (existingEntry) {
      return markAsStale(existingEntry)
    }
    
    if (fallbackData) {
      const fallbackEntry = createCacheEntry(fallbackData, 'cache')
      cache.set(cacheKey, fallbackEntry)
      return fallbackEntry
    }
    
    throw new Error(`No hay datos disponibles para ${cacheKey} y no se puede hacer llamada a API fuera de horario`)
  }
  
  // Evitar llamadas duplicadas concurrentes
  if (pendingRequests.has(cacheKey)) {
    const data = await pendingRequests.get(cacheKey)!
    return cache.get(cacheKey) || createCacheEntry(data, 'api')
  }
  
  const apiCall = async (): Promise<T> => {
    try {
      apiCallsCount++
      lastApiCallTime = currentTime
      
      const result = await apiFunction()
      
      // Registrar llamada exitosa
      apiCallsHistory.push({
        timestamp: currentTime,
        hour: currentHour,
        success: true
      })
      
      return result
      
    } catch (error) {
      // Registrar llamada fallida
      apiCallsHistory.push({
        timestamp: currentTime,
        hour: currentHour,
        success: false
      })
      
      console.error(`❌ API Error [${cacheKey}]:`, error)
      
      // Si hay cache stale, usarlo en caso de error
      if (existingEntry) {
        return existingEntry.data
      }
      
      // Si hay fallback data, usarlo
      if (fallbackData) {
        return fallbackData
      }
      
      throw error
    }
  }
  
  // Ejecutar llamada y guardar promesa para evitar duplicados
  const promise = apiCall()
  pendingRequests.set(cacheKey, promise)
  
  try {
    const data = await promise
    const newEntry = createCacheEntry(data, 'api')
    cache.set(cacheKey, newEntry)
    return newEntry
    
  } finally {
    pendingRequests.delete(cacheKey)
  }
}

/**
 * Función para obtener estadísticas del cache
 */
export const getCacheStats = () => {
  const currentTime = getCurrentTimestamp()
  const currentHour = getCurrentHour()
  const nextAllowedTime = getNextAllowedTime(currentHour, CACHE_CONFIG.allowedHours)
  
  // Calcular estadísticas de cache
  const cacheEntries = Array.from(cache.entries())
  const validEntries = cacheEntries.filter(([_, entry]) => isCacheValid(entry, currentTime))
  const staleEntries = cacheEntries.filter(([_, entry]) => !isCacheValid(entry, currentTime))
  
  // Calcular próximas actualizaciones
  const hoursUntilNextUpdate = Math.ceil((nextAllowedTime - currentTime) / (60 * 60 * 1000))
  
  // Estadísticas de llamadas por hora
  const callsByHour = CACHE_CONFIG.allowedHours.reduce((acc, hour) => {
    acc[hour] = apiCallsHistory.filter(call => call.hour === hour).length
    return acc
  }, {} as Record<number, number>)
  
  return {
    cache: {
      totalEntries: cacheEntries.length,
      validEntries: validEntries.length,
      staleEntries: staleEntries.length,
      hitRate: cacheHitsCount / (cacheHitsCount + cacheMissesCount) || 0
    },
    api: {
      totalCalls: apiCallsCount,
      cacheHits: cacheHitsCount,
      cacheMisses: cacheMissesCount,
      lastCallTime: lastApiCallTime ? new Date(lastApiCallTime).toLocaleString() : 'Nunca',
      callsByHour,
      successRate: apiCallsHistory.length > 0 ? 
        apiCallsHistory.filter(call => call.success).length / apiCallsHistory.length : 0
    },
    schedule: {
      currentHour,
      isAllowedHour: isWithinAllowedHours(currentHour, CACHE_CONFIG.allowedHours),
      allowedHours: CACHE_CONFIG.allowedHours,
      nextUpdateTime: new Date(nextAllowedTime).toLocaleString(),
      hoursUntilNextUpdate
    },
    performance: {
      cacheDurationHours: CACHE_CONFIG.cacheDurationMs / (60 * 60 * 1000),
      estimatedDailyCalls: CACHE_CONFIG.allowedHours.length,
      actualDailyCalls: apiCallsHistory.filter(call => 
        call.timestamp > currentTime - 24 * 60 * 60 * 1000
      ).length
    }
  }
}

/**
 * Función para limpiar cache manualmente
 */
export const clearCache = (pattern?: string): number => {
  if (!pattern) {
    const size = cache.size
    cache.clear()
    return size
  }
  
  let cleared = 0
  const keys = Array.from(cache.keys())
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key)
      cleared++
    }
  })
  
  return cleared
}

/**
 * Función para forzar actualización en próximo horario permitido
 */
export const scheduleUpdate = (cacheKey: string): void => {
  const entry = cache.get(cacheKey)
  if (entry) {
    cache.set(cacheKey, markAsStale(entry))
  }
}


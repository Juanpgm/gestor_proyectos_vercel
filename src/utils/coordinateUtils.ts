/**
 * Utilidad para corrección de coordenadas GeoJSON
 * Convierte coordenadas de formato [lat, lng] a [lng, lat] estándar GeoJSON
 */

export interface CoordinateValidationResult {
  isValid: boolean
  corrected: [number, number]
  wasFixed: boolean
  originalFormat: string
}

/**
 * Función principal para corregir coordenadas según estándar GeoJSON
 * Específicamente diseñada para datos de Cali, Colombia
 */
export const fixCoordinatesForGeoJSON = (coords: any): [number, number] => {
  if (!coords || !Array.isArray(coords) || coords.length !== 2) {
    console.warn('⚠️ Coordenadas inválidas, usando fallback para Cali:', coords)
    return [-76.5320, 3.4516] // [lng, lat] para GeoJSON - Centro de Cali
  }
  
  const [first, second] = coords
  
  // Verificar si los valores están en rango válido
  if (typeof first !== 'number' || typeof second !== 'number') {
    console.warn('⚠️ Coordenadas no son números:', { first, second })
    return [-76.5320, 3.4516]
  }
  
  // Detectar formato [lat, lng] típico de la fuente de datos
  // Cali: lat ~3.4, lng ~-76.5
  if (first > 2 && first < 5 && second > -78 && second < -75) {
    return [second, first] // Convertir a [lng, lat] para GeoJSON
  }
  
  // Si ya está en formato [lng, lat], verificar que sea válido para Cali
  if (first > -78 && first < -75 && second > 2 && second < 5) {
    return [first, second]
  }
  
  console.warn(`⚠️ Coordenadas fuera de rango de Cali: [${first}, ${second}], usando fallback`)
  return [-76.5320, 3.4516]
}

/**
 * Validación detallada de coordenadas con información de diagnóstico
 */
export const validateCoordinates = (coords: any): CoordinateValidationResult => {
  const original = coords
  const corrected = fixCoordinatesForGeoJSON(coords)
  
  let originalFormat = 'unknown'
  let wasFixed = false
  
  if (Array.isArray(original) && original.length === 2) {
    const [first, second] = original
    if (first > 2 && first < 5 && second > -78 && second < -75) {
      originalFormat = '[lat,lng]'
      wasFixed = true
    } else if (first > -78 && first < -75 && second > 2 && second < 5) {
      originalFormat = '[lng,lat]'
      wasFixed = false
    }
  }
  
  return {
    isValid: Array.isArray(corrected) && corrected.length === 2,
    corrected,
    wasFixed,
    originalFormat
  }
}

/**
 * Procesar coordenadas de LineString corrigiendo formato
 */
export const processLineStringCoordinates = (coords: number[][]): number[][] => {
  return coords.map(coord => {
    const [first, second] = coord
    
    // Detectar si está en formato [lat, lng] y convertir a [lng, lat]
    if (first > 2 && first < 5 && second > -78 && second < -75) {
      return [second, first] // [lat, lng] → [lng, lat]
    }
    
    // Si ya está en [lng, lat], mantener
    if (first > -78 && first < -75 && second > 2 && second < 5) {
      return [first, second]
    }
    
    // Fallback para coordenadas inválidas
    console.warn(`⚠️ LineString coord fuera de rango: [${first}, ${second}]`)
    return [-76.5320, 3.4516]
  })
}

/**
 * Procesar un GeoJSON completo corrigiendo todas las coordenadas (optimizado)
 */
export const processGeoJSONCoordinates = (geoJson: any): any => {
  if (!geoJson || !geoJson.features) {
    console.warn('⚠️ GeoJSON inválido o sin features')
    return geoJson
  }
  
  let processedCount = 0
  let correctedCount = 0
  let pointCount = 0
  let lineCount = 0
  
  const startTime = performance.now()
  
  const processedGeoJSON = {
    ...geoJson,
    features: geoJson.features.map((feature: any, index: number) => {
      processedCount++
      
      // Procesar geometrías Point
      if (feature.geometry?.type === 'Point' && feature.geometry?.coordinates) {
        pointCount++
        const validation = validateCoordinates(feature.geometry.coordinates)
        
        if (validation.wasFixed) {
          correctedCount++
        }
        
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: validation.corrected
          }
        }
      }
      
      // Procesar geometrías LineString
      if (feature.geometry?.type === 'LineString' && feature.geometry?.coordinates) {
        lineCount++
        const originalCoords = feature.geometry.coordinates
        const processedCoords = processLineStringCoordinates(originalCoords)
        
        // Verificar si se hicieron correcciones
        const wasFixed = JSON.stringify(originalCoords) !== JSON.stringify(processedCoords)
        if (wasFixed) {
          correctedCount++
        }
        
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: processedCoords
          }
        }
      }
      
      // Para otros tipos de geometría, mantener como está
      return feature
    })
  }
  
  return processedGeoJSON
}

/**
 * Constantes útiles para Cali, Colombia
 */
export const CALI_COORDINATES = {
  // Centro de Cali en formato [lat, lng]
  CENTER_LAT_LNG: [3.4516, -76.5320] as [number, number],
  
  // Centro de Cali en formato [lng, lat] para GeoJSON
  CENTER_LNG_LAT: [-76.5320, 3.4516] as [number, number],
  
  // Límites aproximados de Cali
  BOUNDS: {
    NORTH: 3.65,
    SOUTH: 3.25,
    EAST: -76.35,
    WEST: -76.65
  },
  
  // Zoom por defecto
  DEFAULT_ZOOM: 11
}

/**
 * Verificar si unas coordenadas están dentro de los límites de Cali
 */
export const isWithinCali = (lng: number, lat: number): boolean => {
  const { BOUNDS } = CALI_COORDINATES
  return (
    lng >= BOUNDS.WEST && 
    lng <= BOUNDS.EAST && 
    lat >= BOUNDS.SOUTH && 
    lat <= BOUNDS.NORTH
  )
}

/**
 * Análisis de rendimiento para GeoJSON
 */
export const analyzeGeoJSONPerformance = (geoJson: any): {
  featureCount: number
  estimatedMemoryMB: number
  loadingStrategy: 'direct' | 'chunked' | 'vectorTiles'
  recommendedChunkSize: number
} => {
  if (!geoJson?.features) {
    return {
      featureCount: 0,
      estimatedMemoryMB: 0,
      loadingStrategy: 'direct',
      recommendedChunkSize: 100
    }
  }

  const featureCount = geoJson.features.length
  const sampleFeature = geoJson.features[0]
  
  // Estimar tamaño en memoria (muy aproximado)
  const estimatedFeatureSize = JSON.stringify(sampleFeature || {}).length
  const estimatedMemoryMB = (featureCount * estimatedFeatureSize) / (1024 * 1024)

  // Determinar estrategia de carga basada en cantidad de features
  let loadingStrategy: 'direct' | 'chunked' | 'vectorTiles' = 'direct'
  let recommendedChunkSize = 100

  if (featureCount > 1000) {
    loadingStrategy = 'chunked'
    recommendedChunkSize = Math.max(50, Math.floor(featureCount / 20))
  }

  if (featureCount > 5000) {
    loadingStrategy = 'vectorTiles'
    recommendedChunkSize = Math.max(100, Math.floor(featureCount / 10))
  }

  return {
    featureCount,
    estimatedMemoryMB: Math.round(estimatedMemoryMB * 100) / 100,
    loadingStrategy,
    recommendedChunkSize: Math.min(recommendedChunkSize, 500) // Max 500 por chunk
  }
}

/**
 * Optimizar GeoJSON para mejor rendimiento
 */
export const optimizeGeoJSONForRendering = (geoJson: any, options: {
  maxFeatures?: number
  simplifyGeometry?: boolean
  removeEmptyProperties?: boolean
} = {}): any => {
  if (!geoJson?.features) return geoJson

  const {
    maxFeatures = 1000,
    simplifyGeometry = false,
    removeEmptyProperties = true
  } = options

  let features = [...geoJson.features]

  // Limitar número de features si es necesario
  if (features.length > maxFeatures) {
    features = features.slice(0, maxFeatures)
  }

  // Limpiar propiedades vacías
  if (removeEmptyProperties) {
    features = features.map(feature => ({
      ...feature,
      properties: Object.fromEntries(
        Object.entries(feature.properties || {})
          .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      )
    }))
  }

  return {
    ...geoJson,
    features,
    _optimized: true,
    _originalFeatureCount: geoJson.features.length,
    _optimization: {
      maxFeatures,
      simplifyGeometry,
      removeEmptyProperties,
      reducedBy: geoJson.features.length - features.length
    }
  }
}

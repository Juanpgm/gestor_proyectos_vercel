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
    console.log(`🔄 Corrigiendo [lat,lng] → [lng,lat]: [${first}, ${second}] → [${second}, ${first}]`)
    return [second, first] // Convertir a [lng, lat] para GeoJSON
  }
  
  // Si ya está en formato [lng, lat], verificar que sea válido para Cali
  if (first > -78 && first < -75 && second > 2 && second < 5) {
    console.log(`✅ Coordenadas ya en formato [lng,lat]: [${first}, ${second}]`)
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
 * Procesar un GeoJSON completo corrigiendo todas las coordenadas de puntos
 */
export const processGeoJSONCoordinates = (geoJson: any): any => {
  if (!geoJson || !geoJson.features) {
    console.warn('⚠️ GeoJSON inválido o sin features')
    return geoJson
  }
  
  let processedCount = 0
  let correctedCount = 0
  
  const processedGeoJSON = {
    ...geoJson,
    features: geoJson.features.map((feature: any, index: number) => {
      processedCount++
      
      if (feature.geometry?.type === 'Point' && feature.geometry?.coordinates) {
        const validation = validateCoordinates(feature.geometry.coordinates)
        
        if (validation.wasFixed) {
          correctedCount++
          
          if (index < 3) { // Log de las primeras 3 para debug
            console.log(`📍 Feature ${index + 1} corregido:`, {
              id: feature.properties?.identificador || feature.properties?.id || `feature-${index}`,
              original: feature.geometry.coordinates,
              corrected: validation.corrected,
              format: validation.originalFormat
            })
          }
        }
        
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: validation.corrected
          }
        }
      }
      
      // Para LineString, MultiPoint, etc., mantener como está por ahora
      return feature
    })
  }
  
  console.log(`🎯 GeoJSON procesado: ${processedCount} features, ${correctedCount} corregidos`)
  
  return processedGeoJSON
}

/**
 * Constantes útiles para Cali, Colombia
 */
export const CALI_COORDINATES = {
  // Centro de Cali en formato [lat, lng] para react-leaflet MapContainer
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

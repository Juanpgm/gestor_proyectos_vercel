'use client'

/**
 * ===================================
 * SISTEMA DE DIAGNÓSTICOS GEOJSON
 * ===================================
 * 
 * Herramientas avanzadas para detectar y solucionar problemas
 * de carga de archivos GeoJSON en tiempo real
 */

export interface GeoJSONDiagnosticResult {
  fileName: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: {
    featuresCount?: number
    validCoordinates?: number
    invalidCoordinates?: number
    emptyFeatures?: number
    coordinateIssues?: string[]
    properties?: string[]
    geometryTypes?: Record<string, number>
  }
  suggestedFix?: string
  error?: string
}

export interface GeoJSONValidationConfig {
  checkCoordinates?: boolean
  checkProperties?: boolean
  maxFeatures?: number
  requiredProperties?: string[]
  geometryTypes?: string[]
}

/**
 * Diagnostica la salud de un archivo GeoJSON
 */
export async function diagnoseGeoJSON(
  fileName: string,
  config: GeoJSONValidationConfig = {}
): Promise<GeoJSONDiagnosticResult> {
  const {
    checkCoordinates = true,
    checkProperties = true,
    maxFeatures = 10000,
    requiredProperties = [],
    geometryTypes = ['Point', 'LineString', 'Polygon', 'MultiPolygon']
  } = config

  try {
    console.log(`🔍 Diagnosticando ${fileName}...`)
    
    // Intentar cargar el archivo
    const response = await fetch(`/data/geodata/unidades_proyecto/${fileName}.geojson`)
      .catch(() => fetch(`/data/geodata/${fileName}.geojson`))
    
    if (!response.ok) {
      return {
        fileName,
        status: 'error',
        message: `Archivo ${fileName}.geojson no encontrado`,
        error: `HTTP ${response.status}`,
        suggestedFix: 'Verificar que el archivo existe en /data/geodata/unidades_proyecto/ o /data/geodata/'
      }
    }

    const geoJSON = await response.json()

    // Validar estructura básica
    if (!geoJSON || geoJSON.type !== 'FeatureCollection') {
      return {
        fileName,
        status: 'error',
        message: 'Estructura GeoJSON inválida',
        error: 'No es una FeatureCollection válida',
        suggestedFix: 'Verificar que el archivo tiene la estructura GeoJSON correcta'
      }
    }

    if (!Array.isArray(geoJSON.features)) {
      return {
        fileName,
        status: 'error',
        message: 'Features no es un array',
        error: 'La propiedad features debe ser un array',
        suggestedFix: 'Corregir la estructura del archivo GeoJSON'
      }
    }

    // Estadísticas iniciales
    const featuresCount = geoJSON.features.length
    let validCoordinates = 0
    let invalidCoordinates = 0
    let emptyFeatures = 0
    const coordinateIssues: string[] = []
    const properties = new Set<string>()
    const geometryTypes: Record<string, number> = {}

    // Analizar cada feature
    geoJSON.features.forEach((feature: any, index: number) => {
      // Contar tipos de geometría
      const geomType = feature.geometry?.type
      if (geomType) {
        geometryTypes[geomType] = (geometryTypes[geomType] || 0) + 1
      }

      // Recopilar propiedades
      if (feature.properties && checkProperties) {
        Object.keys(feature.properties).forEach(prop => properties.add(prop))
      }

      // Verificar coordenadas si está habilitado
      if (checkCoordinates && feature.geometry?.coordinates) {
        const coords = feature.geometry.coordinates

        if (!coords || (Array.isArray(coords) && coords.length === 0)) {
          emptyFeatures++
          coordinateIssues.push(`Feature ${index}: coordenadas vacías`)
        } else if (feature.geometry.type === 'Point') {
          const [lng, lat] = coords
          
          if (typeof lng === 'number' && typeof lat === 'number' && 
              !isNaN(lng) && !isNaN(lat)) {
            
            // Verificar rango válido para Cali, Colombia
            if (lng >= -77 && lng <= -76 && lat >= 3 && lat <= 4.5) {
              validCoordinates++
            } else if (lat >= -77 && lat <= -76 && lng >= 3 && lng <= 4.5) {
              // Coordenadas invertidas (lat, lng en lugar de lng, lat)
              coordinateIssues.push(`Feature ${index}: coordenadas posiblemente invertidas [${lng}, ${lat}]`)
              validCoordinates++ // Se pueden corregir automáticamente
            } else {
              invalidCoordinates++
              coordinateIssues.push(`Feature ${index}: coordenadas fuera de rango [${lng}, ${lat}]`)
            }
          } else {
            invalidCoordinates++
            coordinateIssues.push(`Feature ${index}: coordenadas no numéricas`)
          }
        } else {
          validCoordinates++ // Para LineString, Polygon, etc.
        }
      }
    })

    // Verificar propiedades requeridas
    const missingRequiredProps = requiredProperties.filter(prop => !properties.has(prop))

    // Determinar estado del diagnóstico
    let status: 'success' | 'error' | 'warning' = 'success'
    let message = `Archivo ${fileName} válido`
    let suggestedFix: string | undefined

    if (featuresCount === 0) {
      status = 'warning'
      message = 'Archivo vacío (sin features)'
    } else if (invalidCoordinates > 0) {
      status = 'error'
      message = `${invalidCoordinates} coordenadas inválidas encontradas`
      suggestedFix = 'Corregir coordenadas usando el script fix-coordinates.js'
    } else if (coordinateIssues.length > 0) {
      status = 'warning'
      message = `${coordinateIssues.length} problemas menores de coordenadas`
      suggestedFix = 'Las coordenadas se corrigen automáticamente al cargar'
    } else if (missingRequiredProps.length > 0) {
      status = 'warning'
      message = `Faltan propiedades requeridas: ${missingRequiredProps.join(', ')}`
    } else if (featuresCount > maxFeatures) {
      status = 'warning'
      message = `Archivo grande (${featuresCount} features, máximo recomendado: ${maxFeatures})`
      suggestedFix = 'Considerar optimización o división del archivo'
    }

    return {
      fileName,
      status,
      message,
      details: {
        featuresCount,
        validCoordinates,
        invalidCoordinates,
        emptyFeatures,
        coordinateIssues: coordinateIssues.slice(0, 10), // Limitar a 10 ejemplos
        properties: Array.from(properties).slice(0, 20), // Limitar a 20 propiedades
        geometryTypes
      },
      suggestedFix
    }

  } catch (error) {
    return {
      fileName,
      status: 'error',
      message: 'Error al diagnosticar archivo',
      error: error instanceof Error ? error.message : 'Error desconocido',
      suggestedFix: 'Verificar formato y sintaxis del archivo GeoJSON'
    }
  }
}

/**
 * Ejecuta diagnósticos en múltiples archivos GeoJSON
 */
export async function diagnoseBulkGeoJSON(
  fileNames: string[],
  config?: GeoJSONValidationConfig
): Promise<GeoJSONDiagnosticResult[]> {
  console.log(`🔍 Diagnosticando ${fileNames.length} archivos GeoJSON...`)
  
  const results = await Promise.all(
    fileNames.map(fileName => diagnoseGeoJSON(fileName, config))
  )

  // Log resumen
  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    warnings: results.filter(r => r.status === 'warning').length,
    errors: results.filter(r => r.status === 'error').length
  }

  console.log('📊 Resumen de diagnósticos:', summary)
  
  return results
}

/**
 * Genera reporte detallado de diagnósticos
 */
export function generateDiagnosticReport(results: GeoJSONDiagnosticResult[]): string {
  let report = '# 🔍 REPORTE DE DIAGNÓSTICOS GEOJSON\n\n'
  
  // Resumen general
  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    warnings: results.filter(r => r.status === 'warning').length,
    errors: results.filter(r => r.status === 'error').length
  }

  report += '## 📊 Resumen General\n\n'
  report += `- **Total archivos**: ${summary.total}\n`
  report += `- **✅ Exitosos**: ${summary.success}\n`
  report += `- **⚠️ Advertencias**: ${summary.warnings}\n`
  report += `- **❌ Errores**: ${summary.errors}\n\n`

  // Detalles por archivo
  report += '## 📁 Detalles por Archivo\n\n'
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : '❌'
    
    report += `### ${icon} ${result.fileName}\n\n`
    report += `**Estado**: ${result.status.toUpperCase()}\n`
    report += `**Mensaje**: ${result.message}\n\n`
    
    if (result.details) {
      report += '**Estadísticas**:\n'
      if (result.details.featuresCount !== undefined) {
        report += `- Features: ${result.details.featuresCount}\n`
      }
      if (result.details.validCoordinates !== undefined) {
        report += `- Coordenadas válidas: ${result.details.validCoordinates}\n`
      }
      if (result.details.invalidCoordinates !== undefined) {
        report += `- Coordenadas inválidas: ${result.details.invalidCoordinates}\n`
      }
      if (result.details.geometryTypes) {
        report += `- Tipos de geometría: ${Object.entries(result.details.geometryTypes).map(([type, count]) => `${type}(${count})`).join(', ')}\n`
      }
      report += '\n'
    }
    
    if (result.suggestedFix) {
      report += `**💡 Solución sugerida**: ${result.suggestedFix}\n\n`
    }
    
    if (result.error) {
      report += `**❌ Error**: ${result.error}\n\n`
    }
  })

  return report
}

/**
 * Hook de React para diagnósticos en tiempo real
 */
export function useGeoJSONDiagnostics(fileNames: string[]) {
  const [diagnostics, setDiagnostics] = React.useState<GeoJSONDiagnosticResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const runDiagnostics = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const results = await diagnoseBulkGeoJSON(fileNames)
      setDiagnostics(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en diagnósticos')
    } finally {
      setLoading(false)
    }
  }, [fileNames])

  React.useEffect(() => {
    if (fileNames.length > 0) {
      runDiagnostics()
    }
  }, [runDiagnostics, fileNames])

  return {
    diagnostics,
    loading,
    error,
    runDiagnostics
  }
}

// Reexportar React para el hook
import React from 'react'

const geoJSONDiagnosticsUtils = {
  diagnoseGeoJSON,
  diagnoseBulkGeoJSON,
  generateDiagnosticReport,
  useGeoJSONDiagnostics
}

export default geoJSONDiagnosticsUtils

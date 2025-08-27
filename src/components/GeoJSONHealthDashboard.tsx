'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  FileText,
  MapPin,
  Activity,
  Download
} from 'lucide-react'
import { 
  diagnoseGeoJSON, 
  diagnoseBulkGeoJSON,
  generateDiagnosticReport,
  type GeoJSONDiagnosticResult 
} from '@/utils/geoJSONDiagnostics'

interface GeoJSONHealthDashboardProps {
  className?: string
}

const DEFAULT_FILES = [
  'equipamientos',
  'infraestructura_vial',
  'comunas',
  'barrios',
  'corregimientos',
  'veredas'
]

const GeoJSONHealthDashboard: React.FC<GeoJSONHealthDashboardProps> = ({ 
  className = '' 
}) => {
  const [diagnostics, setDiagnostics] = useState<GeoJSONDiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      console.log('🔍 Iniciando diagnósticos de salud de GeoJSON...')
      const results = await diagnoseBulkGeoJSON(DEFAULT_FILES, {
        checkCoordinates: true,
        checkProperties: true,
        maxFeatures: 10000
      })
      setDiagnostics(results)
      setLastCheck(new Date())
    } catch (error) {
      console.error('❌ Error en diagnósticos:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    const report = generateDiagnosticReport(diagnostics)
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `geojson-health-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const summary = diagnostics.reduce(
    (acc, result) => {
      acc[result.status]++
      acc.total++
      if (result.details?.featuresCount) {
        acc.totalFeatures += result.details.featuresCount
      }
      return acc
    },
    { success: 0, warning: 0, error: 0, total: 0, totalFeatures: 0 }
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🏥 Estado de Salud GeoJSON
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Diagnóstico en tiempo real de los archivos de datos geográficos
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Diagnosticando...' : 'Actualizar'}</span>
          </button>
          <button
            onClick={downloadReport}
            disabled={diagnostics.length === 0}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Reporte</span>
          </button>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exitosos</p>
              <p className="text-2xl font-bold text-green-600">{summary.success}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Advertencias</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.warning}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Errores</p>
              <p className="text-2xl font-bold text-red-600">{summary.error}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Features</p>
              <p className="text-2xl font-bold text-purple-600">{summary.totalFeatures}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Última verificación */}
      {lastCheck && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <p className="text-blue-700 dark:text-blue-300">
              Última verificación: {lastCheck.toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      )}

      {/* Resultados detallados */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Detalles por Archivo
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Ejecutando diagnósticos...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {diagnostics.map((result) => (
              <div key={result.fileName} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-blue-500">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <h4 className="text-lg font-semibold">{result.fileName}.geojson</h4>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">{result.message}</p>
                  
                  {result.details && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Features</p>
                        <p className="font-semibold">{result.details.featuresCount || 0}</p>
                      </div>
                      {result.details.validCoordinates !== undefined && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Coords. Válidas</p>
                          <p className="font-semibold text-green-600">{result.details.validCoordinates}</p>
                        </div>
                      )}
                      {result.details.invalidCoordinates !== undefined && result.details.invalidCoordinates > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Coords. Inválidas</p>
                          <p className="font-semibold text-red-600">{result.details.invalidCoordinates}</p>
                        </div>
                      )}
                      {result.details.geometryTypes && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Tipos</p>
                          <p className="font-semibold text-xs">
                            {Object.entries(result.details.geometryTypes)
                              .map(([type, count]) => `${type}(${count})`)
                              .join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {result.suggestedFix && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-yellow-700 dark:text-yellow-300">
                            <strong>💡 Solución sugerida:</strong> {result.suggestedFix}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-red-700 dark:text-red-300">
                            <strong>Error:</strong> {result.error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GeoJSONHealthDashboard

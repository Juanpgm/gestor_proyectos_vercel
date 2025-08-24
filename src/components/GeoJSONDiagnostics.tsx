'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Info, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react'
import { loadAllUnidadesProyecto, detectUnidadesProyectoFiles } from '@/utils/geoJSONLoader'

interface GeoJSONFileInfo {
  fileName: string
  status: 'loading' | 'success' | 'error' | 'not_found'
  features?: number
  error?: string
  fileSize?: string
  geometryTypes?: string[]
  sampleProperties?: string[]
}

interface GeoJSONDiagnosticsProps {
  className?: string
}

const GeoJSONDiagnostics: React.FC<GeoJSONDiagnosticsProps> = ({
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(false)
  const [filesInfo, setFilesInfo] = useState<GeoJSONFileInfo[]>([])
  const [detectedFiles, setDetectedFiles] = useState<string[]>([])

  const runDiagnostics = async () => {
    setIsRunning(true)
    setFilesInfo([])
    
    try {
      console.log('🔍 === INICIANDO DIAGNÓSTICOS GEOJSON ===')
      
      // Primero detectar archivos disponibles
      console.log('🔍 Detectando archivos...')
      const detected = await detectUnidadesProyectoFiles()
      setDetectedFiles(detected)
      
      // Inicializar estado de archivos
      const initialInfo: GeoJSONFileInfo[] = detected.map(fileName => ({
        fileName,
        status: 'loading'
      }))
      setFilesInfo(initialInfo)
      
      // Cargar cada archivo individualmente para diagnosticar
      const diagnostics: GeoJSONFileInfo[] = []
      
      for (const fileName of detected) {
        try {
          console.log(`🔄 Diagnosticando: ${fileName}`)
          
          // Intentar cargar el archivo
          const response = await fetch(`/data/unidades_proyecto/${fileName}.geojson`)
          
          if (!response.ok) {
            diagnostics.push({
              fileName,
              status: 'not_found',
              error: `HTTP ${response.status}: ${response.statusText}`
            })
            continue
          }
          
          // Obtener información del archivo
          const fileSize = response.headers.get('content-length')
          const data = await response.json()
          
          // Analizar estructura
          const features = data.features || []
          const geometryTypes = Array.from(new Set(features.map((f: any) => f.geometry?.type).filter(Boolean))) as string[]
          const sampleProperties = features.length > 0 ? Object.keys(features[0].properties || {}).slice(0, 10) : []
          
          diagnostics.push({
            fileName,
            status: 'success',
            features: features.length,
            fileSize: fileSize ? `${Math.round(parseInt(fileSize) / 1024)} KB` : 'Desconocido',
            geometryTypes,
            sampleProperties
          })
          
        } catch (error) {
          console.error(`❌ Error diagnosticando ${fileName}:`, error)
          diagnostics.push({
            fileName,
            status: 'error',
            error: error instanceof Error ? error.message : 'Error desconocido'
          })
        }
        
        // Actualizar UI progresivamente
        setFilesInfo([...diagnostics])
      }
      
      console.log('✅ Diagnósticos completados')
      
    } catch (error) {
      console.error('❌ Error en diagnósticos:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: GeoJSONFileInfo['status']) => {
    switch (status) {
      case 'loading':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'not_found':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: GeoJSONFileInfo['status']) => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'not_found':
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Diagnósticos GeoJSON
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verificar archivos de unidades de proyecto
              </p>
            </div>
          </div>
          
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
          >
            {isRunning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Ejecutando...</span>
              </>
            ) : (
              <>
                <Info className="w-4 h-4" />
                <span>Ejecutar Diagnósticos</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {detectedFiles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Archivos Detectados: {detectedFiles.length}
            </h4>
            <div className="flex flex-wrap gap-2">
              {detectedFiles.map(fileName => (
                <span 
                  key={fileName}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {fileName}
                </span>
              ))}
            </div>
          </div>
        )}

        {filesInfo.length > 0 ? (
          <div className="space-y-4">
            {filesInfo.map((fileInfo) => (
              <motion.div
                key={fileInfo.fileName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border-2 ${getStatusColor(fileInfo.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(fileInfo.status)}
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-white">
                        {fileInfo.fileName}.geojson
                      </h5>
                      {fileInfo.error ? (
                        <p className="text-sm text-red-600">{fileInfo.error}</p>
                      ) : (
                        <div className="text-sm text-gray-600 space-y-1">
                          {fileInfo.features !== undefined && (
                            <p><span className="font-medium">Features:</span> {fileInfo.features}</p>
                          )}
                          {fileInfo.fileSize && (
                            <p><span className="font-medium">Tamaño:</span> {fileInfo.fileSize}</p>
                          )}
                          {fileInfo.geometryTypes && fileInfo.geometryTypes.length > 0 && (
                            <p>
                              <span className="font-medium">Geometrías:</span> {fileInfo.geometryTypes.join(', ')}
                            </p>
                          )}
                          {fileInfo.sampleProperties && fileInfo.sampleProperties.length > 0 && (
                            <div>
                              <span className="font-medium">Propiedades (muestra):</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {fileInfo.sampleProperties.map(prop => (
                                  <span 
                                    key={prop}
                                    className="px-1 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                                  >
                                    {prop}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Haz clic en &quot;Ejecutar Diagnósticos&quot; para verificar los archivos GeoJSON
            </p>
          </div>
        )}
      </div>

      {filesInfo.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-bold text-green-600">
                {filesInfo.filter(f => f.status === 'success').length}
              </div>
              <div className="text-gray-600">Exitosos</div>
            </div>
            <div>
              <div className="font-bold text-red-600">
                {filesInfo.filter(f => f.status === 'error').length}
              </div>
              <div className="text-gray-600">Con Errores</div>
            </div>
            <div>
              <div className="font-bold text-yellow-600">
                {filesInfo.filter(f => f.status === 'not_found').length}
              </div>
              <div className="text-gray-600">No Encontrados</div>
            </div>
            <div>
              <div className="font-bold text-blue-600">
                {filesInfo.filter(f => f.features).reduce((total, f) => total + (f.features || 0), 0)}
              </div>
              <div className="text-gray-600">Total Features</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default GeoJSONDiagnostics

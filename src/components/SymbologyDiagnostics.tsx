'use client'

import React from 'react'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface SymbologyDiagnosticsProps {
  layerId: string
  layerData: any
  layerConfig: any
  symbologyState: any
  pendingChanges: any
}

const SymbologyDiagnostics: React.FC<SymbologyDiagnosticsProps> = ({
  layerId,
  layerData,
  layerConfig,
  symbologyState,
  pendingChanges
}) => {
  const diagnostics = [
    {
      label: 'Layer ID',
      value: layerId,
      status: layerId ? 'success' : 'error'
    },
    {
      label: 'Layer Data',
      value: layerData ? `${layerData.features?.length || layerData.length || 'Unknown'} elements` : 'No data',
      status: layerData ? 'success' : 'error'
    },
    {
      label: 'Layer Config',
      value: layerConfig ? 'Available' : 'Missing',
      status: layerConfig ? 'success' : 'error'
    },
    {
      label: 'Current Symbology',
      value: symbologyState[layerId] ? 'Configured' : 'Default',
      status: symbologyState[layerId] ? 'success' : 'warning'
    },
    {
      label: 'Pending Changes',
      value: pendingChanges[layerId] ? 'Yes' : 'No',
      status: pendingChanges[layerId] ? 'warning' : 'info'
    }
  ]

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Info className="w-4 h-4" />
        Diagnóstico de Simbología
      </h4>
      
      <div className="space-y-2">
        {diagnostics.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">{item.label}:</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-900 dark:text-white">{item.value}</span>
              {item.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
              {item.status === 'error' && <AlertTriangle className="w-3 h-3 text-red-500" />}
              {item.status === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
              {item.status === 'info' && <Info className="w-3 h-3 text-blue-500" />}
            </div>
          </div>
        ))}
      </div>

      {layerData && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Tipo de datos:</strong> {layerData.features ? 'GeoJSON' : Array.isArray(layerData) ? 'Array' : 'Object'}
          </div>
          {layerData.features && layerData.features[0]?.properties && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Atributos disponibles:</strong> {Object.keys(layerData.features[0].properties).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SymbologyDiagnostics

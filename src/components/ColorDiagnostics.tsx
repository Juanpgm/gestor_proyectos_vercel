import React from 'react'
import { useLayerSymbology } from '@/hooks/useLayerSymbology'

interface ColorDiagnosticsProps {
  layerId: string
  className?: string
}

/**
 * Componente de diagnóstico para verificar qué colores se están aplicando a una capa
 */
const ColorDiagnostics: React.FC<ColorDiagnosticsProps> = ({ layerId, className = '' }) => {
  const { getLayerSymbology, getFeatureStyle } = useLayerSymbology()
  
  const symbologyConfig = getLayerSymbology(layerId, false)
  
  // Simular una feature para probar getFeatureStyle
  const mockFeature = {
    properties: {},
    geometry: { type: 'Point' }
  }
  
  const featureStyle = getFeatureStyle(mockFeature, layerId, 'Point', false)
  
  return (
    <div className={`p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border ${className}`}>
      <h4 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">
        🎨 Diagnóstico de Colores - {layerId}
      </h4>
      
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Modo:</span>
            <span className="ml-1 font-mono">{symbologyConfig.mode}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Opacidad:</span>
            <span className="ml-1 font-mono">{symbologyConfig.opacity}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Color Fijo:</span>
            <div 
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: symbologyConfig.fixedColor }}
            />
            <span className="font-mono text-xs">{symbologyConfig.fixedColor}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Color Stroke:</span>
            <div 
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: symbologyConfig.strokeColor }}
            />
            <span className="font-mono text-xs">{symbologyConfig.strokeColor}</span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-gray-600 dark:text-gray-400 mb-1">Estilo Final de Feature:</div>
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Fill:</span>
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: featureStyle.fillColor }}
              />
              <span className="font-mono text-xs">{featureStyle.fillColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Stroke:</span>
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: featureStyle.color }}
              />
              <span className="font-mono text-xs">{featureStyle.color}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorDiagnostics

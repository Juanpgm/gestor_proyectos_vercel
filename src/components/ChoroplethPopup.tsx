'use client'

import React from 'react'
import { formatCurrency } from '@/utils/formatCurrency'
import { MetricType, METRIC_CONFIG } from './ChoroplethMapInteractive'

interface ChoroplethPopupProps {
  areaName: string
  value: number
  metricType: MetricType
  layerType: string
  properties?: Record<string, any>
}

const ChoroplethPopup: React.FC<ChoroplethPopupProps> = ({
  areaName,
  value,
  metricType,
  layerType,
  properties = {}
}) => {
  const config = METRIC_CONFIG[metricType]
  
  // Formatear el valor según el tipo de métrica
  const formatValue = (val: number, type: MetricType) => {
    switch (type) {
      case 'presupuesto':
      case 'proyectos':
      case 'actividades':
        return formatCurrency(val)
      default:
        return val.toLocaleString()
    }
  }

  // Obtener información adicional del área
  const getAreaInfo = () => {
    const info: Array<{ label: string; value: string }> = []
    
    // Información específica según el tipo de capa
    if (properties.codigo || properties.code) {
      info.push({
        label: 'Código',
        value: properties.codigo || properties.code
      })
    }
    
    if (properties.area_km2) {
      info.push({
        label: 'Área',
        value: `${parseFloat(properties.area_km2).toFixed(2)} km²`
      })
    }
    
    if (properties.poblacion) {
      info.push({
        label: 'Población',
        value: properties.poblacion.toLocaleString()
      })
    }
    
    return info
  }

  const areaInfo = getAreaInfo()

  return (
    <div className="p-3 min-w-[220px] max-w-[260px] bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm" 
             style={{ backgroundColor: config?.color ?? '#059669' }}>
          {config?.icon ?? '💰'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 leading-tight text-sm truncate">
            {areaName}
          </h3>
          <p className="text-xs text-gray-500 capitalize">
            {layerType.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Métrica principal */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <div className="text-xs font-medium text-gray-600 mb-1">
          {config?.name ?? 'Métrica'}
        </div>
        <div className="text-lg font-bold text-gray-900">
          {formatValue(value, metricType)}
        </div>
        {value === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Sin datos registrados
          </p>
        )}
      </div>

      {/* Información adicional del área - Solo mostrar la más relevante */}
      {areaInfo.length > 0 && (
        <div className="space-y-1">
          {areaInfo.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="text-gray-600">{item.label}:</span>
              <span className="font-medium text-gray-900 truncate ml-2">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChoroplethPopup

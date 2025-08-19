'use client'

import React from 'react'
import { MapPin, DollarSign, TrendingUp, Users, Award, BarChart3 } from 'lucide-react'

// Función para formatear correctamente texto con caracteres especiales UTF-8
const formatText = (text: string | any): string => {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  // Los datos del GeoJSON ya vienen en UTF-8, solo necesitamos normalizar
  return text
    .toString()
    .normalize('NFC') // Normalización de caracteres Unicode para UTF-8
    .trim(); // Eliminar espacios en blanco extra
};

// Función para capitalizar correctamente texto con caracteres especiales
const capitalizeText = (text: string): string => {
  return formatText(text)
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface PopupData {
  title: string
  subtitle?: string
  status?: {
    label: string
    color: string
    bgColor: string
  }
  items: {
    label: string
    value: string | number
    icon?: React.ReactNode
    format?: 'currency' | 'number' | 'percentage' | 'text'
  }[]
  progress?: {
    value: number
    color: string
  }
  location?: {
    community?: string
    neighborhood?: string
  }
}

interface MapPopupProps {
  data: PopupData
  className?: string
}

// Interfaz alternativa para datos simples de propiedades
interface SimpleMapPopupProps {
  title: string
  data: Record<string, any>
  excludeFields?: string[]
  className?: string
}

const MapPopup: React.FC<MapPopupProps | SimpleMapPopupProps> = (props) => {
  // Detectar qué tipo de props tenemos
  const isSimpleData = 'excludeFields' in props;
  
  if (isSimpleData) {
    const { title, data, excludeFields = ['geometry', 'type'], className } = props as SimpleMapPopupProps;
    
    const filteredData = Object.entries(data).filter(([key]) => 
      !excludeFields.includes(key)
    );

    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px] max-w-[320px] ${className || ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-lg text-gray-900 leading-tight">
            {formatText(title)}
          </h3>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-3">
            {filteredData.map(([key, value], index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {formatText(key.replace(/_/g, ' '))}:
                </span>
                <span className="font-medium text-sm text-gray-900 text-right max-w-[150px]">
                  {formatText(String(value))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Manejo de datos estructurados
  const { data, className } = props as MapPopupProps;

  const formatValue = (value: string | number, format?: 'currency' | 'number' | 'percentage' | 'text') => {
    if (typeof value === 'string') return formatText(value);
    
    switch (format) {
      case 'currency':
        if (value >= 1000000000) {
          return `$${(value / 1000000000).toFixed(1).replace('.', ',')}B`
        } else if (value >= 1000000) {
          return `$${(value / 1000000).toFixed(0)}M`
        }
        return `$${value.toLocaleString('es-CO')}`
      case 'number':
        return value.toLocaleString('es-CO')
      case 'percentage':
        return `${value}%`
      default:
        return formatText(value.toString())
    }
  }

  const getDefaultIcon = (label: string) => {
    const iconClass = "w-4 h-4 text-gray-500"
    const normalizedLabel = label.toLowerCase();
    
    if (normalizedLabel.includes('población') || normalizedLabel.includes('habitantes')) {
      return <Users className={iconClass} />
    }
    if (normalizedLabel.includes('proyecto')) {
      return <BarChart3 className={iconClass} />
    }
    if (normalizedLabel.includes('presupuesto') || normalizedLabel.includes('budget')) {
      return <DollarSign className={iconClass} />
    }
    if (normalizedLabel.includes('progreso') || normalizedLabel.includes('completado')) {
      return <TrendingUp className={iconClass} />
    }
    if (normalizedLabel.includes('índice') || normalizedLabel.includes('social')) {
      return <Award className={iconClass} />
    }
    return <BarChart3 className={iconClass} />
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px] max-w-[320px] ${className || ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 pr-2 leading-tight">
            {formatText(data.title)}
          </h3>
          {data.status && (
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${data.status.bgColor} ${data.status.color}`}
            >
              {formatText(data.status.label)}
            </span>
          )}
        </div>
        {data.subtitle && (
          <p className="text-sm text-gray-600">{formatText(data.subtitle)}</p>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          {data.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {item.icon || getDefaultIcon(item.label)}
                <span className="text-sm text-gray-600">{formatText(item.label)}:</span>
              </div>
              <span className="font-medium text-sm text-gray-900">
                {formatValue(item.value, item.format)}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {data.progress && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Progreso</span>
              <span className="text-sm font-medium text-gray-900">{data.progress.value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${data.progress.color}`}
                style={{ width: `${Math.min(100, Math.max(0, data.progress.value))}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Location Info */}
        {data.location && (data.location.community || data.location.neighborhood) && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="space-y-2">
              {data.location.community && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Comuna:</span>
                  </div>
                  <span className="font-medium text-sm text-gray-900">{formatText(data.location.community)}</span>
                </div>
              )}
              {data.location.neighborhood && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Barrio:</span>
                  </div>
                  <span className="font-medium text-sm text-gray-900">{formatText(data.location.neighborhood)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapPopup

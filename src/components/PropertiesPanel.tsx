'use client'

import React from 'react'
import { X, MapPin, Building2, Route, Info } from 'lucide-react'
import PopupGaugeChart from './PopupGaugeChart'

interface PropertiesPanelProps {
  feature: any | null // Feature de GeoJSON seleccionado
  layerType: string // Tipo de capa (equipamientos, infraestructura_vial, etc.)
  onClose: () => void // Función para cerrar el panel
  className?: string
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  feature,
  layerType,
  onClose,
  className = ''
}) => {
  
  if (!feature) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Selecciona un elemento del mapa para ver sus propiedades</p>
        </div>
      </div>
    )
  }

  // Determinar si es feature GeoJSON o punto
  const isGeoJSONFeature = feature.properties !== undefined
  const properties = isGeoJSONFeature ? feature.properties : feature

  // Función para obtener el nombre principal
  const getName = () => {
    if (isGeoJSONFeature) {
      return properties.NOMBRE || 
             properties.nombre || 
             properties.NAME || 
             properties.name ||
             properties.NOMCOMUNA ||
             properties.NOMBARRIO ||
             properties.nickname ||
             properties.identificador ||
             properties.seccion_via ||
             properties.barrio ||
             properties.comuna ||
             'Sin nombre'
    } else {
      return feature.name ||
             feature.NOMBRE || 
             feature.nombre || 
             feature.NAME ||
             feature.titulo ||
             feature.proyecto ||
             feature.nickname ||
             feature.identificador ||
             'Proyecto sin nombre'
    }
  }

  // Obtener datos de progreso
  const getProgressData = () => {
    const progressFields = [
      'progress',
      'avance_físico_obra',
      'avance_fisico_obra',
      'avance_fisico',
      'progreso',
      'porcentaje_avance',
      'avance'
    ]
    
    for (const field of progressFields) {
      if (properties[field] !== undefined && properties[field] !== null) {
        let progress = parseFloat(properties[field])
        // Si el valor está entre 0 y 1, convertir a porcentaje
        if (progress >= 0 && progress <= 1) {
          progress = progress * 100
        }
        // Asegurar que esté en el rango 0-100
        return Math.min(Math.max(progress, 0), 100)
      }
    }
    return null
  }

  const progressValue = getProgressData()

  // Función para formatear valores
  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'No especificado'
    }
    
    const keyLower = key.toLowerCase()
    
    // BPIN debe mostrarse como número entero, NO como moneda
    if (keyLower.includes('bpin')) {
      return value.toString()
    }
    
    if (typeof value === 'number') {
      // Solo formatear como moneda si contiene palabras clave de presupuesto/dinero
      if (keyLower.includes('presupuesto') || keyLower.includes('valor') || keyLower.includes('budget') || 
          keyLower.includes('pagos') || keyLower.includes('executed') || keyLower.includes('ppto')) {
        return new Intl.NumberFormat('es-CO', { 
          style: 'currency', 
          currency: 'COP',
          minimumFractionDigits: 0 
        }).format(value)
      }
      return value.toLocaleString('es-CO')
    }
    
    if (typeof value === 'string' && value.length > 150) {
      return `${value.substring(0, 150)}...`
    }
    
    return value.toString()
  }

  // Función para categorizar propiedades
  const categorizeProperty = (key: string) => {
    const keyLower = key.toLowerCase()
    
    if (keyLower.includes('bpin') || keyLower.includes('identificador') || keyLower.includes('id')) {
      return 'identification'
    }
    if (keyLower.includes('ppto_base') || keyLower.includes('presupuesto') || keyLower.includes('valor') || keyLower.includes('budget') || keyLower.includes('pagos') || keyLower.includes('executed')) {
      return 'investment'
    }
    if (keyLower.includes('comuna') || keyLower.includes('barrio') || keyLower.includes('corregimiento') || keyLower.includes('vereda') || keyLower.includes('direccion')) {
      return 'location'
    }
    if (keyLower.includes('fecha') || keyLower.includes('date') || keyLower.includes('start') || keyLower.includes('end')) {
      return 'dates'
    }
    if (keyLower.includes('estado') || keyLower.includes('status') || keyLower.includes('progress') || keyLower.includes('avance')) {
      return 'status'
    }
    if (keyLower.includes('tipo') || keyLower.includes('clase') || keyLower.includes('intervencion') || keyLower.includes('descripcion')) {
      return 'project'
    }
    return 'general'
  }

  // Agrupar propiedades por categoría
  const categorizedProps = Object.entries(properties).reduce((acc, [key, value]) => {
    // Filtrar propiedades internas
    if (key.startsWith('_') || key === 'geometry' || key === 'lat' || key === 'lng') {
      return acc
    }
    
    const category = categorizeProperty(key)
    if (!acc[category]) acc[category] = []
    acc[category].push([key, value])
    return acc
  }, {} as Record<string, [string, any][]>)

  // Configuración de categorías
  const categoryConfig = {
    identification: { name: 'Identificación', icon: '🆔', color: 'blue' },
    investment: { name: 'Inversión', icon: '💰', color: 'green' },
    project: { name: 'Proyecto', icon: '🏗️', color: 'purple' },
    location: { name: 'Ubicación', icon: '📍', color: 'green' },
    status: { name: 'Estado', icon: '📊', color: 'indigo' },
    dates: { name: 'Fechas', icon: '📅', color: 'pink' },
    general: { name: 'General', icon: '📋', color: 'gray' }
  }

  const categoryOrder = ['identification', 'investment', 'project', 'location', 'status', 'dates', 'general']

  // Obtener icono del tipo de capa
  const getLayerIcon = () => {
    if (layerType.includes('equipamiento')) return <Building2 className="w-5 h-5" />
    if (layerType.includes('infraestructura') || layerType.includes('vias')) return <Route className="w-5 h-5" />
    return <MapPin className="w-5 h-5" />
  }

  const getLayerColor = () => {
    if (layerType.includes('equipamiento')) return 'text-green-600 bg-green-50 border-green-200'
    if (layerType.includes('infraestructura') || layerType.includes('vias')) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  // Obtener presupuesto base
  const getPresupuestoBase = () => {
    return properties.ppto_base || properties.presupuesto_base || properties.budget || null
  }

  const presupuestoBase = getPresupuestoBase()

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${getLayerColor()}`}>
            {getLayerIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getName()}
            </h3>
            {presupuestoBase && (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatValue('ppto_base', presupuestoBase)}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {layerType.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Cerrar propiedades"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Gauge Chart - Más prominente */}
      {progressValue !== null && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span className="text-lg">📊</span>
            Progreso del Proyecto
          </h4>
          <div className="flex justify-center">
            <PopupGaugeChart progress={progressValue} size="medium" />
          </div>
        </div>
      )}

      {/* Content - propiedades categorizadas */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {categoryOrder
          .filter(category => categorizedProps[category] && categorizedProps[category].length > 0)
          .map(category => {
            const config = categoryConfig[category as keyof typeof categoryConfig]
            return (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="text-base">{config.icon}</span>
                  {config.name}
                </h4>
                <div className="space-y-1 pl-6">
                  {categorizedProps[category].map(([key, value], index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 text-xs">
                      <dt className="text-gray-600 dark:text-gray-400 break-words font-medium">
                        {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white break-words col-span-2">
                        {formatValue(key, value)}
                      </dd>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        }
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>
            {Object.values(categorizedProps).flat().length} propiedades
          </span>
          <span className="capitalize">
            Capa: {layerType.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PropertiesPanel

'use client'

import React from 'react'
import { X, MapPin, Building2, Route, Info, Target } from 'lucide-react'
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
      // Para vías, priorizar campos específicos
      if (layerType.includes('infraestructura') || layerType.includes('vias')) {
        return properties.nickname ||
               properties.id_via ||
               properties.seccion_via ||
               properties.identificador ||
               `Vía ${properties.bpin || 'Sin ID'}` ||
               'Vía sin nombre'
      }
      
      // Para otros tipos de features
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
    
    // Formatear como porcentaje con máximo 2 decimales para campos de progreso/avance
    if (keyLower.includes('progress') || keyLower.includes('avance') || 
        keyLower.includes('físico') || keyLower.includes('fisico') ||
        keyLower.includes('porcentaje') || keyLower.includes('percent')) {
      let percentage = parseFloat(value)
      // Si el valor está entre 0 y 1, convertir a porcentaje
      if (percentage >= 0 && percentage <= 1) {
        percentage = percentage * 100
      }
      return `${percentage.toFixed(2)}%`
    }
    
    // Formatear como porcentaje para ejecución financiera (calculada)
    if (keyLower.includes('ejecucion') && keyLower.includes('financier')) {
      let percentage = parseFloat(value)
      return `${percentage.toFixed(2)}%`
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
  const categorizeProperty = (key: string): string | null => {
    const keyLower = key.toLowerCase()
    
    // Excluir BPIN ya que se muestra en el header
    if (keyLower.includes('bpin')) {
      return null // No mostrar en propiedades - ya está en el header
    }
    if (keyLower.includes('identificador') || keyLower.includes('id')) {
      return 'identification'
    }
    // Propiedades específicas para vías
    if (keyLower.includes('longitud') || keyLower.includes('length') || keyLower.includes('seccion') || keyLower.includes('via')) {
      return 'infrastructure'
    }
    if (keyLower.includes('ppto_base') || keyLower.includes('presupuesto') || keyLower.includes('valor') || keyLower.includes('budget') || keyLower.includes('pagos') || keyLower.includes('executed') || keyLower.includes('ejecucion')) {
      return 'investment'
    }
    if (keyLower.includes('comuna') || keyLower.includes('barrio') || keyLower.includes('corregimiento') || keyLower.includes('vereda') || keyLower.includes('direccion')) {
      return null // No mostrar en propiedades - ya está en el header
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
    return 'project' // Ya no hay categoría "general"
  }

  // Agrupar propiedades por categoría
  const categorizedProps = Object.entries(properties).reduce((acc, [key, value]) => {
    // Filtrar propiedades internas, dataframe y imagen (se muestra por separado)
    if (key.startsWith('_') || key === 'geometry' || key === 'lat' || key === 'lng' || 
        key.toLowerCase() === 'dataframe' || key.toLowerCase() === 'imagen') {
      return acc
    }
    
    const category = categorizeProperty(key)
    if (category) { // Solo agregar si la categoría no es null
      if (!acc[category]) acc[category] = []
      acc[category].push([key, value])
    }
    return acc
  }, {} as Record<string, [string, any][]>)

  // Configuración de categorías
  const categoryConfig = {
    identification: { name: 'Identificación', icon: '🆔', color: 'blue' },
    infrastructure: { name: 'Infraestructura', icon: '🛣️', color: 'orange' },
    investment: { name: 'Inversión', icon: '💰', color: 'green' },
    project: { name: 'Proyecto', icon: '🏗️', color: 'purple' },
    status: { name: 'Estado', icon: '📊', color: 'indigo' },
    dates: { name: 'Fechas', icon: '📅', color: 'pink' }
  }

  const categoryOrder = ['identification', 'infrastructure', 'investment', 'project', 'status', 'dates']

  // Obtener icono del tipo de capa
  const getLayerIcon = () => {
    if (layerType.includes('equipamiento')) return <Building2 className="w-5 h-5" />
    if (layerType.includes('infraestructura') || layerType.includes('vias')) return <Route className="w-5 h-5" />
    if (layerType.includes('centros_gravedad')) return <Target className="w-5 h-5" />
    return <MapPin className="w-5 h-5" />
  }

  const getLayerColor = () => {
    if (layerType.includes('equipamiento')) return 'text-green-600 bg-green-50 border-green-200'
    if (layerType.includes('infraestructura') || layerType.includes('vias')) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (layerType.includes('centros_gravedad')) return 'text-purple-600 bg-purple-50 border-purple-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  // Obtener presupuesto base
  const getPresupuestoBase = () => {
    return properties.ppto_base || properties.presupuesto_base || properties.budget || null
  }

  // Obtener información de ubicación
  const getLocationInfo = () => {
    const barrio = properties.NOMBARRIO || properties.barrio || properties.neighborhood || ''
    const comuna = properties.NOMCOMUNA || properties.comuna || properties.district || ''
    const direccion = properties.direccion || properties.address || properties.DIRECCION || ''
    
    return { barrio, comuna, direccion }
  }

  // Obtener BPIN
  const getBPIN = () => {
    return properties.BPIN || properties.bpin || properties.codigo_bpin || ''
  }

  const presupuestoBase = getPresupuestoBase()
  const locationInfo = getLocationInfo()
  const bpinValue = getBPIN()

  // Función para convertir URL de Google Drive a formato de imagen directa
  const convertGoogleDriveUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return ''
    
    // Verificar si es una URL de Google Drive
    if (url.includes('drive.google.com')) {
      // Extraer el ID del archivo de diferentes formatos de URL de Google Drive
      let fileId = ''
      
      // Formato: https://drive.google.com/open?id=FILE_ID
      if (url.includes('open?id=')) {
        fileId = url.split('open?id=')[1].split('&')[0]
      }
      // Formato: https://drive.google.com/file/d/FILE_ID/view
      else if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0]
      }
      // Formato: https://drive.google.com/uc?id=FILE_ID
      else if (url.includes('uc?id=')) {
        fileId = url.split('uc?id=')[1].split('&')[0]
      }
      
      // Si encontramos un ID válido, convertir a URL de imagen directa
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`
      }
    }
    
    // Si no es de Google Drive o no podemos extraer el ID, devolver la URL original
    return url
  }

  // Obtener imagen para centros de gravedad
  const getImageInfo = () => {
    if (layerType.includes('centros_gravedad') && properties.imagen) {
      const originalUrl = properties.imagen
      const directImageUrl = convertGoogleDriveUrl(originalUrl)
      return { originalUrl, directImageUrl }
    }
    return null
  }

  const imageInfo = getImageInfo()

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
            {/* BPIN en mayúscula con número en azul */}
            {bpinValue && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                BPIN: <span className="text-blue-400">{bpinValue}</span>
              </p>
            )}
            {/* Ubicación: Barrio, Comuna, Dirección */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {locationInfo.barrio && (
                <p>📍 {locationInfo.barrio}</p>
              )}
              {locationInfo.comuna && (
                <p>🏛️ {locationInfo.comuna}</p>
              )}
              {locationInfo.direccion && (
                <p>🏠 {locationInfo.direccion}</p>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 capitalize mt-1">
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

      {/* Content - propiedades categorizadas */}
      <div className="p-4 space-y-4">
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
                  {categorizedProps[category].map(([key, value], index) => {
                    // Determinar colores para valores en la sección de inversión
                    const isPaymentValue = category === 'investment' && 
                      key.toLowerCase().includes('pagos')
                    
                    const isOtherMonetaryValue = category === 'investment' && 
                      !key.toLowerCase().includes('pagos') &&
                      (key.toLowerCase().includes('presupuesto') || 
                       key.toLowerCase().includes('valor') || 
                       key.toLowerCase().includes('budget') || 
                       key.toLowerCase().includes('executed') ||
                       key.toLowerCase().includes('ppto'))
                    
                    // Función para capitalizar la primera letra de cada palabra
                    const capitalizeKey = (str: string) => {
                      return str
                        .replace(/_/g, ' ')
                        .replace(/([A-Z])/g, ' $1')
                        .trim()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')
                    }
                    
                    return (
                      <div key={index} className="grid grid-cols-3 gap-2 text-xs">
                        <dt className="text-gray-600 dark:text-gray-400 break-words font-medium">
                          {capitalizeKey(key)}:
                        </dt>
                        <dd className={`text-sm break-words col-span-2 ${
                          isPaymentValue 
                            ? 'text-orange-500 dark:text-orange-400 font-medium' 
                            : isOtherMonetaryValue
                            ? 'text-green-500 dark:text-green-400 font-medium'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {formatValue(key, value)}
                        </dd>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        }
      </div>

      {/* Sección de imagen para Centros de Gravedad */}
      {imageInfo && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
            <span className="text-base">📷</span>
            Imagen de referencia
          </h4>
          
          {/* Contenedor horizontal para imagen y enlace */}
          <div className="flex items-center gap-3">
            {/* Imagen compacta */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img 
                  src={imageInfo.directImageUrl}
                  alt="Imagen del centro de gravedad"
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(imageInfo.originalUrl, '_blank')}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500';
                    errorDiv.innerHTML = '<span class="text-sm">📷</span>';
                    target.parentElement?.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
            
            {/* Enlace para ver imagen completa */}
            <div className="flex-1">
              <button
                onClick={() => window.open(imageInfo.originalUrl, '_blank')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                🔗 Ver imagen completa
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Haz clic para ampliar
              </p>
            </div>
          </div>
        </div>
      )}

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

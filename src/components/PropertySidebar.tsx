/**
 * PropertySidebar - Sidebar para mostrar propiedades de objetos geográficos seleccionados
 * @description Componente que muestra información detallada del elemento seleccionado
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  MapPin, 
  Info, 
  BarChart3, 
  Calendar,
  DollarSign,
  Building,
  Users,
  Target,
  Layers,
  ExternalLink,
  Eye
} from 'lucide-react'

interface PropertySidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedFeature: any
  theme: 'light' | 'dark'
  onShowModal?: () => void
}

const PropertySidebar: React.FC<PropertySidebarProps> = ({
  isOpen,
  onClose,
  selectedFeature,
  theme,
  onShowModal
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false)
  if (!selectedFeature) return null

  const isDark = theme === 'dark'

  // Función para formatear valores
  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('presupuesto') || key.toLowerCase().includes('budget')) {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(value)
      }
      if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('porcentaje')) {
        return `${value.toFixed(1)}%`
      }
      if (Number.isInteger(value)) {
        return value.toLocaleString('es-CO')
      }
      return value.toFixed(2)
    }
    
    if (typeof value === 'string') {
      return value
    }
    
    return String(value)
  }

  // Función para obtener icono según el tipo de propiedad
  const getPropertyIcon = (key: string) => {
    const keyLower = key.toLowerCase()
    
    if (keyLower.includes('nombre') || keyLower.includes('name')) return <MapPin className="w-4 h-4" />
    if (keyLower.includes('presupuesto') || keyLower.includes('budget')) return <DollarSign className="w-4 h-4" />
    if (keyLower.includes('fecha') || keyLower.includes('date') || keyLower.includes('año')) return <Calendar className="w-4 h-4" />
    if (keyLower.includes('estado') || keyLower.includes('status')) return <Info className="w-4 h-4" />
    if (keyLower.includes('tipo') || keyLower.includes('type') || keyLower.includes('categoria')) return <Building className="w-4 h-4" />
    if (keyLower.includes('count') || keyLower.includes('cantidad')) return <BarChart3 className="w-4 h-4" />
    if (keyLower.includes('poblacion') || keyLower.includes('population')) return <Users className="w-4 h-4" />
    if (keyLower.includes('avance') || keyLower.includes('progress')) return <Target className="w-4 h-4" />
    
    return <Layers className="w-4 h-4" />
  }

  // Función para obtener el título basado en el tipo de feature
  const getFeatureTitle = () => {
    if (selectedFeature.properties?.nombre) return selectedFeature.properties.nombre
    if (selectedFeature.properties?.name) return selectedFeature.properties.name
    if (selectedFeature.nombre) return selectedFeature.nombre
    if (selectedFeature.bpin) return `BPIN: ${selectedFeature.bpin}`
    if (selectedFeature.upid) return `Unidad: ${selectedFeature.upid}`
    return 'Elemento Seleccionado'
  }

  // Función para obtener el subtítulo
  const getFeatureSubtitle = () => {
    if (selectedFeature.properties?.tipo) return selectedFeature.properties.tipo
    if (selectedFeature.tipo_intervencion) return selectedFeature.tipo_intervencion
    if (selectedFeature.properties?.category) return selectedFeature.properties.category
    return 'Información Geográfica'
  }

  // Filtrar propiedades para mostrar
  const getDisplayProperties = () => {
    const allProps = { ...selectedFeature.properties, ...selectedFeature }
    const excludeKeys = ['geometry', 'coordinates', '_leaflet_id', 'layer']
    
    return Object.entries(allProps)
      .filter(([key, value]) => 
        !excludeKeys.includes(key) && 
        value !== null && 
        value !== undefined && 
        value !== '' &&
        typeof value !== 'object'
      )
      .sort(([a], [b]) => {
        // Priorizar campos importantes
        const priority = ['nombre', 'name', 'bpin', 'upid', 'tipo', 'type', 'estado', 'status']
        const aIndex = priority.findIndex(p => a.toLowerCase().includes(p))
        const bIndex = priority.findIndex(p => b.toLowerCase().includes(p))
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        
        return a.localeCompare(b)
      })
  }

  const displayProperties = getDisplayProperties()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`
            absolute top-0 right-0 w-80 h-full z-[1000]
            ${isDark 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
            }
            border-l shadow-xl overflow-hidden flex flex-col
          `}
        >
          {/* Header */}
          <div className={`
            p-4 border-b 
            ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}
          `}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold truncate pr-2">
                {getFeatureTitle()}
              </h3>
              <div className="flex items-center gap-2">
                {/* Botón Ver Detalles */}
                <button
                  onClick={() => setShowDetailModal(true)}
                  className={`
                    p-1 rounded-lg transition-colors flex-shrink-0
                    ${isDark 
                      ? 'hover:bg-blue-600 text-blue-400 hover:text-white' 
                      : 'hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                    }
                  `}
                  title="Ver detalles completos"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {/* Botón Cerrar */}
                <button
                  onClick={onClose}
                  className={`
                    p-1 rounded-lg transition-colors flex-shrink-0
                    ${isDark 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {getFeatureSubtitle()}
            </p>
          </div>

          {/* Properties List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {displayProperties.length > 0 ? (
                displayProperties.map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      p-3 rounded-lg border
                      ${isDark 
                        ? 'bg-gray-750 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        mt-0.5 
                        ${isDark ? 'text-emerald-400' : 'text-emerald-600'}
                      `}>
                        {getPropertyIcon(key)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <dt className={`
                          text-sm font-medium mb-1
                          ${isDark ? 'text-gray-300' : 'text-gray-700'}
                        `}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </dt>
                        <dd className={`
                          text-sm break-words
                          ${isDark ? 'text-gray-100' : 'text-gray-900'}
                        `}>
                          {formatValue(key, value)}
                        </dd>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className={`
                  text-center py-8
                  ${isDark ? 'text-gray-400' : 'text-gray-500'}
                `}>
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay propiedades disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer con estadísticas si están disponibles */}
          {(selectedFeature.count || selectedFeature.percentage) && (
            <div className={`
              p-4 border-t
              ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}
            `}>
              <div className="grid grid-cols-2 gap-4 text-center">
                {selectedFeature.count && (
                  <div>
                    <div className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {selectedFeature.count.toLocaleString('es-CO')}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Proyectos
                    </div>
                  </div>
                )}
                {selectedFeature.percentage && (
                  <div>
                    <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {selectedFeature.percentage.toFixed(1)}%
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      del Total
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal de Detalles */}
      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowDetailModal(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`
                relative w-full max-w-2xl max-h-[80vh] mx-4 rounded-lg shadow-xl overflow-hidden
                ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
              `}
            >
              {/* Header del Modal */}
              <div className={`
                p-6 border-b
                ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}
              `}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2">
                      {getFeatureTitle()}
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getFeatureSubtitle()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isDark 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="overflow-y-auto max-h-[60vh]">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayProperties.length > 0 ? (
                      displayProperties.map(([key, value], index) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`
                            p-4 rounded-lg border
                            ${isDark 
                              ? 'bg-gray-750 border-gray-600' 
                              : 'bg-gray-50 border-gray-200'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`
                              mt-1 
                              ${isDark ? 'text-emerald-400' : 'text-emerald-600'}
                            `}>
                              {getPropertyIcon(key)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <dt className={`
                                text-sm font-medium mb-2
                                ${isDark ? 'text-gray-300' : 'text-gray-700'}
                              `}>
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </dt>
                              <dd className={`
                                text-sm break-words
                                ${isDark ? 'text-gray-100' : 'text-gray-900'}
                              `}>
                                {formatValue(key, value)}
                              </dd>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className={`
                        col-span-2 text-center py-8
                        ${isDark ? 'text-gray-400' : 'text-gray-500'}
                      `}>
                        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No hay propiedades disponibles</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer del Modal con estadísticas */}
              {(selectedFeature?.count || selectedFeature?.percentage) && (
                <div className={`
                  p-6 border-t
                  ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}
                `}>
                  <div className="grid grid-cols-2 gap-6 text-center">
                    {selectedFeature.count && (
                      <div>
                        <div className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {selectedFeature.count.toLocaleString('es-CO')}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Proyectos
                        </div>
                      </div>
                    )}
                    {selectedFeature.percentage && (
                      <div>
                        <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {selectedFeature.percentage.toFixed(1)}%
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          del Total
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}

export default PropertySidebar
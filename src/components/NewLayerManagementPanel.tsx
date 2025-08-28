'use client'

import React, { useState, useCallback } from 'react'
import { Settings, Eye, EyeOff, Circle, Palette } from 'lucide-react'
import LayerSymbologyModal from './LayerSymbologyModal'

interface LayerConfig {
  id: string
  name: string
  visible: boolean
  color: string
  opacity: number
  representationMode: 'clase_obra' | 'tipo_intervencion' | 'estado'
  data?: any
}

interface NewLayerManagementPanelProps {
  layers: LayerConfig[]
  onLayerUpdate: (layerId: string, updates: Partial<LayerConfig>) => void
  onApplySymbologyChanges?: (layerId: string) => void
  className?: string
}

const NewLayerManagementPanel: React.FC<NewLayerManagementPanelProps> = ({
  layers,
  onLayerUpdate,
  onApplySymbologyChanges,
  className = ''
}) => {
  const [symbologyModalOpen, setSymbologyModalOpen] = useState(false)
  const [selectedLayerId, setSelectedLayerId] = useState<string>('')

  // Funciones para manejar cambios inmediatos
  const handleVisibilityToggle = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (layer) {
      onLayerUpdate(layerId, { visible: !layer.visible })
    }
  }, [layers, onLayerUpdate])

  // Abrir modal de simbología
  const openSymbologyModal = (layerId: string) => {
    console.log('🔧 Abriendo modal de simbología para:', layerId)
    const layer = layers.find(l => l.id === layerId)
    console.log('📋 Datos de la capa:', layer)
    setSelectedLayerId(layerId)
    setSymbologyModalOpen(true)
  }

  // Cerrar modal de simbología
  const closeSymbologyModal = () => {
    setSymbologyModalOpen(false)
    setSelectedLayerId('')
  }

  // Obtener la capa seleccionada para el modal
  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Gestión de Capas</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configura la visibilidad y simbología de cada capa
          </p>
        </div>

        {/* Layers List */}
        <div className="max-h-96 overflow-y-auto">
          {layers.map((layer) => {
            return (
              <div key={layer.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                {/* Layer Item */}
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  
                  {/* Layer Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => handleVisibilityToggle(layer.id)}
                        className={`transition-colors ${
                          layer.visible 
                            ? 'text-blue-500 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {layer.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      
                      <Circle 
                        className="w-4 h-4" 
                        style={{ color: layer.color, fill: layer.color }}
                      />
                      
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {layer.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {layer.representationMode === 'clase_obra' ? 'Clase de Obra' : 
                           layer.representationMode === 'tipo_intervencion' ? 'Tipo Intervención' : 
                           'Estado Proyecto'}
                        </p>
                      </div>
                    </div>

                    {/* Settings Button */}
                    <button
                      onClick={() => openSymbologyModal(layer.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all group"
                      title="Configurar simbología"
                    >
                      <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{layers.filter(l => l.visible).length} de {layers.length} capas visibles</span>
            <button 
              onClick={() => {
                layers.forEach(layer => {
                  onLayerUpdate(layer.id, { visible: true, opacity: 0.8 })
                })
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              Restaurar todo
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Simbología */}
      {selectedLayer && (
        <LayerSymbologyModal
          isOpen={symbologyModalOpen}
          onClose={closeSymbologyModal}
          layerId={selectedLayer.id}
          layerName={selectedLayer.name}
          layerData={selectedLayer.data}
          layerConfig={selectedLayer}
          onApplyChanges={onApplySymbologyChanges}
        />
      )}
    </>
  )
}

export default NewLayerManagementPanel

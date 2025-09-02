'use client'

import React, { useState, useCallback } from 'react'
import { Settings, Eye, EyeOff } from 'lucide-react'
import LayerSymbologyModal from './LayerSymbologyModal'

interface LayerConfig {
  id: string
  name: string
  visible: boolean
  color: string
  opacity: number
  representationMode: 'clase_obra' | 'tipo_intervencion' | 'estado' | 'novedad'
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
        {/* Layers List */}
        <div className="max-h-96 overflow-y-auto">
          {layers.map((layer) => {
            return (
              <div key={layer.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                {/* Layer Item */}
                <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  
                  {/* Layer Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => handleVisibilityToggle(layer.id)}
                        className={`transition-colors ${
                          layer.visible 
                            ? 'text-blue-500 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: layer.color }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {layer.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {layer.representationMode === 'clase_obra' ? 'Clase de Obra' : 
                           layer.representationMode === 'tipo_intervencion' ? 'Tipo Intervención' :
                           layer.representationMode === 'novedad' ? 'Novedad' :
                           'Estado Proyecto'}
                        </p>
                      </div>
                    </div>

                    {/* Settings Button */}
                    <button
                      onClick={() => openSymbologyModal(layer.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                      title="Configurar simbología"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{layers.filter(l => l.visible).length} de {layers.length} visibles</span>
            <button 
              onClick={() => {
                layers.forEach(layer => {
                  onLayerUpdate(layer.id, { visible: true, opacity: 0.8 })
                })
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-xs"
            >
              Restaurar
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

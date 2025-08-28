'use client'

import React, { useState } from 'react'
import LayerManagementPanel from '@/components/LayerManagementPanel'

interface LayerConfig {
  id: string
  name: string
  visible: boolean
  color: string
  opacity: number
  representationMode: 'clase_obra' | 'tipo_intervencion' | 'estado' | 'novedad'
}

export default function LayerTestPage() {
  const [layers, setLayers] = useState<LayerConfig[]>([
    {
      id: 'equipamientos',
      name: 'Equipamientos',
      visible: true,
      color: '#10B981',
      opacity: 0.8,
      representationMode: 'clase_obra'
    },
    {
      id: 'infraestructura_vial',
      name: 'Infraestructura Vial',
      visible: true,
      color: '#F59E0B',
      opacity: 0.8,
      representationMode: 'tipo_intervencion'
    },
    {
      id: 'proyectos',
      name: 'Proyectos',
      visible: false,
      color: '#3B82F6',
      opacity: 0.6,
      representationMode: 'estado'
    }
  ])

  const [darkMode, setDarkMode] = useState(false)

  const handleLayerUpdate = (layerId: string, updates: Partial<LayerConfig>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ))
  }

  const handleApplyChanges = () => {
    console.log('🎨 Cambios aplicados al mapa:', layers)
    alert('¡Cambios aplicados exitosamente!')
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Prueba de Panel de Gestión de Capas
              </h1>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Prueba la funcionalidad de cambio de colores, opacidad y modo de representación
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Panel de Control */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Panel de Control
              </h2>
              <LayerManagementPanel
                layers={layers}
                onLayerUpdate={handleLayerUpdate}
                onApplyChanges={handleApplyChanges}
              />
            </div>

            {/* Estado Actual */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Estado Actual de las Capas
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-4">
                  {layers.map(layer => (
                    <div key={layer.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className={`font-medium ${layer.visible ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                          {layer.name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          layer.visible 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {layer.visible ? 'Visible' : 'Oculta'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>Color: <span className="font-mono">{layer.color}</span></div>
                        <div>Opacidad: {Math.round(layer.opacity * 100)}%</div>
                        <div>Modo: {layer.representationMode.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Funcionalidades disponibles:
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>✅ Cambio de visibilidad</li>
                  <li>✅ Selección de colores predefinidos</li>
                  <li>✅ Selector de color personalizado</li>
                  <li>✅ Control deslizante de opacidad</li>
                  <li>✅ Modo de representación</li>
                  <li>✅ Cambios pendientes con botón aplicar</li>
                  <li>✅ Soporte completo para tema oscuro</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

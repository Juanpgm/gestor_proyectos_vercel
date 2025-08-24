'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Map, 
  BarChart3, 
  PieChart, 
  Layers,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface SimpleMapLayoutProps {
  className?: string;
  height?: string;
}

const SimpleMapLayout: React.FC<SimpleMapLayoutProps> = ({
  className = '',
  height = '800px'
}) => {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [activeChart, setActiveChart] = useState<'interventions' | 'progress' | 'geographic' | 'metrics'>('interventions');

  // Datos de ejemplo para mostrar el layout
  const sampleLayers = [
    { id: 'equipamientos', name: 'Equipamientos', visible: true, icon: '🏢', color: '#10B981' },
    { id: 'infraestructura_vial', name: 'Infraestructura Vial', visible: true, icon: '🛣️', color: '#F59E0B' },
    { id: 'comunas', name: 'Comunas', visible: false, icon: '🏘️', color: '#3B82F6' },
  ];

  console.log('🔧 SimpleMapLayout renderizando');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Layout en tres columnas */}
      <div className="flex h-full">
        
        {/* Panel Izquierdo - Controles y Filtros */}
        <motion.div
          initial={false}
          animate={{ 
            width: leftPanelCollapsed ? '50px' : '240px'
          }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col"
        >
          {/* Header del panel izquierdo */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!leftPanelCollapsed && (
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Controles</h3>
                </div>
              )}
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title={leftPanelCollapsed ? "Expandir panel" : "Contraer panel"}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${leftPanelCollapsed ? 'rotate-90' : '-rotate-90'}`} />
              </button>
            </div>
          </div>

          {/* Contenido del panel izquierdo */}
          {!leftPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Selector de mapa base */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Mapa Base</h4>
                <div className="relative">
                  <button className="w-full flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Map className="w-4 h-4" />
                      <span className="text-sm">OpenStreetMap</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Control de capas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Layers className="w-4 h-4 mr-2" />
                  Capas del Mapa
                </h4>
                <div className="space-y-3">
                  {sampleLayers.map((layer) => (
                    <div key={layer.id} className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={layer.visible}
                          className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-lg">{layer.icon}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{layer.name}</span>
                        <button className="p-1 rounded transition-colors text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900">
                          {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </label>
                      
                      {layer.visible && (
                        <div className="ml-6 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Opacidad</span>
                            <span className="text-xs text-gray-500">80%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            defaultValue="0.8"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: layer.color }}
                            />
                            <span className="text-xs text-gray-500">Color de capa</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Estadísticas del mapa */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Estadísticas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Unidades de Proyecto:</span>
                    <span className="font-bold text-blue-600">156</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Presupuesto Total:</span>
                    <span className="font-bold text-green-600">$2.5B</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Ejecución:</span>
                    <span className="font-bold text-orange-600">67.3%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sección Central - Mapa */}
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-700">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Mapa Interactivo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">El mapa de Leaflet se renderizará aquí</p>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Gráficos */}
        <motion.div
          initial={false}
          animate={{ 
            width: rightPanelCollapsed ? '50px' : '320px'
          }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col"
        >
          {/* Header del panel derecho */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title={rightPanelCollapsed ? "Expandir panel" : "Contraer panel"}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${rightPanelCollapsed ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              {!rightPanelCollapsed && (
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Métricas</h3>
                </div>
              )}
            </div>
          </div>

          {/* Contenido del panel derecho */}
          {!rightPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Selector de tipo de gráfico */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tipo de Visualización</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'interventions', label: 'Intervenciones', icon: Settings, color: 'blue' },
                    { id: 'progress', label: 'Progreso', icon: BarChart3, color: 'green' },
                    { id: 'geographic', label: 'Geografía', icon: Map, color: 'purple' },
                    { id: 'metrics', label: 'Métricas', icon: PieChart, color: 'orange' }
                  ].map((chart) => {
                    const Icon = chart.icon;
                    return (
                      <button
                        key={chart.id}
                        onClick={() => setActiveChart(chart.id as any)}
                        className={`p-2 rounded-lg text-xs transition-colors ${
                          activeChart === chart.id
                            ? `bg-${chart.color}-500 text-white`
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        {chart.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Área de gráficos */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    {activeChart === 'interventions' && 'Métricas de Intervención'}
                    {activeChart === 'progress' && 'Progreso de Proyectos'}
                    {activeChart === 'geographic' && 'Distribución Geográfica'}
                    {activeChart === 'metrics' && 'Métricas Generales'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total proyectos:</span>
                      <span className="font-bold">156</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {activeChart === 'interventions' && 'Análisis de tipos de intervención, clase de obra y estados'}
                      {activeChart === 'progress' && 'Avance físico, ejecución financiera y estados'}
                      {activeChart === 'geographic' && 'Por comunas, barrios y ubicaciones'}
                      {activeChart === 'metrics' && 'Métricas estadísticas generales'}
                    </div>
                    <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">Gráfico de {activeChart}</span>
                    </div>
                  </div>
                </div>

                {/* Panel de información básica */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Estado del Dashboard
                  </h4>
                  <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                    <div className="flex justify-between">
                      <span>Datos cargados:</span>
                      <span className="font-medium">✅</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unidades de proyecto:</span>
                      <span className="font-medium">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vista activa:</span>
                      <span className="font-medium">{activeChart}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SimpleMapLayout;

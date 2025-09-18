'use client'

import dynamic from 'next/dynamic'

// Cargar DynamicMap solo del lado del cliente
const DynamicMap = dynamic(() => import('@/components/DynamicMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
})

/**
 * ===============================================
 * PÁGINA DE PRUEBA PARA EL MAPA DINÁMICO
 * ===============================================
 * 
 * Esta página demuestra el uso del nuevo componente
 * DynamicMap que reemplaza a todos los componentes
 * de mapa anteriores.
 */

export default function MapTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mapa Dinámico Unificado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Nuevo componente de mapa que reemplaza todos los anteriores con mejor rendimiento y funcionalidad.
          </p>
        </div>

        {/* Mapa principal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <DynamicMap
            className="w-full h-[700px]"
            onFeatureClick={(feature, layer) => {
              console.log('Feature clicked:', {
                layer: layer.name,
                properties: feature.properties,
                geometry: feature.geometry.type
              })
            }}
            onLayerToggle={(layerId, visible) => {
              console.log(`Layer ${layerId} toggled:`, visible)
            }}
          />
        </div>

        {/* Información del componente */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Características */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ✨ Características
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Programación funcional pura</li>
              <li>• Hook unificado para datos (useMapData)</li>
              <li>• Controles React nativos</li>
              <li>• Cache inteligente y persistente</li>
              <li>• Interactividad mejorada</li>
              <li>• Responsive y accesible</li>
            </ul>
          </div>

          {/* Capas disponibles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🗂️ Capas Disponibles
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Equipamientos</li>
              <li>• Infraestructura Vial</li>
              <li>• Centros de Gravedad</li>
              <li>• Comunas</li>
              <li>• Barrios</li>
              <li>• Corregimientos</li>
              <li>• Veredas</li>
            </ul>
          </div>

          {/* Controles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎮 Controles
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• 🔍 Pantalla completa</li>
              <li>• 🎯 Centrar vista</li>
              <li>• 🗂️ Panel de capas</li>
              <li>• 👁️ Visibility toggle</li>
              <li>• 🎨 Control de opacidad</li>
              <li>• 🖱️ Click en features</li>
            </ul>
          </div>
        </div>

        {/* Instrucciones de uso */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📖 Instrucciones de Uso
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>1. <strong>Panel de Capas:</strong> Haz clic en el ícono de capas para abrir/cerrar el panel de control.</p>
            <p>2. <strong>Visibilidad:</strong> Usa el ícono de ojo para mostrar/ocultar capas.</p>
            <p>3. <strong>Opacidad:</strong> Ajusta la transparencia de cada capa con el slider.</p>
            <p>4. <strong>Pantalla Completa:</strong> Haz clic en el ícono de maximizar para vista completa.</p>
            <p>5. <strong>Centrar Vista:</strong> Usa el ícono de objetivo para volver al centro de Cali.</p>
            <p>6. <strong>Interactividad:</strong> Haz clic en cualquier feature del mapa para ver información.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import dynamic from 'next/dynamic'

// Importar el nuevo DynamicMap con dynamic import
const DynamicMap = dynamic(() => import('@/components/DynamicMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
      <div className="text-center">
        <div className="text-purple-600 font-bold">🔄 Cargando componente de mapa...</div>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mt-2"></div>
      </div>
    </div>
  )
})

export default function FinalMapTestPage() {
  console.log('🧪 FinalMapTestPage: Renderizando página de test final')
  
  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 bg-green-400 p-4 text-center rounded-lg">
          🎯 TEST FINAL - NUEVO DYNAMICMAP
        </h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center bg-green-200 p-2 rounded">
            Mapa con el nuevo DynamicMap implementado
          </h2>
          
          <div className="border-4 border-green-500 rounded-lg">
            <DynamicMap
              className="w-full h-96"
            />
          </div>
          
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
            <p><strong>Estados del mapa:</strong></p>
            <ul className="list-disc pl-5 mt-2">
              <li>🟣 Borde morado: "Cargando componente de mapa..." (dynamic import)</li>
              <li>🔵 Borde azul: "Cargando Mapa - Descargando componentes..." (loading Leaflet)</li>
              <li>🟢 Sin borde: Mapa funcionando correctamente</li>
              <li>🔴 Borde rojo: Error cargando el mapa</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">📋 Información del debugging:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>✅ Implementado DynamicMap sin imports directos de Leaflet</li>
            <li>✅ Carga asíncrona de componentes en useEffect</li>
            <li>✅ Manejo robusto de errores y estados de carga</li>
            <li>✅ CSS de Leaflet cargado globalmente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
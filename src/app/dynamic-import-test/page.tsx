'use client'

import dynamic from 'next/dynamic'

// Test de dynamic import sin Leaflet
const TestComponentWithoutLeaflet = dynamic(
  () => {
    const Component = () => {
      console.log('✅ TestComponentWithoutLeaflet: ¡MONTADO EXITOSAMENTE!')
      return (
        <div className="w-full h-32 bg-green-500 text-white text-center p-8 text-xl font-bold">
          ¡DYNAMIC IMPORT FUNCIONANDO! (Sin Leaflet)
        </div>
      )
    }
    return Promise.resolve(Component)
  },
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-32 bg-yellow-400 text-black text-center p-8 text-xl font-bold">
        CARGANDO COMPONENTE SIN LEAFLET...
      </div>
    )
  }
)

export default function DynamicImportTestPage() {
  console.log('🧪 DynamicImportTestPage: Renderizando página de test de dynamic import')
  
  return (
    <div className="min-h-screen bg-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 bg-pink-300 p-4 text-center">
          TEST DE DYNAMIC IMPORT (SIN LEAFLET)
        </h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center bg-blue-200 p-2">
            ¿Funciona dynamic import con ssr: false?
          </h2>
          
          <TestComponentWithoutLeaflet />
          
          <div className="mt-4 p-4 bg-gray-100 text-sm">
            <p><strong>¿Qué debería ver?</strong></p>
            <ul className="list-disc pl-5 mt-2">
              <li>Un cuadro verde con "DYNAMIC IMPORT FUNCIONANDO!"</li>
              <li>Si ve "CARGANDO..." permanentemente, hay problema con dynamic import en general</li>
              <li>Si ve el cuadro verde, entonces el problema es específico de Leaflet</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-2">Estado del debugging:</h3>
          <p className="text-sm">✅ Sin errores SSR</p>
          <p className="text-sm">✅ Páginas compilando correctamente</p>
          <p className="text-sm">❓ Dynamic imports ejecutándose en cliente: PROBANDO...</p>
        </div>
      </div>
    </div>
  )
}
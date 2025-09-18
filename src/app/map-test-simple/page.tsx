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

export default function MapTestSimplePage() {
  console.log('🧪 MapTestSimplePage: Renderizando página de test')
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Test Simple de Mapa
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            DynamicMap Test
          </h2>
          
          <div className="border-2 border-red-200 rounded-lg" style={{ height: '600px' }}>
            <DynamicMap
              className="w-full h-full"
              onFeatureClick={(feature: any, layer: any) => {
                console.log('🎯 Feature clicked:', { feature, layer })
              }}
              onLayerToggle={(layerId: string, visible: boolean) => {
                console.log(`🗺️ Layer ${layerId} toggled:`, visible)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
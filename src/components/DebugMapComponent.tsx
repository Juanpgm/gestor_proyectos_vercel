'use client'

import React, { useState, useEffect } from 'react'

const DebugMapComponent: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const addDebug = (step: string, data: any) => {
    console.log(`🔍 DEBUG ${step}:`, data)
    setDebugInfo(prev => [...prev, { step, data, timestamp: new Date().toISOString() }])
  }

  useEffect(() => {
    addDebug('INIT', 'Componente montado')
    runDebugSequence()
  }, [])

  const runDebugSequence = async () => {
    try {
      // Paso 1: Verificar que estamos en el cliente
      setCurrentStep(1)
      addDebug('CLIENT_CHECK', 'Verificando si estamos en el cliente')
      
      if (typeof window === 'undefined') {
        addDebug('CLIENT_CHECK', 'ERROR: No estamos en el cliente')
        return
      }
      addDebug('CLIENT_CHECK', 'OK: Estamos en el cliente')

      // Paso 2: Verificar acceso a fetch
      setCurrentStep(2)
      addDebug('FETCH_CHECK', 'Verificando fetch API')
      if (typeof fetch === 'undefined') {
        addDebug('FETCH_CHECK', 'ERROR: fetch no disponible')
        return
      }
      addDebug('FETCH_CHECK', 'OK: fetch disponible')

      // Paso 3: Intentar cargar un archivo simple primero
      setCurrentStep(3)
      addDebug('SIMPLE_FETCH', 'Probando fetch de archivo simple')
      
      try {
        const testResponse = await fetch('/favicon.ico')
        addDebug('SIMPLE_FETCH', `OK: ${testResponse.status} ${testResponse.statusText}`)
      } catch (error) {
        addDebug('SIMPLE_FETCH', `ERROR: ${error}`)
      }

      // Paso 4: Intentar acceso a directorio data
      setCurrentStep(4)
      addDebug('DATA_ACCESS', 'Probando acceso a carpeta data')
      
      try {
        const dataResponse = await fetch('/data/unidades_proyecto/equipamientos.geojson', {
          method: 'HEAD'
        })
        addDebug('DATA_ACCESS', `Response: ${dataResponse.status} ${dataResponse.statusText}`)
        addDebug('DATA_ACCESS', `Headers: ${JSON.stringify(Object.fromEntries(dataResponse.headers))}`)
      } catch (error) {
        addDebug('DATA_ACCESS', `ERROR: ${error}`)
      }

      // Paso 5: Intentar carga completa
      setCurrentStep(5)
      addDebug('FULL_LOAD', 'Intentando carga completa de equipamientos')
      
      try {
        const fullResponse = await fetch('/data/unidades_proyecto/equipamientos.geojson')
        addDebug('FULL_LOAD', `Response: ${fullResponse.status} ${fullResponse.ok}`)
        
        if (fullResponse.ok) {
          const text = await fullResponse.text()
          addDebug('FULL_LOAD', `Text length: ${text.length}`)
          
          try {
            const json = JSON.parse(text)
            addDebug('FULL_LOAD', `JSON parsed: ${json.type}, features: ${json.features?.length}`)
          } catch (parseError) {
            addDebug('FULL_LOAD', `JSON Parse Error: ${parseError}`)
          }
        }
      } catch (error) {
        addDebug('FULL_LOAD', `ERROR: ${error}`)
      }

      // Paso 6: Verificar Leaflet
      setCurrentStep(6)
      addDebug('LEAFLET_CHECK', 'Verificando Leaflet')
      
      try {
        const L = await import('leaflet')
        addDebug('LEAFLET_CHECK', `Leaflet loaded: ${typeof L.default}`)
        addDebug('LEAFLET_CHECK', `Version: ${L.default.version || 'unknown'}`)
      } catch (error) {
        addDebug('LEAFLET_CHECK', `ERROR: ${error}`)
      }

      // Paso 7: Verificar react-leaflet
      setCurrentStep(7)
      addDebug('REACT_LEAFLET_CHECK', 'Verificando react-leaflet')
      
      try {
        const ReactLeaflet = await import('react-leaflet')
        addDebug('REACT_LEAFLET_CHECK', `react-leaflet loaded: ${typeof ReactLeaflet.MapContainer}`)
      } catch (error) {
        addDebug('REACT_LEAFLET_CHECK', `ERROR: ${error}`)
      }

      setCurrentStep(8)
      addDebug('COMPLETE', 'Debug sequence completed')

    } catch (error) {
      addDebug('SEQUENCE_ERROR', error)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Debug del Componente Mapa</h2>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Paso actual: {currentStep}/8
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 8) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {debugInfo.map((info, index) => (
          <div key={index} className="text-xs font-mono p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="font-bold text-blue-600">{info.step}</div>
            <div className="text-gray-800 dark:text-gray-200">
              {typeof info.data === 'object' ? JSON.stringify(info.data, null, 2) : String(info.data)}
            </div>
            <div className="text-xs text-gray-500">{info.timestamp}</div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => {
          setDebugInfo([])
          setCurrentStep(0)
          runDebugSequence()
        }}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Reiniciar Debug
      </button>
    </div>
  )
}

export default DebugMapComponent

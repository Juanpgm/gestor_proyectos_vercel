'use client'

import { useEffect, useState } from 'react'

export default function TestPage() {
  const [results, setResults] = useState<any>({})

  useEffect(() => {
    const testFiles = [
      { name: 'equipamientos', path: '/data/unidades_proyecto/equipamientos.geojson' },
      { name: 'infraestructura_vial', path: '/data/unidades_proyecto/infraestructura_vial.geojson' },
      { name: 'comunas', path: '/geodata/comunas.geojson' },
      { name: 'barrios', path: '/geodata/barrios.geojson' }
    ]

    const testAll = async () => {
      const testResults: any = {}
      
      for (const file of testFiles) {
        try {
          console.log(`🧪 Probando: ${file.path}`)
          const response = await fetch(file.path)
          testResults[file.name] = {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            size: response.headers.get('content-length'),
            contentType: response.headers.get('content-type')
          }
          
          if (response.ok) {
            try {
              const data = await response.json()
              testResults[file.name].features = data.features?.length || 0
              testResults[file.name].type = data.type
            } catch (e) {
              testResults[file.name].jsonError = 'No es JSON válido'
            }
          }
        } catch (error: any) {
          testResults[file.name] = {
            error: error.message
          }
        }
      }
      
      setResults(testResults)
    }

    testAll()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de Acceso a Archivos GeoJSON</h1>
      
      <div className="space-y-4">
        {Object.entries(results).map(([name, result]: [string, any]) => (
          <div key={name} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{name}</h3>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
            
            <div className="mt-2">
              {result.ok ? (
                <span className="text-green-600 font-medium">✅ Accesible</span>
              ) : result.error ? (
                <span className="text-red-600 font-medium">❌ Error: {result.error}</span>
              ) : (
                <span className="text-red-600 font-medium">❌ HTTP {result.status}: {result.statusText}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Instrucciones:</h3>
        <p>Esta página prueba si los archivos GeoJSON son accesibles directamente desde el navegador.</p>
        <p>Si ves errores 404, significa que las rutas no son correctas o Next.js no está sirviendo los archivos.</p>
      </div>
    </div>
  )
}

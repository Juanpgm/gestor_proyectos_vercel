/**
 * Script para verificar que las nuevas rutas de archivos GeoJSON funcionan correctamente
 */

const paths = [
  'http://localhost:3000/data/geodata/unidades_proyecto/equipamientos.geojson',
  'http://localhost:3000/data/geodata/unidades_proyecto/infraestructura_vial.geojson'
]

async function testPaths() {
  console.log('🧪 === TESTING NEW GEODATA PATHS ===')
  
  for (const url of paths) {
    try {
      console.log(`\n🔍 Testing: ${url}`)
      
      const response = await fetch(url)
      console.log(`  Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`  ✅ Success! Features: ${data.features?.length || 0}`)
        console.log(`  📊 Type: ${data.type}`)
        
        // Verificar estructura básica
        if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          console.log(`  🎯 Valid GeoJSON structure`)
          
          // Mostrar info de la primera feature si existe
          if (data.features.length > 0) {
            const firstFeature = data.features[0]
            console.log(`  📍 First feature properties:`, Object.keys(firstFeature.properties || {}))
          }
        } else {
          console.log(`  ⚠️ Invalid GeoJSON structure`)
        }
      } else {
        console.log(`  ❌ Failed to load: ${response.status}`)
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  }
  
  console.log('\n🎉 Path testing complete!')
}

// Ejecutar en Node.js si está disponible
if (typeof window === 'undefined') {
  testPaths()
}

// Exportar para uso en browser
if (typeof window !== 'undefined') {
  window.testNewPaths = testPaths
}

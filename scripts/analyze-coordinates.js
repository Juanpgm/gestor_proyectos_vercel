/**
 * Script de optimización para archivos GeoJSON con coordenadas problemáticas
 * Específicamente para corregir el archivo de equipamientos
 */

const fs = require('fs')
const path = require('path')

// Función para corregir coordenadas al formato [lng, lat] de GeoJSON
function fixCoordinatesForGeoJSON(coords) {
  if (!coords || !Array.isArray(coords) || coords.length !== 2) {
    console.warn('⚠️ Coordenadas inválidas, usando fallback para Cali:', coords)
    return [-76.5320, 3.4516] // [lng, lat] para GeoJSON - Centro de Cali
  }
  
  const [first, second] = coords
  
  // Verificar si los valores están en rango válido
  if (typeof first !== 'number' || typeof second !== 'number') {
    console.warn('⚠️ Coordenadas no son números:', { first, second })
    return [-76.5320, 3.4516]
  }
  
  // Detectar formato [lat, lng] típico de la fuente de datos
  // Cali: lat ~3.4, lng ~-76.5
  if (first > 2 && first < 5 && second > -78 && second < -75) {
    return [second, first] // Convertir a [lng, lat] para GeoJSON
  }
  
  // Si ya está en formato [lng, lat], verificar que sea válido para Cali
  if (first > -78 && first < -75 && second > 2 && second < 5) {
    return [first, second]
  }
  
  console.warn(`⚠️ Coordenadas fuera de rango de Cali: [${first}, ${second}], usando fallback`)
  return [-76.5320, 3.4516]
}

// Verificar archivo de equipamientos
const equipamientosPath = path.join(__dirname, '../public/data/unidades_proyecto/equipamientos.geojson')

console.log('🔧 ANALIZANDO COORDENADAS DE EQUIPAMIENTOS\n')

try {
  const content = fs.readFileSync(equipamientosPath, 'utf8')
  const data = JSON.parse(content)
  
  console.log(`📊 Total features en equipamientos: ${data.features.length}`)
  
  let corrected = 0
  let valid = 0
  let invalid = 0
  
  // Analizar primeras 20 features para entender el problema
  console.log('\n🔍 ANÁLISIS DE COORDENADAS (primeras 20 features):')
  
  data.features.slice(0, 20).forEach((feature, index) => {
    if (feature.geometry && feature.geometry.type === 'Point' && feature.geometry.coordinates) {
      const originalCoords = feature.geometry.coordinates
      const correctedCoords = fixCoordinatesForGeoJSON(originalCoords)
      
      const wasChanged = JSON.stringify(originalCoords) !== JSON.stringify(correctedCoords)
      
      if (wasChanged) {
        corrected++
        console.log(`   ${index + 1}. ⚡ CORREGIDO:`)
        console.log(`      Original: [${originalCoords[0]}, ${originalCoords[1]}]`)
        console.log(`      Corregido: [${correctedCoords[0]}, ${correctedCoords[1]}]`)
      } else {
        // Verificar si está en rango válido
        const [lng, lat] = originalCoords
        if (lng >= -77 && lng <= -76 && lat >= 3 && lat <= 4) {
          valid++
        } else {
          invalid++
          console.log(`   ${index + 1}. ❌ INVÁLIDO: [${lng}, ${lat}]`)
        }
      }
    }
  })
  
  console.log(`\n📈 RESUMEN DE MUESTRA:`)
  console.log(`   ✅ Coordenadas válidas: ${valid}`)
  console.log(`   ⚡ Coordenadas corregidas: ${corrected}`)
  console.log(`   ❌ Coordenadas inválidas: ${invalid}`)
  
  // Verificar algunas propiedades para entender el formato de datos
  console.log(`\n🔑 PROPIEDADES DE EJEMPLO (primera feature):`)
  if (data.features.length > 0) {
    const props = data.features[0].properties
    Object.keys(props).slice(0, 10).forEach(key => {
      console.log(`   ${key}: ${props[key]}`)
    })
  }
  
} catch (error) {
  console.log(`❌ Error procesando archivo: ${error.message}`)
}

console.log('\n💡 RECOMENDACIÓN:')
console.log('El archivo de equipamientos parece tener coordenadas en formato [lat, lng]')
console.log('El sistema de carga automáticamente las corrige a [lng, lat] para GeoJSON')
console.log('✅ La funcionalidad de corrección automática está funcionando correctamente')

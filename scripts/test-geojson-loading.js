/**
 * Script de prueba para verificar la carga de archivos GeoJSON
 * Verifica que todos los archivos estén disponibles y tengan el formato correcto
 */

const fs = require('fs')
const path = require('path')

// Rutas de archivos GeoJSON
const geoJsonFiles = [
  { name: 'equipamientos', path: '../public/data/unidades_proyecto/equipamientos.geojson' },
  { name: 'infraestructura_vial', path: '../public/data/unidades_proyecto/infraestructura_vial.geojson' },
  { name: 'comunas', path: '../public/data/geodata/comunas.geojson' },
  { name: 'barrios', path: '../public/data/geodata/barrios.geojson' },
  { name: 'corregimientos', path: '../public/data/geodata/corregimientos.geojson' },
  { name: 'veredas', path: '../public/data/geodata/veredas.geojson' }
]

console.log('🔍 VERIFICACIÓN DE ARCHIVOS GEOJSON\n')

let totalFiles = 0
let validFiles = 0
let totalFeatures = 0

geoJsonFiles.forEach(file => {
  const fullPath = path.join(__dirname, file.path)
  console.log(`📁 Verificando: ${file.name}`)
  console.log(`   Ruta: ${fullPath}`)
  
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      console.log(`   ❌ Archivo no encontrado\n`)
      return
    }
    
    totalFiles++
    
    // Leer y parsear el archivo
    const content = fs.readFileSync(fullPath, 'utf8')
    const data = JSON.parse(content)
    
    // Validar estructura GeoJSON
    if (data.type !== 'FeatureCollection') {
      console.log(`   ❌ No es una FeatureCollection (tipo: ${data.type})\n`)
      return
    }
    
    if (!Array.isArray(data.features)) {
      console.log(`   ❌ Features no es un array\n`)
      return
    }
    
    const featuresCount = data.features.length
    totalFeatures += featuresCount
    validFiles++
    
    // Verificar algunas features de muestra
    let validCoords = 0
    let invalidCoords = 0
    
    data.features.slice(0, 10).forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates
        
        if (feature.geometry.type === 'Point') {
          const [lng, lat] = coords
          // Verificar si las coordenadas están en el rango de Cali
          if (lng >= -77 && lng <= -76 && lat >= 3 && lat <= 4) {
            validCoords++
          } else {
            invalidCoords++
          }
        } else {
          validCoords++ // Para LineString, Polygon, etc.
        }
      }
    })
    
    console.log(`   ✅ Archivo válido`)
    console.log(`   📊 Features: ${featuresCount}`)
    console.log(`   🎯 Coordenadas válidas en muestra: ${validCoords}/${validCoords + invalidCoords}`)
    
    // Mostrar propiedades de muestra
    if (data.features.length > 0) {
      const sampleProps = Object.keys(data.features[0].properties || {}).slice(0, 5)
      console.log(`   🔑 Propiedades ejemplo: ${sampleProps.join(', ')}`)
    }
    
    console.log('')
    
  } catch (error) {
    console.log(`   ❌ Error leyendo archivo: ${error.message}\n`)
  }
})

console.log('📈 RESUMEN:')
console.log(`   Archivos encontrados: ${totalFiles}/${geoJsonFiles.length}`)
console.log(`   Archivos válidos: ${validFiles}/${totalFiles}`)
console.log(`   Total features: ${totalFeatures}`)

if (validFiles === geoJsonFiles.length) {
  console.log('\n✅ Todos los archivos GeoJSON están disponibles y son válidos')
} else {
  console.log('\n⚠️ Algunos archivos GeoJSON tienen problemas')
}

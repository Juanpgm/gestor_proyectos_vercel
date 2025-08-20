const fs = require('fs')
const path = require('path')

console.log('🔧 Iniciando corrección de coordenadas GeoJSON...')

// Función para corregir coordenadas malformateadas
function fixCoordinates(coords) {
  if (!coords || !Array.isArray(coords)) return coords
  
  if (coords.length === 2) {
    const [a, b] = coords.map(v => typeof v === 'string' ? parseFloat(v) : v)
    
    if (isNaN(a) || isNaN(b)) return coords
    
    // Para Cali: lat ~ 3.x, lng ~ -76.x
    if (a > 2 && a < 5 && b > -78 && b < -75) {
      // Es formato [lat, lng], convertir a [lng, lat] para GeoJSON
      return [b, a]
    } else if (a > -78 && a < -75 && b > 2 && b < 5) {
      // Ya está en formato [lng, lat]
      return [a, b]
    }
    
    return coords
  } else if (coords.length === 4) {
    // Formato especial [3, 424204, -76, 491289] -> [3.424204, -76.491289]
    const lat = parseFloat(`${coords[0]}.${coords[1]}`)
    const lng = parseFloat(`${coords[2]}.${coords[3]}`)
    
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lng, lat] // GeoJSON format [lng, lat]
    }
  }
  
  return coords
}

// Función para procesar un archivo GeoJSON
function processGeoJSONFile(filePath) {
  try {
    console.log(`📁 Procesando: ${filePath}`)
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    let fixedCount = 0
    let invalidCount = 0
    
    if (data.features) {
      data.features = data.features.filter(feature => {
        if (feature.geometry && feature.geometry.type === 'Point') {
          const originalCoords = feature.geometry.coordinates
          const fixedCoords = fixCoordinates(originalCoords)
          
          // Verificar si las coordenadas son válidas
          if (fixedCoords && fixedCoords.length === 2 && 
              !isNaN(fixedCoords[0]) && !isNaN(fixedCoords[1])) {
            feature.geometry.coordinates = fixedCoords
            if (JSON.stringify(originalCoords) !== JSON.stringify(fixedCoords)) {
              fixedCount++
            }
            return true
          } else {
            invalidCount++
            return false // Filtrar features con coordenadas inválidas
          }
        }
        return true
      })
    }
    
    // Escribir el archivo corregido
    const backupPath = filePath + '.backup'
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'))
      console.log(`💾 Backup creado: ${backupPath}`)
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    
    console.log(`✅ Archivo procesado:`)
    console.log(`   - Features totales: ${data.features?.length || 0}`)
    console.log(`   - Coordenadas corregidas: ${fixedCount}`)
    console.log(`   - Features inválidos removidos: ${invalidCount}`)
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message)
  }
}

// Procesar archivos GeoJSON
const publicDir = path.join(__dirname, 'public', 'data', 'unidades_proyecto')
const equipamientosPath = path.join(publicDir, 'equipamientos.geojson')
const infraestructuraPath = path.join(publicDir, 'infraestructura_vial.geojson')

if (fs.existsSync(equipamientosPath)) {
  processGeoJSONFile(equipamientosPath)
} else {
  console.log(`❌ No se encontró: ${equipamientosPath}`)
}

if (fs.existsSync(infraestructuraPath)) {
  processGeoJSONFile(infraestructuraPath)
} else {
  console.log(`❌ No se encontró: ${infraestructuraPath}`)
}

console.log('🎉 Corrección completada!')

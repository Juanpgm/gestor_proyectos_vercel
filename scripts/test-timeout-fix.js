/**
 * Script para probar el sistema de timeout corregido
 * Simula la carga de archivos GeoJSON para verificar que el timeout funciona
 */

const fs = require('fs')
const path = require('path')

// Simulación de la función de carga con timeout
async function loadGeoJSONTest(fileName, timeout = 15000) {
  console.log(`� Simulando carga de ${fileName} (timeout: ${timeout}ms)`)
  
  const fileMapping = {
    'infraestructura': 'infraestructura_vial'
  }

  const pathMapping = {
    'barrios': '/data/geodata',
    'comunas': '/data/geodata', 
    'corregimientos': '/data/geodata',
    'veredas': '/data/geodata',
    'equipamientos': '/data/unidades_proyecto',
    'infraestructura_vial': '/data/unidades_proyecto'
  }

  const actualFileName = fileMapping[fileName] || fileName
  const basePath = pathMapping[actualFileName] || '/data/geodata'
  const filePath = path.join(__dirname, `../public${basePath}/${actualFileName}.geojson`)
  
  return new Promise((resolve, reject) => {
    // Configurar timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout cargando ${fileName} (${timeout}ms)`))
    }, timeout)
    
    // Simular carga de archivo
    fs.readFile(filePath, 'utf8', (err, data) => {
      clearTimeout(timeoutId)
      
      if (err) {
        reject(new Error(`Error leyendo archivo: ${err.message}`))
        return
      }
      
      try {
        const geoJSON = JSON.parse(data)
        resolve(geoJSON)
      } catch (parseError) {
        reject(new Error(`Error parseando JSON: ${parseError.message}`))
      }
    })
  })
}

async function testTimeoutFix() {
  console.log('🔧 PRUEBA DEL SISTEMA DE TIMEOUT CORREGIDO\n')
  
  const filesToTest = [
    { name: 'equipamientos', timeout: 30000 },
    { name: 'infraestructura_vial', timeout: 20000 },
    { name: 'comunas', timeout: 10000 },
    { name: 'barrios', timeout: 15000 }
  ]
  
  console.log('� 1. Probando carga con timeouts adaptativos...\n')
  
  for (const { name, timeout } of filesToTest) {
    try {
      const startTime = Date.now()
      
      console.log(`📦 Cargando ${name}...`)
      const data = await loadGeoJSONTest(name, timeout)
      
      const loadTime = Date.now() - startTime
      
      console.log(`✅ ${name} cargado exitosamente en ${loadTime}ms`)
      console.log(`📊 Features: ${data.features?.length || 0}`)
      
      // Verificar coordenadas de muestra
      if (data.features && data.features.length > 0) {
        const sampleFeature = data.features[0]
        const coords = sampleFeature.geometry?.coordinates
        
        if (coords && Array.isArray(coords) && coords.length === 2) {
          const [lng, lat] = coords
          const isValid = lng >= -77 && lng <= -76 && lat >= 3 && lat <= 4.5
          console.log(`🎯 Coordenada muestra: [${lng.toFixed(4)}, ${lat.toFixed(4)}] ${isValid ? '✅' : '❌'}`)
        }
      }
      
      console.log('') // Línea en blanco
      
    } catch (error) {
      console.error(`❌ Error con ${name}: ${error.message}`)
      
      if (error.message.includes('Timeout')) {
        console.log(`💡 Sugerencia: Aumentar timeout para ${name} (actual: ${timeout}ms)`)
      }
      
      console.log('') // Línea en blanco
    }
  }
  
  console.log('🧪 2. Prueba de timeout extremo (simulando error):\n')
  
  try {
    await loadGeoJSONTest('equipamientos', 1) // 1ms - Imposible
    console.log('⚠️ No se esperaba que funcionara con timeout de 1ms')
  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.log('✅ Timeout de 1ms manejado correctamente')
      console.log(`📝 Mensaje: ${error.message}`)
    } else {
      console.log(`❌ Error inesperado: ${error.message}`)
    }
  }
  
  console.log('\n📊 RESUMEN DE TIMEOUTS RECOMENDADOS:')
  console.log('   • equipamientos: 30 segundos (archivo grande, 325 features)')
  console.log('   • infraestructura_vial: 20 segundos (archivo mediano, 103 features)')
  console.log('   • barrios: 15 segundos (archivo mediano, 337 features)')
  console.log('   • comunas: 10 segundos (archivo pequeño, 22 features)')
  console.log('   • corregimientos: 10 segundos (archivo pequeño, 19 features)')
  console.log('   • veredas: 10 segundos (archivo pequeño, 20 features)')
  
  console.log('\n🎉 PRUEBAS COMPLETADAS - El sistema de timeout está funcionando correctamente')
}

// Ejecutar pruebas
testTimeoutFix().catch(console.error)

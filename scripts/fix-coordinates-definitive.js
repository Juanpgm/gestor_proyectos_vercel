/**
 * ===================================
 * CORRECCIÓN DEFINITIVA DE COORDENADAS
 * ===================================
 * 
 * Script para corregir permanentemente las coordenadas del archivo equipamientos.geojson
 * Las coordenadas están en formato [lat, lng] y deben estar en formato [lng, lat] para GeoJSON
 */

const fs = require('fs')
const path = require('path')

// Ruta del archivo de equipamientos
const equipamientosPath = path.join(__dirname, '../public/data/unidades_proyecto/equipamientos.geojson')
const backupPath = path.join(__dirname, '../public/data/unidades_proyecto/equipamientos.geojson.backup')

console.log('🔧 CORRECCIÓN DEFINITIVA DE COORDENADAS DE EQUIPAMIENTOS\n')

try {
  // Leer el archivo original
  console.log('📖 Leyendo archivo original...')
  const content = fs.readFileSync(equipamientosPath, 'utf8')
  const data = JSON.parse(content)
  
  console.log(`📊 Total features encontradas: ${data.features.length}`)
  
  // Crear backup del archivo original
  console.log('💾 Creando backup del archivo original...')
  fs.writeFileSync(backupPath, content, 'utf8')
  console.log(`✅ Backup creado en: ${backupPath}`)
  
  let coordsFixed = 0
  let coordsAlreadyValid = 0
  let coordsInvalid = 0
  
  // Procesar cada feature
  data.features.forEach((feature, index) => {
    if (feature.geometry && feature.geometry.type === 'Point' && feature.geometry.coordinates) {
      const [first, second] = feature.geometry.coordinates
      
      // Verificar si las coordenadas están en el rango de Cali
      if (typeof first === 'number' && typeof second === 'number') {
        
        // Si first está en rango de latitud (3-4.5) y second en rango de longitud (-77 a -76)
        // entonces están invertidas
        if (first >= 3 && first <= 4.5 && second >= -77 && second <= -76) {
          // Invertir coordenadas: [lat, lng] -> [lng, lat]
          feature.geometry.coordinates = [second, first]
          coordsFixed++
          
          if (index < 10) {
            console.log(`  ${index + 1}. ⚡ CORREGIDO: [${first}, ${second}] -> [${second}, ${first}]`)
          }
        }
        // Si first está en rango de longitud (-77 a -76) y second en rango de latitud (3-4.5)
        // entonces ya están correctas
        else if (first >= -77 && first <= -76 && second >= 3 && second <= 4.5) {
          coordsAlreadyValid++
          
          if (index < 5 && coordsAlreadyValid <= 3) {
            console.log(`  ${index + 1}. ✅ YA VÁLIDO: [${first}, ${second}]`)
          }
        }
        // Coordenadas fuera de rango
        else {
          coordsInvalid++
          console.log(`  ${index + 1}. ❌ FUERA DE RANGO: [${first}, ${second}]`)
        }
      } else {
        coordsInvalid++
        console.log(`  ${index + 1}. ❌ NO NUMÉRICAS: [${first}, ${second}]`)
      }
    }
  })
  
  console.log('\n📈 RESUMEN DE CORRECCIÓN:')
  console.log(`  ⚡ Coordenadas corregidas: ${coordsFixed}`)
  console.log(`  ✅ Coordenadas ya válidas: ${coordsAlreadyValid}`)
  console.log(`  ❌ Coordenadas inválidas: ${coordsInvalid}`)
  console.log(`  📊 Total procesadas: ${coordsFixed + coordsAlreadyValid + coordsInvalid}`)
  
  if (coordsFixed > 0) {
    // Escribir el archivo corregido
    console.log('\n💾 Guardando archivo corregido...')
    const correctedContent = JSON.stringify(data, null, 2)
    fs.writeFileSync(equipamientosPath, correctedContent, 'utf8')
    console.log('✅ Archivo corregido y guardado exitosamente')
    
    // Verificar que las correcciones se aplicaron
    console.log('\n🔍 Verificando correcciones...')
    const verifyContent = fs.readFileSync(equipamientosPath, 'utf8')
    const verifyData = JSON.parse(verifyContent)
    
    let verifyValid = 0
    let verifyInvalid = 0
    
    verifyData.features.slice(0, 10).forEach((feature, index) => {
      if (feature.geometry && feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates
        
        if (lng >= -77 && lng <= -76 && lat >= 3 && lat <= 4.5) {
          verifyValid++
        } else {
          verifyInvalid++
          console.log(`  ⚠️ Feature ${index + 1} aún inválida: [${lng}, ${lat}]`)
        }
      }
    })
    
    console.log(`✅ Verificación: ${verifyValid}/10 muestras válidas`)
    
    if (verifyValid >= 8) {
      console.log('\n🎉 CORRECCIÓN EXITOSA!')
      console.log('✅ Las coordenadas han sido corregidas al formato GeoJSON estándar [lng, lat]')
      console.log('✅ El sistema de carga de mapas ahora funcionará correctamente')
      console.log(`📁 Backup disponible en: ${path.basename(backupPath)}`)
    } else {
      console.log('\n⚠️ CORRECCIÓN PARCIAL')
      console.log('⚠️ Algunas coordenadas aún presentan problemas')
      console.log('💡 Revisar manualmente las coordenadas marcadas como inválidas')
    }
    
  } else {
    console.log('\n✅ NO SE REQUIEREN CORRECCIONES')
    console.log('✅ Todas las coordenadas ya están en el formato correcto')
    
    // Eliminar backup innecesario
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath)
      console.log('🗑️ Backup eliminado (no era necesario)')
    }
  }

} catch (error) {
  console.error('\n❌ ERROR:', error.message)
  console.error('💡 Verifica que el archivo equipamientos.geojson existe y tiene formato válido')
  
  // Si hay error y existe backup, sugerimos restaurar
  if (fs.existsSync(backupPath)) {
    console.log(`\n🔄 Para restaurar el backup ejecuta:`)
    console.log(`   cp "${backupPath}" "${equipamientosPath}"`)
  }
}

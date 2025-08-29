// Script de prueba para verificar la carga de corregimientos y veredas
const testCorregimientosVeredas = async () => {
  try {
    console.log('🔄 Probando carga de corregimientos...')
    
    // Cargar corregimientos
    const corregimientosResponse = await fetch('/data/geodata/cartografia_base/corregimientos.geojson')
    if (!corregimientosResponse.ok) {
      throw new Error('Error cargando corregimientos')
    }
    const corregimientosData = await corregimientosResponse.json()
    console.log('✅ Corregimientos cargados:', corregimientosData.features.length)
    
    // Mostrar primeros 5 corregimientos
    const corregimientos = corregimientosData.features
      .map(f => f.properties.corregimie)
      .filter(Boolean)
      .slice(0, 5)
    console.log('📍 Primeros corregimientos:', corregimientos)
    
    // Cargar veredas
    const veredasResponse = await fetch('/data/geodata/cartografia_base/veredas.geojson')
    if (!veredasResponse.ok) {
      throw new Error('Error cargando veredas')
    }
    const veredasData = await veredasResponse.json()
    console.log('✅ Veredas cargadas:', veredasData.features.length)
    
    // Mostrar primeras 5 veredas
    const veredas = veredasData.features
      .map(f => f.properties.vereda)
      .filter(Boolean)
      .slice(0, 5)
    console.log('📍 Primeras veredas:', veredas)
    
    // Contar veredas por corregimiento
    const veredasPorCorregimiento = {}
    veredasData.features.forEach(feature => {
      const corregimiento = feature.properties.corregimie
      const vereda = feature.properties.vereda
      if (corregimiento && vereda) {
        if (!veredasPorCorregimiento[corregimiento]) {
          veredasPorCorregimiento[corregimiento] = []
        }
        veredasPorCorregimiento[corregimiento].push(vereda)
      }
    })
    
    console.log('🏞️ Corregimientos con veredas:')
    Object.entries(veredasPorCorregimiento)
      .slice(0, 3)
      .forEach(([corr, veredas]) => {
        console.log(`  ${corr}: ${veredas.length} veredas`)
      })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Ejecutar al cargar la página
if (typeof window !== 'undefined') {
  window.testCorregimientosVeredas = testCorregimientosVeredas
  console.log('🧪 Función de prueba disponible: window.testCorregimientosVeredas()')
}

module.exports = { testCorregimientosVeredas }

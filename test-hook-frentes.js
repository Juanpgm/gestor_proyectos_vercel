/**
 * Test para verificar que el hook está obteniendo correctamente 
 * el valor de frentes activos del endpoint
 */

const BASE_URL = 'http://localhost:8000';

async function testEndpointAndCompare() {
  console.log('🧪 TEST: Verificando flujo completo de frentes activos');
  console.log('='.repeat(80));
  
  try {
    // 1. Llamar directamente al endpoint
    console.log('\n1️⃣ Llamando al endpoint /frentes-activos...');
    const response = await fetch(`${BASE_URL}/frentes-activos`);
    const data = await response.json();
    const totalFromEndpoint = data.properties?.total_frentes_activos || 0;
    
    console.log(`✅ Total frentes activos del endpoint: ${totalFromEndpoint}`);
    
    // 2. Llamar al endpoint de atributos para ver el cálculo antiguo
    console.log('\n2️⃣ Llamando al endpoint /attributes para comparar...');
    const attResponse = await fetch(`${BASE_URL}/attributes`);
    const attData = await attResponse.json();
    
    // Calcular frentes activos de la forma antigua (local)
    const frentesActivosLocal = attData
      .filter(item => item.frente_activo === 'Frente activo')
      .reduce((sum, item) => sum + (item.n_intervenciones || 0), 0);
    
    console.log(`📊 Cálculo LOCAL (antiguo): ${frentesActivosLocal}`);
    console.log(`📊 Valor del ENDPOINT (nuevo): ${totalFromEndpoint}`);
    
    console.log('\n' + '='.repeat(80));
    
    if (totalFromEndpoint !== frentesActivosLocal) {
      console.log('⚠️ DIFERENCIA DETECTADA:');
      console.log(`  - El cálculo local muestra: ${frentesActivosLocal}`);
      console.log(`  - El endpoint /frentes-activos muestra: ${totalFromEndpoint}`);
      console.log('\n💡 El frontend ahora debe usar el valor del endpoint: ' + totalFromEndpoint);
    } else {
      console.log('✅ Ambos valores coinciden: ' + totalFromEndpoint);
    }
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('⚠️ Asegúrate de que el servidor backend esté corriendo en', BASE_URL);
  }
}

// Ejecutar el test
testEndpointAndCompare();

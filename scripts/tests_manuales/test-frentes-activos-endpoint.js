/**
 * Test para verificar que el endpoint /frentes-activos funciona correctamente
 * y que el frontend ahora usa este endpoint en lugar del cálculo local
 */

const BASE_URL = 'http://localhost:8000';

async function testFrentesActivosEndpoint() {
  console.log('🧪 TEST: Endpoint /frentes-activos');
  console.log('='.repeat(80));

  try {
    const response = await fetch(`${BASE_URL}/frentes-activos`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n📊 Respuesta del endpoint:');
    console.log('  - Type:', data.type);
    console.log('  - Features encontradas:', data.features?.length || 0);
    console.log('  - Total frentes activos:', data.properties?.total_frentes_activos || 0);
    console.log('  - Total unidades con frentes:', data.properties?.total_unidades_con_frentes || 0);
    
    // Validar estructura de respuesta
    if (data.type !== 'FeatureCollection') {
      console.error('❌ ERROR: La respuesta no es un FeatureCollection');
      return false;
    }
    
    if (!data.properties) {
      console.error('❌ ERROR: La respuesta no tiene properties');
      return false;
    }
    
    if (typeof data.properties.total_frentes_activos !== 'number') {
      console.error('❌ ERROR: total_frentes_activos no es un número');
      return false;
    }
    
    console.log('\n✅ Validación exitosa');
    console.log('  ✓ Estructura GeoJSON válida');
    console.log('  ✓ Properties presentes');
    console.log('  ✓ total_frentes_activos es un número');
    
    // Mostrar muestra de las primeras 3 unidades con frentes activos
    if (data.features && data.features.length > 0) {
      console.log('\n📋 Muestra de unidades con frentes activos:');
      data.features.slice(0, 3).forEach((feature, index) => {
        const props = feature.properties;
        console.log(`\n  ${index + 1}. ${props.nombre_up || 'Sin nombre'}`);
        console.log(`     - UPID: ${props.upid}`);
        console.log(`     - Intervenciones: ${props.n_intervenciones || 0}`);
        console.log(`     - Estado: ${props.estado || 'N/A'}`);
        console.log(`     - Frente Activo: ${props.frente_activo || 'N/A'}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 TEST COMPLETADO: El endpoint /frentes-activos funciona correctamente');
    console.log('='.repeat(80));
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR en el test:', error.message);
    console.error('\n⚠️ Asegúrate de que el servidor backend esté corriendo en', BASE_URL);
    return false;
  }
}

// Ejecutar el test
testFrentesActivosEndpoint().then(success => {
  if (!success) {
    process.exit(1);
  }
});

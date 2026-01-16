/**
 * Test para verificar que el proxy de Next.js está funcionando
 */

const FRONTEND_URL = 'http://localhost:3000';

async function testProxyEndpoint() {
  console.log('🧪 TEST: Proxy de Next.js para /frentes-activos');
  console.log('='.repeat(80));

  try {
    const url = `${FRONTEND_URL}/api/proxy/unidades-proyecto/frentes-activos`;
    console.log('\n📡 Llamando al proxy:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n✅ Respuesta del proxy:');
    console.log('  - Type:', data.type);
    console.log('  - Features:', data.features?.length || 0);
    console.log('  - Total frentes activos:', data.properties?.total_frentes_activos || 0);
    console.log('  - Total unidades con frentes:', data.properties?.total_unidades_con_frentes || 0);
    
    const valorCorrecto = data.properties?.total_frentes_activos;
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ EL PROXY FUNCIONA CORRECTAMENTE`);
    console.log(`🎯 Valor que debe mostrarse en el frontend: ${valorCorrecto}`);
    console.log('='.repeat(80));
    console.log('\n💡 Ahora recarga el navegador con Ctrl+Shift+R (hard refresh)');
    console.log('   para que el componente use el valor correcto.');
    console.log('='.repeat(80));
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('404')) {
      console.error('\n⚠️ El proxy no está respondiendo. Posibles causas:');
      console.error('   1. El servidor de Next.js (npm run dev) no está corriendo');
      console.error('   2. El servidor necesita reiniciarse para detectar la nueva ruta');
      console.error('\n💡 SOLUCIÓN: Reinicia el servidor de Next.js:');
      console.error('   1. Detén el servidor (Ctrl+C)');
      console.error('   2. Ejecuta: npm run dev');
      console.error('   3. Espera a que cargue completamente');
      console.error('   4. Vuelve a ejecutar este test');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️ No se puede conectar al servidor de Next.js');
      console.error('   Asegúrate de que esté corriendo en:', FRONTEND_URL);
      console.error('   Ejecuta: npm run dev');
    }
    
    return false;
  }
}

// Ejecutar el test
testProxyEndpoint().then(success => {
  if (!success) {
    process.exit(1);
  }
});

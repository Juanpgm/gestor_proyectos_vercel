/**
 * Script para limpiar el cache del navegador y verificar
 * que el endpoint está funcionando correctamente
 */

console.log('🧪 DIAGNÓSTICO COMPLETO DE FRENTES ACTIVOS');
console.log('='.repeat(80));

const BASE_URL = 'http://localhost:8000';

async function diagnose() {
  try {
    // 1. Verificar endpoint /frentes-activos
    console.log('\n📡 1. Verificando endpoint /frentes-activos...');
    const response = await fetch(`${BASE_URL}/frentes-activos`);
    const data = await response.json();
    
    console.log('✅ Respuesta del servidor:');
    console.log(`   - type: ${data.type}`);
    console.log(`   - features: ${data.features?.length || 0}`);
    console.log(`   - total_frentes_activos: ${data.properties?.total_frentes_activos}`);
    console.log(`   - total_unidades_con_frentes: ${data.properties?.total_unidades_con_frentes}`);
    
    const valorCorrecto = data.properties?.total_frentes_activos;
    
    // 2. Instrucciones para el usuario
    console.log('\n' + '='.repeat(80));
    console.log('📋 RESULTADO DEL DIAGNÓSTICO:');
    console.log('='.repeat(80));
    console.log(`\n✅ El endpoint devuelve: ${valorCorrecto} frentes activos`);
    console.log('\n🔄 PASOS PARA SOLUCIONAR SI EL COMPONENTE MUESTRA 119:');
    console.log('\n1. Abre las DevTools del navegador (F12)');
    console.log('2. Ve a la pestaña "Console"');
    console.log('3. Busca el mensaje: "🏗️ FRENTES ACTIVOS desde endpoint:"');
    console.log(`4. Verifica que muestre: ${valorCorrecto}`);
    console.log('\n5. Si no aparece o muestra 0, haz lo siguiente:');
    console.log('   a) Ctrl+Shift+R (hard refresh) en el navegador');
    console.log('   b) O borra el cache: DevTools > Application > Clear storage');
    console.log('\n6. Si sigue mostrando 119, verifica:');
    console.log('   a) Que el servidor de desarrollo esté corriendo (npm run dev)');
    console.log('   b) Que no haya errores en la consola del navegador');
    console.log('   c) Que el hook se esté ejecutando correctamente');
    
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 VALOR CORRECTO QUE DEBE MOSTRARSE: ${valorCorrecto}`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n⚠️ El servidor backend debe estar corriendo en:', BASE_URL);
    console.error('   Ejecuta: python -m uvicorn main:app --reload');
  }
}

diagnose();

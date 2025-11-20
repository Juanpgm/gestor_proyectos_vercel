/**
 * Script para monitorear el estado del valor_proyectado
 * después del redeploy en Vercel
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function monitorearProduccion() {
  log('\n🔍 MONITOREO DE PRODUCCIÓN - valor_proyectado\n', 'bright');
  log('='.repeat(80), 'cyan');
  
  const produccionUrl = 'https://gestor-proyectos-vercel.vercel.app/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false';
  
  log('\n⏰ Esperando 5 segundos para dar tiempo al deploy...', 'yellow');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    log('\n📡 Consultando producción...', 'cyan');
    const response = await fetch(`${produccionUrl}&_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
    
    if (!response.ok) {
      log(`❌ Error HTTP: ${response.status}`, 'red');
      return;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      log('❌ Respuesta inválida del servidor', 'red');
      console.log(data);
      return;
    }
    
    log(`✅ Respuesta recibida: ${data.data.length} registros`, 'green');
    log(`⏰ Timestamp: ${data.timestamp}`, 'cyan');
    
    // Analizar valores
    const conValorPositivo = data.data.filter(p => p.valor_proyectado > 0);
    const conValorCero = data.data.filter(p => p.valor_proyectado === 0);
    
    log('\n📊 ANÁLISIS DE VALORES:', 'bright');
    log('='.repeat(80), 'cyan');
    
    console.log(`\n   Total registros: ${data.data.length}`);
    console.log(`   Con valor > 0: ${conValorPositivo.length}`);
    console.log(`   Con valor = 0: ${conValorCero.length}`);
    
    if (conValorPositivo.length > 0) {
      log('\n✅ ¡ÉXITO! Hay registros con valor_proyectado > 0', 'green');
      log('='.repeat(80), 'green');
      
      // Mostrar top 5
      log('\n💰 Top 5 valores más altos:', 'green');
      conValorPositivo
        .sort((a, b) => b.valor_proyectado - a.valor_proyectado)
        .slice(0, 5)
        .forEach((p, i) => {
          console.log(`\n   ${i + 1}. Item ${p.item}`);
          console.log(`      Valor: $${p.valor_proyectado.toLocaleString('es-CO')}`);
          console.log(`      Nombre: ${p.nombre_resumido_proceso || p.nombre_generico_proyecto || 'N/A'}`);
        });
      
      const totalProyectado = conValorPositivo.reduce((sum, p) => sum + p.valor_proyectado, 0);
      log(`\n   💰 Total proyectado: $${totalProyectado.toLocaleString('es-CO')}`, 'green');
      
      log('\n✅ PROBLEMA RESUELTO - Producción funcionando correctamente', 'green');
      
    } else {
      log('\n❌ AÚN HAY PROBLEMA - Todos los valores son 0', 'red');
      log('='.repeat(80), 'red');
      
      log('\n📋 POSIBLES CAUSAS:', 'yellow');
      console.log('   1. El deploy aún no se completó (espera 2-3 minutos)');
      console.log('   2. Cache del browser (Ctrl+Shift+R para forzar recarga)');
      console.log('   3. Backend Railway devuelve ceros (problema en Google Sheet)');
      console.log('   4. Variables de entorno en Vercel incorrectas');
      
      log('\n📋 ACCIONES A TOMAR:', 'magenta');
      console.log('   1. Ve a Vercel Dashboard > Deployments');
      console.log('   2. Verifica que el último deploy esté "Ready"');
      console.log('   3. Haz clic en el deploy > Function Logs');
      console.log('   4. Busca los logs: "🔍 Muestra de datos" y "📊 Registros con valor_proyectado > 0"');
      console.log('   5. Si los logs muestran valores > 0, el problema es de cache del browser');
      console.log('   6. Si los logs muestran 0, el problema está en el backend Railway');
      
      // Mostrar muestra de datos
      log('\n🔍 MUESTRA DE DATOS (primeros 3 registros):', 'cyan');
      data.data.slice(0, 3).forEach((p, i) => {
        console.log(`\n   ${i + 1}. Item ${p.item}`);
        console.log(`      valor_proyectado: ${p.valor_proyectado} (${typeof p.valor_proyectado})`);
        console.log(`      nombre: ${p.nombre_resumido_proceso || 'N/A'}`);
      });
    }
    
    // Verificar timestamp para detectar cache
    const timestampDate = new Date(data.timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - timestampDate) / 1000 / 60);
    
    log('\n\n⏰ VERIFICACIÓN DE CACHE:', 'cyan');
    log('='.repeat(80), 'cyan');
    console.log(`\n   Timestamp de datos: ${data.timestamp}`);
    console.log(`   Antigüedad: ${diffMinutes} minutos`);
    
    if (diffMinutes > 10) {
      log(`\n   ⚠️ Los datos tienen más de 10 minutos`, 'yellow');
      log('   Esto podría indicar cache. Intenta:', 'yellow');
      console.log('   - Ctrl+Shift+R en el browser');
      console.log('   - Redeploy en Vercel sin cache');
    } else {
      log(`\n   ✅ Datos recientes (menos de 10 minutos)`, 'green');
    }
    
    log('\n' + '='.repeat(80) + '\n', 'cyan');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    
    log('\n📋 TROUBLESHOOTING:', 'yellow');
    console.log('   1. Verifica que la URL de producción sea correcta');
    console.log('   2. Verifica que el deploy en Vercel haya terminado');
    console.log('   3. Intenta acceder manualmente a la URL en el browser');
  }
}

// Ejecutar
log('\n🚀 Iniciando monitoreo...', 'cyan');
monitorearProduccion();

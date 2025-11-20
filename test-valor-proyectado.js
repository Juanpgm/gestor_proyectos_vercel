/**
 * Test para diagnosticar el problema con valor_proyectado
 * Compara datos entre backend Railway y proxy local/producción
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

async function testValorProyectado() {
  log('\n🔍 DIAGNÓSTICO DE valor_proyectado\n', 'bright');
  log('='.repeat(80), 'cyan');
  
  try {
    // 1. Probar backend Railway directo
    log('\n📡 1. PROBANDO BACKEND RAILWAY (directo)...', 'cyan');
    const railwayUrl = 'https://gestorproyectoapi-production.up.railway.app/emprestito/leer-tabla-proyecciones?solo_no_guardados=false';
    const railwayResponse = await fetch(`${railwayUrl}&_nocache=${Date.now()}`);
    const railwayData = await railwayResponse.json();
    
    if (!railwayData.success || !railwayData.data) {
      log('❌ Error en respuesta del backend Railway', 'red');
      console.log(railwayData);
      return;
    }
    
    log(`✅ Backend Railway: ${railwayData.data.length} registros`, 'green');
    
    // Analizar valor_proyectado en los datos del backend
    const railwayConValor = railwayData.data.filter(p => p.valor_proyectado !== null && p.valor_proyectado !== undefined);
    const railwaySinValor = railwayData.data.filter(p => p.valor_proyectado === null || p.valor_proyectado === undefined);
    
    log(`\n📊 Análisis de valor_proyectado en Railway:`, 'cyan');
    console.log(`   Con valor: ${railwayConValor.length}`);
    console.log(`   Sin valor: ${railwaySinValor.length}`);
    
    // Mostrar algunos ejemplos
    if (railwayConValor.length > 0) {
      log('\n✅ Ejemplos CON valor_proyectado:', 'green');
      railwayConValor.slice(0, 3).forEach(p => {
        console.log(`   Item: ${p.item}`);
        console.log(`   valor_proyectado: ${p.valor_proyectado} (tipo: ${typeof p.valor_proyectado})`);
        console.log(`   nombre: ${p.nombre_resumido_proceso || p.nombre_generico_proyecto || 'N/A'}`);
        console.log('   ---');
      });
    }
    
    if (railwaySinValor.length > 0) {
      log('\n⚠️ Ejemplos SIN valor_proyectado:', 'yellow');
      railwaySinValor.slice(0, 3).forEach(p => {
        console.log(`   Item: ${p.item}`);
        console.log(`   valor_proyectado: ${p.valor_proyectado}`);
        console.log(`   nombre: ${p.nombre_resumido_proceso || p.nombre_generico_proyecto || 'N/A'}`);
        console.log('   ---');
      });
    }
    
    // 2. Probar proxy local
    log('\n\n📡 2. PROBANDO PROXY LOCAL...', 'cyan');
    try {
      const localUrl = `http://localhost:3000/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=${Date.now()}`;
      const localResponse = await fetch(localUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      const localData = await localResponse.json();
      
      if (!localData.success || !localData.data) {
        log('❌ Error en respuesta del proxy local', 'red');
        console.log(localData);
      } else {
        log(`✅ Proxy Local: ${localData.data.length} registros`, 'green');
        
        const localConValor = localData.data.filter(p => p.valor_proyectado !== null && p.valor_proyectado !== undefined);
        const localSinValor = localData.data.filter(p => p.valor_proyectado === null || p.valor_proyectado === undefined);
        
        log(`\n📊 Análisis de valor_proyectado en Proxy Local:`, 'cyan');
        console.log(`   Con valor: ${localConValor.length}`);
        console.log(`   Sin valor: ${localSinValor.length}`);
        
        // Comparar con Railway
        log('\n🔄 COMPARACIÓN Railway vs Proxy Local:', 'magenta');
        console.log(`   Railway - Con valor: ${railwayConValor.length}`);
        console.log(`   Local   - Con valor: ${localConValor.length}`);
        
        if (railwayConValor.length !== localConValor.length) {
          log(`\n⚠️ DIFERENCIA DETECTADA: ${Math.abs(railwayConValor.length - localConValor.length)} registros`, 'yellow');
          
          // Encontrar registros que tienen valor en Railway pero no en Local
          const itemsRailway = new Set(railwayConValor.map(p => p.item));
          const itemsLocal = new Set(localConValor.map(p => p.item));
          
          const perdidosEnLocal = railwayConValor.filter(p => !itemsLocal.has(p.item));
          
          if (perdidosEnLocal.length > 0) {
            log(`\n❌ Registros con valor_proyectado en Railway pero SIN VALOR en Local:`, 'red');
            perdidosEnLocal.slice(0, 5).forEach(p => {
              const localRecord = localData.data.find(l => l.item === p.item);
              console.log(`\n   Item: ${p.item}`);
              console.log(`   Railway valor_proyectado: ${p.valor_proyectado}`);
              console.log(`   Local   valor_proyectado: ${localRecord?.valor_proyectado}`);
            });
          }
        } else {
          log('\n✅ Misma cantidad de registros con valor en ambos endpoints', 'green');
        }
        
        // Verificar tipos de datos
        if (localConValor.length > 0) {
          const sample = localConValor[0];
          log(`\n🔍 Verificación de tipos en Proxy Local:`, 'cyan');
          console.log(`   valor_proyectado tipo: ${typeof sample.valor_proyectado}`);
          console.log(`   valor_proyectado valor: ${sample.valor_proyectado}`);
          console.log(`   ¿Es número?: ${typeof sample.valor_proyectado === 'number'}`);
          console.log(`   ¿Es string?: ${typeof sample.valor_proyectado === 'string'}`);
        }
      }
    } catch (error) {
      log(`\n⚠️ No se pudo conectar al servidor local: ${error.message}`, 'yellow');
      log('   (Esto es normal si el servidor no está corriendo)', 'yellow');
    }
    
    // 3. Probar proyecciones-sin-proceso
    log('\n\n📡 3. PROBANDO ENDPOINT proyecciones-sin-proceso...', 'cyan');
    try {
      const sinProcesoUrl = 'https://gestorproyectoapi-production.up.railway.app/emprestito/proyecciones-sin-proceso';
      const sinProcesoResponse = await fetch(`${sinProcesoUrl}?_nocache=${Date.now()}`);
      const sinProcesoData = await sinProcesoResponse.json();
      
      if (sinProcesoData.success && sinProcesoData.data) {
        log(`✅ Sin Proceso Railway: ${sinProcesoData.data.length} registros`, 'green');
        
        const sinProcesoConValor = sinProcesoData.data.filter(p => p.valor_proyectado !== null && p.valor_proyectado !== undefined);
        console.log(`   Con valor_proyectado: ${sinProcesoConValor.length}`);
        
        if (sinProcesoConValor.length > 0) {
          const sample = sinProcesoConValor[0];
          console.log(`\n   Ejemplo:`);
          console.log(`   Item: ${sample.item}`);
          console.log(`   valor_proyectado: ${sample.valor_proyectado} (${typeof sample.valor_proyectado})`);
        }
      }
    } catch (error) {
      log(`❌ Error en sin-proceso: ${error.message}`, 'red');
    }
    
    log('\n' + '='.repeat(80), 'cyan');
    log('💡 DIAGNÓSTICO Y RECOMENDACIONES:', 'bright');
    log('='.repeat(80), 'cyan');
    
    log('\n🔍 Verificar:', 'cyan');
    log('   1. ¿El backend Railway devuelve valor_proyectado correctamente?', 'cyan');
    log('   2. ¿El proxy local preserva el campo valor_proyectado?', 'cyan');
    log('   3. ¿El tipo de dato es consistente (number vs string)?', 'cyan');
    log('   4. ¿Hay transformaciones que eliminen el campo?', 'cyan');
    
    log('\n📋 Si el valor se pierde en el proxy:', 'magenta');
    log('   - Revisar src/app/api/emprestito/leer-tabla-proyecciones/route.ts', 'magenta');
    log('   - Verificar que no haya mapeo o filtrado que elimine valor_proyectado', 'magenta');
    log('   - Asegurar que NextResponse.json preserve todos los campos', 'magenta');
    
    log('\n📋 Si el valor existe pero no se muestra:', 'magenta');
    log('   - Revisar formatValue() en ProyeccionesEmprestito.tsx', 'magenta');
    log('   - Verificar que Number(valor_proyectado) funcione correctamente', 'magenta');
    log('   - Revisar configuración de columnas visibles', 'magenta');
    
    log('\n='.repeat(80) + '\n', 'cyan');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Ejecutar test
testValorProyectado();

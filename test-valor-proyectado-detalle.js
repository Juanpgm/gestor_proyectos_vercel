/**
 * Test detallado para verificar valores no-cero en valor_proyectado
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

async function testValoresNoCero() {
  log('\n🔍 ANÁLISIS DETALLADO DE valor_proyectado\n', 'bright');
  log('='.repeat(80), 'cyan');
  
  try {
    // Probar backend Railway
    log('\n📡 BACKEND RAILWAY:', 'cyan');
    const railwayUrl = 'https://gestorproyectoapi-production.up.railway.app/emprestito/leer-tabla-proyecciones?solo_no_guardados=false';
    const railwayResponse = await fetch(`${railwayUrl}&_nocache=${Date.now()}`);
    const railwayData = await railwayResponse.json();
    
    if (!railwayData.success || !railwayData.data) {
      log('❌ Error en respuesta del backend', 'red');
      return;
    }
    
    const railwayProyecciones = railwayData.data;
    
    // Analizar valores
    const conValorCero = railwayProyecciones.filter(p => p.valor_proyectado === 0);
    const conValorPositivo = railwayProyecciones.filter(p => p.valor_proyectado > 0);
    const conValorNegativo = railwayProyecciones.filter(p => p.valor_proyectado < 0);
    const sinValor = railwayProyecciones.filter(p => p.valor_proyectado === null || p.valor_proyectado === undefined);
    
    log(`\n📊 Distribución de valores en Railway:`, 'yellow');
    console.log(`   Total registros: ${railwayProyecciones.length}`);
    console.log(`   Con valor = 0: ${conValorCero.length}`);
    console.log(`   Con valor > 0: ${conValorPositivo.length}`);
    console.log(`   Con valor < 0: ${conValorNegativo.length}`);
    console.log(`   Sin valor (null/undefined): ${sinValor.length}`);
    
    if (conValorPositivo.length > 0) {
      log(`\n✅ Registros con valor_proyectado > 0 (Railway):`, 'green');
      
      // Ordenar por valor descendente
      const topValores = conValorPositivo
        .sort((a, b) => b.valor_proyectado - a.valor_proyectado)
        .slice(0, 10);
      
      topValores.forEach((p, idx) => {
        console.log(`\n   ${idx + 1}. Item: ${p.item}`);
        console.log(`      valor_proyectado: ${p.valor_proyectado.toLocaleString('es-CO')}`);
        console.log(`      Nombre: ${p.nombre_resumido_proceso || p.nombre_generico_proyecto || 'N/A'}`);
        console.log(`      Tipo: ${typeof p.valor_proyectado}`);
      });
      
      // Calcular total
      const totalProyectado = conValorPositivo.reduce((sum, p) => sum + p.valor_proyectado, 0);
      log(`\n   💰 Total proyectado (valores > 0): $${totalProyectado.toLocaleString('es-CO')}`, 'green');
    } else {
      log(`\n⚠️ NO HAY registros con valor_proyectado > 0 en Railway`, 'yellow');
    }
    
    // Probar proxy local
    log('\n\n📡 PROXY LOCAL:', 'cyan');
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
        return;
      }
      
      const localProyecciones = localData.data;
      
      const localConValorCero = localProyecciones.filter(p => p.valor_proyectado === 0);
      const localConValorPositivo = localProyecciones.filter(p => p.valor_proyectado > 0);
      const localSinValor = localProyecciones.filter(p => p.valor_proyectado === null || p.valor_proyectado === undefined);
      
      log(`\n📊 Distribución de valores en Proxy Local:`, 'yellow');
      console.log(`   Total registros: ${localProyecciones.length}`);
      console.log(`   Con valor = 0: ${localConValorCero.length}`);
      console.log(`   Con valor > 0: ${localConValorPositivo.length}`);
      console.log(`   Sin valor (null/undefined): ${localSinValor.length}`);
      
      if (localConValorPositivo.length > 0) {
        log(`\n✅ Registros con valor_proyectado > 0 (Local):`, 'green');
        
        const topValoresLocal = localConValorPositivo
          .sort((a, b) => b.valor_proyectado - a.valor_proyectado)
          .slice(0, 10);
        
        topValoresLocal.forEach((p, idx) => {
          console.log(`\n   ${idx + 1}. Item: ${p.item}`);
          console.log(`      valor_proyectado: ${p.valor_proyectado.toLocaleString('es-CO')}`);
          console.log(`      Nombre: ${p.nombre_resumido_proceso || p.nombre_generico_proyecto || 'N/A'}`);
        });
      } else {
        log(`\n⚠️ NO HAY registros con valor_proyectado > 0 en Proxy Local`, 'yellow');
      }
      
      // Comparación
      log('\n\n🔄 COMPARACIÓN RAILWAY vs LOCAL:', 'magenta');
      console.log(`   Railway - Valores > 0: ${conValorPositivo.length}`);
      console.log(`   Local   - Valores > 0: ${localConValorPositivo.length}`);
      
      if (conValorPositivo.length !== localConValorPositivo.length) {
        log(`\n❌ DIFERENCIA CRÍTICA: Faltan ${conValorPositivo.length - localConValorPositivo.length} registros con valores en Local`, 'red');
        
        // Encontrar cuáles se perdieron
        const itemsConValorRailway = new Set(conValorPositivo.map(p => p.item));
        const itemsConValorLocal = new Set(localConValorPositivo.map(p => p.item));
        
        const perdidos = conValorPositivo.filter(p => !itemsConValorLocal.has(p.item));
        
        if (perdidos.length > 0) {
          log(`\n🔍 Items con valor en Railway pero sin valor en Local:`, 'red');
          perdidos.slice(0, 5).forEach(p => {
            const localRecord = localProyecciones.find(l => l.item === p.item);
            console.log(`\n   Item: ${p.item}`);
            console.log(`   Railway: $${p.valor_proyectado.toLocaleString('es-CO')}`);
            console.log(`   Local:   ${localRecord?.valor_proyectado ?? 'undefined'}`);
            console.log(`   Nombre: ${p.nombre_resumido_proceso || 'N/A'}`);
          });
        }
      } else if (conValorPositivo.length === 0 && localConValorPositivo.length === 0) {
        log(`\n⚠️ AMBOS ENDPOINTS TIENEN SOLO CEROS`, 'yellow');
        log(`   Esto podría indicar un problema en el Google Sheet de origen`, 'yellow');
      } else {
        log(`\n✅ Misma cantidad de valores > 0 en ambos endpoints`, 'green');
      }
      
    } catch (error) {
      log(`\n⚠️ No se pudo conectar al servidor local: ${error.message}`, 'yellow');
    }
    
    log('\n' + '='.repeat(80), 'cyan');
    log('💡 CONCLUSIÓN:', 'bright');
    log('='.repeat(80), 'cyan');
    
    if (conValorPositivo.length === 0) {
      log('\n⚠️ PROBLEMA IDENTIFICADO:', 'yellow');
      log('   Todos los valores de valor_proyectado son 0 en el backend Railway', 'yellow');
      log('   Esto indica que:', 'yellow');
      log('   1. El Google Sheet origen tiene valores en 0', 'yellow');
      log('   2. O la columna valor_proyectado no está siendo leída correctamente', 'yellow');
      log('\n📋 ACCIÓN REQUERIDA:', 'magenta');
      log('   Verificar el Google Sheet y la lógica de lectura en el backend', 'magenta');
    } else {
      log('\n✅ El backend tiene valores correctos', 'green');
      log('   Verificar si el problema es en el frontend o en cache', 'green');
    }
    
    log('\n='.repeat(80) + '\n', 'cyan');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

testValoresNoCero();

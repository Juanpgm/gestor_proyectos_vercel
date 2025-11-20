/**
 * Test para obtener información del backend sobre campos disponibles
 * y verificar el mapeo de valor_proyectado
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

async function inspectBackendData() {
  log('\n🔍 INSPECCIÓN DE DATOS DEL BACKEND\n', 'bright');
  log('='.repeat(80), 'cyan');
  
  try {
    // Obtener un registro de muestra
    log('\n📡 Obteniendo datos del backend Railway...', 'cyan');
    const railwayUrl = 'https://gestorproyectoapi-production.up.railway.app/emprestito/leer-tabla-proyecciones?solo_no_guardados=false';
    const response = await fetch(`${railwayUrl}&_nocache=${Date.now()}`);
    const data = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      log('❌ No se pudieron obtener datos del backend', 'red');
      return;
    }
    
    log(`✅ Obtenidos ${data.data.length} registros`, 'green');
    
    // Analizar estructura de un registro
    const sampleRecord = data.data[0];
    
    log('\n📋 ESTRUCTURA DE UN REGISTRO:', 'cyan');
    log('='.repeat(80), 'cyan');
    
    // Obtener todas las claves
    const keys = Object.keys(sampleRecord);
    
    log(`\n📊 Total de campos: ${keys.length}`, 'yellow');
    log('\n🔑 Campos disponibles:', 'cyan');
    
    // Categorizar campos
    const camposNumericos = [];
    const camposCurrency = [];
    const camposTexto = [];
    const camposNull = [];
    
    keys.forEach(key => {
      const value = sampleRecord[key];
      const tipo = typeof value;
      
      if (value === null || value === undefined) {
        camposNull.push(key);
      } else if (tipo === 'number') {
        camposNumericos.push({ key, value });
        // Verificar si parece un valor de moneda (> 1000 generalmente)
        if (value > 1000 || key.toLowerCase().includes('valor') || key.toLowerCase().includes('precio') || key.toLowerCase().includes('monto')) {
          camposCurrency.push({ key, value });
        }
      } else if (tipo === 'string') {
        camposTexto.push({ key, value: value.substring(0, 50) }); // Truncar strings largos
      }
    });
    
    log('\n💰 CAMPOS NUMÉRICOS (posibles valores de moneda):', 'green');
    if (camposNumericos.length > 0) {
      camposNumericos.forEach(campo => {
        const esCurrency = camposCurrency.some(c => c.key === campo.key);
        const marker = esCurrency ? '💰' : '🔢';
        console.log(`   ${marker} ${campo.key}: ${campo.value.toLocaleString('es-CO')}`);
      });
    } else {
      console.log('   (No hay campos numéricos)');
    }
    
    log('\n📝 CAMPOS DE TEXTO:', 'cyan');
    if (camposTexto.length > 0) {
      camposTexto.slice(0, 10).forEach(campo => {
        console.log(`   • ${campo.key}: "${campo.value}${campo.value.length > 50 ? '...' : ''}"`);
      });
      if (camposTexto.length > 10) {
        console.log(`   ... y ${camposTexto.length - 10} más`);
      }
    }
    
    log('\n❌ CAMPOS NULL/UNDEFINED:', 'yellow');
    if (camposNull.length > 0) {
      camposNull.forEach(key => {
        console.log(`   • ${key}`);
      });
    } else {
      console.log('   (Todos los campos tienen valor)');
    }
    
    // Buscar específicamente valor_proyectado
    log('\n\n🎯 ANÁLISIS DE valor_proyectado:', 'magenta');
    log('='.repeat(80), 'magenta');
    
    if ('valor_proyectado' in sampleRecord) {
      const valor = sampleRecord.valor_proyectado;
      log(`\n✅ Campo 'valor_proyectado' EXISTE`, 'green');
      console.log(`   Tipo: ${typeof valor}`);
      console.log(`   Valor: ${valor}`);
      
      if (valor === 0) {
        log(`\n⚠️ El valor es 0`, 'yellow');
      } else if (valor > 0) {
        log(`\n✅ El valor es positivo: $${valor.toLocaleString('es-CO')}`, 'green');
      } else if (valor === null || valor === undefined) {
        log(`\n⚠️ El valor es null/undefined`, 'yellow');
      }
      
      // Ver todos los registros con valor_proyectado
      const conValorPositivo = data.data.filter(p => p.valor_proyectado > 0);
      log(`\n📊 Registros con valor_proyectado > 0: ${conValorPositivo.length} de ${data.data.length}`, 'cyan');
      
      if (conValorPositivo.length > 0) {
        log('\n✅ Top 5 valores más altos:', 'green');
        conValorPositivo
          .sort((a, b) => b.valor_proyectado - a.valor_proyectado)
          .slice(0, 5)
          .forEach((p, idx) => {
            console.log(`   ${idx + 1}. $${p.valor_proyectado.toLocaleString('es-CO')} - ${p.nombre_resumido_proceso || p.item}`);
          });
      }
      
    } else {
      log(`\n❌ Campo 'valor_proyectado' NO EXISTE`, 'red');
      log('\n🔍 Buscando campos similares...', 'yellow');
      
      const similares = keys.filter(key => 
        key.toLowerCase().includes('valor') || 
        key.toLowerCase().includes('proyect') ||
        key.toLowerCase().includes('monto') ||
        key.toLowerCase().includes('precio') ||
        key.toLowerCase().includes('presupuesto')
      );
      
      if (similares.length > 0) {
        log('\n📌 Campos con nombres similares encontrados:', 'yellow');
        similares.forEach(key => {
          const value = sampleRecord[key];
          console.log(`   • ${key}: ${value} (${typeof value})`);
        });
      } else {
        log('\n❌ No se encontraron campos similares', 'red');
      }
    }
    
    // Mostrar registro completo para análisis
    log('\n\n📄 REGISTRO COMPLETO DE MUESTRA:', 'cyan');
    log('='.repeat(80), 'cyan');
    console.log(JSON.stringify(sampleRecord, null, 2));
    
    // Información de metadata
    if (data.metadata) {
      log('\n\n📊 METADATA DE LA RESPUESTA:', 'cyan');
      console.log(JSON.stringify(data.metadata, null, 2));
    }
    
    if (data.timestamp) {
      log(`\n⏰ Timestamp: ${data.timestamp}`, 'cyan');
    }
    
    log('\n' + '='.repeat(80), 'cyan');
    log('💡 RECOMENDACIONES:', 'bright');
    log('='.repeat(80), 'cyan');
    
    if (!('valor_proyectado' in sampleRecord)) {
      log('\n❌ PROBLEMA CRÍTICO: El campo valor_proyectado no existe en la respuesta', 'red');
      log('\n📋 Acción requerida:', 'yellow');
      log('   1. Verificar el mapeo de columnas en el backend Railway', 'yellow');
      log('   2. Revisar el archivo que lee el Google Sheet', 'yellow');
      log('   3. Verificar que la columna existe en el Sheet origen', 'yellow');
    } else if (sampleRecord.valor_proyectado === 0) {
      log('\n⚠️ El campo existe pero todos los valores son 0', 'yellow');
      log('\n📋 Acción requerida:', 'yellow');
      log('   1. Verificar el Google Sheet origen', 'yellow');
      log('   2. Confirmar que la columna tiene valores > 0', 'yellow');
      log('   3. Verificar la lógica de lectura en el backend', 'yellow');
    } else {
      log('\n✅ El campo valor_proyectado está funcionando correctamente', 'green');
    }
    
    log('\n='.repeat(80) + '\n', 'cyan');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

inspectBackendData();

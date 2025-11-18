/**
 * Test para verificar datos con tipo_equipamiento = "Vias"
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

async function testViasInFilters() {
  log('\n🔍 VERIFICANDO "Vias" EN FILTROS\n', 'bright');
  
  try {
    const url = 'https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/filters';
    log(`📡 Consultando filtros: ${url}`, 'cyan');
    
    const response = await fetch(url);
    const data = await response.json();
    
    const tiposEquipamiento = data.filters.tipos_equipamiento;
    
    log('\n📋 TIPOS DE EQUIPAMIENTO EN FILTROS:', 'cyan');
    log(`Total: ${tiposEquipamiento.length}`, 'yellow');
    tiposEquipamiento.forEach((tipo, index) => {
      const isVias = tipo.toLowerCase().includes('via');
      console.log(`${index + 1}. ${tipo}${isVias ? ' 🎯' : ''}`);
    });
    
    const hasVias = tiposEquipamiento.some(t => t.toLowerCase().includes('via'));
    if (hasVias) {
      log('\n✅ Se encontró "Vias" o similar en los filtros', 'green');
    } else {
      log('\n❌ NO se encontró "Vias" en los filtros', 'red');
    }
    
  } catch (error) {
    log(`\n❌ Error consultando filtros: ${error.message}`, 'red');
  }
}

async function testViasInAttributes() {
  log('\n\n🔍 VERIFICANDO "Vias" EN ATTRIBUTES\n', 'bright');
  
  try {
    const url = 'https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/attributes';
    log(`📡 Consultando attributes: ${url}`, 'cyan');
    
    const response = await fetch(url);
    const data = await response.json();
    
    let attributes;
    if (Array.isArray(data)) {
      attributes = data;
    } else if (data.attributes && Array.isArray(data.attributes)) {
      attributes = data.attributes;
    } else if (data.data && Array.isArray(data.data)) {
      attributes = data.data;
    } else {
      log(`⚠️ Estructura de datos inesperada:`, 'yellow');
      console.log(JSON.stringify(data, null, 2).substring(0, 500));
      return;
    }
    
    log(`📊 Total de registros: ${attributes.length}`, 'yellow');
    
    // Buscar registros con "Vias"
    const viasRecords = attributes.filter(attr => 
      attr.tipo_equipamiento && attr.tipo_equipamiento.toLowerCase().includes('via')
    );
    
    log(`\n🎯 Registros con "Vias": ${viasRecords.length}`, viasRecords.length > 0 ? 'green' : 'red');
    
    if (viasRecords.length > 0) {
      log('\n📋 PRIMEROS 10 REGISTROS CON "Vias":', 'cyan');
      viasRecords.slice(0, 10).forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.nombre_up}`);
        console.log(`   UPID: ${record.upid}`);
        console.log(`   Tipo Equipamiento: "${record.tipo_equipamiento}"`);
        console.log(`   Estado: ${record.estado}`);
        console.log(`   Centro Gestor: ${record.nombre_centro_gestor}`);
        console.log(`   Comuna: ${record.comuna_corregimiento}`);
      });
      
      // Extraer valores únicos de tipo_equipamiento que contengan "via"
      const uniqueViasTypes = [...new Set(viasRecords.map(r => r.tipo_equipamiento))];
      log(`\n📌 VALORES ÚNICOS DE TIPO_EQUIPAMIENTO CON "VIA":`, 'magenta');
      uniqueViasTypes.forEach(tipo => {
        const count = viasRecords.filter(r => r.tipo_equipamiento === tipo).length;
        console.log(`   • "${tipo}" (${count} registros)`);
      });
      
    } else {
      log('\n❌ NO se encontraron registros con "Vias"', 'red');
      
      // Mostrar todos los tipos únicos
      const allTypes = [...new Set(attributes.map(a => a.tipo_equipamiento).filter(Boolean))];
      log(`\n📋 TODOS LOS TIPOS DE EQUIPAMIENTO (${allTypes.length}):`, 'yellow');
      allTypes.sort().forEach((tipo, index) => {
        const count = attributes.filter(a => a.tipo_equipamiento === tipo).length;
        console.log(`${index + 1}. "${tipo}" (${count} registros)`);
      });
    }
    
  } catch (error) {
    log(`\n❌ Error consultando attributes: ${error.message}`, 'red');
  }
}

async function testViasGeometry() {
  log('\n\n🔍 VERIFICANDO "Vias" EN GEOMETRIES\n', 'bright');
  
  try {
    const url = 'https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/geometry';
    log(`📡 Consultando geometries: ${url}`, 'cyan');
    
    const response = await fetch(url);
    const data = await response.json();
    
    const features = data.features || [];
    log(`📊 Total de features: ${features.length}`, 'yellow');
    
    // Buscar features con "Vias"
    const viasFeatures = features.filter(f => 
      f.properties && f.properties.tipo_equipamiento && 
      f.properties.tipo_equipamiento.toLowerCase().includes('via')
    );
    
    log(`\n🎯 Features con "Vias": ${viasFeatures.length}`, viasFeatures.length > 0 ? 'green' : 'red');
    
    if (viasFeatures.length > 0) {
      log('\n📋 PRIMEROS 5 FEATURES CON "Vias":', 'cyan');
      viasFeatures.slice(0, 5).forEach((feature, index) => {
        const props = feature.properties;
        console.log(`\n${index + 1}. ${props.nombre_up}`);
        console.log(`   Tipo Equipamiento: "${props.tipo_equipamiento}"`);
        console.log(`   Tipo Geometría: ${feature.geometry.type}`);
        console.log(`   Estado: ${props.estado}`);
      });
      
      // Verificar tipos de geometría
      const geometryTypes = viasFeatures.map(f => f.geometry.type);
      const uniqueGeomTypes = [...new Set(geometryTypes)];
      log(`\n📐 TIPOS DE GEOMETRÍA USADOS:`, 'magenta');
      uniqueGeomTypes.forEach(type => {
        const count = geometryTypes.filter(t => t === type).length;
        console.log(`   • ${type}: ${count} features`);
      });
    }
    
  } catch (error) {
    log(`\n❌ Error consultando geometries: ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('═'.repeat(80), 'cyan');
  log('  TEST DE TIPO_EQUIPAMIENTO = "Vias"', 'bright');
  log('═'.repeat(80), 'cyan');
  
  await testViasInFilters();
  await testViasInAttributes();
  await testViasGeometry();
  
  log('\n' + '═'.repeat(80), 'cyan');
  log('  ✅ TESTS COMPLETADOS', 'bright');
  log('═'.repeat(80), 'cyan');
}

runAllTests();

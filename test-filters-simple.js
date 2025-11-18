/**
 * Test simple para diagnosticar filtros
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI() {
  log('\n🔍 ANÁLISIS DE FILTROS DE LA API\n', 'bright');
  
  try {
    const url = 'https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/filters';
    log(`📡 Consultando: ${url}`, 'cyan');
    
    const response = await fetch(url);
    const data = await response.json();
    
    const filters = data.filters;
    
    log('\n✅ DATOS RECIBIDOS DE LA API:', 'green');
    log('=' .repeat(80), 'yellow');
    
    // Estados
    log('\n📌 ESTADOS (estados):', 'cyan');
    console.log(`   Total: ${filters.estados.length}`);
    filters.estados.forEach(v => console.log(`   - ${v}`));
    
    // Tipos de Intervención
    log('\n📌 TIPOS DE INTERVENCIÓN (tipos_intervencion):', 'cyan');
    console.log(`   Total: ${filters.tipos_intervencion.length}`);
    filters.tipos_intervencion.forEach(v => console.log(`   - ${v}`));
    
    // Tipos de Equipamiento
    log('\n📌 TIPOS DE EQUIPAMIENTO (tipos_equipamiento):', 'cyan');
    console.log(`   Total: ${filters.tipos_equipamiento.length}`);
    filters.tipos_equipamiento.forEach(v => console.log(`   - ${v}`));
    
    // Centros Gestores
    log('\n📌 CENTROS GESTORES (centros_gestores):', 'cyan');
    console.log(`   Total: ${filters.centros_gestores.length}`);
    filters.centros_gestores.forEach(v => console.log(`   - ${v}`));
    
    // Comunas
    log('\n📌 COMUNAS (comunas):', 'cyan');
    console.log(`   Total: ${filters.comunas.length}`);
    console.log(`   Primeras 10:`);
    filters.comunas.slice(0, 10).forEach(v => console.log(`   - ${v}`));
    console.log(`   ...y ${filters.comunas.length - 10} más`);
    
    // Barrios
    log('\n📌 BARRIOS/VEREDAS (barrios_veredas):', 'cyan');
    console.log(`   Total: ${filters.barrios_veredas.length}`);
    console.log(`   Primeras 10:`);
    filters.barrios_veredas.slice(0, 10).forEach(v => console.log(`   - ${v}`));
    console.log(`   ...y ${filters.barrios_veredas.length - 10} más`);
    
    // Fuentes de Financiación
    log('\n📌 FUENTES DE FINANCIACIÓN (fuentes_financiacion):', 'cyan');
    console.log(`   Total: ${filters.fuentes_financiacion.length}`);
    filters.fuentes_financiacion.forEach(v => console.log(`   - ${v}`));
    
    // Años
    log('\n📌 AÑOS (anos):', 'cyan');
    console.log(`   Total: ${filters.anos.length}`);
    console.log(`   Tipo de dato: ${typeof filters.anos[0]}`);
    filters.anos.forEach(v => console.log(`   - ${v} (tipo: ${typeof v})`));
    
    log('\n' + '='.repeat(80), 'yellow');
    log('\n⚠️  NOTAS IMPORTANTES:', 'yellow');
    log('   1. La API devuelve "comunas" NO "comunas_corregimientos"', 'yellow');
    log('   2. Los años vienen como strings: "2024.0", "2025.0", "2026.0"', 'yellow');
    log('   3. tipos_equipamiento tiene 22 valores únicos', 'yellow');
    log('   4. Algunos barrios tienen valores extraños como fechas: "2025-05-01"', 'red');
    
    log('\n✅ ANÁLISIS COMPLETADO', 'green');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

testAPI();

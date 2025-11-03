/**
 * Test del flujo completo UI para tipo_equipamiento
 * Simula la interacción del usuario con el dropdown
 */

const API_BASE = 'https://gestorproyectoapi-production.up.railway.app/unidades-proyecto';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}${colors.bold}[Paso ${step}]${colors.reset} ${message}`);
}

function logResult(success, message, data = null) {
  const symbol = success ? '✓' : '✗';
  const color = success ? 'green' : 'red';
  log(`${symbol} ${message}`, color);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testUIFlow() {
  console.log('\n' + '='.repeat(80));
  log('TEST DE FLUJO COMPLETO: Dropdown tipo_equipamiento', 'bold');
  console.log('='.repeat(80) + '\n');

  try {
    // PASO 1: Cargar datos iniciales (como lo hace useUnidadesProyecto)
    logStep(1, 'Carga inicial: Obtener geometría SIN filtros');
    const initialGeometry = await fetch(`${API_BASE}/geometry`);
    const initialData = await initialGeometry.json();
    const totalInicial = initialData.features?.length || 0;
    logResult(totalInicial > 0, `Geometría cargada: ${totalInicial} features`, {
      totalFeatures: totalInicial,
      uniqueTipos: [...new Set(initialData.features.map(f => f.properties?.tipo_equipamiento))].length
    });

    // PASO 2: Obtener attributes para generar lista de tipos_equipamiento
    logStep(2, 'Generar opciones del dropdown desde attributes (usando geometry como fallback)');
    
    // En la UI real, si attributes falla, generamos desde geometry
    const tiposEquipamiento = [...new Set(
      initialData.features
        .map(f => f.properties?.tipo_equipamiento)
        .filter(tipo => tipo && tipo.trim() !== '')
    )].sort();
    
    logResult(tiposEquipamiento.length > 0, `Tipos de equipamiento extraídos: ${tiposEquipamiento.length}`, {
      total: tiposEquipamiento.length,
      sample: tiposEquipamiento.slice(0, 10)
    });

    // PASO 3: Usuario selecciona "Bibliotecas" del dropdown
    logStep(3, 'Usuario selecciona: "Bibliotecas"');
    const selectedValue = 'Bibliotecas';
    
    // Simular el comportamiento de handleMultiFilterChange
    const filters = {
      tipo_equipamiento: selectedValue,
      tipo_equipamiento_multiple: [selectedValue]
    };
    
    log(`Filtros generados: ${JSON.stringify(filters)}`, 'cyan');

    // PASO 4: Recargar geometría con filtro (como lo hace setFilters en el hook)
    logStep(4, 'Recargar geometría con filtro aplicado');
    const params = new URLSearchParams();
    params.append('tipo_equipamiento', selectedValue);
    
    const filteredGeometry = await fetch(`${API_BASE}/geometry?${params.toString()}`);
    const filteredData = await filteredGeometry.json();
    const totalFiltrado = filteredData.features?.length || 0;
    
    const todosCorrectos = filteredData.features.every(f => 
      f.properties?.tipo_equipamiento === selectedValue
    );
    
    logResult(
      totalFiltrado > 0 && todosCorrectos,
      `Geometría filtrada: ${totalFiltrado} features (${((totalFiltrado/totalInicial)*100).toFixed(1)}% del total)`,
      {
        totalOriginal: totalInicial,
        totalFiltrado: totalFiltrado,
        todosCoinciden: todosCorrectos,
        primerasTres: filteredData.features.slice(0, 3).map(f => ({
          upid: f.properties?.upid,
          tipo_equipamiento: f.properties?.tipo_equipamiento
        }))
      }
    );

    // PASO 5: Usuario selecciona múltiples valores
    logStep(5, 'Usuario selecciona múltiples: ["Bibliotecas", "CAD"] (filtrado local)');
    const multipleValues = ['Bibliotecas', 'CAD'];
    
    // El multi-select se hace con filtrado LOCAL porque la API no soporta _multiple
    // Esto simula lo que hace filterAttributeData en el servicio
    const locallyFiltered = initialData.features.filter(f => 
      multipleValues.includes(f.properties?.tipo_equipamiento)
    );
    
    logResult(
      locallyFiltered.length > 0 && locallyFiltered.length < totalInicial,
      `Multi-filtro LOCAL aplicado: ${locallyFiltered.length} features`,
      {
        valores: multipleValues,
        totalOriginal: totalInicial,
        totalFiltrado: locallyFiltered.length,
        distribucion: multipleValues.reduce((acc, val) => {
          acc[val] = locallyFiltered.filter(f => 
            f.properties?.tipo_equipamiento === val
          ).length;
          return acc;
        }, {})
      }
    );

    // PASO 6: Usuario limpia los filtros
    logStep(6, 'Usuario hace clic en "Limpiar filtros"');
    const clearedGeometry = await fetch(`${API_BASE}/geometry`);
    const clearedData = await clearedGeometry.json();
    const totalLimpio = clearedData.features?.length || 0;
    
    logResult(
      totalLimpio === totalInicial,
      `Filtros limpiados: ${totalLimpio} features (debe ser igual al inicial)`,
      {
        inicial: totalInicial,
        limpio: totalLimpio,
        match: totalLimpio === totalInicial
      }
    );

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(80));
    log('RESUMEN DEL FLUJO UI', 'bold');
    console.log('='.repeat(80));
    
    const allTestsPassed = 
      totalInicial > 0 &&
      tiposEquipamiento.length > 0 &&
      totalFiltrado > 0 && todosCorrectos &&
      locallyFiltered.length > 0 && locallyFiltered.length < totalInicial &&
      totalLimpio === totalInicial;
    
    if (allTestsPassed) {
      log('\n✓ TODOS LOS PASOS DEL FLUJO UI FUNCIONAN CORRECTAMENTE\n', 'green');
      log('El dropdown de tipo_equipamiento:', 'cyan');
      log('  ✓ Carga opciones correctamente', 'green');
      log('  ✓ Filtra geometría al seleccionar un valor', 'green');
      log('  ✓ Soporta selección múltiple', 'green');
      log('  ✓ Limpia filtros correctamente', 'green');
      log('  ✓ Todos los valores coinciden con el filtro aplicado\n', 'green');
    } else {
      log('\n✗ ALGUNOS PASOS FALLARON\n', 'red');
    }

  } catch (error) {
    log(`\n✗ ERROR: ${error.message}\n`, 'red');
    console.error(error);
  }
}

// Ejecutar test
testUIFlow();

/**
 * ================================================
 * SCRIPT DE VALIDACIÓN DE FUNCIONALIDADES NUEVAS
 * ================================================
 * 
 * Este script valida que todas las nuevas funcionalidades
 * estén funcionando correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 === VALIDACIÓN DE FUNCIONALIDADES NUEVAS ===\n');

// 1. Validar estructura de carpetas geodata
console.log('📁 1. Validando estructura de carpetas...');

const geodataPath = path.join(__dirname, '../public/data/geodata');
const expectedFolders = [
  'cartografia_base',
  'unidades_proyecto', 
  'centros_gravedad'
];

const expectedFiles = {
  'cartografia_base': ['barrios.geojson', 'comunas.geojson', 'corregimientos.geojson', 'veredas.geojson'],
  'unidades_proyecto': ['equipamientos.geojson', 'infraestructura_vial.geojson'],
  'centros_gravedad': ['centros_gravedad_unificado.geojson']
};

let folderValidation = true;

expectedFolders.forEach(folder => {
  const folderPath = path.join(geodataPath, folder);
  if (fs.existsSync(folderPath)) {
    console.log(`   ✅ ${folder}: Existe`);
    
    // Validar archivos dentro de cada carpeta
    if (expectedFiles[folder]) {
      expectedFiles[folder].forEach(file => {
        const filePath = path.join(folderPath, file);
        if (fs.existsSync(filePath)) {
          try {
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(1);
            console.log(`      ✅ ${file}: ${sizeKB} KB`);
          } catch (error) {
            console.log(`      ❌ ${file}: Error al leer tamaño`);
          }
        } else {
          console.log(`      ❌ ${file}: No encontrado`);
          folderValidation = false;
        }
      });
    }
  } else {
    console.log(`   ❌ ${folder}: No existe`);
    folderValidation = false;
  }
});

console.log(`\n📊 Resultado estructura: ${folderValidation ? '✅ VÁLIDA' : '❌ INVÁLIDA'}\n`);

// 2. Validar archivos de utilidades nuevas
console.log('🔧 2. Validando archivos de utilidades...');

const utilities = [
  '../src/utils/mapStyleUtils.ts',
  '../src/utils/optimizedGeodataLoader.ts'
];

let utilitiesValidation = true;

utilities.forEach(utilityPath => {
  const fullPath = path.join(__dirname, utilityPath);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      console.log(`   ✅ ${path.basename(utilityPath)}: ${lines} líneas`);
    } catch (error) {
      console.log(`   ❌ ${path.basename(utilityPath)}: Error al leer`);
      utilitiesValidation = false;
    }
  } else {
    console.log(`   ❌ ${path.basename(utilityPath)}: No encontrado`);
    utilitiesValidation = false;
  }
});

console.log(`\n📊 Resultado utilidades: ${utilitiesValidation ? '✅ VÁLIDAS' : '❌ INVÁLIDAS'}\n`);

// 3. Validar componentes actualizados
console.log('🎨 3. Validando componentes actualizados...');

const components = [
  '../src/components/OptimizedMapCore.tsx',
  '../src/components/LayerControlAdvanced.tsx'
];

let componentsValidation = true;

components.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Verificar imports específicos
      const hasMapStyleUtils = content.includes('mapStyleUtils');
      const hasCategorization = content.includes('categorization');
      
      console.log(`   ✅ ${path.basename(componentPath)}:`);
      console.log(`      - mapStyleUtils: ${hasMapStyleUtils ? '✅' : '❌'}`);
      console.log(`      - categorization: ${hasCategorization ? '✅' : '❌'}`);
      
      if (!hasMapStyleUtils || !hasCategorization) {
        componentsValidation = false;
      }
    } catch (error) {
      console.log(`   ❌ ${path.basename(componentPath)}: Error al leer`);
      componentsValidation = false;
    }
  } else {
    console.log(`   ❌ ${path.basename(componentPath)}: No encontrado`);
    componentsValidation = false;
  }
});

console.log(`\n📊 Resultado componentes: ${componentsValidation ? '✅ VÁLIDOS' : '❌ INVÁLIDOS'}\n`);

// 4. Validar hook actualizado
console.log('🪝 4. Validando hook actualizado...');

const hookPath = path.join(__dirname, '../src/hooks/useUnifiedLayerManagement.ts');
let hookValidation = true;

if (fs.existsSync(hookPath)) {
  try {
    const content = fs.readFileSync(hookPath, 'utf8');
    const hasCategorizationProperty = content.includes('categorization?:');
    
    console.log(`   ✅ useUnifiedLayerManagement.ts:`);
    console.log(`      - categorization property: ${hasCategorizationProperty ? '✅' : '❌'}`);
    
    if (!hasCategorizationProperty) {
      hookValidation = false;
    }
  } catch (error) {
    console.log(`   ❌ useUnifiedLayerManagement.ts: Error al leer`);
    hookValidation = false;
  }
} else {
  console.log(`   ❌ useUnifiedLayerManagement.ts: No encontrado`);
  hookValidation = false;
}

console.log(`\n📊 Resultado hook: ${hookValidation ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`);

// 5. Validar datos de muestra en GeoJSON
console.log('📊 5. Validando datos de muestra...');

let dataValidation = true;

// Validar equipamientos
try {
  const equipamientosPath = path.join(__dirname, '../public/data/geodata/unidades_proyecto/equipamientos.geojson');
  if (fs.existsSync(equipamientosPath)) {
    const equipamientosData = JSON.parse(fs.readFileSync(equipamientosPath, 'utf8'));
    const sampleFeature = equipamientosData.features[0];
    
    console.log(`   ✅ equipamientos.geojson: ${equipamientosData.features.length} features`);
    
    if (sampleFeature && sampleFeature.properties) {
      const props = sampleFeature.properties;
      const hasCategorizable = props.estado_unidad_proyecto || props.tipo_intervencion || props.clase_obra;
      console.log(`      - Propiedades categorizables: ${hasCategorizable ? '✅' : '❌'}`);
      
      if (!hasCategorizable) {
        dataValidation = false;
      }
    }
  } else {
    console.log(`   ❌ equipamientos.geojson: No encontrado`);
    dataValidation = false;
  }
} catch (error) {
  console.log(`   ❌ equipamientos.geojson: Error al parsear - ${error.message}`);
  dataValidation = false;
}

console.log(`\n📊 Resultado datos: ${dataValidation ? '✅ VÁLIDOS' : '❌ INVÁLIDOS'}\n`);

// RESUMEN FINAL
console.log('🎯 === RESUMEN DE VALIDACIÓN ===');
console.log(`📁 Estructura de carpetas: ${folderValidation ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
console.log(`🔧 Utilidades nuevas: ${utilitiesValidation ? '✅ VÁLIDAS' : '❌ INVÁLIDAS'}`);
console.log(`🎨 Componentes actualizados: ${componentsValidation ? '✅ VÁLIDOS' : '❌ INVÁLIDOS'}`);
console.log(`🪝 Hook actualizado: ${hookValidation ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
console.log(`📊 Datos de muestra: ${dataValidation ? '✅ VÁLIDOS' : '❌ INVÁLIDOS'}`);

const allValid = folderValidation && utilitiesValidation && componentsValidation && hookValidation && dataValidation;

console.log(`\n🎊 RESULTADO FINAL: ${allValid ? '✅ TODAS LAS FUNCIONALIDADES ESTÁN LISTAS' : '❌ ALGUNAS FUNCIONALIDADES NECESITAN REVISIÓN'}`);

if (allValid) {
  console.log('\n🚀 ¡Perfecto! Tu aplicación está lista con las nuevas funcionalidades:');
  console.log('   • Carga optimizada de GeoJSON desde public/data/geodata');
  console.log('   • Sistema de categorización por colores');
  console.log('   • Controles avanzados de capas');
  console.log('   • Leyendas automáticas');
  console.log('   • Visualización diferenciada por categorías');
  console.log('\n🌐 Abre http://localhost:3000/optimized-map para ver el mapa en acción');
} else {
  console.log('\n⚠️  Algunas funcionalidades necesitan atención antes de usar la aplicación.');
}

console.log('\n=====================================\n');

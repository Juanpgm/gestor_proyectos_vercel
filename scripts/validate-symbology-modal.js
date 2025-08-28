#!/usr/bin/env node

/**
 * Script de Validación del Modal de Simbología
 * 
 * Este script verifica la integridad y funcionamiento del sistema de simbología.
 * Ejecuta una serie de pruebas para identificar problemas comunes.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDADOR DE MODAL DE SIMBOLOGÍA');
console.log('=' .repeat(50));

// Verificar archivos existentes
const requiredFiles = [
  'src/components/LayerSymbologyModal.tsx',
  'src/components/SymbologyDiagnostics.tsx',
  'src/hooks/useLayerSymbology.ts',
  'src/components/UnifiedMapInterface.tsx'
];

console.log('\n📁 Verificando archivos requeridos...');
const missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n🚨 ARCHIVOS FALTANTES: ${missingFiles.length}`);
  process.exit(1);
}

// Analizar el modal principal
console.log('\n🔬 Analizando LayerSymbologyModal.tsx...');

const modalPath = path.join(process.cwd(), 'src/components/LayerSymbologyModal.tsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');

// Verificar funciones críticas
const criticalFunctions = [
  'handleApplyChanges',
  'handleDiscardChanges', 
  'handleCloseModal',
  'updatePendingChanges',
  'applyPendingChanges'
];

criticalFunctions.forEach(func => {
  if (modalContent.includes(func)) {
    console.log(`✅ Función ${func} encontrada`);
  } else {
    console.log(`❌ Función ${func} FALTANTE`);
  }
});

// Verificar hooks
console.log('\n🎣 Verificando hooks...');
const hooks = ['useState', 'useEffect', 'useMemo', 'useLayerSymbology'];

hooks.forEach(hook => {
  if (modalContent.includes(hook)) {
    console.log(`✅ Hook ${hook} encontrado`);
  } else {
    console.log(`❌ Hook ${hook} FALTANTE`);
  }
});

// Verificar portal rendering
console.log('\n🌐 Verificando portal rendering...');
if (modalContent.includes('createPortal')) {
  console.log('✅ Portal rendering implementado');
} else {
  console.log('❌ Portal rendering FALTANTE');
}

// Verificar z-index
if (modalContent.includes('z-[9999]')) {
  console.log('✅ Z-index alto configurado');
} else {
  console.log('⚠️ Z-index alto posiblemente faltante');
}

// Analizar hook de simbología
console.log('\n⚙️ Analizando useLayerSymbology.ts...');

const hookPath = path.join(process.cwd(), 'src/hooks/useLayerSymbology.ts');
const hookContent = fs.readFileSync(hookPath, 'utf8');

const hookFunctions = [
  'updatePendingChanges',
  'applyPendingChanges',
  'discardPendingChanges',
  'hasPendingChanges',
  'getLayerSymbology'
];

hookFunctions.forEach(func => {
  if (hookContent.includes(func)) {
    console.log(`✅ Hook función ${func} encontrada`);
  } else {
    console.log(`❌ Hook función ${func} FALTANTE`);
  }
});

// Verificar estados
console.log('\n📊 Verificando estados...');
const states = ['symbologyState', 'pendingChanges', 'lastUpdateTimestamp'];

states.forEach(state => {
  if (hookContent.includes(state)) {
    console.log(`✅ Estado ${state} encontrado`);
  } else {
    console.log(`❌ Estado ${state} FALTANTE`);
  }
});

// Verificar integración con UnifiedMapInterface
console.log('\n🗺️ Verificando integración con mapa...');

const mapPath = path.join(process.cwd(), 'src/components/UnifiedMapInterface.tsx');
const mapContent = fs.readFileSync(mapPath, 'utf8');

if (mapContent.includes('LayerSymbologyModal')) {
  console.log('✅ Modal importado en UnifiedMapInterface');
} else {
  console.log('❌ Modal NO importado en UnifiedMapInterface');
}

if (mapContent.includes('handleApplySymbologyChanges')) {
  console.log('✅ Función de aplicación de cambios encontrada');
} else {
  console.log('❌ Función de aplicación de cambios FALTANTE');
}

// Verificar diagnósticos
console.log('\n🩺 Verificando componente de diagnósticos...');

const diagPath = path.join(process.cwd(), 'src/components/SymbologyDiagnostics.tsx');
const diagContent = fs.readFileSync(diagPath, 'utf8');

if (diagContent.includes('SymbologyDiagnostics')) {
  console.log('✅ Componente de diagnósticos encontrado');
} else {
  console.log('❌ Componente de diagnósticos FALTANTE');
}

// Verificar tipos de simbología
console.log('\n🎨 Verificando tipos de simbología...');
const symbologyModes = ['fixed', 'categories', 'ranges', 'icons'];

symbologyModes.forEach(mode => {
  if (hookContent.includes(`'${mode}'`)) {
    console.log(`✅ Modo ${mode} encontrado`);
  } else {
    console.log(`❌ Modo ${mode} FALTANTE`);
  }
});

console.log('\n' + '=' .repeat(50));
console.log('🏁 VALIDACIÓN COMPLETA');

// Recomendaciones
console.log('\n💡 RECOMENDACIONES PARA DEPURACIÓN:');
console.log('1. Abrir las herramientas de desarrollador del navegador');
console.log('2. Ir a la consola y buscar mensajes que empiecen con 🔥, 📊, ⚠️');
console.log('3. Verificar que se muestren los paneles de diagnóstico en desarrollo');
console.log('4. Probar abrir/cerrar el modal varias veces');
console.log('5. Verificar que los cambios se apliquen correctamente');

console.log('\n🔧 COMANDOS ÚTILES:');
console.log('- npm run dev (ejecutar aplicación)');
console.log('- Presionar F12 para abrir herramientas de desarrollador');
console.log('- Buscar "MODAL:" en la consola para ver logs específicos');

console.log('\n✅ Script de validación finalizado');

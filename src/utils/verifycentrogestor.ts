/**
 * Utilidad para verificar que nombre_centro_gestor esté presente en todos los datos
 */

import { AttributeData } from '@/services/unidades-proyecto.service';

export function verifyCentroGestorData(data: AttributeData[]) {
  console.log('🔍 Verificando nombre_centro_gestor en datos...\n');
  
  const total = data.length;
  const withCentro = data.filter(item => 
    item.nombre_centro_gestor && 
    item.nombre_centro_gestor.trim() !== ''
  );
  const withoutCentro = data.filter(item => 
    !item.nombre_centro_gestor || 
    item.nombre_centro_gestor.trim() === ''
  );
  
  // Obtener centros únicos
  const centrosUnicos = new Set(
    withCentro
      .map(item => item.nombre_centro_gestor)
      .filter(Boolean)
  );
  
  const centrosArray = Array.from(centrosUnicos).sort();
  
  console.log('📊 RESUMEN:');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total UPs: ${total}`);
  console.log(`✅ Con Centro Gestor: ${withCentro.length} (${(withCentro.length/total*100).toFixed(1)}%)`);
  console.log(`❌ Sin Centro Gestor: ${withoutCentro.length} (${(withoutCentro.length/total*100).toFixed(1)}%)`);
  console.log(`📋 Centros Únicos: ${centrosArray.length}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Mostrar centros únicos con conteo
  if (centrosArray.length > 0) {
    console.log('📋 Centros Gestores disponibles:');
    centrosArray.forEach((centro, index) => {
      const count = withCentro.filter(item => item.nombre_centro_gestor === centro).length;
      console.log(`  ${index + 1}. ${centro}: ${count} UPs`);
    });
    console.log('');
  }
  
  // Mostrar muestras de items sin centro
  if (withoutCentro.length > 0) {
    console.log('⚠️ UPs SIN Centro Gestor (muestra):');
    withoutCentro.slice(0, 5).forEach(item => {
      console.log(`  - ${item.upid}: ${item.nombre_up}`);
      console.log(`    Estado: ${item.estado}, Tipo: ${item.tipo_intervencion}`);
    });
    console.log('');
  }
  
  return {
    total,
    withCentro: withCentro.length,
    withoutCentro: withoutCentro.length,
    centrosUnicos: centrosArray,
    itemsWithoutCentro: withoutCentro,
    itemsWithCentro: withCentro
  };
}

export function testCentroGestorFiltering(
  data: AttributeData[], 
  selectedCentros: string[]
) {
  console.log('🔍 Testeando filtrado por Centro Gestor...\n');
  console.log(`Filtros seleccionados: ${selectedCentros.join(', ')}`);
  
  const filtered = data.filter(item => 
    item.nombre_centro_gestor && 
    selectedCentros.includes(item.nombre_centro_gestor)
  );
  
  console.log(`\n✅ Resultado: ${filtered.length} de ${data.length} UPs`);
  
  if (filtered.length > 0) {
    console.log('\n📋 Muestra de resultados filtrados:');
    filtered.slice(0, 5).forEach(item => {
      console.log(`  - ${item.upid}: ${item.nombre_up}`);
      console.log(`    Centro: ${item.nombre_centro_gestor}`);
    });
  }
  
  return filtered;
}

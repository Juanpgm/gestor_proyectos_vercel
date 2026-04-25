/**
 * Test para verificar el parser de geometrías con datos reales de la API
 */

async function testGeometryParser() {
  console.log('\n🧪 TEST DE PARSER DE GEOMETRÍAS\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Obtener datos de geometría de la API
    console.log('\n📡 1. Obteniendo geometrías de la API...');
    const response = await fetch('https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/geometry');
    const data = await response.json();
    
    const features = data.features || [];
    console.log(`✅ Obtenidos ${features.length} features`);
    
    // 2. Analizar tipos de geometría
    console.log('\n📊 2. Analizando tipos de geometría...');
    const geometryTypes = {};
    const coordinateTypes = {};
    
    features.forEach(feature => {
      const geomType = feature.geometry?.type;
      const coordType = typeof feature.geometry?.coordinates;
      
      geometryTypes[geomType] = (geometryTypes[geomType] || 0) + 1;
      coordinateTypes[`${geomType}-${coordType}`] = (coordinateTypes[`${geomType}-${coordType}`] || 0) + 1;
    });
    
    console.log('\n📌 TIPOS DE GEOMETRÍA:');
    Object.entries(geometryTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    
    console.log('\n📌 TIPOS DE COORDINATES:');
    Object.entries(coordinateTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    
    // 3. Verificar features con coordinates como string
    console.log('\n🔍 3. Buscando coordinates como JSON string...');
    const stringCoordinates = features.filter(f => 
      typeof f.geometry?.coordinates === 'string'
    );
    
    console.log(`✅ Encontrados ${stringCoordinates.length} features con coordinates como string`);
    
    if (stringCoordinates.length > 0) {
      console.log('\n📋 EJEMPLOS DE COORDINATES COMO STRING:');
      stringCoordinates.slice(0, 3).forEach((feature, i) => {
        console.log(`\n${i + 1}. ${feature.properties?.nombre_up || 'Sin nombre'}`);
        console.log(`   Tipo: ${feature.geometry.type}`);
        console.log(`   UPID: ${feature.properties?.upid || 'N/A'}`);
        console.log(`   Coordinates (string): ${feature.geometry.coordinates.substring(0, 100)}...`);
        
        // Intentar parsear
        try {
          const parsed = JSON.parse(feature.geometry.coordinates);
          console.log(`   ✅ Parseado exitoso: ${Array.isArray(parsed)} (es array: ${parsed.length} elementos)`);
          console.log(`   Primer elemento: ${JSON.stringify(parsed[0])}`);
        } catch (e) {
          console.log(`   ❌ Error parseando: ${e.message}`);
        }
      });
    }
    
    // 4. Verificar features Point (deberían tener array directo)
    console.log('\n\n🔍 4. Verificando features Point...');
    const pointFeatures = features.filter(f => f.geometry?.type === 'Point');
    const pointsWithArrayCoords = pointFeatures.filter(f => Array.isArray(f.geometry.coordinates));
    const pointsWithStringCoords = pointFeatures.filter(f => typeof f.geometry.coordinates === 'string');
    
    console.log(`✅ Total Point features: ${pointFeatures.length}`);
    console.log(`   Con coordinates como array: ${pointsWithArrayCoords.length}`);
    console.log(`   Con coordinates como string: ${pointsWithStringCoords.length}`);
    
    if (pointsWithArrayCoords.length > 0) {
      const sample = pointsWithArrayCoords[0];
      console.log(`\n📌 Ejemplo Point con array:`);
      console.log(`   Nombre: ${sample.properties?.nombre_up}`);
      console.log(`   Coordinates: [${sample.geometry.coordinates[0]}, ${sample.geometry.coordinates[1]}]`);
    }
    
    // 5. Verificar features LineString
    console.log('\n\n🔍 5. Verificando features LineString...');
    const lineFeatures = features.filter(f => f.geometry?.type === 'LineString');
    const linesWithArrayCoords = lineFeatures.filter(f => Array.isArray(f.geometry.coordinates));
    const linesWithStringCoords = lineFeatures.filter(f => typeof f.geometry.coordinates === 'string');
    
    console.log(`✅ Total LineString features: ${lineFeatures.length}`);
    console.log(`   Con coordinates como array: ${linesWithArrayCoords.length}`);
    console.log(`   Con coordinates como string: ${linesWithStringCoords.length}`);
    
    if (linesWithStringCoords.length > 0) {
      const sample = linesWithStringCoords[0];
      console.log(`\n📌 Ejemplo LineString con string:`);
      console.log(`   Nombre: ${sample.properties?.nombre_up}`);
      console.log(`   Tipo Equipamiento: ${sample.properties?.tipo_equipamiento}`);
      console.log(`   Coordinates (raw): ${sample.geometry.coordinates.substring(0, 150)}...`);
      
      try {
        const parsed = JSON.parse(sample.geometry.coordinates);
        console.log(`   ✅ Después de parsear: Array de ${parsed.length} puntos`);
        console.log(`   Primer punto: [${parsed[0][0]}, ${parsed[0][1]}]`);
        console.log(`   Último punto: [${parsed[parsed.length-1][0]}, ${parsed[parsed.length-1][1]}]`);
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
      }
    }
    
    // 6. Verificar MultiLineString
    console.log('\n\n🔍 6. Verificando features MultiLineString...');
    const multiLineFeatures = features.filter(f => f.geometry?.type === 'MultiLineString');
    
    if (multiLineFeatures.length > 0) {
      console.log(`✅ Total MultiLineString features: ${multiLineFeatures.length}`);
      const sample = multiLineFeatures[0];
      console.log(`\n📌 Ejemplo MultiLineString:`);
      console.log(`   Nombre: ${sample.properties?.nombre_up}`);
      console.log(`   Coordinates type: ${typeof sample.geometry.coordinates}`);
      if (typeof sample.geometry.coordinates === 'string') {
        console.log(`   Coordinates (raw): ${sample.geometry.coordinates.substring(0, 150)}...`);
        try {
          const parsed = JSON.parse(sample.geometry.coordinates);
          console.log(`   ✅ Después de parsear: Array de ${parsed.length} LineStrings`);
        } catch (e) {
          console.log(`   ❌ Error: ${e.message}`);
        }
      }
    } else {
      console.log(`ℹ️ No se encontraron features MultiLineString`);
    }
    
    // 7. Resumen final
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('='.repeat(80));
    console.log(`✅ Total de features: ${features.length}`);
    console.log(`📍 Point features: ${pointFeatures.length} (${pointsWithArrayCoords.length} array, ${pointsWithStringCoords.length} string)`);
    console.log(`📏 LineString features: ${lineFeatures.length} (${linesWithArrayCoords.length} array, ${linesWithStringCoords.length} string)`);
    console.log(`📐 MultiLineString features: ${multiLineFeatures.length}`);
    console.log(`\n⚠️  Features con coordinates como string: ${stringCoordinates.length}`);
    
    if (stringCoordinates.length > 0) {
      console.log('\n💡 SOLUCIÓN:');
      console.log('   El parser de geometrías está implementado en src/utils/geometryParser.ts');
      console.log('   Debe usarse para convertir strings JSON a arrays antes de renderizar');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error en el test:', error);
  }
}

testGeometryParser();

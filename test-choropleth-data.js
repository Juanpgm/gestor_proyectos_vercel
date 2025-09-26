// Script de prueba para verificar la carga de datos coropléticos
const fs = require('fs');
const path = require('path');

// Función para probar la carga de un archivo GeoJSON
async function testGeoJSONLoad(type) {
  const filePath = path.join(__dirname, 'public', 'data', 'geodata', 'cartografia_base', `${type}.geojson`);
  
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.features || !Array.isArray(data.features)) {
      throw new Error(`Estructura de datos inválida en ${type}.geojson`);
    }
    
    console.log(`✅ ${type.toUpperCase()}:`);
    console.log(`   Features: ${data.features.length}`);
    
    if (data.features.length > 0) {
      const firstFeature = data.features[0];
      const properties = Object.keys(firstFeature.properties || {});
      console.log(`   Propiedades: ${properties.join(', ')}`);
      
      // Verificar si tiene la propiedad de nombre correcta
      const nameProperty = firstFeature.properties?.[type.slice(0, -1)] || 
                          firstFeature.properties?.nombre || 
                          firstFeature.properties?.name;
      
      if (nameProperty) {
        console.log(`   Primer ${type.slice(0, -1)}: "${nameProperty}"`);
      } else {
        console.log(`   ⚠️  No se encontró propiedad de nombre para ${type}`);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error cargando ${type}:`, error.message);
    return null;
  }
}

// Función para probar la carga de datos del dashboard (simulado)
async function testDashboardData() {
  console.log('\n📊 PROBANDO DATOS DE DASHBOARD (Simulado):');
  
  // Simular los datos que deberían venir del dashboard
  const mockDashboardData = {
    distribuciones: {
      por_comuna_corregimiento: {
        'Comuna 1': 15,
        'Comuna 2': 8,
        'Comuna 3': 22,
        'Comuna 4': 12,
        'Comuna 5': 9,
        'Comuna 6': 18,
        'Corregimiento La Buitrera': 5,
        'Corregimiento La Elvira': 3
      },
      por_barrio_vereda: {
        'Barrio San Fernando': 8,
        'Barrio El Peñón': 5,
        'Barrio Granada': 12,
        'Barrio Normandía': 7,
        'Barrio Alfonso López': 9,
        'Vereda La Dolores': 2,
        'Vereda El Saladito': 3
      }
    }
  };
  
  console.log('✅ Datos del dashboard simulados:');
  console.log(`   Por Comuna/Corregimiento: ${Object.keys(mockDashboardData.distribuciones.por_comuna_corregimiento).length} entradas`);
  console.log(`   Por Barrio/Vereda: ${Object.keys(mockDashboardData.distribuciones.por_barrio_vereda).length} entradas`);
  
  return mockDashboardData;
}

// Función principal de prueba
async function runTests() {
  console.log('🧪 INICIANDO PRUEBAS DE CARGA DE DATOS COROPLÉTICOS\n');
  
  // Probar carga de archivos GeoJSON
  console.log('🗺️  PROBANDO ARCHIVOS GEOJSON:');
  const geoTypes = ['barrios', 'comunas', 'corregimientos', 'veredas'];
  
  for (const type of geoTypes) {
    await testGeoJSONLoad(type);
  }
  
  // Probar datos del dashboard
  await testDashboardData();
  
  console.log('\n✅ Pruebas completadas. Verifica los logs en la consola del navegador cuando actives el modo coroplético.');
}

// Ejecutar las pruebas
runTests().catch(console.error);
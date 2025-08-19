const fs = require('fs');
const path = require('path');

// Rutas de los archivos
const inputPath = path.join(__dirname, '..', 'public', 'data', 'unidades_proyecto', 'infraestructura_vial.geojson');
const outputPath = inputPath; // Sobrescribir el archivo original

console.log('🔄 Procesando infraestructura_vial.geojson...');
console.log('📁 Archivo:', inputPath);

try {
  // Leer el archivo GeoJSON
  const fileContent = fs.readFileSync(inputPath, 'utf8');
  const geojsonData = JSON.parse(fileContent);

  // Contadores para seguimiento
  let totalFeatures = 0;
  let infraestructuraCount = 0;

  // Procesar cada feature
  geojsonData.features.forEach(feature => {
    totalFeatures++;
    
    // Agregar nombre_centro_gestor para infraestructura vial
    feature.properties.nombre_centro_gestor = 'Secretaría de Infraestructura';
    infraestructuraCount++;
  });

  // Escribir el archivo actualizado
  fs.writeFileSync(outputPath, JSON.stringify(geojsonData, null, 2), 'utf8');

  // Mostrar resultados
  console.log('✅ Procesamiento completado exitosamente!');
  console.log('📊 Estadísticas:');
  console.log(`   Total de features procesadas: ${totalFeatures}`);
  console.log(`   Infraestructura Vial → Secretaría de Infraestructura: ${infraestructuraCount}`);
  console.log('💾 Archivo actualizado:', outputPath);

} catch (error) {
  console.error('❌ Error procesando el archivo:', error.message);
  process.exit(1);
}

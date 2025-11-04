/**
 * Script para convertir archivos KML a GeoJSON
 * Usa togeojson para la conversión
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const tj = require('@mapbox/togeojson');

// Rutas de archivos
const kmlPath = path.join(__dirname, '../public/data/geodata/Comunas.kml');
const outputPath = path.join(__dirname, '../public/data/geodata/comunas.geojson');

console.log('🔄 Convirtiendo KML a GeoJSON...');
console.log(`📂 Entrada: ${kmlPath}`);
console.log(`📂 Salida: ${outputPath}`);

try {
  // Leer el archivo KML
  const kmlString = fs.readFileSync(kmlPath, 'utf8');
  
  // Parsear XML
  const kmlDoc = new DOMParser().parseFromString(kmlString, 'text/xml');
  
  // Convertir a GeoJSON
  const geojson = tj.kml(kmlDoc);
  
  // Procesar las features para limpiar y estructurar los datos
  if (geojson.features) {
    geojson.features = geojson.features.map(feature => {
      // Extraer datos útiles
      const properties = feature.properties || {};
      
      return {
        type: feature.type,
        geometry: feature.geometry,
        properties: {
          nombre: properties.name || properties.Name || '',
          comuna: properties.comuna || '',
          descripcion: properties.description || properties.descripción || '',
          shape_leng: parseFloat(properties.shape_leng) || 0,
          shape_area: parseFloat(properties.shape_area) || 0,
          // Mantener todas las propiedades originales
          ...properties
        }
      };
    });
    
    // Ordenar por número de comuna si existe
    geojson.features.sort((a, b) => {
      const comunaA = parseInt(a.properties.comuna) || 0;
      const comunaB = parseInt(b.properties.comuna) || 0;
      return comunaA - comunaB;
    });
  }
  
  // Escribir archivo GeoJSON
  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2), 'utf8');
  
  console.log('✅ Conversión completada exitosamente!');
  console.log(`📊 Total de features: ${geojson.features?.length || 0}`);
  
  // Mostrar resumen de comunas
  if (geojson.features && geojson.features.length > 0) {
    console.log('\n📋 Comunas encontradas:');
    geojson.features.forEach(feature => {
      const nombre = feature.properties.nombre || feature.properties.name || 'Sin nombre';
      const comuna = feature.properties.comuna || 'N/A';
      console.log(`   - ${nombre} (Comuna ${comuna})`);
    });
  }
  
} catch (error) {
  console.error('❌ Error durante la conversión:', error.message);
  console.error(error.stack);
  process.exit(1);
}

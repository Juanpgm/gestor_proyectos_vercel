// Script para verificar la extracción de nombres de las características geográficas
const fs = require('fs');
const path = require('path');

function testNameExtraction(type, feature, index) {
  let name;
  switch (type) {
    case 'barrios':
      name = feature.properties?.barrio || `barrio-${index}`;
      break;
    case 'comunas':
      name = feature.properties?.nombre || 
             (feature.properties?.comuna ? `Comuna ${feature.properties.comuna}` : `comuna-${index}`);
      break;
    case 'corregimientos':
      name = feature.properties?.corregimie || 
             feature.properties?.corregimiento || `corregimiento-${index}`;
      break;
    case 'veredas':
      name = feature.properties?.vereda || `vereda-${index}`;
      break;
    default:
      name = feature.properties?.nombre || feature.properties?.name || `${type}-${index}`;
  }
  return name;
}

async function testNameExtractionForAll() {
  console.log('🏷️  PROBANDO EXTRACCIÓN DE NOMBRES:\n');
  
  const geoTypes = ['barrios', 'comunas', 'corregimientos', 'veredas'];
  
  for (const type of geoTypes) {
    const filePath = path.join(__dirname, 'public', 'data', 'geodata', 'cartografia_base', `${type}.geojson`);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`❌ ${type}: Archivo no encontrado`);
        continue;
      }
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`📍 ${type.toUpperCase()}:`);
      
      // Mostrar los primeros 5 nombres extraídos
      const sampleNames = data.features.slice(0, 5).map((feature, index) => {
        return testNameExtraction(type, feature, index);
      });
      
      console.log(`   Ejemplos de nombres extraídos:`);
      sampleNames.forEach((name, i) => {
        console.log(`   ${i + 1}. "${name}"`);
      });
      
      // Verificar si hay nombres únicos
      const allNames = data.features.map((feature, index) => {
        return testNameExtraction(type, feature, index);
      });
      
      const uniqueNames = new Set(allNames);
      const duplicates = allNames.length - uniqueNames.size;
      
      console.log(`   Total de ${type}: ${allNames.length}`);
      console.log(`   Nombres únicos: ${uniqueNames.size}`);
      if (duplicates > 0) {
        console.log(`   ⚠️  Nombres duplicados: ${duplicates}`);
      } else {
        console.log(`   ✅ Todos los nombres son únicos`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error procesando ${type}:`, error.message);
    }
  }
}

testNameExtractionForAll().catch(console.error);
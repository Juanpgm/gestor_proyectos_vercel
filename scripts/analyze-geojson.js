const fs = require('fs');
const path = require('path');

// Ruta del archivo GeoJSON
const filePath = path.join(__dirname, '../public/data/unidades_proyecto/equipamientos.geojson');

try {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log('Total features:', data.features.length);
  
  let validCoords = 0;
  let emptyCoords = 0;
  let invalidCoords = 0;
  
  const coordsSample = [];
  
  data.features.forEach((feature, index) => {
    const coords = feature.geometry?.coordinates;
    
    if (!coords || (Array.isArray(coords) && coords.length === 0)) {
      emptyCoords++;
      return;
    }
    
    if (Array.isArray(coords) && coords.length === 2) {
      const [a, b] = coords;
      if (typeof a === 'number' && typeof b === 'number' && !isNaN(a) && !isNaN(b)) {
        validCoords++;
        if (coordsSample.length < 5) {
          coordsSample.push({
            index,
            coords,
            name: feature.properties?.nickname || 'Sin nombre'
          });
        }
      } else {
        invalidCoords++;
      }
    } else {
      invalidCoords++;
    }
  });
  
  console.log('Coordenadas válidas:', validCoords);
  console.log('Coordenadas vacías:', emptyCoords);
  console.log('Coordenadas inválidas:', invalidCoords);
  console.log('\nMuestra de coordenadas válidas:');
  coordsSample.forEach(sample => {
    console.log(`  ${sample.name}: [${sample.coords[0]}, ${sample.coords[1]}]`);
  });
  
} catch (error) {
  console.error('Error:', error);
}

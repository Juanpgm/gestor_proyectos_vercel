const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('./public/geodata/barrios.geojson', 'utf8'));
  
  console.log('Total features:', data.features.length);
  
  // Agrupar por comuna y contar barrios
  const comunaBarrios = {};
  
  data.features.forEach(feature => {
    const comuna = feature.properties.comuna;
    const barrio = feature.properties.barrio;
    
    if (!comunaBarrios[comuna]) {
      comunaBarrios[comuna] = new Set();
    }
    comunaBarrios[comuna].add(barrio);
  });
  
  console.log('\nPrimeras 5 comunas y sus barrios:');
  Object.keys(comunaBarrios).slice(0, 5).forEach(comuna => {
    console.log(`${comuna}: ${comunaBarrios[comuna].size} barrios`);
    console.log(`  Barrios: ${Array.from(comunaBarrios[comuna]).slice(0, 5).join(', ')}${comunaBarrios[comuna].size > 5 ? '...' : ''}`);
  });
  
  console.log('\nTodas las comunas:');
  Object.keys(comunaBarrios).sort().forEach(comuna => {
    console.log(`${comuna}: ${comunaBarrios[comuna].size} barrios`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
}

const fs = require('fs');
const path = require('path');

// Función para intercambiar coordenadas de lat,lng a lng,lat
function fixCoordinates(coordinates) {
  if (Array.isArray(coordinates[0])) {
    // Es un array de coordenadas (para LineString, Polygon, etc.)
    return coordinates.map(coord => fixCoordinates(coord));
  } else {
    // Es un par de coordenadas [lat, lng] -> [lng, lat]
    if (coordinates.length >= 2) {
      return [coordinates[1], coordinates[0], ...coordinates.slice(2)];
    }
    return coordinates;
  }
}

// Leer y procesar el archivo de equipamientos
const equipamientosPath = path.join(__dirname, '../public/data/unidades_proyecto/equipamientos.geojson');
const equipamientosData = JSON.parse(fs.readFileSync(equipamientosPath, 'utf8'));

console.log('Procesando equipamientos...');
let processedCount = 0;

equipamientosData.features.forEach(feature => {
  if (feature.geometry && feature.geometry.coordinates) {
    const originalCoords = JSON.stringify(feature.geometry.coordinates);
    feature.geometry.coordinates = fixCoordinates(feature.geometry.coordinates);
    
    // Verificar si se hicieron cambios
    if (originalCoords !== JSON.stringify(feature.geometry.coordinates)) {
      processedCount++;
    }
  }
});

// Guardar el archivo corregido
fs.writeFileSync(equipamientosPath, JSON.stringify(equipamientosData, null, 2));
console.log(`✅ Procesados ${processedCount} features en equipamientos.geojson`);

// Verificar si infraestructura necesita corrección
const infraPath = path.join(__dirname, '../public/data/unidades_proyecto/infraestructura_vial.geojson');
const infraData = JSON.parse(fs.readFileSync(infraPath, 'utf8'));

console.log('Verificando infraestructura vial...');
let infraNeedsCorrection = false;

// Tomar una muestra de las primeras coordenadas para verificar el formato
if (infraData.features.length > 0) {
  const firstFeature = infraData.features[0];
  if (firstFeature.geometry && firstFeature.geometry.coordinates) {
    const firstCoord = firstFeature.geometry.coordinates[0];
    
    // Si la primera coordenada es mayor que 0, probablemente sea latitud (debería ser longitud negativa para Colombia)
    if (Array.isArray(firstCoord) && firstCoord[0] > 0) {
      console.log('⚠️  Infraestructura vial también necesita corrección de coordenadas');
      infraNeedsCorrection = true;
    }
  }
}

if (infraNeedsCorrection) {
  let infraProcessedCount = 0;
  
  infraData.features.forEach(feature => {
    if (feature.geometry && feature.geometry.coordinates) {
      const originalCoords = JSON.stringify(feature.geometry.coordinates);
      feature.geometry.coordinates = fixCoordinates(feature.geometry.coordinates);
      
      if (originalCoords !== JSON.stringify(feature.geometry.coordinates)) {
        infraProcessedCount++;
      }
    }
  });
  
  fs.writeFileSync(infraPath, JSON.stringify(infraData, null, 2));
  console.log(`✅ Procesados ${infraProcessedCount} features en infraestructura_vial.geojson`);
} else {
  console.log('✅ Infraestructura vial ya tiene el formato correcto');
}

console.log('🎉 Proceso completado');

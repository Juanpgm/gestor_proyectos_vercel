const shapefile = require('shapefile');
const fs = require('fs');
const path = require('path');

async function convertShapefileToGeoJSON(shpPath, outputPath) {
  try {
    const geojson = {
      type: "FeatureCollection",
      features: []
    };

    await shapefile.open(shpPath)
      .then(source => source.read()
        .then(function log(result) {
          if (result.done) return geojson;
          geojson.features.push(result.value);
          return source.read().then(log);
        }));

    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    console.log(`✅ Converted ${shpPath} to ${outputPath}`);
    return geojson;
  } catch (error) {
    console.error(`❌ Error converting ${shpPath}:`, error);
  }
}

async function main() {
  const geodataDir = path.join(__dirname, '..', 'geodata');
  const publicDir = path.join(__dirname, '..', 'public', 'geodata');
  
  // Crear directorio de salida si no existe
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Convertir COMUNAS
  await convertShapefileToGeoJSON(
    path.join(geodataDir, 'COMUNAS', 'mc_comunas.shp'),
    path.join(publicDir, 'comunas.geojson')
  );

  // Convertir BARRIOS
  await convertShapefileToGeoJSON(
    path.join(geodataDir, 'BARRIOS', 'BARRIOS.shp'),
    path.join(publicDir, 'barrios.geojson')
  );

  console.log('🎉 Conversion completed!');
}

main().catch(console.error);

/**
 * Script de verificación de geometrías en Unidades de Proyecto
 * Verifica que el endpoint /geometry retorna todos los tipos de geometría correctamente
 */

const API_BASE =
  "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto";

console.log("🔍 Iniciando verificación de geometrías...\n");

async function testGeometryEndpoint() {
  console.log("📡 Testeando endpoint /geometry sin filtros...");

  try {
    const response = await fetch(`${API_BASE}/geometry`);
    const data = await response.json();

    // Verificar estructura GeoJSON
    console.log("✅ Estructura GeoJSON:");
    console.log(`   - type: ${data.type}`);
    console.log(`   - features: ${data.features?.length || 0} elementos`);

    if (!data.features || data.features.length === 0) {
      console.log("❌ No se encontraron features");
      return;
    }

    // Contar tipos de geometría
    const geometryTypes = {};
    const validGeometries = [];
    const invalidGeometries = [];

    data.features.forEach((feature, index) => {
      const geomType = feature.geometry?.type;
      const hasValidGeom = feature.properties?.has_valid_geometry;

      if (geomType) {
        geometryTypes[geomType] = (geometryTypes[geomType] || 0) + 1;
      }

      if (hasValidGeom === true || hasValidGeom === undefined) {
        validGeometries.push(feature);
      } else {
        invalidGeometries.push(feature);
      }
    });

    console.log("\n📊 Distribución de tipos de geometría:");
    Object.entries(geometryTypes).forEach(([type, count]) => {
      const percentage = ((count / data.features.length) * 100).toFixed(1);
      console.log(`   - ${type}: ${count} (${percentage}%)`);
    });

    console.log(`\n✅ Geometrías válidas: ${validGeometries.length}`);
    console.log(
      `⚠️  Geometrías placeholder [0,0]: ${invalidGeometries.length}`
    );

    // Verificar cada tipo de geometría
    console.log("\n🔍 Verificando cada tipo de geometría:");

    // Points
    const points = data.features.filter((f) => f.geometry.type === "Point");
    if (points.length > 0) {
      const sample = points[0];
      console.log(`\n✅ Point (${points.length} encontrados)`);
      console.log(`   - UPID: ${sample.properties.upid}`);
      console.log(
        `   - Coordenadas: [${sample.geometry.coordinates[0]}, ${sample.geometry.coordinates[1]}]`
      );
      console.log(
        `   - Has valid geometry: ${sample.properties.has_valid_geometry}`
      );
    }

    // LineStrings
    const linestrings = data.features.filter(
      (f) => f.geometry.type === "LineString"
    );
    if (linestrings.length > 0) {
      const sample = linestrings[0];
      console.log(`\n✅ LineString (${linestrings.length} encontrados)`);
      console.log(`   - UPID: ${sample.properties.upid}`);
      console.log(
        `   - Número de puntos: ${sample.geometry.coordinates.length}`
      );
      console.log(
        `   - Primer punto: [${sample.geometry.coordinates[0][0]}, ${sample.geometry.coordinates[0][1]}]`
      );
      console.log(
        `   - Último punto: [${
          sample.geometry.coordinates[sample.geometry.coordinates.length - 1][0]
        }, ${
          sample.geometry.coordinates[sample.geometry.coordinates.length - 1][1]
        }]`
      );
    } else {
      console.log(`\n⚠️  LineString: No se encontraron`);
    }

    // Polygons
    const polygons = data.features.filter((f) => f.geometry.type === "Polygon");
    if (polygons.length > 0) {
      const sample = polygons[0];
      console.log(`\n✅ Polygon (${polygons.length} encontrados)`);
      console.log(`   - UPID: ${sample.properties.upid}`);
      console.log(
        `   - Número de anillos: ${sample.geometry.coordinates.length}`
      );
      console.log(
        `   - Puntos en primer anillo: ${sample.geometry.coordinates[0].length}`
      );
      console.log(
        `   - Primer punto: [${sample.geometry.coordinates[0][0][0]}, ${sample.geometry.coordinates[0][0][1]}]`
      );
    } else {
      console.log(`\n⚠️  Polygon: No se encontraron`);
    }

    // MultiPoints
    const multipoints = data.features.filter(
      (f) => f.geometry.type === "MultiPoint"
    );
    if (multipoints.length > 0) {
      const sample = multipoints[0];
      console.log(`\n✅ MultiPoint (${multipoints.length} encontrados)`);
      console.log(`   - UPID: ${sample.properties.upid}`);
      console.log(
        `   - Número de puntos: ${sample.geometry.coordinates.length}`
      );
    } else {
      console.log(`\n⚠️  MultiPoint: No se encontraron`);
    }

    // MultiLineStrings
    const multilinestrings = data.features.filter(
      (f) => f.geometry.type === "MultiLineString"
    );
    if (multilinestrings.length > 0) {
      const sample = multilinestrings[0];
      console.log(
        `\n✅ MultiLineString (${multilinestrings.length} encontrados)`
      );
      console.log(`   - UPID: ${sample.properties.upid}`);
      console.log(
        `   - Número de líneas: ${sample.geometry.coordinates.length}`
      );
    } else {
      console.log(`\n⚠️  MultiLineString: No se encontraron`);
    }

    // MultiPolygons
    const multipolygons = data.features.filter(
      (f) => f.geometry.type === "MultiPolygon"
    );
    if (multipolygons.length > 0) {
      const sample = multipolygons[0];
      console.log(`\n✅ MultiPolygon (${multipolygons.length} encontrados)`);
      console.log(`   - UPID: ${sample.properties.upid}`);
      console.log(
        `   - Número de polígonos: ${sample.geometry.coordinates.length}`
      );
    } else {
      console.log(`\n⚠️  MultiPolygon: No se encontraron`);
    }

    // Resumen final
    console.log("\n" + "=".repeat(60));
    console.log("📋 RESUMEN DE VERIFICACIÓN");
    console.log("=".repeat(60));
    console.log(`Total de features: ${data.features.length}`);
    console.log(
      `Tipos de geometría únicos: ${Object.keys(geometryTypes).length}`
    );
    console.log(
      `Geometrías válidas: ${validGeometries.length} (${(
        (validGeometries.length / data.features.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `Geometrías placeholder: ${invalidGeometries.length} (${(
        (invalidGeometries.length / data.features.length) *
        100
      ).toFixed(1)}%)`
    );

    const hasLineStrings = linestrings.length > 0;
    const hasPolygons = polygons.length > 0;
    const hasMultiGeometries =
      multipoints.length > 0 ||
      multilinestrings.length > 0 ||
      multipolygons.length > 0;

    if (hasLineStrings || hasPolygons || hasMultiGeometries) {
      console.log(
        "\n✅ El endpoint retorna geometrías complejas (LineString, Polygon, Multi*)"
      );
    } else {
      console.log("\n⚠️  El endpoint solo retorna geometrías tipo Point");
    }
  } catch (error) {
    console.error("❌ Error al verificar endpoint:", error.message);
  }
}

async function testFilteredGeometry() {
  console.log("\n\n🔍 Testeando endpoint /geometry con filtros...");

  try {
    // Probar con filtro de centro gestor
    const response = await fetch(
      `${API_BASE}/geometry?nombre_centro_gestor=Secretaría de Infraestructura`
    );
    const data = await response.json();

    console.log(
      `✅ Filtrado por centro gestor: ${data.features?.length || 0} elementos`
    );

    if (data.features && data.features.length > 0) {
      const geometryTypes = {};
      data.features.forEach((f) => {
        const type = f.geometry?.type;
        if (type) geometryTypes[type] = (geometryTypes[type] || 0) + 1;
      });

      console.log("   Tipos encontrados:");
      Object.entries(geometryTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
    }
  } catch (error) {
    console.error("❌ Error al verificar filtros:", error.message);
  }
}

async function testSpecificGeometryTypes() {
  console.log("\n\n🔍 Buscando proyectos con geometrías específicas...");

  try {
    const response = await fetch(`${API_BASE}/geometry`);
    const data = await response.json();

    // Buscar ejemplos de cada tipo
    const examples = {
      Point: null,
      LineString: null,
      Polygon: null,
      MultiPoint: null,
      MultiLineString: null,
      MultiPolygon: null,
    };

    data.features?.forEach((feature) => {
      const type = feature.geometry?.type;
      if (
        type &&
        !examples[type] &&
        feature.properties?.has_valid_geometry !== false
      ) {
        examples[type] = {
          upid: feature.properties?.upid,
          nombre: feature.properties?.nombre_up,
          tipo_intervencion: feature.properties?.tipo_intervencion,
        };
      }
    });

    console.log("📍 Ejemplos de proyectos por tipo de geometría:");
    Object.entries(examples).forEach(([type, example]) => {
      if (example) {
        console.log(`\n${type}:`);
        console.log(`   - UPID: ${example.upid}`);
        console.log(`   - Nombre: ${example.nombre}`);
        console.log(`   - Tipo: ${example.tipo_intervencion}`);
      } else {
        console.log(`\n${type}: No disponible`);
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Ejecutar todas las pruebas
(async () => {
  await testGeometryEndpoint();
  await testFilteredGeometry();
  await testSpecificGeometryTypes();

  console.log("\n\n✅ Verificación completada");
})();

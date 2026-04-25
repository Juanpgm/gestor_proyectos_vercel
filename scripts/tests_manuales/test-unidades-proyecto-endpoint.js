/**
 * Script de prueba para verificar el endpoint unificado GET /unidades-proyecto
 * Verifica que la API responde correctamente con datos GeoJSON
 */

const API_URL = "https://gestorproyectoapi-production.up.railway.app";
const ENDPOINT = "/unidades-proyecto";

async function testUnifiedEndpoint() {
  console.log("🧪 ========== TEST: ENDPOINT UNIFICADO ==========");
  console.log(`📍 Base URL: ${API_URL}`);
  console.log(`📍 Endpoint: ${ENDPOINT}`);
  console.log(`📍 Full URL: ${API_URL}${ENDPOINT}`);
  console.log("");

  try {
    console.log("🚀 Fetching data from unified endpoint...");
    const startTime = Date.now();

    const response = await fetch(`${API_URL}${ENDPOINT}`);
    const fetchTime = Date.now() - startTime;

    console.log(`✅ Response received in ${fetchTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📦 Content-Type: ${response.headers.get("content-type")}`);
    console.log("");

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const rawData = await response.json();

    // Validar estructura de la API
    console.log("🔍 ========== RAW API RESPONSE ==========");
    console.log("Response keys:", Object.keys(rawData));
    console.log("success:", rawData.success);
    console.log("count:", rawData.count);
    console.log("data array length:", rawData.data?.length);
    console.log("collection:", JSON.stringify(rawData.collection, null, 2));
    console.log("filters:", JSON.stringify(rawData.filters, null, 2));
    console.log("");

    if (!rawData.success || !Array.isArray(rawData.data)) {
      throw new Error(
        "Invalid API response: Expected { success: true, data: [...] }",
      );
    }

    // Convertir a GeoJSON como lo hace el servicio
    console.log("🔧 ========== CONVERTING TO GEOJSON ==========");
    const features = rawData.data.map((item) => {
      const { geometry, ...properties } = item;
      return {
        type: "Feature",
        geometry: geometry || null,
        properties: properties,
      };
    });

    const data = {
      type: "FeatureCollection",
      features: features,
    };

    console.log(
      `✅ Converted ${features.length} items to GeoJSON FeatureCollection`,
    );
    console.log("");

    // Validar estructura GeoJSON
    console.log("🔍 ========== GEOJSON VALIDATION ==========");
    console.log(`📋 Type: ${data.type}`);
    console.log(
      `📋 Is FeatureCollection: ${data.type === "FeatureCollection"}`,
    );
    console.log(`📋 Has features array: ${Array.isArray(data.features)}`);
    console.log(`📋 Total features: ${data.features?.length || 0}`);
    console.log("");

    if (data.features.length === 0) {
      console.warn("⚠️  WARNING: GeoJSON has 0 features!");
      return;
    }

    // Analizar primer feature
    const firstFeature = data.features[0];
    console.log("🔍 ========== FIRST FEATURE ANALYSIS ==========");
    console.log(
      "Feature structure:",
      JSON.stringify(firstFeature, null, 2).substring(0, 500) + "...",
    );
    console.log("");
    console.log(`📋 Feature type: ${firstFeature.type}`);
    console.log(`📋 Geometry type: ${firstFeature.geometry?.type}`);
    console.log(`📋 Has coordinates: ${!!firstFeature.geometry?.coordinates}`);
    console.log(
      `📋 Coordinates: ${JSON.stringify(firstFeature.geometry?.coordinates).substring(0, 100)}...`,
    );
    console.log("");
    console.log("📋 Properties:", Object.keys(firstFeature.properties || {}));
    console.log(`📋 UPID: ${firstFeature.properties?.upid}`);
    console.log(`📋 nombre_up: ${firstFeature.properties?.nombre_up}`);
    console.log(`📋 estado: ${firstFeature.properties?.estado}`);
    console.log(
      `📋 tipo_intervencion: ${firstFeature.properties?.tipo_intervencion}`,
    );
    console.log(
      `📋 has_valid_geometry: ${firstFeature.properties?.has_valid_geometry}`,
    );
    console.log("");

    // Estadísticas de geometrías
    const geometryStats = data.features.reduce((acc, f) => {
      const type = f.geometry?.type || "null";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log("🔍 ========== GEOMETRY STATISTICS ==========");
    Object.entries(geometryStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} features`);
    });
    console.log("");

    // Validar coordenadas
    const validGeometries = data.features.filter((f) => {
      const coords = f.geometry?.coordinates;
      if (!coords) return false;

      // Verificar si es coordenada [0,0] (inválida para Cali)
      if (Array.isArray(coords) && coords.length === 2) {
        return !(coords[0] === 0 && coords[1] === 0);
      }
      return true;
    });

    const invalidGeometries = data.features.length - validGeometries.length;

    console.log("🔍 ========== COORDINATE VALIDATION ==========");
    console.log(`✅ Valid geometries: ${validGeometries.length}`);
    console.log(`❌ Invalid geometries (0,0 or null): ${invalidGeometries}`);
    console.log(
      `📊 Valid ratio: ${((validGeometries.length / data.features.length) * 100).toFixed(2)}%`,
    );
    console.log("");

    // Verificar propiedades clave
    const propertiesCheck = {
      upid: 0,
      nombre_up: 0,
      estado: 0,
      tipo_intervencion: 0,
      presupuesto_base: 0,
      avance_obra: 0,
      has_valid_geometry: 0,
    };

    data.features.forEach((f) => {
      Object.keys(propertiesCheck).forEach((key) => {
        if (f.properties?.[key] !== undefined && f.properties[key] !== null) {
          propertiesCheck[key]++;
        }
      });
    });

    console.log("🔍 ========== PROPERTIES AVAILABILITY ==========");
    Object.entries(propertiesCheck).forEach(([prop, count]) => {
      const percentage = ((count / data.features.length) * 100).toFixed(2);
      console.log(
        `  ${prop}: ${count}/${data.features.length} (${percentage}%)`,
      );
    });
    console.log("");

    console.log("✅ ========== TEST PASSED ==========");
    console.log(`✅ Endpoint is working correctly`);
    console.log(`✅ Data structure is valid GeoJSON FeatureCollection`);
    console.log(
      `✅ ${validGeometries.length} features ready for map visualization`,
    );
    console.log("");
  } catch (error) {
    console.error("");
    console.error("❌ ========== TEST FAILED ==========");
    console.error("❌ Error:", error.message);
    console.error("");
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar test
testUnifiedEndpoint();

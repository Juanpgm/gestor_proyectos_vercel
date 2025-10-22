/**
 * Test específico para el endpoint de geometría
 * Ejecutar con: node test-geometry-endpoint.js
 */

const BASE_URL = "http://localhost:3000"; // Cambia por tu URL local

async function testGeometryEndpoint() {
  try {
    console.log("🗺️  Testing Geometry Endpoint...");
    console.log(
      `📍 URL: ${BASE_URL}/api/proxy/unidades-proyecto/geometry?limit=3`
    );

    const response = await fetch(
      `${BASE_URL}/api/proxy/unidades-proyecto/geometry?limit=3`
    );

    console.log(`📡 Response Status: ${response.status}`);
    console.log(`📡 Response OK: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Response Error:", errorText);
      return;
    }

    const data = await response.json();

    console.log("\n📊 Response Analysis:");
    console.log(`   Type: ${data.type}`);
    console.log(
      `   Is FeatureCollection: ${data.type === "FeatureCollection"}`
    );
    console.log(`   Features count: ${data.features?.length || 0}`);
    console.log(`   Has properties: ${!!data.properties}`);
    console.log(`   Top level keys: ${Object.keys(data)}`);

    if (data.features && data.features.length > 0) {
      console.log("\n📍 First Feature Analysis:");
      const firstFeature = data.features[0];
      console.log(`   Feature type: ${firstFeature.type}`);
      console.log(`   Geometry type: ${firstFeature.geometry?.type}`);
      console.log(
        `   Has coordinates: ${!!firstFeature.geometry?.coordinates}`
      );
      console.log(
        `   Coordinates length: ${
          firstFeature.geometry?.coordinates?.length || 0
        }`
      );
      console.log(`   UPID: ${firstFeature.properties?.upid}`);
      console.log(
        `   Has valid geometry: ${firstFeature.properties?.has_valid_geometry}`
      );
      console.log(`   Estado: ${firstFeature.properties?.estado}`);
      console.log(
        `   Centro gestor: ${firstFeature.properties?.nombre_centro_gestor}`
      );

      // Mostrar las coordenadas de la primera feature
      if (firstFeature.geometry?.coordinates) {
        console.log(
          `   Coordinates: [${firstFeature.geometry.coordinates[0]}, ${firstFeature.geometry.coordinates[1]}]`
        );
      }
    }

    if (data.properties) {
      console.log("\n📋 Response Metadata:");
      console.log(`   Success: ${data.properties.success}`);
      console.log(`   Count: ${data.properties.count}`);
      console.log(`   Message: ${data.properties.message}`);
      console.log(
        `   Filters applied: ${JSON.stringify(data.properties.filters_applied)}`
      );
    }

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Test también con filtros
async function testGeometryWithFilters() {
  try {
    console.log("\n🔍 Testing Geometry Endpoint with Filters...");

    const filterParams = new URLSearchParams({
      estado: "En ejecución",
      limit: "2",
    });

    const url = `${BASE_URL}/api/proxy/unidades-proyecto/geometry?${filterParams}`;
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Filtered Response Error:", errorText);
      return;
    }

    const data = await response.json();

    console.log("\n📊 Filtered Response Analysis:");
    console.log(`   Features count: ${data.features?.length || 0}`);

    if (data.features && data.features.length > 0) {
      console.log("   States of returned features:");
      data.features.forEach((feature, index) => {
        console.log(
          `     ${index + 1}. ${feature.properties?.estado} (${
            feature.properties?.upid
          })`
        );
      });
    }

    console.log("\n✅ Filtered test completed successfully!");
  } catch (error) {
    console.error("❌ Filtered test failed:", error.message);
  }
}

// Ejecutar tests
async function runGeometryTests() {
  console.log("🚀 Starting Geometry Endpoint Tests...");

  await testGeometryEndpoint();
  await testGeometryWithFilters();

  console.log("\n🏁 All geometry tests completed!");
}

if (require.main === module) {
  runGeometryTests().catch(console.error);
}

module.exports = { testGeometryEndpoint, testGeometryWithFilters };

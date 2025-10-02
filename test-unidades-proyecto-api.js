#!/usr/bin/env node

/**
 * Test script para validar los endpoints de Unidades de Proyecto
 * Ejecutar con: node test-unidades-proyecto-api.js
 */

const baseUrl = "http://localhost:3000/api/proxy/unidades-proyecto";

async function testEndpoint(endpoint, description) {
  console.log(`\n🔍 Testing ${description}...`);
  console.log(`   URL: ${baseUrl}${endpoint}`);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
      return false;
    }

    const data = await response.json();

    // Log diferentes estructuras según el endpoint
    if (endpoint.includes("attributes")) {
      console.log(
        `   ✅ Success: ${data.success ? "Has success wrapper" : "Direct data"}`
      );
      console.log(`   📊 Count: ${data.count || "N/A"} attributes`);
      console.log(
        `   🔢 Total before limit: ${data.total_before_limit || "N/A"}`
      );
      if (data.data && data.data.length > 0) {
        console.log(
          `   📝 Sample UPID: ${data.data[0].properties?.upid || "N/A"}`
        );
      }
    } else if (endpoint.includes("geometry")) {
      console.log(`   ✅ Success: ${data.type || "No type"}`);
      console.log(`   📍 Features: ${data.features?.length || 0}`);
      console.log(`   📊 Count: ${data.count || "N/A"}`);
    } else if (endpoint.includes("filters")) {
      console.log(
        `   ✅ Success: ${data.success ? "Has success wrapper" : "Direct data"}`
      );
      if (data.filters) {
        console.log(
          `   🏷️  Filter categories: ${Object.keys(data.filters).join(", ")}`
        );
        console.log(`   📊 Estados: ${data.filters.estados?.length || 0}`);
        console.log(
          `   🏢 Centros gestores: ${
            data.filters.centros_gestores?.length || 0
          }`
        );
      }
    } else if (endpoint.includes("dashboard")) {
      console.log(
        `   ✅ Success: ${data.success ? "Has success wrapper" : "Direct data"}`
      );
      if (data.dashboard) {
        console.log(
          `   📊 Dashboard sections: ${Object.keys(data.dashboard).join(", ")}`
        );
        console.log(
          `   🔢 Total proyectos: ${
            data.dashboard.resumen_general?.total_proyectos || "N/A"
          }`
        );
      }
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Testing Unidades de Proyecto API endpoints");
  console.log("===============================================");

  const tests = [
    ["/attributes?limit=5", "Attributes endpoint (limited)"],
    ["/geometry?limit=5", "Geometry endpoint (limited)"],
    ["/filters", "Filters endpoint"],
    ["/dashboard", "Dashboard endpoint"],
  ];

  let passed = 0;
  let total = tests.length;

  for (const [endpoint, description] of tests) {
    const success = await testEndpoint(endpoint, description);
    if (success) passed++;
  }

  console.log("\n📊 Test Results");
  console.log("================");
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log("\n🎉 All tests passed! API endpoints are working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Check the logs above for details.");
    process.exit(1);
  }
}

// Execute tests
runTests().catch((error) => {
  console.error("💥 Test runner failed:", error);
  process.exit(1);
});

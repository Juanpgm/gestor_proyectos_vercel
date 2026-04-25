/**
 * Test exhaustivo de endpoints de Unidades de Proyecto
 * Busca encontrar los endpoints reales que funcionan en la API
 */

const API_BASE_URL = "https://gestorproyectoapi-production.up.railway.app";

// Probar todas las posibles variaciones de endpoints
const endpointsToTest = [
  // Endpoints documentados en OpenAPI
  "/unidades-proyecto/quality-control-summary",
  "/unidades-proyecto/quality-control-records",
  "/unidades-proyecto/quality-control-changelog",
  "/unidades-proyecto/quality-control-metadata",
  "/unidades-proyecto/quality-control-stats",
  "/unidades-proyecto/quality-control-by-centro-gestor/1",

  // Variaciones sin guiones
  "/unidades-proyecto/qualitycontrolsummary",
  "/unidades-proyecto/qualitycontrol/summary",

  // Variaciones con guión bajo
  "/unidades-proyecto/quality_control_summary",
  "/unidades-proyecto/quality_control/summary",

  // Prefijo alternativo
  "/quality-control/unidades-proyecto/summary",
  "/quality-control-summary",

  // Endpoints que SÍ funcionan según la documentación
  "/unidades-proyecto/geometry",
  "/unidades-proyecto/attributes",
  "/unidades-proyecto/filters",
  "/unidades-proyecto/download-geojson",
  "/unidades-proyecto/download-table",

  // Posibles endpoints de calidad
  "/unidades-proyecto/quality",
  "/unidades-proyecto/control",
  "/unidades-proyecto/summary",
  "/unidades-proyecto/validation",
];

async function testEndpoint(url) {
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    const startTime = Date.now();
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const endTime = Date.now();

    const status = response.status;
    const statusText = response.statusText;
    const duration = endTime - startTime;

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      let preview = "";

      if (contentType && contentType.includes("application/json")) {
        try {
          const data = await response.json();
          preview = JSON.stringify(data).substring(0, 200);
        } catch {
          preview = "Error parsing JSON";
        }
      } else {
        const text = await response.text();
        preview = text.substring(0, 200);
      }

      return {
        url,
        status,
        statusText,
        duration,
        success: true,
        preview,
      };
    } else {
      return {
        url,
        status,
        statusText,
        duration,
        success: false,
        error: await response.text(),
      };
    }
  } catch (error) {
    return {
      url,
      status: "ERROR",
      statusText: error.message,
      duration: 0,
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log("\n" + "=".repeat(80));
  console.log("🔍 TEST EXHAUSTIVO DE ENDPOINTS - UNIDADES DE PROYECTO");
  console.log("=".repeat(80));
  console.log(`🌐 API Base: ${API_BASE_URL}`);
  console.log(`📋 Endpoints a probar: ${endpointsToTest.length}`);
  console.log(`⏰ Inicio: ${new Date().toLocaleString("es-CO")}`);
  console.log("=".repeat(80));

  const results = [];

  for (let i = 0; i < endpointsToTest.length; i++) {
    const endpoint = endpointsToTest[i];
    process.stdout.write(
      `\r[${i + 1}/${endpointsToTest.length}] Probando: ${endpoint.padEnd(60)}`
    );

    const result = await testEndpoint(endpoint);
    results.push(result);

    // Pequeña pausa para no saturar la API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("📊 RESULTADOS DEL TEST");
  console.log("=".repeat(80));

  // Endpoints exitosos
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ ENDPOINTS EXITOSOS (${successful.length}):`);
  console.log("-".repeat(80));
  if (successful.length === 0) {
    console.log("   ❌ No se encontraron endpoints funcionando");
  } else {
    successful.forEach((r) => {
      console.log(`\n   ✓ ${r.url}`);
      console.log(`     Status: ${r.status} ${r.statusText}`);
      console.log(`     Tiempo: ${r.duration}ms`);
      console.log(`     Preview: ${r.preview}`);
    });
  }

  console.log(
    `\n\n❌ ENDPOINTS CON ERROR 404 (${
      failed.filter((r) => r.status === 404).length
    }):`
  );
  console.log("-".repeat(80));
  const notFound = failed.filter((r) => r.status === 404);
  if (notFound.length > 0) {
    notFound.forEach((r) => {
      console.log(`   ✗ ${r.url} - ${r.status} ${r.statusText}`);
    });
  }

  const otherErrors = failed.filter((r) => r.status !== 404);
  if (otherErrors.length > 0) {
    console.log(`\n\n⚠️  OTROS ERRORES (${otherErrors.length}):`);
    console.log("-".repeat(80));
    otherErrors.forEach((r) => {
      console.log(`\n   ⚠️  ${r.url}`);
      console.log(`     Status: ${r.status} ${r.statusText}`);
      console.log(`     Error: ${r.error}`);
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log("📈 RESUMEN");
  console.log("=".repeat(80));
  console.log(`Total probados:        ${results.length}`);
  console.log(`✅ Exitosos:           ${successful.length}`);
  console.log(`❌ Fallidos:           ${failed.length}`);
  console.log(
    `📊 Tasa de éxito:      ${(
      (successful.length / results.length) *
      100
    ).toFixed(1)}%`
  );

  if (successful.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("💡 RECOMENDACIÓN");
    console.log("=".repeat(80));
    console.log(
      "Los siguientes endpoints están funcionando y pueden ser usados:"
    );
    successful.forEach((r) => {
      console.log(`   • ${r.url}`);
    });
  } else {
    console.log("\n" + "=".repeat(80));
    console.log("⚠️  ADVERTENCIA");
    console.log("=".repeat(80));
    console.log("No se encontraron endpoints de quality-control funcionando.");
    console.log("Los endpoints deben ser implementados en el backend primero.");
  }

  console.log("\n" + "=".repeat(80));
  console.log(`⏰ Fin: ${new Date().toLocaleString("es-CO")}`);
  console.log("=".repeat(80) + "\n");
}

// Ejecutar tests
runTests().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});

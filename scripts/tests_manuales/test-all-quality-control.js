/**
 * Script para probar TODOS los endpoints de quality-control
 */

const API_BASE_URL = "https://gestorproyectoapi-production.up.railway.app";

const endpoints = [
  "/unidades-proyecto/quality-control/summary",
  "/unidades-proyecto/quality-control/records",
  "/unidades-proyecto/quality-control/records/test-id",
  "/unidades-proyecto/quality-control/changelog",
  "/unidades-proyecto/quality-control/by-centro-gestor",
  "/unidades-proyecto/quality-control/by-centro-gestor/test-centro",
  "/unidades-proyecto/quality-control/metadata",
  "/unidades-proyecto/quality-control/metadata/test-id",
  "/unidades-proyecto/quality-control/stats",
];

async function testAllEndpoints() {
  console.log("\n🧪 Probando TODOS los endpoints de Quality Control...\n");

  const results = [];

  for (const endpoint of endpoints) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url);
      const status = response.status;

      let result = {
        endpoint,
        status,
        working: status === 200,
      };

      if (status === 200) {
        try {
          const data = await response.json();
          result.count = data.count || data.data?.length || 0;
          result.hasData = !!data.data;
        } catch (e) {
          result.parseError = true;
        }
        console.log(`✅ ${endpoint} - Status ${status} ✓`);
      } else {
        console.log(`❌ ${endpoint} - Status ${status}`);
      }

      results.push(result);
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
      results.push({
        endpoint,
        error: error.message,
      });
    }
  }

  console.log("\n📊 RESUMEN:\n");
  const working = results.filter((r) => r.working);
  const notWorking = results.filter((r) => !r.working);

  console.log(
    `✅ Endpoints funcionando: ${working.length}/${endpoints.length}`
  );
  working.forEach((r) => {
    console.log(`   - ${r.endpoint} (${r.count || 0} registros)`);
  });

  console.log(
    `\n❌ Endpoints NO disponibles: ${notWorking.length}/${endpoints.length}`
  );
  notWorking.forEach((r) => {
    console.log(`   - ${r.endpoint} (Status ${r.status || "Error"})`);
  });

  console.log("\n✅ Prueba completada\n");
}

testAllEndpoints();

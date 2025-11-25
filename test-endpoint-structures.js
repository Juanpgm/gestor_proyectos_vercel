const endpoints = [
  "/unidades-proyecto/quality-control/summary",
  "/unidades-proyecto/quality-control/records",
  "/unidades-proyecto/quality-control/changelog",
  "/unidades-proyecto/quality-control/by-centro-gestor",
  "/unidades-proyecto/quality-control/metadata",
  "/unidades-proyecto/quality-control/stats",
];

async function testEndpoints() {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(
        `https://gestorproyectoapi-production.up.railway.app${endpoint}`
      );
      const data = await response.json();
      console.log("=".repeat(80));
      console.log(`ENDPOINT: ${endpoint}`);
      console.log("=".repeat(80));
      if (data.data && data.data.length > 0) {
        console.log("PRIMER REGISTRO:");
        console.log(JSON.stringify(data.data[0], null, 2));
        console.log(`\nTOTAL REGISTROS: ${data.data.length}`);
        console.log(
          "CAMPOS DISPONIBLES:",
          Object.keys(data.data[0]).join(", ")
        );
      } else {
        console.log("RESPUESTA COMPLETA:");
        console.log(JSON.stringify(data, null, 2));
      }
      console.log("\n");
    } catch (error) {
      console.error(`Error en ${endpoint}:`, error.message);
    }
  }
}

testEndpoints();

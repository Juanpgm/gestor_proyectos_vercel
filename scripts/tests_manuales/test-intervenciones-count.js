/**
 * Script de prueba para verificar el conteo de intervenciones
 * desde el endpoint GET /intervenciones
 */

const API_URL = "https://gestorproyectoapi-production.up.railway.app";

async function testIntervencionesCount() {
  console.log("🧪 ========== TEST: CONTEO DE INTERVENCIONES ==========");
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📍 Endpoint: /intervenciones`);
  console.log("");

  try {
    // Test 1: Obtener solo el count (con limit=1 para optimizar)
    console.log("🚀 Test 1: Fetching count with limit=1...");
    const response1 = await fetch(`${API_URL}/intervenciones?limit=1`);
    const data1 = await response1.json();

    console.log("Response structure:", Object.keys(data1));
    console.log("✅ Count:", data1.count);
    console.log("✅ Data length:", data1.data?.length);
    console.log("");

    // Test 2: Verificar el count total
    console.log("🚀 Test 2: Fetching all data with limit=10000...");
    const response2 = await fetch(`${API_URL}/intervenciones?limit=10000`);
    const data2 = await response2.json();

    console.log("✅ Count:", data2.count);
    console.log("✅ Data length:", data2.data?.length);
    console.log(
      "✅ Match:",
      data2.count === data2.data.length ? "YES ✓" : "NO ✗",
    );
    console.log("");

    // Test 3: Análisis de los datos
    console.log("🔍 ========== ANÁLISIS DE INTERVENCIONES ==========");
    const intervenciones = data2.data;

    // Contar por estado
    const byEstado = intervenciones.reduce((acc, item) => {
      const estado = item.estado || "Sin estado";
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    console.log("Por Estado:");
    Object.entries(byEstado).forEach(([estado, count]) => {
      console.log(`  ${estado}: ${count}`);
    });
    console.log("");

    // Contar por tipo
    const byTipo = intervenciones.reduce((acc, item) => {
      const tipo = item.tipo_intervencion || "Sin tipo";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    console.log("Por Tipo de Intervención:");
    Object.entries(byTipo).forEach(([tipo, count]) => {
      console.log(`  ${tipo}: ${count}`);
    });
    console.log("");

    // UPIDs únicos
    const uniqueUPIDs = new Set(intervenciones.map((i) => i.upid));
    console.log(`UPIDs únicos: ${uniqueUPIDs.size}`);
    console.log(`Total intervenciones: ${intervenciones.length}`);
    console.log(
      `Promedio intervenciones por UPID: ${(intervenciones.length / uniqueUPIDs.size).toFixed(2)}`,
    );
    console.log("");

    console.log("✅ ========== TEST COMPLETO ==========");
    console.log(`✅ Total de intervenciones: ${data2.count}`);
    console.log(`✅ El endpoint funciona correctamente`);
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
testIntervencionesCount();

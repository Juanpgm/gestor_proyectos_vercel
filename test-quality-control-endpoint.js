/**
 * Script para probar el endpoint de quality-control-summary
 * Verifica que el endpoint funcione correctamente
 */

const API_BASE_URL = "https://gestorproyectoapi-production.up.railway.app";

async function testQualityControlSummary() {
  console.log("\n🧪 Probando endpoint de Quality Control Summary...\n");

  const endpoint = `${API_BASE_URL}/unidades-proyecto/quality-control-summary`;

  console.log(`📍 URL: ${endpoint}\n`);

  try {
    const response = await fetch(endpoint);

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📦 Content-Type: ${response.headers.get("content-type")}\n`);

    if (response.ok) {
      const data = await response.json();

      console.log("✅ Respuesta exitosa:");
      console.log(`   - success: ${data.success}`);
      console.log(`   - count: ${data.count}`);
      console.log(`   - collection: ${data.collection}`);

      if (data.data && data.data.length > 0) {
        console.log(`\n📋 Campos del primer registro:`);
        const firstRecord = data.data[0];
        Object.keys(firstRecord).forEach((key) => {
          console.log(`   - ${key}: ${typeof firstRecord[key]}`);
        });

        console.log(`\n📄 Primer registro completo:`);
        console.log(JSON.stringify(firstRecord, null, 2));
      } else {
        console.log("\n⚠️  No hay datos en la respuesta");
      }

      // Probar con filtros
      console.log("\n🔍 Probando con filtro de centro gestor...");
      const responseWithFilter = await fetch(`${endpoint}?limit=5`);
      const dataWithFilter = await responseWithFilter.json();
      console.log(`✅ Con filtro limit=5: ${dataWithFilter.count} registros`);
    } else {
      const errorText = await response.text();
      console.log("❌ Error en la respuesta:");
      console.log(errorText);
    }
  } catch (error) {
    console.error("❌ Error al hacer la petición:");
    console.error(error.message);
  }

  console.log("\n✅ Prueba completada\n");
}

// Ejecutar
testQualityControlSummary();

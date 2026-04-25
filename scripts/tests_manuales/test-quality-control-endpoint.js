/**
 * Script para probar el endpoint principal de calidad de datos
 * Verifica que /unidades-proyecto/calidad-datos funcione correctamente
 */

const API_BASE_URL = "https://gestorproyectoapi-production.up.railway.app";

async function testQualityControlSummary() {
  console.log("\n🧪 Probando endpoint de Calidad de Datos (ISO/DAMA)...\n");

  const endpoint = `${API_BASE_URL}/unidades-proyecto/calidad-datos`;

  console.log(`📍 URL: ${endpoint}\n`);

  try {
    const response = await fetch(endpoint);

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📦 Content-Type: ${response.headers.get("content-type")}\n`);

    if (response.ok) {
      const data = await response.json();

      console.log("✅ Respuesta exitosa:");
      console.log(`   - success: ${data.success}`);
      console.log(`   - keys raíz: ${Object.keys(data).join(", ")}`);

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

      console.log("\n🔍 Validando estructura para reportes/tabs...");
      const expectedSections = [
        "summary",
        "resumen",
        "records",
        "registros",
        "stats",
        "estadisticas",
        "metadata",
        "metadatos",
      ];
      const availableSections = expectedSections.filter(
        (key) => key in data || (data.data && key in data.data),
      );
      console.log(
        `✅ Secciones detectadas: ${availableSections.join(", ") || "ninguna (revisar contrato actual)"}`,
      );
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

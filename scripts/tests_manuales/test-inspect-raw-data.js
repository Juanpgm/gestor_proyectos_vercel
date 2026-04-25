/**
 * Script para inspeccionar la respuesta cruda del backend
 */

const https = require("https");

const API_URL = "https://gestorproyectoapi-production.up.railway.app";

function fetchAttributesRaw() {
  return new Promise((resolve, reject) => {
    console.log("🔄 Obteniendo datos CRUDOS de attributes...");
    const url = `${API_URL}/unidades-proyecto/attributes`;

    https
      .get(
        url,
        {
          headers: {
            Accept: "application/json",
          },
        },
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
              return;
            }

            try {
              const result = JSON.parse(data);
              resolve(result);
            } catch (error) {
              reject(new Error(`Error parsing JSON: ${error.message}`));
            }
          });
        },
      )
      .on("error", (error) => {
        reject(error);
      });
  });
}

async function main() {
  try {
    console.log("\n========================================");
    console.log("🔍 INSPECCIÓN DE RESPUESTA CRUDA");
    console.log("========================================\n");

    const rawResponse = await fetchAttributesRaw();

    console.log("📋 ESTRUCTURA DE LA RESPUESTA:");
    console.log(`   - Tipo: ${typeof rawResponse}`);
    console.log(`   - Claves principales:`, Object.keys(rawResponse));
    console.log("");

    const data = rawResponse.data || rawResponse;

    if (Array.isArray(data)) {
      console.log(`📊 DATOS: Array de ${data.length} elementos`);
      console.log("");

      // Inspeccionar primeros 3 registros completos
      console.log("📋 PRIMEROS 3 REGISTROS COMPLETOS:\n");

      data.slice(0, 3).forEach((item, i) => {
        console.log(`\n════════════ REGISTRO ${i + 1} ════════════`);
        console.log(JSON.stringify(item, null, 2));
        console.log("═══════════════════════════════════════\n");
      });

      // Verificar si existe el campo 'intervenciones'
      const tieneIntervenciones = data.some(
        (item) =>
          item.intervenciones ||
          (item.properties && item.properties.intervenciones),
      );
      console.log(
        `\n🔍 ¿Existe campo 'intervenciones'?: ${tieneIntervenciones}`,
      );

      if (tieneIntervenciones) {
        const itemConIntervenciones = data.find(
          (item) =>
            item.intervenciones ||
            (item.properties && item.properties.intervenciones),
        );
        console.log("\n📋 EJEMPLO CON INTERVENCIONES:");
        console.log(JSON.stringify(itemConIntervenciones, null, 2));
      }

      // Verificar campos críticos
      console.log("\n🔍 CAMPOS CRÍTICOS EN PRIMER REGISTRO:");
      const firstItem = data[0].properties || data[0];
      console.log(
        `   - n_intervenciones: ${firstItem.n_intervenciones} (tipo: ${typeof firstItem.n_intervenciones})`,
      );
      console.log(
        `   - frente_activo: ${firstItem.frente_activo} (tipo: ${typeof firstItem.frente_activo})`,
      );
      console.log(
        `   - estado: ${firstItem.estado} (tipo: ${typeof firstItem.estado})`,
      );
      console.log(
        `   - avance_obra: ${firstItem.avance_obra} (tipo: ${typeof firstItem.avance_obra})`,
      );
      console.log(
        `   - presupuesto_base: ${firstItem.presupuesto_base} (tipo: ${typeof firstItem.presupuesto_base})`,
      );
    } else {
      console.log("⚠️  Los datos no son un array");
      console.log(JSON.stringify(data, null, 2).slice(0, 500));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();

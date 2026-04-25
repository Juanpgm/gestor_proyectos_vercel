/**
 * Script de verificación para endpoints de empréstito usando backend real
 */

const API_BASE_URL = "http://localhost:3000/api/emprestito";

async function testBackendEndpoints() {
  console.log("🚀 Verificando endpoints de empréstito con backend real...");
  console.log(`🌐 Proxy URL: ${API_BASE_URL}`);
  console.log("=".repeat(60));

  const tests = [
    {
      name: "Proyecciones de Empréstito (Backend Real)",
      endpoint: "/leer-tabla-proyecciones",
      expectedFields: [
        "referencia_proceso",
        "valor_proyectado",
        "nombre_organismo_reducido",
      ],
    },
    {
      name: "Proyecciones Sin Proceso (Backend Real)",
      endpoint: "/proyecciones-sin-proceso",
      expectedFields: ["sin_proceso", "estado_proceso", "valor_proyectado"],
    },
    {
      name: "Órdenes de Compra (Backend Real)",
      endpoint: "/ordenes-compra",
      expectedFields: [
        "numero_orden",
        "nombre_centro_gestor",
        "valor_proyectado",
      ],
    },
  ];

  let successfulTests = 0;

  for (const test of tests) {
    console.log(`\n🧪 Probando: ${test.name}`);
    console.log(`📡 Endpoint: ${API_BASE_URL}${test.endpoint}`);

    try {
      const startTime = Date.now();

      // Usando fetch nativo de Node.js 18+
      const { default: fetch } = await import("node-fetch");

      const response = await fetch(`${API_BASE_URL}${test.endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Tiempo de respuesta: ${responseTime}ms`);
      console.log(`📄 Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          console.log(`✅ Conexión al backend exitosa`);
          console.log(`📊 Total registros: ${data.data?.length || 0}`);
          console.log(`🕒 Timestamp backend: ${data.timestamp}`);

          if (data.data && data.data.length > 0) {
            const firstRecord = data.data[0];
            console.log(
              `🔍 Campos en primer registro: ${Object.keys(firstRecord).length}`
            );

            // Verificar campos específicos
            const missingFields = test.expectedFields.filter(
              (field) => !(field in firstRecord)
            );
            if (missingFields.length === 0) {
              console.log(`✅ Todos los campos esperados presentes`);
            } else {
              console.log(`⚠️ Campos faltantes: ${missingFields.join(", ")}`);
            }

            // Mostrar valor si existe
            if (firstRecord.valor_proyectado) {
              console.log(
                `💰 Valor ejemplo: $${firstRecord.valor_proyectado.toLocaleString(
                  "es-CO"
                )}`
              );
            }

            console.log(
              `🏢 Organismo ejemplo: ${
                firstRecord.nombre_organismo_reducido || "N/A"
              }`
            );
          }

          successfulTests++;
        } else {
          console.log(
            `❌ Error del backend: ${data.error || "Error desconocido"}`
          );
          console.log(`📝 Mensaje: ${data.message || "Sin mensaje adicional"}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ HTTP Error: ${response.status}`);
        console.log(`📝 Detalle: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
    }
  }

  // Resumen
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN DE VERIFICACIÓN");
  console.log(`✅ Endpoints exitosos: ${successfulTests}/${tests.length}`);
  console.log(
    `❌ Endpoints fallidos: ${tests.length - successfulTests}/${tests.length}`
  );

  if (successfulTests === tests.length) {
    console.log(
      "🎉 ¡Todos los endpoints están funcionando con el backend real!"
    );
    console.log(
      "✨ Las proyecciones de empréstito obtienen datos actualizados"
    );
  } else {
    console.log("⚠️ Algunos endpoints presentan problemas");
  }

  console.log("=".repeat(60));
}

// Ejecutar verificación
testBackendEndpoints().catch(console.error);

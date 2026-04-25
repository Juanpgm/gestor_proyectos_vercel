/**
 * Script completo para probar todos los endpoints de Empréstito
 * Este script verifica la funcionalidad completa de los endpoints locales
 */

const API_BASE_URL = "http://localhost:3000/api/emprestito";

async function testCompleteEmprestitoAPI() {
  console.log("🚀 Iniciando pruebas completas de la API de Empréstito...");
  console.log(`🌐 Base URL: ${API_BASE_URL}`);
  console.log("=".repeat(60));

  const tests = [
    {
      name: "Proyecciones de Empréstito",
      endpoint: "/leer-tabla-proyecciones",
      expectedFields: [
        "referencia_proceso",
        "valor_proyectado",
        "nombre_organismo_reducido",
      ],
    },
    {
      name: "Proyecciones Sin Proceso",
      endpoint: "/proyecciones-sin-proceso",
      expectedFields: ["sin_proceso", "estado_proceso", "valor_proyectado"],
    },
    {
      name: "Órdenes de Compra",
      endpoint: "/ordenes-compra",
      expectedFields: [
        "numero_orden",
        "nombre_centro_gestor",
        "valor_proyectado",
      ],
    },
    {
      name: "Reportes de Contratos",
      endpoint: "/reportes_contratos",
      expectedFields: ["resumen", "por_estado", "por_entidad"],
    },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    await runSingleTest(test, (success) => {
      if (success) passedTests++;
    });
  }

  // Test específico de proceso por referencia
  await testSpecificProcess();

  // Resumen final
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN DE PRUEBAS");
  console.log(`✅ Exitosas: ${passedTests}/${totalTests}`);
  console.log(`❌ Fallidas: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log("🎉 ¡Todas las pruebas pasaron exitosamente!");
    console.log(
      '✨ Las "Proyecciones de Empréstito" están funcionando correctamente'
    );
  } else {
    console.log("⚠️ Algunas pruebas fallaron. Revisar logs anteriores.");
  }

  console.log("=".repeat(60));
}

async function runSingleTest(test, callback) {
  console.log(`\n🧪 Probando: ${test.name}`);
  console.log(`📡 Endpoint: ${API_BASE_URL}${test.endpoint}`);

  try {
    const startTime = Date.now();
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

      // Verificar estructura de respuesta
      if (data.success) {
        console.log(`✅ Respuesta exitosa`);
        console.log(`📊 Datos disponibles: ${data.data ? "Sí" : "No"}`);

        if (Array.isArray(data.data)) {
          console.log(`📈 Total registros: ${data.data.length}`);

          if (data.data.length > 0) {
            const firstRecord = data.data[0];
            console.log(
              `🔍 Campos disponibles en primer registro: ${
                Object.keys(firstRecord).length
              }`
            );

            // Verificar campos esperados
            const missingFields = test.expectedFields.filter(
              (field) => !(field in firstRecord)
            );
            if (missingFields.length === 0) {
              console.log(`✅ Todos los campos esperados están presentes`);
            } else {
              console.log(`⚠️ Campos faltantes: ${missingFields.join(", ")}`);
            }

            // Mostrar muestra de valores importantes
            if (firstRecord.valor_proyectado) {
              const valor = new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(firstRecord.valor_proyectado);
              console.log(`💰 Valor ejemplo: ${valor}`);
            }
          }
        } else if (typeof data.data === "object") {
          console.log(
            `📊 Datos de objeto: ${Object.keys(data.data).length} propiedades`
          );
        }

        console.log(`🕒 Timestamp: ${data.timestamp}`);
        console.log(`📂 Fuente: ${data.source || "No especificada"}`);

        callback(true);
      } else {
        console.log(
          `❌ Respuesta con error: ${data.error || "Error desconocido"}`
        );
        console.log(`📝 Mensaje: ${data.message || "Sin mensaje"}`);
        callback(false);
      }
    } else {
      const errorText = await response
        .text()
        .catch(() => "No se pudo leer el error");
      console.log(`❌ HTTP Error: ${errorText}`);
      callback(false);
    }
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
    callback(false);
  }
}

async function testSpecificProcess() {
  console.log(`\n🧪 Prueba Especial: Proceso Específico`);

  try {
    // Primero obtener una lista de procesos para tener una referencia válida
    const proyeccionesResponse = await fetch(
      `${API_BASE_URL}/leer-tabla-proyecciones`
    );

    if (proyeccionesResponse.ok) {
      const proyeccionesData = await proyeccionesResponse.json();

      if (
        proyeccionesData.success &&
        proyeccionesData.data &&
        proyeccionesData.data.length > 0
      ) {
        const primeraProyeccion = proyeccionesData.data[0];
        const referenciaTest = primeraProyeccion.referencia_proceso;

        if (referenciaTest) {
          console.log(`📡 Probando proceso específico: ${referenciaTest}`);

          const procesoResponse = await fetch(
            `${API_BASE_URL}/proceso/${encodeURIComponent(referenciaTest)}`
          );

          if (procesoResponse.ok) {
            const procesoData = await procesoResponse.json();

            if (procesoData.success) {
              console.log(`✅ Proceso específico encontrado`);
              console.log(
                `🏢 Organismo: ${procesoData.data.nombre_organismo_reducido}`
              );
              console.log(`💰 Valor: ${procesoData.data.valor_proyectado}`);
              console.log(`📊 Estado: ${procesoData.data.estado_proceso}`);
            } else {
              console.log(
                `❌ Error en datos del proceso: ${procesoData.error}`
              );
            }
          } else {
            console.log(
              `❌ Error HTTP al obtener proceso: ${procesoResponse.status}`
            );
          }
        } else {
          console.log(`⚠️ No se encontró referencia de proceso para probar`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error en prueba de proceso específico: ${error.message}`);
  }
}

// Ejecutar las pruebas
testCompleteEmprestitoAPI().catch(console.error);

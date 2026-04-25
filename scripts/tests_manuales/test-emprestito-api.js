/**
 * Script para probar la API de Empréstito y verificar los valores de los procesos
 * Este script verifica los endpoints relacionados con proyecciones de empréstito
 */

const API_BASE_URL = "http://localhost:3000/api";

async function testEmprestitoEndpoints() {
  console.log("🔍 Probando endpoints locales de Empréstito...");
  console.log(`API Base URL: ${API_BASE_URL}`);

  const endpoints = [
    "/emprestito/leer-tabla-proyecciones",
    "/emprestito/proyecciones-sin-proceso",
    "/emprestito/ordenes-compra",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Probando: ${endpoint}`);
      const url = `${API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Éxito - Datos disponibles`);

        // Mostrar información específica según el endpoint
        if (endpoint.includes("proyecciones")) {
          if (data.data && Array.isArray(data.data)) {
            console.log(`   📊 Total proyecciones: ${data.data.length}`);
            if (data.data.length > 0) {
              const firstItem = data.data[0];
              console.log(
                `   💰 Valor proyectado ejemplo: ${
                  firstItem.valor_proyectado || "N/A"
                }`
              );
              console.log(
                `   🏢 Organismo ejemplo: ${
                  firstItem.nombre_organismo_reducido || "N/A"
                }`
              );
            }
          }
        }

        if (endpoint.includes("ordenes-compra")) {
          if (data.data && Array.isArray(data.data)) {
            console.log(`   📋 Total órdenes de compra: ${data.data.length}`);
          }
        }
      } else {
        const errorText = await response
          .text()
          .catch(() => "No se pudo leer el error");
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
  }

  // Probar endpoint específico para obtener valores de procesos
  console.log("\n🔍 Probando obtención de valores específicos...");
  await testGetProcesoValues();
}

async function testGetProcesoValues() {
  try {
    // Primero obtener proyecciones para tener referencias
    const proyeccionesUrl = `${API_BASE_URL}/emprestito/leer-tabla-proyecciones`;
    const proyeccionesResponse = await fetch(proyeccionesUrl);

    if (proyeccionesResponse.ok) {
      const proyeccionesData = await proyeccionesResponse.json();

      if (proyeccionesData.data && proyeccionesData.data.length > 0) {
        console.log("\n📊 Análisis de valores de procesos:");

        const proyeccionesConValor = proyeccionesData.data.filter(
          (p) => p.valor_proyectado && p.valor_proyectado > 0
        );
        const totalValor = proyeccionesData.data.reduce(
          (sum, p) => sum + (p.valor_proyectado || 0),
          0
        );

        console.log(`   Total proyecciones: ${proyeccionesData.data.length}`);
        console.log(`   Con valor definido: ${proyeccionesConValor.length}`);
        console.log(
          `   Valor total: ${new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(totalValor)}`
        );

        // Mostrar muestra de valores
        console.log("\n📋 Muestra de valores de procesos:");
        proyeccionesData.data.slice(0, 5).forEach((p, i) => {
          const valor = p.valor_proyectado || 0;
          const valorFormateado = new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(valor);

          console.log(
            `   ${i + 1}. ${
              p.referencia_proceso || "Sin ref"
            } - ${valorFormateado}`
          );
          console.log(
            `      Organismo: ${p.nombre_organismo_reducido || "N/A"}`
          );
          console.log(`      Banco: ${p.nombre_banco || "N/A"}`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Error obteniendo valores: ${error.message}`);
  }
}

async function testSpecificProcesoValue(referenciaProceso) {
  console.log(
    `\n🔍 Probando valor específico para proceso: ${referenciaProceso}`
  );

  try {
    const procesoUrl = `${API_BASE_URL}/emprestito/proceso/${referenciaProceso}`;
    const response = await fetch(procesoUrl);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Datos del proceso obtenidos:");
      console.log(`   Referencia: ${data.referencia_proceso || "N/A"}`);
      console.log(`   Valor: ${data.valor_proyectado || "N/A"}`);
      console.log(`   Estado: ${data.estado_proceso || "N/A"}`);

      return data;
    } else {
      console.log(
        `❌ Error obteniendo proceso: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
  }

  return null;
}

// Ejecutar las pruebas
testEmprestitoEndpoints()
  .then(() => {
    console.log("\n✅ Pruebas completadas");
  })
  .catch((error) => {
    console.error("❌ Error en las pruebas:", error);
  });

/**
 * Script de prueba para los endpoints de Quality Control
 * Prueba la conectividad con la API de Unidades de Proyecto
 */

const API_BASE_URL = "https://gestorproyectoapi-production.up.railway.app";

const endpoints = [
  {
    name: "Quality Control Summary (Unidades Proyecto)",
    url: `${API_BASE_URL}/unidades-proyecto/quality-control-summary`,
    method: "GET",
  },
  {
    name: "Quality Control Summary",
    url: `${API_BASE_URL}/quality-control/summary`,
    method: "GET",
  },
  {
    name: "Quality Control Records",
    url: `${API_BASE_URL}/quality-control/records`,
    method: "GET",
  },
  {
    name: "Quality Control Changelog",
    url: `${API_BASE_URL}/quality-control/changelog`,
    method: "GET",
  },
  {
    name: "Quality Control Metadata",
    url: `${API_BASE_URL}/quality-control/metadata`,
    method: "GET",
  },
  {
    name: "Quality Control Stats",
    url: `${API_BASE_URL}/quality-control/stats`,
    method: "GET",
  },
  {
    name: "Quality Control by Centro Gestor (ejemplo: 1)",
    url: `${API_BASE_URL}/quality-control/by-centro-gestor/1`,
    method: "GET",
  },
];

async function testEndpoint(endpoint) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📡 Probando: ${endpoint.name}`);
  console.log(`🔗 URL: ${endpoint.url}`);
  console.log(`📤 Método: ${endpoint.method}`);

  try {
    const startTime = Date.now();
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Tiempo de respuesta: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log(`✅ Respuesta exitosa`);
        console.log(
          `📦 Tipo de dato: ${Array.isArray(data) ? "Array" : typeof data}`
        );

        if (Array.isArray(data)) {
          console.log(`📊 Cantidad de elementos: ${data.length}`);
          if (data.length > 0) {
            console.log(`🔍 Primer elemento:`);
            console.log(JSON.stringify(data[0], null, 2));
          }
        } else {
          console.log(`📄 Datos recibidos:`);
          console.log(JSON.stringify(data, null, 2));
        }
      } else {
        const text = await response.text();
        console.log(`✅ Respuesta exitosa (no JSON)`);
        console.log(
          `📄 Contenido: ${text.substring(0, 200)}${
            text.length > 200 ? "..." : ""
          }`
        );
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error en la respuesta`);
      console.log(`📄 Detalles del error:`);
      console.log(errorText.substring(0, 500));
    }
  } catch (error) {
    console.log(`❌ Error al realizar la petición`);
    console.log(`🔴 Tipo de error: ${error.name}`);
    console.log(`📝 Mensaje: ${error.message}`);
    console.log(`📚 Stack:`, error.stack);
  }
}

async function testAllEndpoints() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 INICIANDO PRUEBAS DE ENDPOINTS - QUALITY CONTROL");
  console.log("=".repeat(70));
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  console.log(`⏰ Fecha: ${new Date().toLocaleString("es-CO")}`);

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    // Pequeña pausa entre peticiones
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n" + "=".repeat(70));
  console.log("✨ PRUEBAS COMPLETADAS");
  console.log("=".repeat(70) + "\n");
}

// Ejecutar pruebas
testAllEndpoints().catch((error) => {
  console.error("💥 Error fatal en las pruebas:", error);
  process.exit(1);
});

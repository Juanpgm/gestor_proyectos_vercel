#!/usr/bin/env node

/**
 * Script para probar los endpoints de Unidades de Proyecto
 * Verifica que los endpoints estén funcionando correctamente después de limpiar el cache
 */

const http = require("http");

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const ENDPOINTS = [
  "/api/proxy/unidades-proyecto/geometry",
  "/api/proxy/unidades-proyecto/attributes",
  "/api/proxy/unidades-proyecto/filters",
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${endpoint}?_t=${Date.now()}`;

    console.log(`🔍 Probando: ${endpoint}`);

    const req = http.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const hasData = Array.isArray(parsed)
            ? parsed.length > 0
            : (parsed.features && parsed.features.length > 0) ||
              parsed.estados ||
              parsed.tipos_intervencion;

          console.log(
            `✅ ${endpoint}: ${res.statusCode} - Datos: ${
              hasData ? "Sí" : "No"
            }`
          );
          console.log(
            `   Headers Cache: ${res.headers["cache-control"] || "N/A"}`
          );
          console.log(`   Timestamp: ${res.headers["x-timestamp"] || "N/A"}`);

          resolve({
            endpoint,
            status: res.statusCode,
            hasData,
            cacheControl: res.headers["cache-control"],
            timestamp: res.headers["x-timestamp"],
          });
        } catch (error) {
          console.log(`❌ ${endpoint}: Error parsing JSON - ${error.message}`);
          resolve({
            endpoint,
            status: res.statusCode,
            error: error.message,
            hasData: false,
          });
        }
      });
    });

    req.on("error", (error) => {
      console.log(`❌ ${endpoint}: Network error - ${error.message}`);
      resolve({
        endpoint,
        error: error.message,
        hasData: false,
      });
    });

    req.setTimeout(10000, () => {
      console.log(`⏱️ ${endpoint}: Timeout`);
      req.destroy();
      resolve({
        endpoint,
        error: "Timeout",
        hasData: false,
      });
    });
  });
}

async function testAllEndpoints() {
  console.log("🧪 Probando endpoints de Unidades de Proyecto...\n");

  const results = [];

  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(""); // Línea en blanco entre tests
  }

  console.log("📊 Resumen de resultados:");
  console.log("========================");

  let allOk = true;
  results.forEach((result) => {
    const status = result.error
      ? "❌ ERROR"
      : result.status === 200
      ? "✅ OK"
      : `⚠️ ${result.status}`;

    console.log(`${status} ${result.endpoint}`);

    if (result.error || result.status !== 200) {
      allOk = false;
    }
  });

  console.log("");
  if (allOk) {
    console.log("🎉 Todos los endpoints están funcionando correctamente!");
  } else {
    console.log(
      "⚠️ Algunos endpoints tienen problemas. Verifica la configuración."
    );
  }

  return results;
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  testAllEndpoints().catch(console.error);
}

module.exports = { testAllEndpoints, testEndpoint };

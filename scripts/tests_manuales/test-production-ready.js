#!/usr/bin/env node

/**
 * Test completo de producción - Verificar que todo funcione
 */

const https = require("https");

console.log("🧪 TEST COMPLETO DE PRODUCCIÓN");
console.log("=".repeat(40));

async function testProductionLogin() {
  console.log("\n1. 🌐 Probando backend directo...");

  try {
    const testData = {
      email: "testuser@cali.gov.co",
      password: "TestPass123!!",
    };

    await makeRequest(
      "gestorproyectoapi-production.up.railway.app",
      "/auth/login",
      "POST",
      testData,
    );

    console.log("\n2. 📝 Probando registro...");

    const registerData = {
      email: "production-test@cali.gov.co",
      password: "ProductionTest123!!",
      confirmPassword: "ProductionTest123!!",
      name: "Production Test User",
      cellphone: "1234567890",
      nombre_centro_gestor: "Test Centro Gestor",
    };

    await makeRequest(
      "gestorproyectoapi-production.up.railway.app",
      "/auth/register",
      "POST",
      registerData,
    );
  } catch (error) {
    console.log(`❌ Error en test: ${error.message}`);
  }
}

function makeRequest(hostname, path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": postData.length,
        "User-Agent": "Production-Test/1.0",
      },
    };

    console.log(`🔗 ${method} https://${hostname}${path}`);

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log(`📊 Status: ${res.statusCode}`);

        try {
          const jsonResponse = JSON.parse(responseData);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${method} ${path}: ÉXITO`);

            if (jsonResponse.user) {
              console.log(`👤 Usuario: ${jsonResponse.user.email || "N/A"}`);
            }

            if (jsonResponse.success !== undefined) {
              console.log(`🎯 Success: ${jsonResponse.success}`);
            }
          } else {
            console.log(`❌ ${method} ${path}: ERROR ${res.statusCode}`);
            console.log(
              `📄 Error: ${jsonResponse.error || jsonResponse.detail || "Unknown error"}`,
            );
          }
        } catch (parseError) {
          console.log(
            `⚠️ No JSON response: ${responseData.substring(0, 100)}...`,
          );
        }

        resolve();
      });
    });

    req.on("error", (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      reject(error);
    });

    req.on("timeout", () => {
      console.log("❌ Request timeout");
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.setTimeout(10000); // 10 second timeout
    req.write(postData);
    req.end();
  });
}

console.log("🚀 Iniciando test de producción...");
console.log("📝 Verificando que el backend funcione correctamente");

testProductionLogin()
  .then(() => {
    console.log("\n" + "=".repeat(40));
    console.log("✅ Test de producción completado");
    console.log("\n💡 PASOS SIGUIENTES:");
    console.log("1. Configurar variables en Vercel (ver VERCEL_ENV_SETUP.md)");
    console.log("2. Redeplegar la aplicación");
    console.log("3. Probar: https://tu-app.vercel.app/debug-production.html");
    console.log("4. Intentar login en: https://tu-app.vercel.app");
  })
  .catch((error) => {
    console.log(`\n❌ Test falló: ${error.message}`);
  });

// Prueba directa del endpoint para verificar el problema
const API_CONFIG = {
  BASE_URL: "https://gestorproyectoapi-production.up.railway.app",
};

async function testEndpointDirectly() {
  console.log("🎯 PRUEBA DIRECTA DEL ENDPOINT\n");

  // Primero probar con credenciales que sabemos que funcionan
  console.log("1️⃣ Probando con credenciales que FUNCIONAN:");
  await testCredentials("testunico1759577712158@testmail.com", "TestPass123!");

  console.log("\n" + "=".repeat(60) + "\n");

  // Luego probar con las credenciales que están causando problema
  console.log("2️⃣ Probando con credenciales que FALLAN:");
  await testCredentials("juan.guzman@cali.gov.co", "Sakura13!");

  console.log("\n" + "=".repeat(60) + "\n");

  // Probar también con un usuario que sabemos que no existe
  console.log("3️⃣ Probando con usuario INEXISTENTE:");
  await testCredentials("usuario.noexiste@test.com", "password123");
}

async function testCredentials(email, password) {
  console.log(`📧 Email: ${email}`);
  console.log(`🔐 Password: ${password.substring(0, 3)}***`);
  console.log();

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log(`📊 Status: ${response.status} (${response.statusText})`);

    const data = await response.json();
    console.log("📨 Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log("✅ RESULTADO: LOGIN EXITOSO");
      console.log(`👤 Usuario: ${data.user?.display_name || data.user?.email}`);
    } else if (response.status === 401) {
      console.log("❌ RESULTADO: CREDENCIALES INVÁLIDAS");
      console.log(
        `🚫 Error: ${data.detail?.error || data.error || "Error desconocido"}`
      );
    } else if (response.status === 500) {
      console.log("💥 RESULTADO: ERROR INTERNO DEL SERVIDOR");
      console.log(`🚫 Error: ${data.error || data.message || "Error interno"}`);
      console.log("⚠️  ESTO INDICA UN PROBLEMA EN EL BACKEND");
    } else {
      console.log(`❓ RESULTADO: ERROR INESPERADO (${response.status})`);
      console.log(
        `🚫 Error: ${data.error || data.message || "Error desconocido"}`
      );
    }
  } catch (error) {
    console.error("💥 ERROR DE CONEXIÓN:");
    console.error(`   ${error.message}`);
  }

  console.log();
}

testEndpointDirectly();

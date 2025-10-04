// Test específico para verificar el fix del backend
const API_CONFIG = {
  BASE_URL: "https://gestorproyectoapi-production.up.railway.app",
};

async function testBackendFix() {
  console.log("🔧 VERIFICANDO FIX DEL BACKEND\n");

  console.log("📊 Probando múltiples veces el usuario problemático...");

  const loginData = {
    email: "juan.guzman@cali.gov.co",
    password: "Sakura13!",
  };

  for (let i = 1; i <= 3; i++) {
    console.log(`\n🧪 Intento ${i}/3:`);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      console.log(`   Status: ${response.status}`);

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("   ✅ ÉXITO! El fix funciona");
        console.log(
          `   👤 Usuario: ${data.user?.display_name || data.user?.email}`
        );
        console.log(`   🏢 Centro: ${data.user?.custom_claims?.centro_gestor}`);
        break;
      } else if (response.status === 500) {
        console.log("   ❌ Aún da error 500");
        console.log(`   🚫 Error: ${data.error || data.message}`);
      } else if (response.status === 401) {
        console.log("   🔒 Error 401 - Credenciales incorrectas");
        console.log(`   🚫 Error: ${data.detail?.error || data.error}`);
        break; // Si es 401, no tiene sentido seguir intentando
      }
    } catch (error) {
      console.log(`   💥 Error de conexión: ${error.message}`);
    }

    // Esperar un poco entre intentos
    if (i < 3) {
      console.log("   ⏳ Esperando 2 segundos...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n🎯 RESULTADO FINAL:");
  console.log("Si sigue dando error 500:");
  console.log("1. El servidor backend necesita reiniciarse");
  console.log("2. El fix no se deployó correctamente");
  console.log("3. Hay que revisar los logs del servidor");
  console.log("\nSi funciona:");
  console.log("✅ El problema está resuelto y el frontend debería funcionar");
}

testBackendFix();

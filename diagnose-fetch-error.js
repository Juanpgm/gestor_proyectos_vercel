// Script de diagnóstico para el error "Failed to fetch"
const API_CONFIG = {
  BASE_URL: "https://gestorproyectoapi-production.up.railway.app",
};

async function diagnoseFetchError() {
  console.log("🔍 DIAGNOSTICANDO ERROR 'Failed to fetch'\n");

  const loginData = {
    email: "juan.guzman@cali.gov.co", // Las credenciales que estás usando
    password: "Sakura13!",
  };

  console.log("📋 DATOS DE PRUEBA:");
  console.log("   Email:", loginData.email);
  console.log("   Password: [OCULTO]");
  console.log("   URL:", `${API_CONFIG.BASE_URL}/auth/login`);
  console.log();

  try {
    console.log("🌐 Probando conectividad con el servidor...");

    // Primero, probar conectividad básica
    const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: "GET",
    });

    console.log("   Health check status:", healthResponse.status);
    console.log("   Health check ok:", healthResponse.ok);

    if (!healthResponse.ok) {
      console.log("❌ El servidor no responde correctamente");
      return;
    }

    console.log("✅ Servidor accesible, probando login...\n");

    // Ahora probar el login
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    console.log("📊 RESPUESTA DEL LOGIN:");
    console.log("   Status:", response.status);
    console.log("   StatusText:", response.statusText);
    console.log("   OK:", response.ok);
    console.log();

    const data = await response.json();
    console.log("📨 DATOS RECIBIDOS:");
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log("\n❌ LOGIN FALLIDO:");
      if (response.status === 401) {
        console.log("   🚫 Error 401: Credenciales inválidas");
        if (data.detail?.error?.includes("Usuario no encontrado")) {
          console.log("   📝 El usuario no está registrado en el sistema");
        } else if (data.detail?.error?.includes("Contraseña incorrecta")) {
          console.log("   📝 La contraseña es incorrecta");
        }
      } else if (response.status === 422) {
        console.log("   🚫 Error 422: Datos de entrada inválidos");
      } else if (response.status === 500) {
        console.log("   🚫 Error 500: Error interno del servidor");
      }
    } else {
      console.log("\n✅ LOGIN EXITOSO:");
      console.log(
        "   👤 Usuario:",
        data.user?.display_name || data.user?.email
      );
      console.log("   🎯 El frontend debería permitir acceso");
    }
  } catch (error) {
    console.error("\n💥 ERROR DE CONEXIÓN:");
    console.error("   Tipo:", error.name);
    console.error("   Mensaje:", error.message);
    console.error("   Stack:", error.stack);

    console.log("\n🔧 POSIBLES CAUSAS:");
    console.log("   1. Problemas de CORS");
    console.log("   2. El servidor está caído");
    console.log("   3. Problemas de red/firewall");
    console.log("   4. SSL/TLS issues");
    console.log("   5. El navegador está bloqueando la petición");
  }
}

diagnoseFetchError();

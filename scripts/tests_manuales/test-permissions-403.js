// Test para diagnosticar el problema de permisos 403
const { default: fetch } = require("node-fetch");

const BACKEND_URL = "https://gestorproyectoapi-production.up.railway.app";

// Credenciales de prueba (usuario creado en Firebase)
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

async function diagnosePermissions() {
  console.log("=".repeat(60));
  console.log("🔍 DIAGNÓSTICO DE PERMISOS - ERROR 403");
  console.log("=".repeat(60));
  console.log("");

  try {
    // 1. Login
    console.log("1️⃣ Intentando login...");
    const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      console.log("❌ Login falló:", loginData);
      return;
    }

    console.log("✅ Login exitoso");
    console.log("");

    // 2. Verificar custom_token
    console.log("2️⃣ Verificando custom_token...");
    if (!loginData.custom_token) {
      console.log("❌ No se recibió custom_token");
      console.log("Respuesta completa:", JSON.stringify(loginData, null, 2));
      return;
    }
    console.log("✅ custom_token recibido");
    console.log("");

    // 3. Verificar roles del usuario
    console.log("3️⃣ Roles y permisos del usuario:");
    console.log("- Email:", loginData.user.email);
    console.log("- UID:", loginData.user.uid);
    console.log("- Roles:", JSON.stringify(loginData.user.roles || []));
    console.log(
      "- Permisos:",
      JSON.stringify(loginData.user.permissions || []),
    );
    console.log("");

    // 4. Verificar si tiene super_admin
    const hasSuperAdmin = loginData.user.roles?.includes("super_admin");
    console.log(
      "4️⃣ ¿Tiene rol super_admin?",
      hasSuperAdmin ? "✅ SÍ" : "❌ NO",
    );
    console.log("");

    if (!hasSuperAdmin) {
      console.log("🚨 PROBLEMA ENCONTRADO:");
      console.log("");
      console.log('El usuario NO tiene el rol "super_admin".');
      console.log("Solo usuarios con rol super_admin pueden:");
      console.log("  - Asignar roles a otros usuarios");
      console.log("  - Actualizar información de usuarios");
      console.log("  - Gestionar permisos");
      console.log("");
      console.log("✅ SOLUCIÓN:");
      console.log("");
      console.log(
        "Opción 1: Asignar rol super_admin directamente en Firebase:",
      );
      console.log("  1. Ir a Firebase Console → Firestore");
      console.log("  2. Colección: usuarios");
      console.log("  3. Documento con UID:", loginData.user.uid);
      console.log('  4. Editar campo "roles"');
      console.log('  5. Agregar "super_admin" al array de roles');
      console.log("");
      console.log("Opción 2: Usar script del backend:");
      console.log(
        "  python scripts/assign_super_admin.py",
        loginData.user.email,
      );
      console.log("");
      console.log("Opción 3: Crear nuevo usuario super_admin:");
      console.log("  python scripts/create_super_admin.py");
      console.log("");
      return;
    }

    // 5. Test de endpoint protegido
    console.log("5️⃣ Probando endpoint protegido...");

    // Necesitaríamos el id_token aquí, pero para diagnóstico
    // solo verificamos si el custom_token está presente
    console.log("✅ Usuario tiene permisos de super_admin");
    console.log("");
    console.log("📋 SIGUIENTE PASO:");
    console.log("");
    console.log("El frontend debe:");
    console.log("1. Usar signInWithCustomToken(custom_token) con Firebase SDK");
    console.log("2. Obtener id_token con user.getIdToken()");
    console.log(
      "3. Usar id_token en header Authorization de todas las peticiones",
    );
    console.log("");
    console.log("Si el error 403 persiste, verifica que:");
    console.log("- El id_token se está enviando correctamente");
    console.log("- El token no ha expirado (válido por 1 hora)");
    console.log("- Firebase Auth SDK está configurado correctamente");
  } catch (error) {
    console.error("❌ Error en diagnóstico:", error.message);
  }

  console.log("");
  console.log("=".repeat(60));
}

// Ejecutar diagnóstico
diagnosePermissions();

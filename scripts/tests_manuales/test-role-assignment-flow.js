/**
 * Script de prueba para verificar el flujo completo de asignación de roles
 *
 * Este script simula el flujo completo:
 * 1. Login del usuario
 * 2. Verificación del token
 * 3. Llamada a la API de asignación de roles
 * 4. Verificación de la respuesta
 */

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://backend-cumplimiento-unidad-bfn0.onrender.com";

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function login(email, password) {
  console.log("\n🔐 Intentando login...");

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Login falló: ${error.error || error.message || JSON.stringify(error)}`
    );
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(
      `Login falló: ${data.error || data.message || "Error desconocido"}`
    );
  }

  console.log("✅ Login exitoso");
  console.log("   Email:", data.user.email);
  console.log("   UID:", data.user.uid);
  console.log(
    "   Roles:",
    data.user.roles || data.user.firestore_data?.roles || "Sin roles"
  );
  console.log(
    "   Token presente:",
    !!(data.id_token || data.idToken || data.token)
  );

  return {
    user: data.user,
    token: data.id_token || data.idToken || data.token || data.user.uid,
  };
}

async function validateToken(token) {
  console.log("\n🔍 Validando token...");
  console.log("   Token:", token.substring(0, 20) + "...");

  const response = await fetch(`${API_BASE_URL}/auth/validate-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id_token: token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Validación falló: ${
        error.error || error.message || JSON.stringify(error)
      }`
    );
  }

  const data = await response.json();
  console.log("✅ Token válido");
  return data;
}

async function listUsers(token) {
  console.log("\n📋 Listando usuarios...");

  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Listar usuarios falló: ${
        error.error || error.message || JSON.stringify(error)
      }`
    );
  }

  const data = await response.json();
  const users = data.users || data.data || [];

  console.log(`✅ ${users.length} usuarios encontrados`);

  if (users.length > 0) {
    console.log("\n   Usuarios disponibles:");
    users.slice(0, 5).forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.email} (${user.uid})`);
      console.log(`      Roles: ${user.roles?.join(", ") || "Sin roles"}`);
    });
    if (users.length > 5) {
      console.log(`   ... y ${users.length - 5} más`);
    }
  }

  return users;
}

async function assignRoles(token, uid, roles, reason) {
  console.log("\n💾 Asignando roles...");
  console.log("   Usuario:", uid);
  console.log("   Roles:", roles.join(", "));
  console.log("   Razón:", reason || "N/A");

  const response = await fetch(
    `${API_BASE_URL}/auth/admin/users/${uid}/roles`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roles, reason }),
    }
  );

  console.log("   Status:", response.status);

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Error en la asignación:");
    console.error("   Status:", response.status);
    console.error("   Response:", JSON.stringify(data, null, 2));
    throw new Error(
      `Asignación falló: ${
        data.error || data.message || data.detail || JSON.stringify(data)
      }`
    );
  }

  console.log("✅ Roles asignados exitosamente");
  console.log("   Respuesta:", JSON.stringify(data, null, 2));

  return data;
}

async function main() {
  try {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║  Test de Asignación de Roles - Flujo Completo         ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log();
    console.log("Este script probará el flujo completo de asignación de roles");
    console.log("API Base URL:", API_BASE_URL);
    console.log();

    // Paso 1: Login
    const email = await question("Email del administrador: ");
    const password = await question("Contraseña: ");

    const { user, token } = await login(email, password);

    // Paso 2: Validar token
    await validateToken(token);

    // Paso 3: Listar usuarios
    const users = await listUsers(token);

    if (users.length === 0) {
      console.log("\n⚠️  No hay usuarios disponibles para asignar roles");
      rl.close();
      return;
    }

    // Paso 4: Asignar roles
    console.log("\n");
    const continuar = await question(
      "¿Deseas asignar roles a un usuario? (s/n): "
    );

    if (continuar.toLowerCase() !== "s") {
      console.log("\n👋 Test completado sin asignar roles");
      rl.close();
      return;
    }

    const targetUid = await question("\nUID del usuario a modificar: ");
    const rolesInput = await question("Roles a asignar (separados por coma): ");
    const roles = rolesInput
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r);
    const reason = await question("Razón (opcional): ");

    if (roles.length === 0) {
      console.log("\n⚠️  No se especificaron roles");
      rl.close();
      return;
    }

    await assignRoles(token, targetUid, roles, reason);

    console.log("\n✅ Test completado exitosamente");
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("DIAGNÓSTICO:");
    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ Login funciona correctamente");
    console.log("✅ Token se valida correctamente");
    console.log("✅ Listar usuarios funciona");
    console.log("✅ Asignación de roles funciona");
    console.log("═══════════════════════════════════════════════════════");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n═══════════════════════════════════════════════════════");
    console.error("DIAGNÓSTICO:");
    console.error("═══════════════════════════════════════════════════════");

    if (error.message.includes("Login falló")) {
      console.error("❌ El login falló - verifica las credenciales");
    } else if (error.message.includes("Validación falló")) {
      console.error("❌ El token no es válido - problema de autenticación");
    } else if (error.message.includes("Listar usuarios falló")) {
      console.error("❌ Error al listar usuarios - problema de permisos o API");
    } else if (error.message.includes("Asignación falló")) {
      console.error("❌ Error al asignar roles:");
      if (error.message.includes("401")) {
        console.error("   • Token inválido o expirado");
      } else if (error.message.includes("403")) {
        console.error(
          "   • Sin permisos suficientes (necesitas rol super_admin)"
        );
      } else if (error.message.includes("404")) {
        console.error("   • Usuario no encontrado");
      }
    }

    console.error("═══════════════════════════════════════════════════════");
  } finally {
    rl.close();
  }
}

main();

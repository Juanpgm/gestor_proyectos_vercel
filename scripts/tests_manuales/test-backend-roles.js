/**
 * Test para verificar qué roles devuelve el backend para el usuario
 */

const API_URL = "https://gestorproyectoapi-production.up.railway.app";

async function testBackendRoles() {
  console.log("🔍 Testing backend roles response...\n");

  // Solicitar credenciales
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const email = await new Promise((resolve) => {
    rl.question("Email: ", resolve);
  });

  const password = await new Promise((resolve) => {
    rl.question("Password: ", resolve);
  });

  rl.close();

  try {
    console.log("\n📡 Sending login request to:", `${API_URL}/auth/login`);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("📊 Response status:", response.status);

    const data = await response.json();

    console.log("\n✅ Full response:");
    console.log(JSON.stringify(data, null, 2));

    if (data.user) {
      console.log("\n👤 User data:");
      console.log("  Email:", data.user.email);
      console.log("  Name:", data.user.display_name || data.user.name);
      console.log("  Roles (direct):", data.user.roles);
      console.log("  Permissions (direct):", data.user.permissions);

      if (data.user.custom_claims) {
        console.log("\n🔐 Custom claims:");
        console.log("  Roles:", data.user.custom_claims.roles);
        console.log("  Permissions:", data.user.custom_claims.permissions);
      }

      // Verificar si tiene super_admin
      const hasDirectRoles =
        Array.isArray(data.user.roles) && data.user.roles.length > 0;
      const hasClaimRoles =
        data.user.custom_claims?.roles &&
        Array.isArray(data.user.custom_claims.roles) &&
        data.user.custom_claims.roles.length > 0;

      const roles = data.user.roles || data.user.custom_claims?.roles || [];
      const isSuperAdmin = roles.includes("super_admin");

      console.log("\n🎯 Analysis:");
      console.log("  Has direct roles:", hasDirectRoles);
      console.log("  Has custom_claims roles:", hasClaimRoles);
      console.log("  Final roles array:", roles);
      console.log("  Is super_admin:", isSuperAdmin);

      if (!isSuperAdmin) {
        console.log("\n⚠️  WARNING: User is NOT super_admin!");
        console.log("  Available roles:", roles.join(", ") || "none");
      } else {
        console.log("\n✅ User IS super_admin");
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

testBackendRoles();

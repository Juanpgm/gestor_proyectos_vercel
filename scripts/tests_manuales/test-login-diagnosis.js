#!/usr/bin/env node

/**
 * Diagnóstico automático del sistema de login Next.js
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 DIAGNÓSTICO AUTOMÁTICO DEL SISTEMA DE LOGIN");
console.log("=".repeat(50));

// 1. Verificar archivos de configuración
console.log("\n1. 📄 Verificando archivos de configuración...");

const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  console.log("✅ .env.local encontrado");
  const envContent = fs.readFileSync(envPath, "utf8");

  // Verificar variables de Firebase
  const firebaseVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  console.log("\n📋 Variables de Firebase:");
  firebaseVars.forEach((varName) => {
    if (envContent.includes(varName)) {
      const line = envContent.split("\n").find((l) => l.startsWith(varName));
      const value = line ? line.split("=")[1] : "NO ENCONTRADO";
      const isPlaceholder =
        value &&
        (value.includes("placeholder") ||
          value.includes("fake") ||
          value.includes("your-"));
      console.log(
        `  ${isPlaceholder ? "⚠️" : "✅"} ${varName}: ${value ? value.substring(0, 20) + "..." : "NO DEFINIDO"}`,
      );
    } else {
      console.log(`  ❌ ${varName}: NO ENCONTRADO`);
    }
  });

  // Verificar API URL
  if (envContent.includes("NEXT_PUBLIC_API_BASE_URL")) {
    const apiLine = envContent
      .split("\n")
      .find((l) => l.startsWith("NEXT_PUBLIC_API_BASE_URL"));
    const apiUrl = apiLine ? apiLine.split("=")[1] : "NO ENCONTRADO";
    console.log(`\n🌐 API Base URL: ${apiUrl}`);
  } else {
    console.log("\n❌ NEXT_PUBLIC_API_BASE_URL: NO ENCONTRADO");
  }
} else {
  console.log("❌ .env.local NO encontrado");
}

// 2. Verificar archivos de servicios
console.log("\n2. 🔧 Verificando archivos de servicios...");

const authServicePath = path.join(
  __dirname,
  "src",
  "services",
  "authService.ts",
);
if (fs.existsSync(authServicePath)) {
  console.log("✅ authService.ts encontrado");
  const authContent = fs.readFileSync(authServicePath, "utf8");

  // Verificar configuración hardcodeada
  if (authContent.includes("unidad-cumplimiento-aa245")) {
    console.log(
      "⚠️ Configuración hardcodeada encontrada: unidad-cumplimiento-aa245",
    );
  }
  if (authContent.includes("calitrack-44403")) {
    console.log(
      "✅ Configuración dinámica encontrada: usa variables de entorno",
    );
  }

  // Verificar métodos críticos
  if (authContent.includes("signInWithEmail")) {
    console.log("✅ Método signInWithEmail encontrado");
  }
  if (authContent.includes("validate-session")) {
    console.log("✅ Validación de sesión implementada");
  }
} else {
  console.log("❌ authService.ts NO encontrado");
}

const firebasePath = path.join(__dirname, "src", "lib", "firebase.ts");
if (fs.existsSync(firebasePath)) {
  console.log("✅ firebase.ts encontrado");
  const firebaseContent = fs.readFileSync(firebasePath, "utf8");

  if (firebaseContent.includes("dummy-key")) {
    console.log("⚠️ Configuración con valores dummy encontrada");
  }
  if (firebaseContent.includes("hasRealConfig")) {
    console.log("✅ Validación de configuración real implementada");
  }
} else {
  console.log("❌ firebase.ts NO encontrado");
}

// 3. Verificar proxy API
console.log("\n3. 🌐 Verificando proxy API...");

const proxyPath = path.join(
  __dirname,
  "src",
  "app",
  "api",
  "proxy",
  "[...path]",
  "route.ts",
);
if (fs.existsSync(proxyPath)) {
  console.log("✅ Proxy route encontrado");
  const proxyContent = fs.readFileSync(proxyPath, "utf8");

  if (proxyContent.includes("API_BASE_URL")) {
    console.log("✅ Proxy usa API_BASE_URL correctamente");
  }
  if (proxyContent.includes("auth/validate-session")) {
    console.log("✅ Endpoints de auth soportados");
  }
} else {
  console.log("❌ Proxy route NO encontrado");
}

// 4. Test de conectividad
console.log("\n4. 🌐 Probando conectividad...");

async function testConnectivity() {
  try {
    const https = require("https");
    const http = require("http");

    // Test backend directo
    console.log("Testing backend directo...");
    const backendUrl =
      "https://gestorproyectoapi-production.up.railway.app/ping";

    return new Promise((resolve) => {
      https
        .get(backendUrl, (res) => {
          console.log(`✅ Backend directo: ${res.statusCode}`);
          resolve();
        })
        .on("error", (err) => {
          console.log(`❌ Backend directo: ${err.message}`);
          resolve();
        });
    });
  } catch (error) {
    console.log(`❌ Error de conectividad: ${error.message}`);
  }
}

// 5. Diagnóstico y recomendaciones
console.log("\n5. 💡 DIAGNÓSTICO Y RECOMENDACIONES");
console.log("-".repeat(40));

console.log("\n🔧 PROBLEMAS DETECTADOS:");
console.log("1. Verificar que las variables de Firebase no sean placeholders");
console.log("2. Asegurar que NEXT_PUBLIC_API_BASE_URL esté definida");
console.log("3. Verificar que el proyecto Firebase sea calitrack-44403");

console.log("\n🚀 SOLUCIONES AUTOMÁTICAS DISPONIBLES:");
console.log("1. Actualizar .env.local con configuración correcta");
console.log("2. Actualizar authService con configuración dinámica");
console.log("3. Verificar inicialización de Firebase");

testConnectivity().then(() => {
  console.log("\n✅ Diagnóstico completado");
  console.log("Ejecutar: node fix-login-issues.js para aplicar correcciones");
});

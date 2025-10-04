#!/usr/bin/env node

/**
 * Script para validar la configuración de variables de entorno
 * Uso: node scripts/validate-env.js
 */

const fs = require("fs");
const path = require("path");

// Variables requeridas para el funcionamiento básico
const REQUIRED_VARS = ["NEXT_PUBLIC_API_BASE_URL"];

// Variables opcionales pero recomendadas
const OPTIONAL_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_APP_VERSION",
  "NEXT_PUBLIC_DEBUG_MODE",
];

// Colores para la consola
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironment() {
  log("\n🔍 Validando configuración de variables de entorno...\n", "blue");

  // Verificar si existe .env.local
  const envLocalPath = path.join(process.cwd(), ".env.local");
  const envExamplePath = path.join(process.cwd(), ".env.example");

  if (!fs.existsSync(envLocalPath)) {
    log("❌ Archivo .env.local no encontrado", "red");

    if (fs.existsSync(envExamplePath)) {
      log(
        "💡 Sugerencia: Copia .env.example a .env.local y configura tus valores",
        "yellow"
      );
      log("   cp .env.example .env.local\n", "yellow");
    }

    return false;
  }

  // Cargar variables de entorno desde .env.local
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && key.trim() && !key.startsWith("#")) {
      envVars[key.trim()] = valueParts.join("=").trim();
    }
  });

  let hasErrors = false;
  let hasWarnings = false;

  // Verificar variables requeridas
  log("📋 Variables requeridas:", "bold");
  REQUIRED_VARS.forEach((varName) => {
    const value = envVars[varName] || process.env[varName];
    if (!value || value === "your-value-here" || value.includes("your-")) {
      log(`   ❌ ${varName}: No configurada o usando valor de ejemplo`, "red");
      hasErrors = true;
    } else {
      log(`   ✅ ${varName}: Configurada`, "green");
    }
  });

  // Verificar variables opcionales
  log("\n📋 Variables opcionales (para funcionalidad completa):", "bold");
  OPTIONAL_VARS.forEach((varName) => {
    const value = envVars[varName] || process.env[varName];
    if (!value || value === "your-value-here" || value.includes("your-")) {
      log(`   ⚠️  ${varName}: No configurada`, "yellow");
      hasWarnings = true;
    } else {
      log(`   ✅ ${varName}: Configurada`, "green");
    }
  });

  // Verificar URLs
  log("\n🌐 Validación de URLs:", "bold");
  const apiUrl =
    envVars["NEXT_PUBLIC_API_BASE_URL"] ||
    process.env["NEXT_PUBLIC_API_BASE_URL"];
  if (apiUrl) {
    try {
      new URL(apiUrl);
      if (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1")) {
        log(`   ⚠️  API URL apunta a localhost: ${apiUrl}`, "yellow");
        log(
          "      Esto está bien para desarrollo, pero cambia para producción",
          "yellow"
        );
      } else {
        log(`   ✅ API URL válida: ${apiUrl}`, "green");
      }
    } catch (error) {
      log(`   ❌ API URL inválida: ${apiUrl}`, "red");
      hasErrors = true;
    }
  }

  // Verificar Firebase config si Google Auth está habilitado
  const firebaseVars = OPTIONAL_VARS.filter((v) => v.includes("FIREBASE"));
  const firebaseConfigured = firebaseVars.some(
    (v) => envVars[v] && !envVars[v].includes("your-")
  );

  if (firebaseConfigured) {
    log("\n🔥 Configuración de Firebase:", "bold");
    const missingFirebase = firebaseVars.filter(
      (v) => !envVars[v] || envVars[v].includes("your-")
    );
    if (missingFirebase.length > 0) {
      log(
        "   ⚠️  Google Auth puede no funcionar. Variables faltantes:",
        "yellow"
      );
      missingFirebase.forEach((v) => log(`      - ${v}`, "yellow"));
    } else {
      log("   ✅ Firebase completamente configurado", "green");
    }
  }

  // Resumen final
  log("\n📊 Resumen:", "bold");
  if (hasErrors) {
    log("❌ Hay errores críticos que deben solucionarse", "red");
    log("   La aplicación puede no funcionar correctamente", "red");
    return false;
  } else if (hasWarnings) {
    log(
      "⚠️  Configuración básica OK, pero hay funcionalidades que pueden no funcionar",
      "yellow"
    );
    log(
      "   La aplicación funcionará pero con funcionalidad limitada",
      "yellow"
    );
    return true;
  } else {
    log("✅ Configuración completa y correcta", "green");
    log("   La aplicación debería funcionar perfectamente", "green");
    return true;
  }
}

// Ejecutar validación
if (require.main === module) {
  const isValid = validateEnvironment();
  log("");
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateEnvironment };

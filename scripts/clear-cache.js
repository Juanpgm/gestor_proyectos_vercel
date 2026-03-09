#!/usr/bin/env node

/**
 * Script para limpiar caché de Next.js y Vercel
 */

const fs = require("fs");
const path = require("path");

const CACHE_DIRS = [".next", "node_modules/.cache", ".vercel/.cache"];

const CACHE_FILES = ["tsconfig.tsbuildinfo", ".env.local.cache"];

function removePathSafe(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.warn(`⚠️  No se pudo eliminar ${targetPath}: ${error.message}`);
    return false;
  }
}

function clearCache() {
  console.log("🧹 Limpiando caché de Next.js y Vercel...\n");

  // Limpiar directorios de caché
  CACHE_DIRS.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Eliminando: ${dir}`);
      removePathSafe(fullPath);
    } else {
      console.log(`✅ Ya limpio: ${dir}`);
    }
  });

  // Limpiar archivos de caché
  CACHE_FILES.forEach((file) => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Eliminando: ${file}`);
      removePathSafe(fullPath);
    } else {
      console.log(`✅ Ya limpio: ${file}`);
    }
  });

  console.log("\n✅ Caché limpiado completamente");
  console.log("💡 Ejecuta npm run dev para regenerar el caché");
}

clearCache();

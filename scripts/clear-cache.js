#!/usr/bin/env node

/**
 * Script para limpiar caché de Next.js y Vercel
 */

const fs = require("fs");
const path = require("path");

const CACHE_DIRS = [".next", "node_modules/.cache", ".vercel/.cache"];

const CACHE_FILES = ["tsconfig.tsbuildinfo", ".env.local.cache"];

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

function clearCache() {
  console.log("🧹 Limpiando caché de Next.js y Vercel...\n");

  // Limpiar directorios de caché
  CACHE_DIRS.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Eliminando: ${dir}`);
      deleteFolderRecursive(fullPath);
    } else {
      console.log(`✅ Ya limpio: ${dir}`);
    }
  });

  // Limpiar archivos de caché
  CACHE_FILES.forEach((file) => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Eliminando: ${file}`);
      fs.unlinkSync(fullPath);
    } else {
      console.log(`✅ Ya limpio: ${file}`);
    }
  });

  console.log("\n✅ Caché limpiado completamente");
  console.log("💡 Ejecuta npm run dev para regenerar el caché");
}

clearCache();

/**
 * Test para verificar qué backend URL está usando local vs producción
 * y comparar los datos que cada uno recibe
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verificarURLsYDatos() {
  log("\n🔍 VERIFICACIÓN DE URLs Y DATOS\n", "bright");
  log("=".repeat(80), "cyan");

  // 1. Backend Railway DIRECTO
  log("\n📡 1. BACKEND RAILWAY (Directo):", "cyan");
  try {
    const railwayUrl =
      "https://gestorproyectoapi-production.up.railway.app/emprestito/leer-tabla-proyecciones?solo_no_guardados=false";
    const railwayResp = await fetch(`${railwayUrl}&_nocache=${Date.now()}`);
    const railwayData = await railwayResp.json();

    const railwayConValor = railwayData.data.filter(
      (p) => p.valor_proyectado > 0
    ).length;

    log(`   URL: ${railwayUrl}`, "cyan");
    log(`   Registros: ${railwayData.data.length}`, "yellow");
    log(
      `   Con valor > 0: ${railwayConValor}`,
      railwayConValor > 0 ? "green" : "red"
    );
    log(`   Timestamp: ${railwayData.timestamp}`, "cyan");

    if (railwayConValor > 0) {
      const sample = railwayData.data.find((p) => p.valor_proyectado > 0);
      console.log(
        `   Ejemplo: Item ${
          sample.item
        } = $${sample.valor_proyectado.toLocaleString("es-CO")}`
      );
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, "red");
  }

  // 2. Servidor LOCAL
  log("\n📡 2. SERVIDOR LOCAL (Proxy):", "cyan");
  try {
    const localUrl = `http://localhost:3000/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=${Date.now()}`;
    const localResp = await fetch(localUrl, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    const localData = await localResp.json();

    const localConValor = localData.data.filter(
      (p) => p.valor_proyectado > 0
    ).length;

    log(`   URL: ${localUrl}`, "cyan");
    log(`   Registros: ${localData.data.length}`, "yellow");
    log(
      `   Con valor > 0: ${localConValor}`,
      localConValor > 0 ? "green" : "red"
    );
    log(`   Timestamp: ${localData.timestamp}`, "cyan");

    if (localConValor > 0) {
      log("\n   ✅ LOCAL TIENE VALORES CORRECTOS", "green");
      const sample = localData.data.find((p) => p.valor_proyectado > 0);
      console.log(
        `   Ejemplo: Item ${
          sample.item
        } = $${sample.valor_proyectado.toLocaleString("es-CO")}`
      );

      // Mostrar más ejemplos
      log("\n   📊 Top 5 valores en LOCAL:", "green");
      localData.data
        .filter((p) => p.valor_proyectado > 0)
        .sort((a, b) => b.valor_proyectado - a.valor_proyectado)
        .slice(0, 5)
        .forEach((p, i) => {
          console.log(
            `   ${i + 1}. Item ${p.item}: $${p.valor_proyectado.toLocaleString(
              "es-CO"
            )}`
          );
        });
    } else {
      log("\n   ❌ Local también muestra ceros", "red");
    }

    // Comparar si backend_url viene en la respuesta de error
    if (localData.backend_url) {
      log(
        `\n   🔗 Backend URL usado por local: ${localData.backend_url}`,
        "magenta"
      );
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, "red");
    log(
      "   ⚠️ Asegúrate de que el servidor local esté corriendo (npm run dev)",
      "yellow"
    );
  }

  // 3. PRODUCCIÓN
  log("\n📡 3. PRODUCCIÓN (Vercel):", "cyan");
  try {
    const prodUrl = `https://gestor-proyectos-vercel.vercel.app/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=${Date.now()}`;
    const prodResp = await fetch(prodUrl, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    const prodData = await prodResp.json();

    const prodConValor = prodData.data.filter(
      (p) => p.valor_proyectado > 0
    ).length;

    log(`   URL: ${prodUrl}`, "cyan");
    log(`   Registros: ${prodData.data.length}`, "yellow");
    log(
      `   Con valor > 0: ${prodConValor}`,
      prodConValor > 0 ? "green" : "red"
    );
    log(`   Timestamp: ${prodData.timestamp}`, "cyan");

    if (prodConValor > 0) {
      log("\n   ✅ PRODUCCIÓN TIENE VALORES CORRECTOS", "green");
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, "red");
  }

  log("\n" + "=".repeat(80), "cyan");
  log("💡 ANÁLISIS:", "bright");
  log("=".repeat(80), "cyan");

  log(
    "\n📋 Si LOCAL muestra valores > 0 pero RAILWAY directo muestra 0:",
    "yellow"
  );
  console.log("   → Local está usando CACHE o datos antiguos");
  console.log("   → Detén el servidor local y borra .next/cache");
  console.log("   → Ejecuta: rm -rf .next && npm run dev");

  log("\n📋 Si RAILWAY directo muestra 0:", "yellow");
  console.log("   → El problema está en el backend Railway");
  console.log("   → Verificar Google Sheet origen");
  console.log("   → Revisar mapeo de columnas en el backend");

  log("\n📋 Si todos muestran 0:", "yellow");
  console.log("   → Problema confirmado en backend Railway");
  console.log("   → Se necesita acceso al código del backend");
  console.log("   → Verificar lectura del Google Sheet");

  log("\n=".repeat(80) + "\n", "cyan");
}

verificarURLsYDatos();

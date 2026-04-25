/**
 * Test para verificar cache en Proyecciones de Empréstito
 * Compara datos entre múltiples llamadas y verifica timestamp
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

async function testCacheProyecciones() {
  log("\n🔍 TEST DE CACHE EN PROYECCIONES DE EMPRÉSTITO\n", "bright");
  log("=".repeat(80), "cyan");

  try {
    // Hacer 3 llamadas consecutivas al backend Railway
    log("\n📡 1. PROBANDO CACHE EN BACKEND RAILWAY (3 llamadas)...", "cyan");

    const railwayUrl =
      "https://gestorproyectoapi-production.up.railway.app/emprestito/leer-tabla-proyecciones?solo_no_guardados=false";
    const timestamps = [];
    const dataCounts = [];

    for (let i = 1; i <= 3; i++) {
      log(`\n   Llamada ${i}...`, "yellow");
      const response = await fetch(`${railwayUrl}&_nocache=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      const data = await response.json();

      timestamps.push(data.timestamp);
      dataCounts.push(data.data?.length || 0);

      console.log(`   ✅ Timestamp: ${data.timestamp}`);
      console.log(`   ✅ Registros: ${data.data?.length || 0}`);

      // Esperar 500ms entre llamadas
      if (i < 3) await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Verificar que los timestamps sean diferentes (no hay cache)
    const uniqueTimestamps = new Set(timestamps);
    if (uniqueTimestamps.size === 3) {
      log(
        "\n✅ BACKEND SIN CACHE: Cada llamada tiene timestamp diferente",
        "green"
      );
    } else {
      log("\n⚠️ POSIBLE CACHE: Algunos timestamps se repiten", "yellow");
      timestamps.forEach((ts, i) => console.log(`   Llamada ${i + 1}: ${ts}`));
    }

    // Verificar que los conteos sean consistentes
    const uniqueCounts = new Set(dataCounts);
    if (uniqueCounts.size === 1) {
      log(
        `✅ DATOS CONSISTENTES: ${dataCounts[0]} registros en todas las llamadas`,
        "green"
      );
    } else {
      log(
        `⚠️ DATOS INCONSISTENTES: Diferentes cantidades de registros`,
        "yellow"
      );
      dataCounts.forEach((count, i) =>
        console.log(`   Llamada ${i + 1}: ${count} registros`)
      );
    }

    // Probar el proxy local (si está disponible)
    log("\n\n📡 2. PROBANDO CACHE EN PROXY LOCAL (3 llamadas)...", "cyan");

    try {
      const localTimestamps = [];
      const localDataCounts = [];

      for (let i = 1; i <= 3; i++) {
        log(`\n   Llamada ${i}...`, "yellow");
        const localUrl = `http://localhost:3000/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=${Date.now()}`;
        const response = await fetch(localUrl, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        const data = await response.json();

        localTimestamps.push(data.timestamp);
        localDataCounts.push(data.data?.length || 0);

        console.log(`   ✅ Timestamp: ${data.timestamp}`);
        console.log(`   ✅ Registros: ${data.data?.length || 0}`);

        if (i < 3) await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Verificar timestamps del proxy
      const uniqueLocalTimestamps = new Set(localTimestamps);
      if (uniqueLocalTimestamps.size === 3) {
        log(
          "\n✅ PROXY SIN CACHE: Cada llamada obtiene datos frescos del backend",
          "green"
        );
      } else if (uniqueLocalTimestamps.size === 1) {
        log(
          "\n❌ PROXY CON CACHE: Todas las llamadas tienen el mismo timestamp",
          "red"
        );
        log(
          "   Esto significa que el proxy está cacheando las respuestas",
          "red"
        );
      } else {
        log(
          "\n⚠️ PROXY CON CACHE PARCIAL: Algunos timestamps se repiten",
          "yellow"
        );
      }

      // Comparar con backend directo
      log("\n📊 COMPARACIÓN BACKEND vs PROXY:", "cyan");
      if (dataCounts[0] === localDataCounts[0]) {
        log(`✅ Mismo número de registros: ${dataCounts[0]}`, "green");
      } else {
        log(`⚠️ DIFERENCIA EN REGISTROS:`, "yellow");
        console.log(`   Backend Railway: ${dataCounts[0]}`);
        console.log(`   Proxy Local: ${localDataCounts[0]}`);
      }
    } catch (error) {
      log(
        `\n⚠️ No se pudo conectar al servidor local: ${error.message}`,
        "yellow"
      );
      log("   (Esto es normal si el servidor no está corriendo)", "yellow");
    }

    // Probar endpoint de proyecciones sin proceso
    log("\n\n📡 3. PROBANDO ENDPOINT DE PROYECCIONES SIN PROCESO...", "cyan");

    try {
      const sinProcesoUrl =
        "https://gestorproyectoapi-production.up.railway.app/emprestito/proyecciones-sin-proceso";
      const response = await fetch(`${sinProcesoUrl}?_nocache=${Date.now()}`);
      const data = await response.json();

      log(
        `✅ Proyecciones sin proceso: ${data.data?.length || 0} registros`,
        "green"
      );
      console.log(`   Timestamp: ${data.timestamp}`);

      // Verificar con el proxy local
      try {
        const localSinProcesoUrl =
          "http://localhost:3000/api/emprestito/proyecciones-sin-proceso";
        const localResponse = await fetch(
          `${localSinProcesoUrl}?_t=${Date.now()}`
        );
        const localData = await localResponse.json();

        log(
          `✅ Proxy local - sin proceso: ${
            localData.data?.length || 0
          } registros`,
          "green"
        );

        if (data.data?.length === localData.data?.length) {
          log(
            "✅ Mismo número de registros sin proceso en ambos endpoints",
            "green"
          );
        } else {
          log("⚠️ Diferencia en registros sin proceso:", "yellow");
          console.log(`   Backend: ${data.data?.length || 0}`);
          console.log(`   Proxy: ${localData.data?.length || 0}`);
        }
      } catch (error) {
        log(`   ⚠️ No se pudo probar proxy local para sin-proceso`, "yellow");
      }
    } catch (error) {
      log(`❌ Error al probar endpoint sin proceso: ${error.message}`, "red");
    }

    log("\n" + "=".repeat(80), "cyan");
    log("💡 RECOMENDACIONES:", "bright");
    log("=".repeat(80), "cyan");

    log("\n✅ Si los timestamps son diferentes en cada llamada:", "cyan");
    log("   El cache está deshabilitado correctamente", "cyan");

    log("\n⚠️ Si los timestamps se repiten:", "yellow");
    log(
      "   1. Verificar headers de Cache-Control en las rutas de API",
      "yellow"
    );
    log("   2. Agregar timestamp único a cada petición (?_t=)", "yellow");
    log("   3. En producción, verificar configuración de Vercel CDN", "yellow");

    log("\n📋 EN PRODUCCIÓN:", "magenta");
    log(
      "   1. Verificar que NEXT_PUBLIC_API_BASE_URL esté configurado",
      "magenta"
    );
    log("   2. Limpiar cache de Vercel después del deploy", "magenta");
    log(
      "   3. Usar el parámetro ?_t=timestamp en todas las llamadas",
      "magenta"
    );

    log("\n=".repeat(80) + "\n", "cyan");
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, "red");
    console.error(error);
  }
}

testCacheProyecciones();

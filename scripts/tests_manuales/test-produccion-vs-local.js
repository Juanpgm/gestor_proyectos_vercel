/**
 * Test para comparar PRODUCCIÓN vs LOCAL
 * Identificar diferencias en valor_proyectado
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

async function compareProduccionVsLocal() {
  log("\n🔍 COMPARACIÓN PRODUCCIÓN vs LOCAL\n", "bright");
  log("=".repeat(80), "cyan");

  try {
    // 1. Probar PRODUCCIÓN (Vercel)
    log("\n📡 1. PROBANDO PRODUCCIÓN (Vercel)...", "cyan");
    const produccionUrl =
      "https://gestor-proyectos-vercel.vercel.app/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false";

    let produccionData = null;
    try {
      const produccionResponse = await fetch(
        `${produccionUrl}&_t=${Date.now()}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
      produccionData = await produccionResponse.json();

      if (produccionData.success && produccionData.data) {
        log(`✅ Producción: ${produccionData.data.length} registros`, "green");

        const prodConValor = produccionData.data.filter(
          (p) => p.valor_proyectado > 0
        );
        const prodCero = produccionData.data.filter(
          (p) => p.valor_proyectado === 0
        );

        log(`\n📊 Valores en Producción:`, "yellow");
        console.log(`   Con valor > 0: ${prodConValor.length}`);
        console.log(`   Con valor = 0: ${prodCero.length}`);

        if (prodConValor.length > 0) {
          log(`\n✅ Top 3 valores en PRODUCCIÓN:`, "green");
          prodConValor
            .sort((a, b) => b.valor_proyectado - a.valor_proyectado)
            .slice(0, 3)
            .forEach((p, i) => {
              console.log(
                `   ${i + 1}. Item ${
                  p.item
                }: $${p.valor_proyectado.toLocaleString("es-CO")}`
              );
              console.log(
                `      Nombre: ${p.nombre_resumido_proceso || "N/A"}`
              );
            });
        } else {
          log(`\n❌ NO HAY valores > 0 en Producción`, "red");
        }
      }
    } catch (error) {
      log(`❌ Error conectando a producción: ${error.message}`, "red");
      log(
        "   ⚠️ Verifica la URL de producción o que esté desplegado",
        "yellow"
      );
    }

    // 2. Probar LOCAL
    log("\n\n📡 2. PROBANDO LOCAL (localhost:3000)...", "cyan");
    let localData = null;
    try {
      const localUrl = `http://localhost:3000/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=${Date.now()}`;
      const localResponse = await fetch(localUrl, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      localData = await localResponse.json();

      if (localData.success && localData.data) {
        log(`✅ Local: ${localData.data.length} registros`, "green");

        const localConValor = localData.data.filter(
          (p) => p.valor_proyectado > 0
        );
        const localCero = localData.data.filter(
          (p) => p.valor_proyectado === 0
        );

        log(`\n📊 Valores en Local:`, "yellow");
        console.log(`   Con valor > 0: ${localConValor.length}`);
        console.log(`   Con valor = 0: ${localCero.length}`);

        if (localConValor.length > 0) {
          log(`\n✅ Top 3 valores en LOCAL:`, "green");
          localConValor
            .sort((a, b) => b.valor_proyectado - a.valor_proyectado)
            .slice(0, 3)
            .forEach((p, i) => {
              console.log(
                `   ${i + 1}. Item ${
                  p.item
                }: $${p.valor_proyectado.toLocaleString("es-CO")}`
              );
              console.log(
                `      Nombre: ${p.nombre_resumido_proceso || "N/A"}`
              );
            });
        } else {
          log(`\n❌ NO HAY valores > 0 en Local`, "red");
        }
      }
    } catch (error) {
      log(`❌ Error conectando a local: ${error.message}`, "red");
      log(
        "   ⚠️ Asegúrate de que el servidor local esté corriendo (npm run dev)",
        "yellow"
      );
    }

    // 3. COMPARACIÓN
    if (produccionData && localData) {
      log("\n\n🔄 COMPARACIÓN DIRECTA:", "magenta");
      log("=".repeat(80), "magenta");

      const prodConValor = produccionData.data.filter(
        (p) => p.valor_proyectado > 0
      );
      const localConValor = localData.data.filter(
        (p) => p.valor_proyectado > 0
      );

      console.log(`\n   Producción - Valores > 0: ${prodConValor.length}`);
      console.log(`   Local      - Valores > 0: ${localConValor.length}`);
      console.log(
        `   Diferencia: ${Math.abs(
          prodConValor.length - localConValor.length
        )} registros`
      );

      if (prodConValor.length === 0 && localConValor.length > 0) {
        log(
          `\n❌ PROBLEMA CONFIRMADO: Producción tiene ceros, Local tiene valores`,
          "red"
        );

        // Comparar mismo registro
        log(`\n🔍 Comparando mismo registro (Item 1):`, "cyan");
        const prodItem1 = produccionData.data.find((p) => p.item === "1");
        const localItem1 = localData.data.find((p) => p.item === "1");

        if (prodItem1 && localItem1) {
          console.log(`\n   PRODUCCIÓN:`);
          console.log(`   - valor_proyectado: ${prodItem1.valor_proyectado}`);
          console.log(`   - tipo: ${typeof prodItem1.valor_proyectado}`);
          console.log(`   - timestamp: ${produccionData.timestamp}`);

          console.log(`\n   LOCAL:`);
          console.log(`   - valor_proyectado: ${localItem1.valor_proyectado}`);
          console.log(`   - tipo: ${typeof localItem1.valor_proyectado}`);
          console.log(`   - timestamp: ${localData.timestamp}`);

          // Verificar si hay diferencia en la fuente de datos
          log(`\n🔍 Análisis de diferencias:`, "yellow");

          if (produccionData.timestamp !== localData.timestamp) {
            log(
              `   ⚠️ Timestamps diferentes - están usando datos de diferentes momentos`,
              "yellow"
            );
          }

          // Verificar variables de entorno
          log(`\n🔍 Posibles causas:`, "yellow");
          console.log(
            `   1. Variables de entorno diferentes (NEXT_PUBLIC_API_BASE_URL)`
          );
          console.log(`   2. Producción usando cache antiguo`);
          console.log(`   3. Producción conectando a backend diferente`);
          console.log(`   4. Problema de build/deploy en Vercel`);
        }
      } else if (
        prodConValor.length === localConValor.length &&
        prodConValor.length > 0
      ) {
        log(`\n✅ Ambos tienen valores correctos`, "green");
      }
    }

    // 4. Probar backend Railway directo
    log("\n\n📡 3. PROBANDO BACKEND RAILWAY (directo)...", "cyan");
    const railwayUrl =
      "https://gestorproyectoapi-production.up.railway.app/emprestito/leer-tabla-proyecciones?solo_no_guardados=false";
    const railwayResponse = await fetch(`${railwayUrl}&_nocache=${Date.now()}`);
    const railwayData = await railwayResponse.json();

    if (railwayData.success && railwayData.data) {
      const railwayConValor = railwayData.data.filter(
        (p) => p.valor_proyectado > 0
      );

      log(`✅ Backend Railway: ${railwayData.data.length} registros`, "green");
      console.log(`   Con valor > 0: ${railwayConValor.length}`);

      if (railwayConValor.length > 0) {
        log(`\n✅ Backend tiene valores correctos`, "green");
        railwayConValor
          .sort((a, b) => b.valor_proyectado - a.valor_proyectado)
          .slice(0, 3)
          .forEach((p, i) => {
            console.log(
              `   ${i + 1}. Item ${
                p.item
              }: $${p.valor_proyectado.toLocaleString("es-CO")}`
            );
          });
      }
    }

    log("\n" + "=".repeat(80), "cyan");
    log("💡 DIAGNÓSTICO:", "bright");
    log("=".repeat(80), "cyan");

    const railwayConValor = railwayData.data.filter(
      (p) => p.valor_proyectado > 0
    );

    if (localData && localConValor && railwayConValor) {
      const localTieneValores =
        localData.data.filter((p) => p.valor_proyectado > 0).length > 0;
      const railwayTieneValores = railwayConValor.length > 0;
      const produccionTieneValores = produccionData
        ? produccionData.data.filter((p) => p.valor_proyectado > 0).length > 0
        : false;

      if (railwayTieneValores && localTieneValores && !produccionTieneValores) {
        log(
          `\n❌ PROBLEMA: Producción no recibe datos correctos del backend`,
          "red"
        );
        log(`\n📋 Acciones:`, "yellow");
        console.log(`   1. Verificar NEXT_PUBLIC_API_BASE_URL en Vercel`);
        console.log(
          `   2. Limpiar cache de Vercel (Dashboard > Deployments > ... > Redeploy)`
        );
        console.log(`   3. Verificar que el build de producción sea reciente`);
        console.log(`   4. Revisar logs de producción en Vercel`);
      } else if (!railwayTieneValores) {
        log(
          `\n⚠️ Backend Railway devuelve ceros - problema en Google Sheet`,
          "yellow"
        );
      } else {
        log(`\n✅ Datos correctos en todos los ambientes`, "green");
      }
    }

    log("\n=".repeat(80) + "\n", "cyan");
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, "red");
    console.error(error);
  }
}

compareProduccionVsLocal();

/**
 * Test para comparar datos de Proyecciones de Empréstito
 * entre el backend directo y el proxy de Next.js
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

async function testProyeccionesEmprestito() {
  log("\n🔍 TEST DE PROYECCIONES DE EMPRÉSTITO\n", "bright");
  log("=".repeat(80), "cyan");

  try {
    // 1. Test directo al backend Railway
    log("\n📡 1. CONSULTANDO BACKEND DE RAILWAY (directo)...", "cyan");
    const railwayUrl =
      "https://gestorproyectoapi-production.up.railway.app/emprestito/leer-tabla-proyecciones?solo_no_guardados=false";
    const railwayResponse = await fetch(railwayUrl);
    const railwayData = await railwayResponse.json();

    log(`✅ Respuesta del backend Railway:`, "green");
    console.log(`   Success: ${railwayData.success}`);
    console.log(`   Total registros: ${railwayData.data?.length || 0}`);
    console.log(`   Timestamp: ${railwayData.timestamp}`);

    if (railwayData.data && railwayData.data.length > 0) {
      const firstRecord = railwayData.data[0];
      log("\n📋 ESTRUCTURA DEL PRIMER REGISTRO (Backend):", "cyan");
      console.log(
        "   Campos disponibles:",
        Object.keys(firstRecord).join(", ")
      );

      log("\n📊 CAMPOS IMPORTANTES:", "yellow");
      console.log(`   ID: ${firstRecord.id || "N/A"}`);
      console.log(`   Item: ${firstRecord.item || "N/A"}`);
      console.log(
        `   Referencia Proceso: ${firstRecord.referencia_proceso || "N/A"}`
      );
      console.log(
        `   Nombre Organismo: ${firstRecord.nombre_organismo_reducido || "N/A"}`
      );
      console.log(`   Banco: ${firstRecord.nombre_banco || "N/A"}`);
      console.log(`   BP: ${firstRecord.BP || "N/A"}`);
      console.log(
        `   Nombre Resumido: ${firstRecord.nombre_resumido_proceso || "N/A"}`
      );
      console.log(`   ID PAA: ${firstRecord.id_paa || "N/A"}`);
      console.log(
        `   Valor Proyectado: ${firstRecord.valor_proyectado || "N/A"}`
      );
      console.log(`   Descripción BP: ${firstRecord.descripcion_bp || "N/A"}`);
      console.log(
        `   Última Actualización: ${firstRecord.ultima_actualizacion || "N/A"}`
      );
    }

    // 2. Test al proxy de Next.js (localhost)
    log("\n\n📡 2. CONSULTANDO PROXY DE NEXT.JS (localhost)...", "cyan");
    try {
      const localUrl =
        "http://localhost:3000/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=" +
        Date.now();
      const localResponse = await fetch(localUrl);
      const localData = await localResponse.json();

      log(`✅ Respuesta del proxy Next.js:`, "green");
      console.log(`   Success: ${localData.success}`);
      console.log(`   Total registros: ${localData.data?.length || 0}`);
      console.log(`   Timestamp: ${localData.timestamp}`);

      if (localData.data && localData.data.length > 0) {
        const firstRecord = localData.data[0];
        log("\n📋 ESTRUCTURA DEL PRIMER REGISTRO (Proxy):", "cyan");
        console.log(
          "   Campos disponibles:",
          Object.keys(firstRecord).join(", ")
        );

        log("\n📊 CAMPOS IMPORTANTES:", "yellow");
        console.log(`   ID: ${firstRecord.id || "N/A"}`);
        console.log(`   Item: ${firstRecord.item || "N/A"}`);
        console.log(
          `   Referencia Proceso: ${firstRecord.referencia_proceso || "N/A"}`
        );
        console.log(
          `   Nombre Organismo: ${
            firstRecord.nombre_organismo_reducido || "N/A"
          }`
        );
        console.log(`   Banco: ${firstRecord.nombre_banco || "N/A"}`);
        console.log(`   BP: ${firstRecord.BP || "N/A"}`);
        console.log(
          `   Nombre Resumido: ${firstRecord.nombre_resumido_proceso || "N/A"}`
        );
        console.log(`   ID PAA: ${firstRecord.id_paa || "N/A"}`);
        console.log(
          `   Valor Proyectado: ${firstRecord.valor_proyectado || "N/A"}`
        );
        console.log(
          `   Descripción BP: ${firstRecord.descripcion_bp || "N/A"}`
        );
        console.log(
          `   Última Actualización: ${
            firstRecord.ultima_actualizacion || "N/A"
          }`
        );
      }

      // 3. Comparación de datos
      log("\n\n📊 3. COMPARACIÓN DE DATOS", "cyan");
      log("=".repeat(80), "cyan");

      const railwayCount = railwayData.data?.length || 0;
      const localCount = localData.data?.length || 0;

      if (railwayCount === localCount) {
        log(`✅ Mismo número de registros: ${railwayCount}`, "green");
      } else {
        log(`⚠️ DIFERENCIA EN NÚMERO DE REGISTROS:`, "yellow");
        console.log(`   Backend Railway: ${railwayCount}`);
        console.log(`   Proxy Next.js: ${localCount}`);
        console.log(`   Diferencia: ${Math.abs(railwayCount - localCount)}`);
      }

      // Comparar campos del primer registro
      if (railwayData.data?.[0] && localData.data?.[0]) {
        const railwayFields = new Set(Object.keys(railwayData.data[0]));
        const localFields = new Set(Object.keys(localData.data[0]));

        const missingInLocal = Array.from(railwayFields).filter(
          (f) => !localFields.has(f)
        );
        const extraInLocal = Array.from(localFields).filter(
          (f) => !railwayFields.has(f)
        );

        if (missingInLocal.length === 0 && extraInLocal.length === 0) {
          log(`\n✅ Mismos campos en ambas respuestas`, "green");
        } else {
          if (missingInLocal.length > 0) {
            log(`\n⚠️ CAMPOS FALTANTES EN PROXY:`, "yellow");
            missingInLocal.forEach((field) => console.log(`   ❌ ${field}`));
          }
          if (extraInLocal.length > 0) {
            log(`\n📋 CAMPOS EXTRA EN PROXY:`, "cyan");
            extraInLocal.forEach((field) => console.log(`   ➕ ${field}`));
          }
        }

        // Comparar valores de campos importantes
        const camposImportantes = [
          "id",
          "item",
          "referencia_proceso",
          "nombre_organismo_reducido",
          "nombre_banco",
          "BP",
          "nombre_resumido_proceso",
          "valor_proyectado",
          "descripcion_bp",
          "id_paa",
        ];

        log(`\n📋 COMPARACIÓN DE VALORES (primer registro):`, "cyan");
        camposImportantes.forEach((campo) => {
          const railwayVal = railwayData.data[0][campo];
          const localVal = localData.data[0][campo];

          if (railwayVal === localVal) {
            console.log(`   ✅ ${campo}: Igual`);
          } else {
            console.log(`   ⚠️ ${campo}:`);
            console.log(`      Backend: ${railwayVal || "N/A"}`);
            console.log(`      Proxy: ${localVal || "N/A"}`);
          }
        });
      }
    } catch (error) {
      log(
        `\n⚠️ No se pudo conectar al servidor local: ${error.message}`,
        "yellow"
      );
      log("   (Esto es normal si el servidor no está corriendo)", "yellow");
    }

    // 4. Análisis de campos especiales
    log("\n\n📊 4. ANÁLISIS DE CAMPOS ESPECIALES", "cyan");
    log("=".repeat(80), "cyan");

    if (railwayData.data && railwayData.data.length > 0) {
      // Contar registros con/sin proceso
      const conProceso = railwayData.data.filter(
        (p) => p.referencia_proceso && p.referencia_proceso.trim() !== ""
      ).length;
      const sinProceso = railwayData.data.length - conProceso;

      log(`\n📌 DISTRIBUCIÓN DE PROCESOS:`, "yellow");
      console.log(
        `   Con proceso (referencia_proceso no vacía): ${conProceso}`
      );
      console.log(`   Sin proceso (referencia_proceso vacía): ${sinProceso}`);

      // Campos con valores nulos o vacíos
      const camposConNulos = {};
      railwayData.data.forEach((record) => {
        Object.keys(record).forEach((key) => {
          if (
            record[key] === null ||
            record[key] === undefined ||
            record[key] === ""
          ) {
            camposConNulos[key] = (camposConNulos[key] || 0) + 1;
          }
        });
      });

      log(`\n📌 CAMPOS CON VALORES NULOS/VACÍOS (top 10):`, "yellow");
      Object.entries(camposConNulos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([campo, count]) => {
          const porcentaje = ((count / railwayData.data.length) * 100).toFixed(
            1
          );
          console.log(`   ${campo}: ${count} registros (${porcentaje}%)`);
        });
    }

    log("\n" + "=".repeat(80), "cyan");
    log("💡 CONCLUSIONES:", "bright");
    log("=".repeat(80), "cyan");

    if (railwayData.success) {
      log("✅ El backend Railway está funcionando correctamente", "green");
      log(`✅ Devuelve ${railwayData.data?.length || 0} proyecciones`, "green");
    }

    log("\n📋 SIGUIENTE PASO:", "yellow");
    log(
      "   Verifica que el proxy de Next.js en producción devuelva los mismos datos",
      "yellow"
    );
    log("   que el backend directo de Railway", "yellow");

    log("\n=".repeat(80) + "\n", "cyan");
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, "red");
    console.error(error);
  }
}

testProyeccionesEmprestito();

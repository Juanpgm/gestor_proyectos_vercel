/**
 * Test de Diagnóstico de Presupuesto Total
 * Replica el flujo completo del frontend para identificar discrepancias
 */

const API_BASE = "http://localhost:3000/api/proxy/unidades-proyecto";

console.log("🔍 ====================================================");
console.log("   DIAGNÓSTICO DE PRESUPUESTO TOTAL - UNIDADES PROYECTO");
console.log("====================================================\n");

async function diagnosticarPresupuesto() {
  try {
    // PASO 1: Fetch de datos desde el endpoint (igual que el frontend)
    console.log("📡 PASO 1: Consultando endpoint /attributes...");
    const url = `${API_BASE}/attributes`;
    console.log(`   URL: ${url}`);
    console.log(
      `   ⚠️  Asegúrate de que el servidor esté corriendo (npm run dev)\n`
    );

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const apiResponse = await response.json();

    // PASO 2: Procesar respuesta (igual que el servicio del frontend)
    console.log("📦 PASO 2: Procesando respuesta...");
    let dataArray;

    if (Array.isArray(apiResponse)) {
      dataArray = apiResponse;
      console.log("   ✓ Respuesta directa como array");
    } else if (
      apiResponse &&
      apiResponse.success &&
      Array.isArray(apiResponse.data)
    ) {
      dataArray = apiResponse.data;
      console.log("   ✓ Respuesta envuelta con success: true");
    } else if (
      apiResponse &&
      apiResponse.data &&
      Array.isArray(apiResponse.data)
    ) {
      dataArray = apiResponse.data;
      console.log("   ✓ Respuesta con data pero sin success");
    } else {
      dataArray = [];
      console.warn("   ⚠️ Formato inesperado, usando array vacío");
    }

    console.log(`   📊 Total de registros recibidos: ${dataArray.length}\n`);

    // PASO 3: Procesar y validar datos (simulando el servicio)
    console.log("🔧 PASO 3: Procesando y validando datos...");
    const validatedData = [];
    let erroresValidacion = 0;

    dataArray.forEach((item, index) => {
      try {
        const properties = item.properties || item;

        // Extraer intervenciones
        const intervenciones = properties.intervenciones || [];
        const primeraIntervencion =
          intervenciones.length > 0 ? intervenciones[0] : {};

        // 💰 CORRECCIÓN: Sumar presupuestos de TODAS las intervenciones
        const presupuestoTotal = intervenciones.reduce((sum, interv) => {
          const presupuesto = parseFloat(interv.presupuesto_base || 0);
          return sum + presupuesto;
        }, 0);

        // Si no hay intervenciones, usar el presupuesto a nivel de documento
        const presupuesto_base =
          presupuestoTotal > 0
            ? presupuestoTotal
            : parseFloat(properties.presupuesto_base || 0);

        // 📊 CORRECCIÓN: Calcular avance promedio ponderado
        let avance_obra = 0;
        if (intervenciones.length > 0 && presupuestoTotal > 0) {
          const avancePonderado = intervenciones.reduce((sum, interv) => {
            const avance = parseFloat(interv.avance_obra || 0);
            const presupuesto = parseFloat(interv.presupuesto_base || 0);
            return sum + avance * presupuesto;
          }, 0);
          avance_obra = avancePonderado / presupuestoTotal;
        } else {
          avance_obra = parseFloat(properties.avance_obra || 0);
        }

        validatedData.push({
          upid: properties.upid || "",
          nombre_up: properties.nombre_up || "",
          presupuesto_base: presupuesto_base,
          avance_obra: avance_obra,
          n_intervenciones: intervenciones.length,
          estado:
            primeraIntervencion.estado || properties.estado || "Sin estado",
          tipo_intervencion:
            primeraIntervencion.tipo_intervencion ||
            properties.tipo_intervencion ||
            "Sin especificar",
        });
      } catch (error) {
        erroresValidacion++;
      }
    });

    console.log(`   ✓ Registros validados: ${validatedData.length}`);
    console.log(`   ✗ Errores de validación: ${erroresValidacion}\n`);

    // PASO 4: Calcular presupuesto total y avance promedio (igual que el hook)
    console.log(
      "💰 PASO 4: Calculando presupuesto total y avance promedio...\n"
    );

    const totalBudget = validatedData.reduce(
      (sum, item) => sum + (item.presupuesto_base || 0),
      0
    );

    // Calcular avance promedio
    const avgProgress =
      validatedData.length > 0
        ? validatedData.reduce(
            (sum, item) => sum + (item.avance_obra || 0),
            0
          ) / validatedData.length
        : 0;

    // Estadísticas detalladas
    const presupuestosNonZero = validatedData.filter(
      (item) => (item.presupuesto_base || 0) > 0
    );
    const presupuestosZero = validatedData.filter(
      (item) => (item.presupuesto_base || 0) === 0
    );
    const presupuestos = validatedData.map(
      (item) => item.presupuesto_base || 0
    );
    const maxPresupuesto = Math.max(...presupuestos);
    const minPresupuestoNonZero = Math.min(
      ...presupuestos.filter((p) => p > 0)
    );

    // Estadísticas de intervenciones
    const docsConMultiplesIntervenciones = validatedData.filter(
      (item) => item.n_intervenciones > 1
    );

    console.log("═══════════════════════════════════════════════════════");
    console.log("📊 RESULTADO DEL CÁLCULO");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log(
      `💰 PRESUPUESTO TOTAL: $${totalBudget.toLocaleString("es-CO")}`
    );
    console.log(`📊 AVANCE PROMEDIO: ${avgProgress.toFixed(2)}%`);
    console.log(`\n📈 Estadísticas:`);
    console.log(`   • Total de registros: ${validatedData.length}`);
    console.log(
      `   • Con múltiples intervenciones: ${docsConMultiplesIntervenciones.length}`
    );
    console.log(
      `   • Con presupuesto > 0: ${presupuestosNonZero.length} (${(
        (presupuestosNonZero.length / validatedData.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `   • Con presupuesto = 0: ${presupuestosZero.length} (${(
        (presupuestosZero.length / validatedData.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `   • Presupuesto máximo: $${maxPresupuesto.toLocaleString("es-CO")}`
    );
    console.log(
      `   • Presupuesto mínimo (>0): $${minPresupuestoNonZero.toLocaleString(
        "es-CO"
      )}\n`
    );

    // PASO 5: Mostrar muestra de datos
    console.log("═══════════════════════════════════════════════════════");
    console.log("🔍 MUESTRA DE DATOS (Primeros 10 registros)");
    console.log("═══════════════════════════════════════════════════════\n");

    validatedData.slice(0, 10).forEach((item, i) => {
      console.log(`${i + 1}. ${item.nombre_up}`);
      console.log(`   UPID: ${item.upid}`);
      console.log(
        `   Presupuesto: $${(item.presupuesto_base || 0).toLocaleString(
          "es-CO"
        )}`
      );
      console.log(`   Avance: ${(item.avance_obra || 0).toFixed(2)}%`);
      console.log(`   Intervenciones: ${item.n_intervenciones}`);
      console.log(`   Estado: ${item.estado}`);
      console.log(`   Tipo: ${item.tipo_intervencion}`);
      console.log("");
    });

    // PASO 6: Mostrar registros con mayor presupuesto
    console.log("═══════════════════════════════════════════════════════");
    console.log("🏆 TOP 10 REGISTROS CON MAYOR PRESUPUESTO");
    console.log("═══════════════════════════════════════════════════════\n");

    const topPresupuestos = [...validatedData]
      .sort((a, b) => (b.presupuesto_base || 0) - (a.presupuesto_base || 0))
      .slice(0, 10);

    topPresupuestos.forEach((item, i) => {
      const porcentaje = ((item.presupuesto_base / totalBudget) * 100).toFixed(
        2
      );
      console.log(
        `${i + 1}. $${(item.presupuesto_base || 0).toLocaleString(
          "es-CO"
        )} (${porcentaje}%)`
      );
      console.log(`   ${item.nombre_up}`);
      console.log("");
    });

    // PASO 7: Análisis de discrepancias
    console.log("═══════════════════════════════════════════════════════");
    console.log("🔍 ANÁLISIS DE DISCREPANCIAS");
    console.log("═══════════════════════════════════════════════════════\n");

    const valorFrontendReportado = 397400836352;
    const valorBackendScript = 575870324754; // Del script anterior
    const valorEsteTest = totalBudget;

    console.log(
      `Frontend muestra:       $${valorFrontendReportado.toLocaleString(
        "es-CO"
      )}`
    );
    console.log(
      `Este test calcula:      $${valorEsteTest.toLocaleString("es-CO")}`
    );
    console.log(
      `Script backend mostró:  $${valorBackendScript.toLocaleString("es-CO")}\n`
    );

    const difFrontendTest = valorEsteTest - valorFrontendReportado;
    const difTestBackend = valorBackendScript - valorEsteTest;

    console.log(
      `Diferencia Frontend vs Test:   $${difFrontendTest.toLocaleString(
        "es-CO"
      )}`
    );
    console.log(
      `Diferencia Test vs Backend:    $${difTestBackend.toLocaleString(
        "es-CO"
      )}\n`
    );

    if (Math.abs(difFrontendTest) > 1000000) {
      console.log(
        "⚠️ PROBLEMA IDENTIFICADO: El frontend está mostrando un valor diferente"
      );
      console.log("Posibles causas:");
      console.log(
        "  1. ❌ Los datos no se están cargando completamente en el frontend"
      );
      console.log(
        "  2. ❌ Hay filtros aplicados que están ocultando registros"
      );
      console.log(
        "  3. ❌ El frontend está usando datos en caché desactualizados"
      );
      console.log("  4. ❌ Error en el cálculo de reduce() en el hook\n");
    }

    if (Math.abs(difTestBackend) > 1000000) {
      console.log(
        "⚠️ PROBLEMA IDENTIFICADO: El backend tiene datos diferentes a la API"
      );
      console.log("Posibles causas:");
      console.log(
        "  1. ❌ El backend está consultando directamente Firestore (todos los docs)"
      );
      console.log("  2. ❌ La API está aplicando algún filtro implícito");
      console.log(
        "  3. ❌ Hay documentos en Firestore que no están expuestos por la API"
      );
      console.log(
        "  4. ❌ Diferencia en conversión de tipos de datos (string vs number)\n"
      );
    }

    // PASO 8: Verificar tipos de datos
    console.log("═══════════════════════════════════════════════════════");
    console.log("🔍 VERIFICACIÓN DE TIPOS DE DATOS");
    console.log("═══════════════════════════════════════════════════════\n");

    const tiposDatos = {
      number: 0,
      string: 0,
      nan: 0,
      zero: 0,
      null: 0,
      undefined: 0,
    };

    validatedData.forEach((item) => {
      const val = item.presupuesto_base;
      if (val === null) tiposDatos.null++;
      else if (val === undefined) tiposDatos.undefined++;
      else if (val === 0) tiposDatos.zero++;
      else if (isNaN(val)) tiposDatos.nan++;
      else if (typeof val === "number") tiposDatos.number++;
      else if (typeof val === "string") tiposDatos.string++;
    });

    console.log("Distribución de tipos en presupuesto_base:");
    console.log(`   • Number (>0):  ${tiposDatos.number} registros`);
    console.log(`   • Zero (0):     ${tiposDatos.zero} registros`);
    console.log(`   • String:       ${tiposDatos.string} registros`);
    console.log(`   • NaN:          ${tiposDatos.nan} registros`);
    console.log(`   • Null:         ${tiposDatos.null} registros`);
    console.log(`   • Undefined:    ${tiposDatos.undefined} registros\n`);

    // PASO 9: Comparación con valor esperado
    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ CONCLUSIÓN");
    console.log("═══════════════════════════════════════════════════════\n");

    if (Math.abs(valorEsteTest - valorFrontendReportado) < 1000000) {
      console.log("✅ El cálculo es CORRECTO - Frontend y Test coinciden");
    } else {
      console.log("❌ HAY UNA DISCREPANCIA entre Frontend y Test");
      console.log("   Revisa los logs de la consola del navegador para:");
      console.log("   • Verificar cuántos registros carga el frontend");
      console.log("   • Confirmar si hay filtros aplicados");
      console.log('   • Revisar el log "DIAGNÓSTICO DE PRESUPUESTO"\n');
    }
  } catch (error) {
    console.error("❌ ERROR en el diagnóstico:", error);
    console.error("Stack:", error.stack);
  }
}

// Ejecutar diagnóstico
diagnosticarPresupuesto()
  .then(() => {
    console.log("\n✅ Diagnóstico completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });

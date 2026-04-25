/**
 * Test Diagnóstico: Frontend vs API
 * Determina si el problema está en la API o en el comportamiento del frontend
 */

const centro = "Secretaría de Bienestar Social";
const baseUrl = "https://gestorproyectoapi-production.up.railway.app";

async function runDiagnostics() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔬 DIAGNÓSTICO: Frontend vs API");
  console.log("═══════════════════════════════════════════════════════════\n");

  let testsPassed = 0;
  let testsFailed = 0;
  const issues = [];

  try {
    // ============================================================
    // TEST 1: API con filtro directo (server-side)
    // ============================================================
    console.log("📡 TEST 1: API con filtro server-side");
    console.log("─────────────────────────────────────────────────────────");

    const encodedCentro = encodeURIComponent(centro);

    // Geometry con filtro
    const geoFilteredUrl = `${baseUrl}/unidades-proyecto/geometry?nombre_centro_gestor=${encodedCentro}`;
    const geoFilteredRes = await fetch(geoFilteredUrl);
    const geoFilteredData = await geoFilteredRes.json();
    const geoFilteredCount = geoFilteredData.features?.length || 0;
    const geoFilteredUPIDs =
      geoFilteredData.features?.map((f) => f.properties.upid) || [];

    // Attributes con filtro
    const attrFilteredUrl = `${baseUrl}/unidades-proyecto/attributes?nombre_centro_gestor=${encodedCentro}`;
    const attrFilteredRes = await fetch(attrFilteredUrl);
    const attrFilteredData = await attrFilteredRes.json();
    const attrFilteredCount = attrFilteredData.data?.length || 0;
    const attrFilteredUPIDs =
      attrFilteredData.data?.map((item) => item.upid) || [];

    console.log(`  📍 Geometry filtered: ${geoFilteredCount} features`);
    console.log(`  📊 Attributes filtered: ${attrFilteredCount} items`);
    console.log(
      `  📋 Sample UPIDs: ${geoFilteredUPIDs.slice(0, 3).join(", ")}`
    );

    if (geoFilteredCount > 0 && attrFilteredCount > 0) {
      console.log(`  ✅ API retorna datos con filtro\n`);
      testsPassed++;
    } else {
      console.log(`  ❌ API NO retorna datos con filtro\n`);
      testsFailed++;
      issues.push("API no retorna datos cuando se aplica filtro server-side");
    }

    // ============================================================
    // TEST 2: API sin filtros (comportamiento del frontend)
    // ============================================================
    console.log("🌐 TEST 2: Cargar TODOS los datos (comportamiento frontend)");
    console.log("─────────────────────────────────────────────────────────");

    const allGeoUrl = `${baseUrl}/unidades-proyecto/geometry`;
    const allAttrUrl = `${baseUrl}/unidades-proyecto/attributes`;

    console.log("  ⏳ Cargando datos completos...");
    const [allGeoRes, allAttrRes] = await Promise.all([
      fetch(allGeoUrl),
      fetch(allAttrUrl),
    ]);

    const allGeoData = await allGeoRes.json();
    const allAttrData = await allAttrRes.json();

    const totalGeoFeatures = allGeoData.features?.length || 0;
    const totalAttrItems = allAttrData.data?.length || 0;

    console.log(`  📦 Total geometry: ${totalGeoFeatures} features`);
    console.log(`  📦 Total attributes: ${totalAttrItems} items`);

    if (totalGeoFeatures > 0 && totalAttrItems > 0) {
      console.log(`  ✅ Carga completa exitosa\n`);
      testsPassed++;
    } else {
      console.log(`  ❌ Fallo al cargar datos completos\n`);
      testsFailed++;
      issues.push("No se pueden cargar todos los datos de la API");
    }

    // ============================================================
    // TEST 3: Filtrado local (simulación frontend)
    // ============================================================
    console.log("🔍 TEST 3: Filtrado local (simulación lógica frontend)");
    console.log("─────────────────────────────────────────────────────────");

    // Simular filterAttributeData
    const localFilteredAttrs =
      allAttrData.data?.filter(
        (item) => item.nombre_centro_gestor === centro
      ) || [];

    // Simular filteredGeometry useMemo
    const filteredUPIDSet = new Set(
      localFilteredAttrs.map((item) => item.upid)
    );
    const localFilteredGeo =
      allGeoData.features?.filter((feature) =>
        filteredUPIDSet.has(feature.properties.upid)
      ) || [];

    console.log(
      `  📊 Attributes filtrados localmente: ${localFilteredAttrs.length}`
    );
    console.log(
      `  🗺️  Geometry filtrado por UPID match: ${localFilteredGeo.length}`
    );
    console.log(
      `  📋 UPIDs en attributes: ${Array.from(filteredUPIDSet)
        .slice(0, 3)
        .join(", ")}`
    );
    console.log(
      `  📋 UPIDs en geometry match: ${localFilteredGeo
        .slice(0, 3)
        .map((f) => f.properties.upid)
        .join(", ")}`
    );

    if (localFilteredAttrs.length > 0 && localFilteredGeo.length > 0) {
      console.log(`  ✅ Filtrado local funciona correctamente\n`);
      testsPassed++;
    } else {
      console.log(`  ❌ Filtrado local NO funciona\n`);
      testsFailed++;
      if (localFilteredAttrs.length === 0) {
        issues.push(
          "Filtrado local de attributes falla - no encuentra registros con nombre_centro_gestor"
        );
      }
      if (localFilteredAttrs.length > 0 && localFilteredGeo.length === 0) {
        issues.push(
          "Filtrado de geometry por UPID falla - UPIDs no coinciden entre attributes y geometry"
        );
      }
    }

    // ============================================================
    // TEST 4: Verificación de campo nombre_centro_gestor
    // ============================================================
    console.log("🏢 TEST 4: Verificar campo nombre_centro_gestor en datos");
    console.log("─────────────────────────────────────────────────────────");

    // En attributes
    const attrsWithCentro =
      allAttrData.data?.filter(
        (item) =>
          item.nombre_centro_gestor && item.nombre_centro_gestor.trim() !== ""
      ) || [];
    const attrsCentroPercent = (
      (attrsWithCentro.length / totalAttrItems) *
      100
    ).toFixed(1);

    // En geometry
    const geoWithCentro =
      allGeoData.features?.filter(
        (f) =>
          f.properties.nombre_centro_gestor &&
          f.properties.nombre_centro_gestor.trim() !== ""
      ) || [];
    const geoCentroPercent = (
      (geoWithCentro.length / totalGeoFeatures) *
      100
    ).toFixed(1);

    console.log(
      `  📊 Attributes con centro: ${attrsWithCentro.length}/${totalAttrItems} (${attrsCentroPercent}%)`
    );
    console.log(
      `  📍 Geometry con centro: ${geoWithCentro.length}/${totalGeoFeatures} (${geoCentroPercent}%)`
    );

    // Contar valores únicos de centro
    const uniqueCentrosAttr = new Set(
      allAttrData.data?.map((i) => i.nombre_centro_gestor).filter(Boolean)
    );
    const uniqueCentrosGeo = new Set(
      allGeoData.features
        ?.map((f) => f.properties.nombre_centro_gestor)
        .filter(Boolean)
    );

    console.log(`  🏢 Centros únicos en attributes: ${uniqueCentrosAttr.size}`);
    console.log(`  🏢 Centros únicos en geometry: ${uniqueCentrosGeo.size}`);
    console.log(
      `  🏢 "${centro}" existe en attributes: ${
        uniqueCentrosAttr.has(centro) ? "SÍ" : "NO"
      }`
    );
    console.log(
      `  🏢 "${centro}" existe en geometry: ${
        uniqueCentrosGeo.has(centro) ? "SÍ" : "NO"
      }`
    );

    if (uniqueCentrosAttr.has(centro) && uniqueCentrosGeo.has(centro)) {
      console.log(
        `  ✅ Campo nombre_centro_gestor existe y tiene el valor buscado\n`
      );
      testsPassed++;
    } else {
      console.log(`  ❌ Campo nombre_centro_gestor falta o valor incorrecto\n`);
      testsFailed++;
      issues.push(`El centro "${centro}" no existe en ambos endpoints`);
    }

    // ============================================================
    // TEST 5: Alineación de UPIDs
    // ============================================================
    console.log("🔗 TEST 5: Alineación de UPIDs entre endpoints");
    console.log("─────────────────────────────────────────────────────────");

    const allAttrUPIDs = new Set(
      allAttrData.data?.map((item) => item.upid) || []
    );
    const allGeoUPIDs = new Set(
      allGeoData.features?.map((f) => f.properties.upid) || []
    );

    const onlyInAttrs = [...allAttrUPIDs].filter(
      (upid) => !allGeoUPIDs.has(upid)
    );
    const onlyInGeo = [...allGeoUPIDs].filter(
      (upid) => !allAttrUPIDs.has(upid)
    );
    const commonUPIDs = [...allAttrUPIDs].filter((upid) =>
      allGeoUPIDs.has(upid)
    );

    console.log(`  🔗 UPIDs comunes: ${commonUPIDs.length}`);
    console.log(`  📊 Solo en attributes: ${onlyInAttrs.length}`);
    console.log(`  📍 Solo en geometry: ${onlyInGeo.length}`);

    if (onlyInAttrs.length > 0) {
      console.log(
        `  ⚠️  Primeros 5 solo en attributes: ${onlyInAttrs
          .slice(0, 5)
          .join(", ")}`
      );
    }
    if (onlyInGeo.length > 0) {
      console.log(
        `  ⚠️  Primeros 5 solo en geometry: ${onlyInGeo.slice(0, 5).join(", ")}`
      );
    }

    const alignmentPercent = (
      (commonUPIDs.length / Math.max(allAttrUPIDs.size, allGeoUPIDs.size)) *
      100
    ).toFixed(1);
    console.log(`  📊 Alineación: ${alignmentPercent}%`);

    if (alignmentPercent > 95) {
      console.log(`  ✅ UPIDs están bien alineados (${alignmentPercent}%)\n`);
      testsPassed++;
    } else {
      console.log(
        `  ❌ UPIDs desalineados significativamente (${alignmentPercent}%)\n`
      );
      testsFailed++;
      issues.push(
        `Solo ${alignmentPercent}% de UPIDs coinciden entre geometry y attributes`
      );
    }

    // ============================================================
    // TEST 6: Comparación server-side vs client-side
    // ============================================================
    console.log("⚖️  TEST 6: Comparación server-side vs client-side");
    console.log("─────────────────────────────────────────────────────────");

    console.log(`  🖥️  Server-side (API con filtro):`);
    console.log(`      Geometry: ${geoFilteredCount}`);
    console.log(`      Attributes: ${attrFilteredCount}`);
    console.log(`  💻 Client-side (filtrado local):`);
    console.log(`      Geometry: ${localFilteredGeo.length}`);
    console.log(`      Attributes: ${localFilteredAttrs.length}`);

    const serverClientMatch =
      geoFilteredCount === localFilteredGeo.length &&
      attrFilteredCount === localFilteredAttrs.length;

    if (serverClientMatch) {
      console.log(
        `  ✅ Resultados idénticos entre server-side y client-side\n`
      );
      testsPassed++;
    } else {
      console.log(`  ⚠️  Diferencias entre server-side y client-side\n`);
      testsFailed++;
      issues.push(
        "Filtrado server-side y client-side producen resultados diferentes"
      );
    }

    // ============================================================
    // TEST 7: Tipos de datos de UPIDs
    // ============================================================
    console.log("🔤 TEST 7: Verificar tipos de datos de UPIDs");
    console.log("─────────────────────────────────────────────────────────");

    const sampleAttrUpid = allAttrData.data?.[0]?.upid;
    const sampleGeoUpid = allGeoData.features?.[0]?.properties.upid;

    console.log(
      `  📊 Attributes UPID tipo: ${typeof sampleAttrUpid} | Valor: "${sampleAttrUpid}"`
    );
    console.log(
      `  📍 Geometry UPID tipo: ${typeof sampleGeoUpid} | Valor: "${sampleGeoUpid}"`
    );

    const typesMatch = typeof sampleAttrUpid === typeof sampleGeoUpid;

    if (typesMatch && typeof sampleAttrUpid === "string") {
      console.log(`  ✅ Tipos de UPID coinciden y son strings\n`);
      testsPassed++;
    } else {
      console.log(`  ❌ Tipos de UPID no coinciden o no son strings\n`);
      testsFailed++;
      issues.push(
        `UPIDs tienen tipos diferentes: attributes=${typeof sampleAttrUpid}, geometry=${typeof sampleGeoUpid}`
      );
    }

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 RESUMEN DE DIAGNÓSTICO");
    console.log(
      "═══════════════════════════════════════════════════════════\n"
    );

    console.log(`✅ Tests pasados: ${testsPassed}/7`);
    console.log(`❌ Tests fallidos: ${testsFailed}/7\n`);

    if (issues.length > 0) {
      console.log("🔴 PROBLEMAS DETECTADOS:\n");
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      console.log("");
    }

    // DIAGNÓSTICO FINAL
    console.log("🎯 DIAGNÓSTICO:");
    console.log("─────────────────────────────────────────────────────────");

    if (testsPassed === 7) {
      console.log("  ✅ TODO FUNCIONA CORRECTAMENTE");
      console.log("  → El problema está en el FRONTEND (código React/hooks)");
      console.log(
        "  → Revisar: useUnidadesProyectoEnhanced.ts, UnidadesProyecto.tsx"
      );
      console.log("  → Verificar: logs del navegador, re-renders, estados");
    } else if (geoFilteredCount === 0 || attrFilteredCount === 0) {
      console.log("  ❌ PROBLEMA EN LA API");
      console.log("  → El backend no retorna datos correctamente con filtros");
      console.log(
        "  → Verificar: endpoint /unidades-proyecto/geometry y /attributes"
      );
    } else if (localFilteredGeo.length === 0 && localFilteredAttrs.length > 0) {
      console.log("  ⚠️  PROBLEMA EN ALINEACIÓN DE DATOS");
      console.log("  → Los UPIDs no coinciden entre geometry y attributes");
      console.log(
        "  → Los attributes se filtran pero no hay geometry matching"
      );
      console.log("  → Posible causa: datos inconsistentes en base de datos");
    } else if (!typesMatch) {
      console.log("  ⚠️  PROBLEMA DE TIPOS DE DATOS");
      console.log("  → Los UPIDs tienen tipos diferentes (string vs number)");
      console.log("  → Esto causa que el Set.has() falle en el filtrado");
      console.log("  → Solución: normalizar UPIDs a string en ambos lados");
    } else {
      console.log("  ⚠️  PROBLEMA MIXTO");
      console.log("  → Revisar los problemas detectados arriba");
      console.log("  → Puede ser combinación de API + Frontend");
    }

    console.log(
      "\n═══════════════════════════════════════════════════════════\n"
    );

    process.exit(testsFailed === 0 ? 0 : 1);
  } catch (error) {
    console.error("\n❌ ERROR FATAL:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
runDiagnostics();

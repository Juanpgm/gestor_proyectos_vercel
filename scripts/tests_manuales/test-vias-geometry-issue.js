/**
 * Test para verificar por qué "Vias" no se representa en el mapa
 */

async function checkViasGeometryIssue() {
  console.log('\n🔍 ANALIZANDO PROBLEMA DE GEOMETRÍA EN "Vias"\n');
  console.log("=".repeat(80));

  try {
    // 1. Obtener attributes
    console.log("\n📊 1. Obteniendo ATTRIBUTES...");
    const attrResponse = await fetch(
      "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/attributes"
    );
    const attrData = await attrResponse.json();
    const attributes = Array.isArray(attrData)
      ? attrData
      : attrData.attributes || attrData.data || [];

    // 2. Obtener geometries
    console.log("📊 2. Obteniendo GEOMETRIES...");
    const geomResponse = await fetch(
      "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/geometry"
    );
    const geomData = await geomResponse.json();
    const geometries = geomData.features || [];

    // 3. Filtrar registros con "Vias"
    const viasAttrs = attributes.filter((a) => a.tipo_equipamiento === "Vias");
    console.log(
      `\n✅ Attributes con tipo_equipamiento = "Vias": ${viasAttrs.length}`
    );

    // 4. Buscar geometries con "Vias"
    const viasGeoms = geometries.filter(
      (g) => g.properties?.tipo_equipamiento === "Vias"
    );
    console.log(
      `✅ Geometries con tipo_equipamiento = "Vias": ${viasGeoms.length}`
    );

    console.log("\n" + "=".repeat(80));
    console.log("🔴 PROBLEMA DETECTADO:");
    console.log("=".repeat(80));
    console.log(
      `❌ ${viasAttrs.length} registros en ATTRIBUTES pero solo ${viasGeoms.length} en GEOMETRIES`
    );
    console.log(`❌ Faltan ${viasAttrs.length - viasGeoms.length} geometrías`);

    // 5. Analizar registros sin geometría
    console.log("\n📋 ANÁLISIS DE REGISTROS SIN GEOMETRÍA:");
    console.log("-".repeat(80));

    // Extraer UPIDs de geometries con Vias
    const geomUPIDs = new Set(
      viasGeoms.map((g) => g.properties?.upid).filter(Boolean)
    );

    // Encontrar attributes sin geometría
    const attrsWithoutGeom = viasAttrs.filter((a) => !geomUPIDs.has(a.upid));
    console.log(
      `\n⚠️  Registros "Vias" sin geometría: ${attrsWithoutGeom.length}`
    );

    // Analizar características de registros sin geometría
    const withUPID = attrsWithoutGeom.filter((a) => a.upid).length;
    const withoutUPID = attrsWithoutGeom.filter((a) => !a.upid).length;
    const withEstado = attrsWithoutGeom.filter((a) => a.estado).length;
    const withoutEstado = attrsWithoutGeom.filter((a) => !a.estado).length;
    const withNombre = attrsWithoutGeom.filter((a) => a.nombre_up).length;

    console.log(`\nCaracterísticas de registros sin geometría:`);
    console.log(`   • Con UPID: ${withUPID} | Sin UPID: ${withoutUPID}`);
    console.log(
      `   • Con Estado: ${withEstado} | Sin Estado: ${withoutEstado}`
    );
    console.log(`   • Con Nombre: ${withNombre}`);

    // Mostrar algunos ejemplos
    console.log(
      `\n📋 EJEMPLOS DE REGISTROS "Vias" SIN GEOMETRÍA (primeros 5):`
    );
    console.log("-".repeat(80));
    attrsWithoutGeom.slice(0, 5).forEach((record, i) => {
      console.log(`\n${i + 1}. ${record.nombre_up || "SIN NOMBRE"}`);
      console.log(`   UPID: ${record.upid || "N/A"}`);
      console.log(`   Estado: ${record.estado || "N/A"}`);
      console.log(`   Comuna: ${record.comuna_corregimiento || "N/A"}`);
      console.log(`   Centro Gestor: ${record.nombre_centro_gestor || "N/A"}`);
    });

    // 6. Verificar si geometries tiene otros tipos
    console.log("\n\n📊 TIPOS DE EQUIPAMIENTO EN GEOMETRIES (Top 10):");
    console.log("-".repeat(80));
    const tiposEnGeom = {};
    geometries.forEach((g) => {
      const tipo = g.properties?.tipo_equipamiento;
      if (tipo) {
        tiposEnGeom[tipo] = (tiposEnGeom[tipo] || 0) + 1;
      }
    });

    const sortedTipos = Object.entries(tiposEnGeom)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedTipos.forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count} features`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("💡 CONCLUSIÓN:");
    console.log("=".repeat(80));
    console.log("El problema es del BACKEND (base de datos):");
    console.log(
      '❌ Los registros con tipo_equipamiento = "Vias" no tienen geometrías asociadas'
    );
    console.log("❌ Muchos registros no tienen UPID ni estado definido");
    console.log(
      "✅ Solución: Agregar geometrías en la base de datos para estos registros"
    );
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error);
  }
}

checkViasGeometryIssue();

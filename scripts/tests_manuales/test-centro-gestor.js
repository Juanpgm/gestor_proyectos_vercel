/**
 * Script para verificar que todas las UP tienen nombre_centro_gestor
 * y que se visualizan correctamente
 */

const API_BASE_URL =
  process.env.API_BASE_URL ||
  "https://api-movilidad-bogota-test.azurewebsites.net/api/v1";

async function testCentroGestor() {
  console.log("🔍 Testing Centro Gestor en Unidades de Proyecto...\n");

  try {
    // 1. Obtener todos los atributos
    console.log("📥 Fetching attribute data...");
    const attributesResponse = await fetch(
      `${API_BASE_URL}/unidades-proyecto/attributes`
    );

    if (!attributesResponse.ok) {
      throw new Error(
        `HTTP ${attributesResponse.status}: ${attributesResponse.statusText}`
      );
    }

    const attributesData = await attributesResponse.json();
    const items = attributesData.data || [];

    console.log(`✅ Received ${items.length} items\n`);

    // 2. Analizar centro_gestor
    console.log("📊 Analyzing nombre_centro_gestor field...\n");

    const withCentroGestor = items.filter((item) => {
      const hasField =
        item.nombre_centro_gestor !== undefined &&
        item.nombre_centro_gestor !== null &&
        item.nombre_centro_gestor !== "";
      return hasField;
    });

    const withoutCentroGestor = items.filter((item) => {
      const hasField =
        item.nombre_centro_gestor !== undefined &&
        item.nombre_centro_gestor !== null &&
        item.nombre_centro_gestor !== "";
      return !hasField;
    });

    console.log(
      `✅ Items WITH nombre_centro_gestor: ${withCentroGestor.length} (${(
        (withCentroGestor.length / items.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `❌ Items WITHOUT nombre_centro_gestor: ${withoutCentroGestor.length} (${(
        (withoutCentroGestor.length / items.length) *
        100
      ).toFixed(1)}%)\n`
    );

    // 3. Obtener lista única de centros gestores
    const centrosGestores = new Set();
    withCentroGestor.forEach((item) => {
      if (item.nombre_centro_gestor) {
        centrosGestores.add(item.nombre_centro_gestor);
      }
    });

    const centrosGestoresArray = Array.from(centrosGestores).sort();

    console.log(
      `📋 Unique Centro Gestor values (${centrosGestoresArray.length}):`
    );
    centrosGestoresArray.forEach((centro, index) => {
      const count = withCentroGestor.filter(
        (item) => item.nombre_centro_gestor === centro
      ).length;
      console.log(`  ${index + 1}. ${centro} (${count} UPs)`);
    });
    console.log("");

    // 4. Mostrar muestras de items sin centro_gestor
    if (withoutCentroGestor.length > 0) {
      console.log("⚠️ Sample items WITHOUT nombre_centro_gestor:");
      withoutCentroGestor.slice(0, 5).forEach((item) => {
        console.log(`  - UPID: ${item.upid}`);
        console.log(`    Nombre: ${item.nombre_up}`);
        console.log(`    Estado: ${item.estado}`);
        console.log(
          `    Tiene intervenciones?: ${item.intervenciones ? "Sí" : "No"}`
        );
        if (item.intervenciones && item.intervenciones.length > 0) {
          const primeraIntervencion = item.intervenciones[0];
          console.log(
            `    Primera intervención tiene centro?: ${
              primeraIntervencion.nombre_centro_gestor || "No"
            }`
          );
        }
        console.log("");
      });
    }

    // 5. Verificar en la estructura de la API
    console.log("🔍 Checking API structure...");
    const sampleItem = items[0];
    console.log("\n📋 First item structure:");
    console.log("  Top-level keys:", Object.keys(sampleItem));
    console.log("  nombre_centro_gestor:", sampleItem.nombre_centro_gestor);

    if (sampleItem.intervenciones && sampleItem.intervenciones.length > 0) {
      console.log(
        "\n  First intervention keys:",
        Object.keys(sampleItem.intervenciones[0])
      );
      console.log(
        "  First intervention centro_gestor:",
        sampleItem.intervenciones[0].nombre_centro_gestor
      );
    }

    // 6. Test filtro
    console.log("\n\n🔍 Testing filter by nombre_centro_gestor...\n");

    if (centrosGestoresArray.length > 0) {
      const testCentro = centrosGestoresArray[0];
      console.log(`Testing with: "${testCentro}"`);

      const filterUrl = `${API_BASE_URL}/unidades-proyecto/geometry?nombre_centro_gestor=${encodeURIComponent(
        testCentro
      )}`;
      console.log(`URL: ${filterUrl}\n`);

      const filterResponse = await fetch(filterUrl);

      if (!filterResponse.ok) {
        throw new Error(`Filter request failed: HTTP ${filterResponse.status}`);
      }

      const filterData = await filterResponse.json();
      const features = filterData.features || [];

      console.log(`✅ Filter returned ${features.length} features`);

      if (features.length > 0) {
        console.log("\n📋 Sample filtered items:");
        features.slice(0, 3).forEach((feature) => {
          const props = feature.properties;
          console.log(`  - UPID: ${props.upid}`);
          console.log(`    Nombre: ${props.nombre_up}`);
          console.log(`    Centro Gestor: ${props.nombre_centro_gestor}`);
          console.log("");
        });
      }

      // Test multi-filter
      if (centrosGestoresArray.length > 1) {
        const testCentro2 = centrosGestoresArray[1];
        console.log(`\n🔍 Testing multi-filter with 2 centros...\n`);

        const multiFilterUrl = `${API_BASE_URL}/unidades-proyecto/geometry?nombre_centro_gestor=${encodeURIComponent(
          testCentro
        )}&nombre_centro_gestor=${encodeURIComponent(testCentro2)}`;
        console.log(`URL: ${multiFilterUrl}\n`);

        const multiFilterResponse = await fetch(multiFilterUrl);

        if (!multiFilterResponse.ok) {
          throw new Error(
            `Multi-filter request failed: HTTP ${multiFilterResponse.status}`
          );
        }

        const multiFilterData = await multiFilterResponse.json();
        const multiFeatures = multiFilterData.features || [];

        console.log(
          `✅ Multi-filter returned ${multiFeatures.length} features`
        );
        console.log(
          `   Expected: ${
            withCentroGestor.filter(
              (i) =>
                i.nombre_centro_gestor === testCentro ||
                i.nombre_centro_gestor === testCentro2
            ).length
          } features`
        );
      }
    }

    // 7. Resumen final
    console.log("\n\n📊 SUMMARY:");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`Total UPs: ${items.length}`);
    console.log(
      `UPs with Centro Gestor: ${withCentroGestor.length} (${(
        (withCentroGestor.length / items.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `UPs without Centro Gestor: ${withoutCentroGestor.length} (${(
        (withoutCentroGestor.length / items.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(`Unique Centro Gestor values: ${centrosGestoresArray.length}`);
    console.log("═══════════════════════════════════════════════════════");

    if (withoutCentroGestor.length > 0) {
      console.log("\n⚠️ WARNING: Some UPs are missing nombre_centro_gestor");
      console.log(
        "   These items will not appear when filtering by Centro Gestor"
      );
      console.log(
        "   Check the API data structure and ensure all UPs have this field"
      );
    } else {
      console.log("\n✅ SUCCESS: All UPs have nombre_centro_gestor field");
      console.log("   Filtering should work correctly for all items");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar
testCentroGestor()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

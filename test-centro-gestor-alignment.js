/**
 * Test de alineación de nombre_centro_gestor entre endpoints
 * Verifica que geometry y attributes tengan los mismos datos
 */

async function testCentroGestorAlignment() {
  const centro = "Secretaría de Bienestar Social";
  const encodedCentro = encodeURIComponent(centro);
  const baseUrl = "https://gestorproyectoapi-production.up.railway.app";

  console.log(`\n🧪 Testing Centro Gestor Alignment for: ${centro}\n`);

  try {
    // 1. Test Geometry Endpoint
    console.log("📍 Test 1: Geometry Endpoint");
    const geometryUrl = `${baseUrl}/unidades-proyecto/geometry?nombre_centro_gestor=${encodedCentro}`;
    const geometryResponse = await fetch(geometryUrl);
    const geometryData = await geometryResponse.json();

    const geometryCount = geometryData.features?.length || 0;
    const geometryUPIDs =
      geometryData.features?.map((f) => f.properties.upid) || [];
    const geometryCentros =
      geometryData.features?.map((f) => f.properties.nombre_centro_gestor) ||
      [];

    console.log(`  ✅ Geometry features: ${geometryCount}`);
    console.log(`  📋 First 5 UPIDs: ${geometryUPIDs.slice(0, 5).join(", ")}`);
    console.log(
      `  🏢 All have correct centro: ${geometryCentros.every(
        (c) => c === centro
      )}`
    );
    console.log(
      `  🏢 Unique centros: ${[...new Set(geometryCentros)].join(", ")}`
    );

    // 2. Test Attributes Endpoint
    console.log("\n📊 Test 2: Attributes Endpoint");
    const attributesUrl = `${baseUrl}/unidades-proyecto/attributes?nombre_centro_gestor=${encodedCentro}`;
    const attributesResponse = await fetch(attributesUrl);
    const attributesData = await attributesResponse.json();

    const attributesCount = attributesData.data?.length || 0;
    const attributesUPIDs = attributesData.data?.map((item) => item.upid) || [];
    const attributesCentros =
      attributesData.data?.map((item) => item.nombre_centro_gestor) || [];

    console.log(`  ✅ Attribute items: ${attributesCount}`);
    console.log(
      `  📋 First 5 UPIDs: ${attributesUPIDs.slice(0, 5).join(", ")}`
    );
    console.log(
      `  🏢 All have correct centro: ${attributesCentros.every(
        (c) => c === centro
      )}`
    );
    console.log(
      `  🏢 Unique centros: ${[...new Set(attributesCentros)].join(", ")}`
    );

    // 3. Test Without Filters (Frontend loading behavior)
    console.log("\n🌐 Test 3: Loading ALL data (Frontend behavior)");
    const allGeometryUrl = `${baseUrl}/unidades-proyecto/geometry`;
    const allAttributesUrl = `${baseUrl}/unidades-proyecto/attributes`;

    const [allGeoResponse, allAttrResponse] = await Promise.all([
      fetch(allGeometryUrl),
      fetch(allAttributesUrl),
    ]);

    const allGeoData = await allGeoResponse.json();
    const allAttrData = await allAttrResponse.json();

    const allGeoCount = allGeoData.features?.length || 0;
    const allAttrCount = allAttrData.data?.length || 0;

    console.log(`  📦 Total geometry features: ${allGeoCount}`);
    console.log(`  📦 Total attribute items: ${allAttrCount}`);

    // Filter locally by centro_gestor
    const filteredGeoFeatures =
      allGeoData.features?.filter(
        (f) => f.properties.nombre_centro_gestor === centro
      ) || [];

    const filteredAttrItems =
      allAttrData.data?.filter(
        (item) => item.nombre_centro_gestor === centro
      ) || [];

    console.log(
      `  🔍 Filtered geometry (local): ${filteredGeoFeatures.length}`
    );
    console.log(
      `  🔍 Filtered attributes (local): ${filteredAttrItems.length}`
    );

    // 4. Test UPID Alignment
    console.log("\n🔗 Test 4: UPID Alignment");
    const geoUPIDSet = new Set(
      filteredGeoFeatures.map((f) => f.properties.upid)
    );
    const attrUPIDSet = new Set(filteredAttrItems.map((item) => item.upid));

    const geoOnlyUPIDs = [...geoUPIDSet].filter(
      (upid) => !attrUPIDSet.has(upid)
    );
    const attrOnlyUPIDs = [...attrUPIDSet].filter(
      (upid) => !geoUPIDSet.has(upid)
    );
    const commonUPIDs = [...geoUPIDSet].filter((upid) => attrUPIDSet.has(upid));

    console.log(`  ✅ Common UPIDs: ${commonUPIDs.length}`);
    console.log(
      `  📍 Only in geometry: ${geoOnlyUPIDs.length}`,
      geoOnlyUPIDs.length > 0 ? geoOnlyUPIDs : ""
    );
    console.log(
      `  📊 Only in attributes: ${attrOnlyUPIDs.length}`,
      attrOnlyUPIDs.length > 0 ? attrOnlyUPIDs : ""
    );

    // 5. Summary
    console.log("\n📋 Summary:");
    console.log(
      `  ${
        geometryCount === attributesCount ? "✅" : "❌"
      } Counts match: geometry=${geometryCount}, attributes=${attributesCount}`
    );
    console.log(
      `  ${
        filteredGeoFeatures.length === filteredAttrItems.length ? "✅" : "❌"
      } Local filter counts match: geo=${filteredGeoFeatures.length}, attr=${
        filteredAttrItems.length
      }`
    );
    console.log(
      `  ${
        geoOnlyUPIDs.length === 0 && attrOnlyUPIDs.length === 0 ? "✅" : "❌"
      } UPID sets are identical`
    );
    console.log(
      `  ${commonUPIDs.length > 0 ? "✅" : "❌"} Has matching records: ${
        commonUPIDs.length
      }`
    );

    if (
      filteredGeoFeatures.length > 0 &&
      filteredAttrItems.length > 0 &&
      commonUPIDs.length === 0
    ) {
      console.log(
        "\n⚠️ WARNING: Both endpoints return data but UPIDs don't match!"
      );
      console.log(
        "  Sample geometry UPID:",
        filteredGeoFeatures[0].properties.upid,
        typeof filteredGeoFeatures[0].properties.upid
      );
      console.log(
        "  Sample attribute UPID:",
        filteredAttrItems[0].upid,
        typeof filteredAttrItems[0].upid
      );
    }

    console.log("\n✅ Test completed successfully\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testCentroGestorAlignment();

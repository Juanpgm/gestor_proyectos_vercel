/**
 * Test para verificar como el frontend está llamando a los endpoints
 * a través del proxy y que respuestas está recibiendo
 */

const testFrontendProxyBehavior = async () => {
  console.log("🔍 Testing Frontend Proxy Behavior for COMUNA 02...\n");

  // Test directo a API (como backend)
  console.log("1️⃣ Testing direct API calls...");
  const directBaseUrl =
    "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto";
  const filter = "comuna_corregimiento=COMUNA%2002";

  try {
    const [directGeometry, directAttributes] = await Promise.all([
      fetch(`${directBaseUrl}/geometry?${filter}`),
      fetch(`${directBaseUrl}/attributes?${filter}`),
    ]);

    const directGeometryData = await directGeometry.json();
    const directAttributesData = await directAttributes.json();

    console.log("Direct API Results:");
    console.log(
      `  Geometry: ${directGeometryData.features?.length || 0} features`
    );
    console.log(
      `  Attributes: ${directAttributesData.data?.length || 0} records`
    );
    console.log(
      `  Attributes total: ${directAttributesData.total_before_limit || 0}`
    );
  } catch (error) {
    console.error("Error testing direct API:", error);
  }

  // Test a través del proxy (como frontend)
  console.log("\n2️⃣ Testing proxy calls...");
  const proxyBaseUrl = "/api/proxy/unidades-proyecto";

  try {
    const [proxyGeometry, proxyAttributes] = await Promise.all([
      fetch(`${proxyBaseUrl}/geometry?${filter}`),
      fetch(`${proxyBaseUrl}/attributes?${filter}`),
    ]);

    const proxyGeometryData = await proxyGeometry.json();
    const proxyAttributesData = await proxyAttributes.json();

    console.log("Proxy Results:");
    console.log(
      `  Geometry: ${proxyGeometryData.features?.length || 0} features`
    );
    console.log(
      `  Attributes: ${
        Array.isArray(proxyAttributesData)
          ? proxyAttributesData.length
          : proxyAttributesData.data?.length || 0
      } records`
    );

    console.log("\nProxy Response Structures:");
    console.log("  Geometry response keys:", Object.keys(proxyGeometryData));
    console.log(
      "  Attributes response type:",
      Array.isArray(proxyAttributesData) ? "array" : "object"
    );
    if (!Array.isArray(proxyAttributesData)) {
      console.log(
        "  Attributes response keys:",
        Object.keys(proxyAttributesData)
      );
    }
  } catch (error) {
    console.error("Error testing proxy:", error.message);
    console.log("Note: Proxy tests can only run from frontend environment");
  }

  // Test con diferentes límites
  console.log("\n3️⃣ Testing with different limits...");
  const limits = [10, 25, 50, 100];

  for (const limit of limits) {
    try {
      const [geomResponse, attrResponse] = await Promise.all([
        fetch(`${directBaseUrl}/geometry?${filter}&limit=${limit}`),
        fetch(`${directBaseUrl}/attributes?${filter}&limit=${limit}`),
      ]);

      const geomData = await geomResponse.json();
      const attrData = await attrResponse.json();

      console.log(
        `  Limit ${limit}: Geometry ${
          geomData.features?.length || 0
        }, Attributes ${attrData.data?.length || 0}`
      );
    } catch (error) {
      console.error(`Error testing limit ${limit}:`, error.message);
    }
  }

  // Test comportamiento por defecto (sin límite explícito)
  console.log("\n4️⃣ Testing default behavior (no explicit limit)...");
  try {
    const [geomDefault, attrDefault] = await Promise.all([
      fetch(`${directBaseUrl}/geometry?${filter}`),
      fetch(`${directBaseUrl}/attributes?${filter}`),
    ]);

    const geomDefaultData = await geomDefault.json();
    const attrDefaultData = await attrDefault.json();

    console.log("Default (no limit):");
    console.log(
      `  Geometry: ${geomDefaultData.features?.length || 0} features`
    );
    console.log(`  Attributes: ${attrDefaultData.data?.length || 0} records`);
    console.log(`  Geometry metadata:`, geomDefaultData.properties);
    console.log(`  Attributes pagination:`, attrDefaultData.pagination);
  } catch (error) {
    console.error("Error testing default behavior:", error);
  }
};

// Test específico para el problema reportado
const testSpecificIssue = async () => {
  console.log("\n🎯 Testing specific COMUNA 02 issue...\n");

  const baseUrl =
    "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto";
  const filter = "comuna_corregimiento=COMUNA%2002";

  try {
    // Llamar igual que el frontend haría
    const geometryUrl = `${baseUrl}/geometry?${filter}`;
    const attributesUrl = `${baseUrl}/attributes?${filter}`;

    console.log("URLs being called:");
    console.log(`  Geometry: ${geometryUrl}`);
    console.log(`  Attributes: ${attributesUrl}`);

    const [geometryResponse, attributesResponse] = await Promise.all([
      fetch(geometryUrl),
      fetch(attributesUrl),
    ]);

    const geometryData = await geometryResponse.json();
    const attributesData = await attributesResponse.json();

    console.log("\nDetailed comparison:");

    // Análisis de geometría
    const geometryCount = geometryData.features?.length || 0;
    const geometryUPIDs = new Set(
      geometryData.features?.map((f) => f.properties?.upid) || []
    );

    console.log(`📍 Geometry endpoint:`);
    console.log(`  Features: ${geometryCount}`);
    console.log(`  Type: ${geometryData.type}`);
    console.log(`  Metadata count: ${geometryData.properties?.count}`);
    console.log(`  Unique UPIDs: ${geometryUPIDs.size}`);

    // Análisis de atributos
    const attributesCount = attributesData.data?.length || 0;
    const attributesUPIDs = new Set(
      attributesData.data?.map((item) => item.upid) || []
    );

    console.log(`\n📋 Attributes endpoint:`);
    console.log(`  Records: ${attributesCount}`);
    console.log(`  Success: ${attributesData.success}`);
    console.log(`  Total before limit: ${attributesData.total_before_limit}`);
    console.log(`  Unique UPIDs: ${attributesUPIDs.size}`);
    console.log(`  Has pagination: ${!!attributesData.pagination}`);

    // UPIDs de muestra para verificar qué está diferente
    const geometryUPIDArray = [...geometryUPIDs].slice(0, 10);
    const attributesUPIDArray = [...attributesUPIDs].slice(0, 10);

    console.log(`\n🔍 Sample UPIDs comparison:`);
    console.log(`  Geometry sample:`, geometryUPIDArray);
    console.log(`  Attributes sample:`, attributesUPIDArray);

    // Encontrar diferencias
    const onlyInGeometry = [...geometryUPIDs].filter(
      (upid) => !attributesUPIDs.has(upid)
    );
    const onlyInAttributes = [...attributesUPIDs].filter(
      (upid) => !geometryUPIDs.has(upid)
    );

    if (onlyInGeometry.length > 0) {
      console.log(
        `\n🔴 ${onlyInGeometry.length} UPIDs only in geometry:`,
        onlyInGeometry.slice(0, 5)
      );
    }

    if (onlyInAttributes.length > 0) {
      console.log(
        `\n🔴 ${onlyInAttributes.length} UPIDs only in attributes:`,
        onlyInAttributes.slice(0, 5)
      );
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Geometry features: ${geometryCount}`);
    console.log(`  Attributes records: ${attributesCount}`);
    console.log(
      `  Expected total: ${
        attributesData.total_before_limit ||
        geometryData.properties?.count ||
        "unknown"
      }`
    );
    console.log(
      `  Issue: ${
        geometryCount === attributesCount
          ? "No inconsistency detected"
          : "INCONSISTENCY CONFIRMED"
      }`
    );
  } catch (error) {
    console.error("Error in specific issue test:", error);
  }
};

// Ejecutar tests
const runTests = async () => {
  await testFrontendProxyBehavior();
  await testSpecificIssue();
};

runTests();

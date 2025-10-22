/**
 * Test para verificar consistencia entre endpoints de geometría y atributos
 * para el filtro de COMUNA 02
 */

const testEndpointsConsistency = async () => {
  const baseUrl =
    "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto";
  const filter = "comuna_corregimiento=COMUNA%2002";

  console.log("🔍 Probando consistencia entre endpoints para COMUNA 02...\n");

  try {
    // Test endpoint de geometría
    console.log("📍 Testing geometry endpoint...");
    const geometryResponse = await fetch(`${baseUrl}/geometry?${filter}`);
    const geometryData = await geometryResponse.json();

    console.log("Geometry Response:", {
      type: geometryData.type,
      featureCount: geometryData.features?.length || 0,
      hasProperties: !!geometryData.properties,
      success: geometryData.properties?.success,
      count: geometryData.properties?.count,
      message: geometryData.properties?.message,
    });

    // Test endpoint de atributos
    console.log("\n📋 Testing attributes endpoint...");
    const attributesResponse = await fetch(`${baseUrl}/attributes?${filter}`);
    const attributesData = await attributesResponse.json();

    console.log("Attributes Response:", {
      success: attributesData.success,
      dataCount: attributesData.data?.length || 0,
      count: attributesData.count,
      totalBeforeLimit: attributesData.total_before_limit,
      message: attributesData.message,
    });

    // Comparar resultados
    console.log("\n🔍 Análisis de consistencia:");
    const geometryCount = geometryData.features?.length || 0;
    const attributesCount = attributesData.data?.length || 0;

    console.log(`Geometría: ${geometryCount} features`);
    console.log(`Atributos: ${attributesCount} records`);
    console.log(`Diferencia: ${Math.abs(geometryCount - attributesCount)}`);

    if (geometryCount === attributesCount) {
      console.log("✅ Los endpoints son consistentes");
    } else {
      console.log("❌ INCONSISTENCIA DETECTADA entre endpoints");

      // Obtener UPIDs para comparar
      const geometryUPIDs = new Set(
        geometryData.features?.map((f) => f.properties.upid) || []
      );
      const attributesUPIDs = new Set(
        attributesData.data?.map((item) => item.upid) || []
      );

      console.log("\n📊 Análisis de UPIDs:");
      console.log(`UPIDs únicos en geometría: ${geometryUPIDs.size}`);
      console.log(`UPIDs únicos en atributos: ${attributesUPIDs.size}`);

      // UPIDs solo en geometría
      const onlyInGeometry = [...geometryUPIDs].filter(
        (upid) => !attributesUPIDs.has(upid)
      );
      if (onlyInGeometry.length > 0) {
        console.log(
          `\n🔴 UPIDs solo en geometría (${onlyInGeometry.length}):`,
          onlyInGeometry.slice(0, 5)
        );
      }

      // UPIDs solo en atributos
      const onlyInAttributes = [...attributesUPIDs].filter(
        (upid) => !geometryUPIDs.has(upid)
      );
      if (onlyInAttributes.length > 0) {
        console.log(
          `\n🔴 UPIDs solo en atributos (${onlyInAttributes.length}):`,
          onlyInAttributes.slice(0, 5)
        );
      }
    }

    // Test sin límite en geometría para verificar si es problema de paginación
    console.log("\n🔄 Testing geometry endpoint sin límite...");
    const geometryUnlimitedResponse = await fetch(
      `${baseUrl}/geometry?${filter}&limit=1000`
    );
    const geometryUnlimitedData = await geometryUnlimitedResponse.json();

    console.log("Geometry Unlimited Response:", {
      featureCount: geometryUnlimitedData.features?.length || 0,
      count: geometryUnlimitedData.properties?.count,
    });
  } catch (error) {
    console.error("❌ Error durante las pruebas:", error);
  }
};

// Función para probar múltiples comunas
const testMultipleComunas = async () => {
  const comunas = ["COMUNA%2001", "COMUNA%2002", "COMUNA%2003", "COMUNA%2004"];

  console.log("\n🌍 Probando múltiples comunas...\n");

  for (const comuna of comunas) {
    const comunaName = decodeURIComponent(comuna);
    console.log(`\n📍 Testing ${comunaName}:`);

    try {
      const baseUrl =
        "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto";

      const [geometryResponse, attributesResponse] = await Promise.all([
        fetch(`${baseUrl}/geometry?comuna_corregimiento=${comuna}&limit=100`),
        fetch(`${baseUrl}/attributes?comuna_corregimiento=${comuna}&limit=100`),
      ]);

      const geometryData = await geometryResponse.json();
      const attributesData = await attributesResponse.json();

      const geometryCount = geometryData.features?.length || 0;
      const attributesCount = attributesData.data?.length || 0;
      const diff = Math.abs(geometryCount - attributesCount);

      console.log(
        `  Geometría: ${geometryCount}, Atributos: ${attributesCount}, Diff: ${diff} ${
          diff > 0 ? "❌" : "✅"
        }`
      );
    } catch (error) {
      console.error(`  Error testing ${comunaName}:`, error.message);
    }
  }
};

// Ejecutar pruebas
const runAllTests = async () => {
  await testEndpointsConsistency();
  await testMultipleComunas();
};

runAllTests();

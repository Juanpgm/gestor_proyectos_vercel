/**
 * Test específico para verificar si el fix está desplegado en Railway
 */

const testRailwayFix = async () => {
  const baseUrl =
    "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto";
  const filter = "comuna_corregimiento=COMUNA%2002";

  console.log("🚀 Testing Railway Production API for fix validation...\n");

  const testCases = [
    { limit: 10, name: "Limit 10" },
    { limit: 25, name: "Limit 25" },
    { limit: 50, name: "Limit 50" },
    { limit: 100, name: "Limit 100" },
    { limit: null, name: "No Limit" },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing ${testCase.name}:`);

    try {
      const limitQuery = testCase.limit ? `&limit=${testCase.limit}` : "";
      const geometryUrl = `${baseUrl}/geometry?${filter}${limitQuery}`;
      const attributesUrl = `${baseUrl}/attributes?${filter}${limitQuery}`;

      const [geometryResponse, attributesResponse] = await Promise.all([
        fetch(geometryUrl),
        fetch(attributesUrl),
      ]);

      const geometryData = await geometryResponse.json();
      const attributesData = await attributesResponse.json();

      const geometryCount = geometryData.features?.length || 0;
      const attributesCount = attributesData.data?.length || 0;
      const totalBeforeLimit =
        attributesData.total_before_limit || attributesData.count;

      const isConsistent = geometryCount === attributesCount;
      const statusIcon = isConsistent ? "✅" : "❌";

      console.log(
        `  ${statusIcon} Geometry: ${geometryCount}, Attributes: ${attributesCount}`
      );
      console.log(`  📊 Total before limit: ${totalBeforeLimit}`);

      if (!isConsistent) {
        console.log(
          `  🔴 INCONSISTENCIA: Diferencia de ${Math.abs(
            geometryCount - attributesCount
          )} registros`
        );

        // Debug adicional para entender el problema
        console.log(`  🔍 Geometry metadata:`, {
          success: geometryData.properties?.success,
          count: geometryData.properties?.count,
          message: geometryData.properties?.message?.substring(0, 50) + "...",
        });

        console.log(`  🔍 Attributes metadata:`, {
          success: attributesData.success,
          count: attributesData.count,
          message: attributesData.message?.substring(0, 50) + "...",
          pagination: attributesData.pagination,
        });
      } else {
        console.log(`  ✨ Endpoints consistentes - Fix funcionando!`);
      }
    } catch (error) {
      console.error(`  ❌ Error testing ${testCase.name}:`, error.message);
    }
  }

  // Test adicional para verificar si el problema persiste en otras comunas
  console.log(`\n🌍 Testing otras comunas para verificar fix completo...`);

  const otherComunas = ["COMUNA%2001", "COMUNA%2003", "COMUNA%2004"];

  for (const comuna of otherComunas) {
    const comunaName = decodeURIComponent(comuna);
    console.log(`\n📍 ${comunaName} con limit 50:`);

    try {
      const limitQuery = "&limit=50";
      const geometryUrl = `${baseUrl}/geometry?comuna_corregimiento=${comuna}${limitQuery}`;
      const attributesUrl = `${baseUrl}/attributes?comuna_corregimiento=${comuna}${limitQuery}`;

      const [geometryResponse, attributesResponse] = await Promise.all([
        fetch(geometryUrl),
        fetch(attributesUrl),
      ]);

      const geometryData = await geometryResponse.json();
      const attributesData = await attributesResponse.json();

      const geometryCount = geometryData.features?.length || 0;
      const attributesCount = attributesData.data?.length || 0;
      const isConsistent = geometryCount === attributesCount;
      const statusIcon = isConsistent ? "✅" : "❌";

      console.log(
        `  ${statusIcon} Geometry: ${geometryCount}, Attributes: ${attributesCount}`
      );
    } catch (error) {
      console.error(`  ❌ Error testing ${comunaName}:`, error.message);
    }
  }
};

// Test para verificar timestamp del deployment
const checkDeploymentTime = async () => {
  console.log("\n🕒 Checking deployment timestamp...");

  try {
    const response = await fetch(
      "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/geometry?limit=1"
    );
    const data = await response.json();

    if (data.properties) {
      console.log("📅 API Response metadata:");
      console.log(`  Success: ${data.properties.success}`);
      console.log(`  Message: ${data.properties.message}`);
      console.log(
        `  Functional approach: ${data.properties.functional_approach}`
      );

      // El timestamp nos puede dar pista de cuándo se hizo el último deployment
      const timestamp = data.properties.timestamp || "Not available";
      console.log(`  Timestamp: ${timestamp}`);
    }
  } catch (error) {
    console.error("Error checking deployment time:", error);
  }
};

const runFullValidation = async () => {
  await checkDeploymentTime();
  await testRailwayFix();

  console.log("\n🎯 RESUMEN:");
  console.log(
    "Si ves ✅ en todos los tests de COMUNA 02, el fix está funcionando."
  );
  console.log(
    "Si ves ❌, el fix aún no se ha desplegado en Railway o hay otro problema."
  );
};

runFullValidation();

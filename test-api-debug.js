// Test script para debuggear el problema de los 6 elementos
console.log("🔍 Testing Unidades Proyecto API...");

async function testAPI() {
  try {
    // Test 1: API directa
    console.log("\n1. Testing API directa...");
    const directResponse = await fetch(
      "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/attributes"
    );
    console.log(`   - Status: ${directResponse.status}`);
    console.log(
      `   - Headers: ${JSON.stringify(
        Object.fromEntries(directResponse.headers)
      )}`
    );
    const directData = await directResponse.json();
    console.log(`   - Type of response: ${typeof directData}`);
    console.log(`   - Is Array: ${Array.isArray(directData)}`);
    console.log(`   - Data length: ${directData?.length || "undefined"}`);
    console.log(
      `   - Sample data:`,
      JSON.stringify(directData, null, 2).substring(0, 500) + "..."
    );

    // Check if data is wrapped in success/data structure
    if (directData && directData.data && Array.isArray(directData.data)) {
      console.log(`   - REAL data length: ${directData.data.length} elementos`);
    }

    // Test 2: API through proxy
    console.log("\n2. Testing API through proxy...");
    const proxyResponse = await fetch(
      "http://localhost:3000/api/proxy/unidades-proyecto/attributes"
    );
    console.log(`   - Status: ${proxyResponse.status}`);
    const proxyData = await proxyResponse.json();
    console.log(`   - Type of response: ${typeof proxyData}`);
    console.log(`   - Is Array: ${Array.isArray(proxyData)}`);
    console.log(`   - Data length: ${proxyData?.length || "undefined"}`);
    console.log(
      `   - Sample data:`,
      JSON.stringify(proxyData, null, 2).substring(0, 500) + "..."
    );

    // Check if data is wrapped in success/data structure
    if (proxyData && proxyData.data && Array.isArray(proxyData.data)) {
      console.log(`   - REAL data length: ${proxyData.data.length} elementos`);
    }

    // Test 3: Sample data
    if (Array.isArray(directData) && directData.length > 0) {
      console.log("\n3. Sample elements from API:");
      directData.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.upid}: ${item.nombre_up}`);
      });
    }

    // Test 4: Check if there are any filters or null values
    if (Array.isArray(directData)) {
      console.log("\n4. Data quality check:");
      const withNullNames = directData.filter((item) => !item.nombre_up);
      const withEmptyNames = directData.filter((item) => item.nombre_up === "");
      console.log(`   - Elements with null names: ${withNullNames.length}`);
      console.log(`   - Elements with empty names: ${withEmptyNames.length}`);
    }
  } catch (error) {
    console.error("❌ Error testing API:", error);
  }
}

testAPI();

// Test rápido para verificar que el problema se resolvió
async function quickTest() {
  console.log("🔍 Testing fixed API response...");

  try {
    const response = await fetch(
      "http://localhost:3000/api/proxy/unidades-proyecto/attributes"
    );
    const data = await response.json();

    console.log("\n📊 Results:");
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${typeof data}`);
    console.log(`Is array: ${Array.isArray(data)}`);
    console.log(`Length: ${Array.isArray(data) ? data.length : "N/A"}`);

    if (Array.isArray(data) && data.length > 0) {
      console.log("\n✅ SUCCESS: Data is now properly structured as array!");
      console.log(`📈 Total elements: ${data.length}`);
      console.log("\n🔍 Sample elements:");
      data.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.upid}: ${item.nombre_up}`);
      });
    } else if (data && data.data && Array.isArray(data.data)) {
      console.log("\n⚠️  Data still wrapped in response object");
      console.log(`📈 Actual data length: ${data.data.length}`);
    } else {
      console.log("\n❌ Data structure still not correct");
      console.log(
        "Sample:",
        JSON.stringify(data, null, 2).substring(0, 200) + "..."
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

quickTest();

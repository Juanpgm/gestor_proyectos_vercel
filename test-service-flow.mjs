// Script para diagnosticar el problema paso a paso
import { fetchAttributeData } from "./src/services/unidades-proyecto.service.js";

async function testFullFlow() {
  console.log("🔍 Testing full data flow...");

  try {
    // Test the service function directly
    console.log("1. Calling fetchAttributeData()...");
    const result = await fetchAttributeData();

    console.log("2. Result analysis:");
    console.log(`   - Type: ${typeof result}`);
    console.log(`   - Is Array: ${Array.isArray(result)}`);
    console.log(`   - Length: ${result?.length || "undefined"}`);

    if (Array.isArray(result) && result.length > 0) {
      console.log("3. Sample items:");
      result.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.upid}: ${item.nombre_up}`);
      });

      console.log(`4. Full list of UPIDs (first 10):`);
      result.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.upid}`);
      });
    }
  } catch (error) {
    console.error("❌ Error in test:", error);
  }
}

testFullFlow();

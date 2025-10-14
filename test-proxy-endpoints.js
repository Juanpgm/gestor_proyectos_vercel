// Test script para verificar endpoints a través del proxy
async function testProxyEndpoints() {
  console.log("🔍 Probando endpoints a través del proxy local...");

  const endpoints = ["bancos_emprestito_all", "emprestito_bancos_all"];

  const baseUrl = "http://localhost:3000/api/proxy";

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Probando proxy: ${endpoint}`);
      const response = await fetch(`${baseUrl}/${endpoint}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}:`);
        console.log("- Status:", response.status);

        // Verificar formato de respuesta
        if (data.success && data.data) {
          console.log("- Formato: {success: true, data: [...]}");
          console.log("- Total registros:", data.data.length);

          const firstRecord = data.data[0];
          if (firstRecord) {
            console.log("- Campos disponibles:", Object.keys(firstRecord));
            console.log("- Muestra:", firstRecord);

            // Buscar campos relacionados con valores
            const valueFields = Object.keys(firstRecord).filter(
              (key) =>
                key.toLowerCase().includes("valor") ||
                key.toLowerCase().includes("asignado") ||
                key.toLowerCase().includes("monto")
            );
            if (valueFields.length > 0) {
              console.log("- 💰 Campos de valor encontrados:", valueFields);
            }
          }
        } else if (Array.isArray(data)) {
          console.log("- Formato: Array directo");
          console.log("- Total registros:", data.length);
          if (data[0]) {
            console.log("- Campos disponibles:", Object.keys(data[0]));
            console.log("- Muestra:", data[0]);
          }
        } else {
          console.log("- Formato desconocido:", typeof data);
          console.log("- Muestra:", data);
        }
      } else {
        console.log(
          `❌ ${endpoint}: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
    }
  }
}

testProxyEndpoints();

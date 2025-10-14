// Test script para verificar endpoints de bancos disponibles
async function testAllBancosEndpoints() {
  console.log("🔍 Probando diferentes endpoints de bancos...");

  const endpoints = [
    "bancos_emprestito_all",
    "emprestito_bancos_all",
    "bancos_emprestito",
    "emprestito_bancos",
    "bancos",
    "bancos_all",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Probando: ${endpoint}`);
      const response = await fetch(
        `https://gestorproyectoapi-production.up.railway.app/${endpoint}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}:`);
        console.log("- Status:", response.status);
        console.log(
          "- Total registros:",
          data.data?.length || data.length || 0
        );

        const firstRecord = data.data?.[0] || data[0];
        if (firstRecord) {
          console.log("- Campos disponibles:", Object.keys(firstRecord));
          console.log("- Muestra:", firstRecord);

          // Buscar campos relacionados con valores
          const valueFields = Object.keys(firstRecord).filter(
            (key) =>
              key.toLowerCase().includes("valor") ||
              key.toLowerCase().includes("asignado") ||
              key.toLowerCase().includes("monto") ||
              key.toLowerCase().includes("amount")
          );
          if (valueFields.length > 0) {
            console.log("- Campos de valor encontrados:", valueFields);
          }
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

testAllBancosEndpoints();

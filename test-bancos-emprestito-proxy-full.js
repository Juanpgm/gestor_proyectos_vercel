// Test para verificar bancos_emprestito_all via proxy y buscar valor_asignado_banco
async function testBancosEmprestitoProxy() {
  console.log("🔍 Testando endpoint bancos_emprestito_all via proxy...");

  try {
    const response = await fetch(
      "http://localhost:3000/api/proxy/bancos_emprestito_all"
    );
    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Respuesta exitosa:");
      console.log("- Tipo de data:", typeof data);
      console.log("- Es array:", Array.isArray(data));
      console.log("- Tiene success:", "success" in data);
      console.log("- Tiene data:", "data" in data);

      let records = [];
      if (data.success && data.data) {
        console.log("- Formato: {success: true, data: [...]}");
        records = data.data;
        console.log("- Total registros:", records.length);
      } else if (Array.isArray(data)) {
        console.log("- Formato: Array directo");
        records = data;
        console.log("- Total registros:", records.length);
      } else if (data.data) {
        console.log("- Formato con data property");
        records = data.data;
        console.log("- Total registros:", records.length);
      }

      console.log("- Muestra de datos completos:", records.slice(0, 3));

      if (records.length > 0) {
        const firstRecord = records[0];
        console.log("- Campos del primer registro:", Object.keys(firstRecord));
        console.log("- Primer registro completo:", firstRecord);

        // Buscar campos relacionados con valores
        const valueFields = Object.keys(firstRecord).filter(
          (key) =>
            key.toLowerCase().includes("valor") ||
            key.toLowerCase().includes("asignado") ||
            key.toLowerCase().includes("monto") ||
            key.toLowerCase().includes("amount")
        );
        console.log("- Campos de valor encontrados:", valueFields);

        // Verificar específicamente valor_asignado_banco
        console.log(
          "- Tiene valor_asignado_banco:",
          "valor_asignado_banco" in firstRecord
        );
        if (firstRecord.valor_asignado_banco !== undefined) {
          console.log(
            "- Valor de valor_asignado_banco:",
            firstRecord.valor_asignado_banco
          );
        }

        // Mostrar todos los registros con valor_asignado_banco
        const withValues = records.filter(
          (r) =>
            r.valor_asignado_banco !== undefined &&
            r.valor_asignado_banco !== null
        );
        console.log("- Registros con valor_asignado_banco:", withValues.length);
        if (withValues.length > 0) {
          console.log(
            "- Valores encontrados:",
            withValues.map((r) => ({
              banco: r.nombre_banco || r.banco,
              valor: r.valor_asignado_banco,
            }))
          );
        }
      }
    } else {
      console.log(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log("Error body:", errorText);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

testBancosEmprestitoProxy();

// Test específico para el endpoint emprestito_bancos_all via proxy
async function testEmprestitoBancosProxy() {
  console.log("🔍 Testando endpoint emprestito_bancos_all via proxy...");

  try {
    const response = await fetch(
      "http://localhost:3000/api/proxy/emprestito_bancos_all"
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

      if (data.success && data.data) {
        console.log("- Formato: {success: true, data: [...]}");
        console.log("- Total registros:", data.data.length);
        console.log("- Muestra de datos:", data.data.slice(0, 3));

        if (data.data.length > 0) {
          const firstRecord = data.data[0];
          console.log(
            "- Campos del primer registro:",
            Object.keys(firstRecord)
          );
          console.log(
            "- Tiene valor_asignado_banco:",
            "valor_asignado_banco" in firstRecord
          );
          if (firstRecord.valor_asignado_banco) {
            console.log(
              "- Valor de valor_asignado_banco:",
              firstRecord.valor_asignado_banco
            );
          }
        }
      } else if (Array.isArray(data)) {
        console.log("- Formato: Array directo");
        console.log("- Total registros:", data.length);
        console.log("- Muestra de datos:", data.slice(0, 3));
      } else {
        console.log("- Formato desconocido:", data);
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

testEmprestitoBancosProxy();

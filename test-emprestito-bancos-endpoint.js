// Test script para verificar diferencias entre endpoints de bancos
async function testBancosEndpoints() {
  console.log("🔍 Comparando endpoints de bancos...");

  try {
    // Endpoint original
    const bancosRes = await fetch(
      "https://gestorproyectoapi-production.up.railway.app/bancos_emprestito_all"
    );
    const bancosData = await bancosRes.json();

    // Endpoint nuevo
    const emprestitoBancosRes = await fetch(
      "https://gestorproyectoapi-production.up.railway.app/emprestito_bancos_all"
    );
    const emprestitoBancosData = await emprestitoBancosRes.json();

    console.log("📊 Datos de bancos_emprestito_all:");
    console.log("- Total registros:", bancosData.data?.length || 0);
    console.log("- Muestra:", bancosData.data?.slice(0, 2));
    console.log(
      "- Campos disponibles:",
      bancosData.data?.[0] ? Object.keys(bancosData.data[0]) : []
    );

    console.log("\n📊 Datos de emprestito_bancos_all:");
    console.log("- Total registros:", emprestitoBancosData.data?.length || 0);
    console.log("- Muestra:", emprestitoBancosData.data?.slice(0, 2));
    console.log(
      "- Campos disponibles:",
      emprestitoBancosData.data?.[0]
        ? Object.keys(emprestitoBancosData.data[0])
        : []
    );

    // Comparar valores de asignación
    if (bancosData.data && emprestitoBancosData.data) {
      console.log("\n💰 Comparación de valores asignados:");
      const bancosConValor = bancosData.data.filter(
        (b) => b.valor_asignado_banco
      );
      const emprestitoConValor = emprestitoBancosData.data.filter(
        (b) => b.valor_asignado_banco || b.valor_asignado
      );

      console.log(
        "- bancos_emprestito_all con valores:",
        bancosConValor.length
      );
      console.log(
        "- emprestito_bancos_all con valores:",
        emprestitoConValor.length
      );

      bancosConValor.forEach((banco) => {
        const equivalente = emprestitoBancosData.data.find(
          (eb) =>
            eb.nombre_banco === banco.nombre_banco ||
            eb.banco === banco.nombre_banco
        );
        if (equivalente) {
          console.log(`- ${banco.nombre_banco}:`);
          console.log(
            `  Original: ${banco.valor_asignado_banco?.toLocaleString()}`
          );
          console.log(
            `  Nuevo: ${(
              equivalente.valor_asignado_banco || equivalente.valor_asignado
            )?.toLocaleString()}`
          );
        }
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testBancosEndpoints();

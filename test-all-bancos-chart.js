// Test para verificar que se muestran todos los bancos con valor_asignado_banco
async function testAllBancosInChart() {
  console.log("🔍 Testando bancos que deben aparecer en el gráfico...");

  try {
    const response = await fetch(
      "http://localhost:3000/api/proxy/bancos_emprestito_all"
    );

    if (response.ok) {
      const data = await response.json();
      let bancosArray = [];

      if (data.success && data.data) {
        bancosArray = data.data;
      } else if (Array.isArray(data)) {
        bancosArray = data;
      } else if (data.data) {
        bancosArray = data.data;
      }

      console.log("📊 Total de bancos en endpoint:", bancosArray.length);

      // Filtrar bancos que tienen valor_asignado_banco válido (> 0)
      const bancosConValorValido = bancosArray.filter(
        (b) => b.valor_asignado_banco && b.valor_asignado_banco > 0
      );
      console.log(
        "💰 Bancos con valor_asignado_banco válido:",
        bancosConValorValido.length
      );

      console.log("\n📋 Bancos que DEBEN aparecer en el gráfico:");
      bancosConValorValido
        .sort((a, b) => b.valor_asignado_banco - a.valor_asignado_banco) // Ordenar por valor descendente
        .forEach((banco, index) => {
          console.log(
            `${index + 1}. ${
              banco.nombre_banco
            }: ${banco.valor_asignado_banco.toLocaleString()}`
          );
        });

      console.log("\n✅ EXPECTATIVA:");
      console.log(
        `El gráfico "Análisis Financiero por Banco" debe mostrar TODOS estos ${bancosConValorValido.length} bancos`
      );
      console.log(
        "Incluso si algunos no tienen contratos asociados, deben aparecer con:"
      );
      console.log("- Asignado Banco: Su valor del endpoint");
      console.log("- Valor Adjudicado: 0 (si no tienen contratos)");
      console.log("- Ejecución Financiera: 0 (si no tienen contratos)");
      console.log("- Pagos: 0");

      return bancosConValorValido;
    } else {
      console.log("❌ Error al obtener datos:", response.status);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

testAllBancosInChart();

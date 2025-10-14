// Test para verificar el cálculo de valorTotalAsignadoBanco
async function testValorTotalAsignadoBanco() {
  console.log("🔍 Testando cálculo de valorTotalAsignadoBanco...");

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

      console.log("📊 Total de bancos:", bancosArray.length);

      // Filtrar bancos que tienen valor_asignado_banco
      const bancosConValor = bancosArray.filter((b) => b.valor_asignado_banco);
      console.log("💰 Bancos con valor_asignado_banco:", bancosConValor.length);

      // Mostrar cada banco con su valor
      bancosConValor.forEach((banco) => {
        console.log(
          `- ${
            banco.nombre_banco
          }: ${banco.valor_asignado_banco.toLocaleString()}`
        );
      });

      // Calcular suma total (esto es lo que debería mostrar la card)
      const valorTotalAsignadoBanco = bancosArray.reduce(
        (sum, banco) => sum + (banco.valor_asignado_banco || 0),
        0
      );

      console.log("\n✅ RESULTADO:");
      console.log(
        "💵 Valor Total Asignado Banco:",
        valorTotalAsignadoBanco.toLocaleString()
      );
      console.log(
        "💵 En formato moneda:",
        new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        }).format(valorTotalAsignadoBanco)
      );

      return valorTotalAsignadoBanco;
    } else {
      console.log("❌ Error al obtener datos:", response.status);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

testValorTotalAsignadoBanco();

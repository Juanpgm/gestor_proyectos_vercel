// Test simulado para verificar que el código maneja correctamente valor_asignado_banco
function testValorAsignadoBancoLogic() {
  console.log("🧪 Simulando datos del endpoint emprestito_bancos_all...");

  // Datos simulados que deberían venir del endpoint emprestito_bancos_all
  const emprestitoBancos = [
    {
      nombre_banco: "Banco Caja Social",
      valor_asignado_banco: 15000000000, // 15 mil millones
      id: "banco1",
    },
    {
      nombre_banco: "Banco de Bogotá",
      valor_asignado_banco: 12500000000, // 12.5 mil millones
      id: "banco2",
    },
    {
      nombre_banco: "Bancolombia",
      valor_asignado_banco: 20000000000, // 20 mil millones
      id: "banco3",
    },
  ];

  // Datos simulados de contratos
  const contratos = [
    { banco: "Banco Caja Social", valor_contrato: 5000000000 },
    { banco: "Banco Caja Social", valor_contrato: 3000000000 },
    { banco: "Banco de Bogotá", valor_contrato: 4000000000 },
    { banco: "Bancolombia", valor_contrato: 6000000000 },
  ];

  console.log("\n📊 Datos de entrada:");
  console.log(
    "- Empréstito bancos:",
    emprestitoBancos.map((b) => ({
      banco: b.nombre_banco,
      valorAsignado: b.valor_asignado_banco.toLocaleString(),
    }))
  );

  console.log(
    "- Contratos:",
    contratos.map((c) => ({
      banco: c.banco,
      valorContrato: c.valor_contrato.toLocaleString(),
    }))
  );

  // Simular la lógica del código
  const bankMap = new Map();

  contratos.forEach((contrato) => {
    const banco = contrato.banco;
    const valorContrato = contrato.valor_contrato;

    if (!bankMap.has(banco)) {
      // Buscar valor asignado desde emprestito_bancos_all
      const datosBanco = emprestitoBancos.find((b) => b.nombre_banco === banco);
      const valorAsignadoBanco = datosBanco?.valor_asignado_banco || 0;

      bankMap.set(banco, {
        banco,
        valorAsignadoBanco: valorAsignadoBanco, // Del endpoint emprestito_bancos_all
        valorAdjudicado: 0, // Suma de contratos
        totalContratos: 0,
      });
    }

    const analysis = bankMap.get(banco);
    analysis.totalContratos += 1;
    analysis.valorAdjudicado += valorContrato;
  });

  console.log("\n✅ Resultado esperado del análisis:");
  Array.from(bankMap.values()).forEach((bank) => {
    console.log(`- ${bank.banco}:`);
    console.log(
      `  * Asignado Banco (emprestito_bancos_all): ${bank.valorAsignadoBanco.toLocaleString()}`
    );
    console.log(
      `  * Valor Adjudicado (contratos): ${bank.valorAdjudicado.toLocaleString()}`
    );
    console.log(`  * Total Contratos: ${bank.totalContratos}`);
    console.log(
      `  * Diferencia: ${(
        bank.valorAsignadoBanco - bank.valorAdjudicado
      ).toLocaleString()}`
    );
  });
}

testValorAsignadoBancoLogic();

// Test para verificar la diferencia entre promedio simple y ponderado
function testPromedioVsPonderado() {
  console.log("🔍 Simulando diferencia entre promedio simple y ponderado...");

  // Datos simulados de contratos con diferentes valores y avances
  const contratos = [
    {
      valor_contrato: 1000000000, // 1 mil millones - CONTRATO GRANDE
      avance_fisico: 10, // 10% físico
      avance_financiero: 5, // 5% financiero
    },
    {
      valor_contrato: 100000000, // 100 millones - CONTRATO MEDIANO
      avance_fisico: 50, // 50% físico
      avance_financiero: 40, // 40% financiero
    },
    {
      valor_contrato: 50000000, // 50 millones - CONTRATO PEQUEÑO
      avance_fisico: 80, // 80% físico
      avance_financiero: 90, // 90% financiero
    },
    {
      valor_contrato: 10000000, // 10 millones - CONTRATO MUY PEQUEÑO
      avance_fisico: 100, // 100% físico
      avance_financiero: 100, // 100% financiero
    },
  ];

  console.log("📊 Datos de entrada:");
  contratos.forEach((c, i) => {
    console.log(
      `Contrato ${i + 1}: Valor ${c.valor_contrato.toLocaleString()}, Físico ${
        c.avance_fisico
      }%, Financiero ${c.avance_financiero}%`
    );
  });

  // CÁLCULO PROMEDIO SIMPLE (método anterior)
  const promedioFisicoSimple =
    contratos.reduce((sum, c) => sum + c.avance_fisico, 0) / contratos.length;
  const promedioFinancieroSimple =
    contratos.reduce((sum, c) => sum + c.avance_financiero, 0) /
    contratos.length;

  // CÁLCULO PROMEDIO PONDERADO (método nuevo)
  let totalPonderadoFisico = 0;
  let totalPonderadoFinanciero = 0;
  let totalPeso = 0;

  contratos.forEach((contrato) => {
    totalPonderadoFisico += contrato.avance_fisico * contrato.valor_contrato;
    totalPonderadoFinanciero +=
      contrato.avance_financiero * contrato.valor_contrato;
    totalPeso += contrato.valor_contrato;
  });

  const promedioFisicoPonderado =
    totalPeso > 0 ? totalPonderadoFisico / totalPeso : 0;
  const promedioFinancieroPonderado =
    totalPeso > 0 ? totalPonderadoFinanciero / totalPeso : 0;

  console.log("\n📈 RESULTADOS COMPARATIVOS:");
  console.log("EJECUCIÓN FÍSICA:");
  console.log(`- Promedio Simple: ${promedioFisicoSimple.toFixed(2)}%`);
  console.log(`- Promedio Ponderado: ${promedioFisicoPonderado.toFixed(2)}%`);
  console.log(
    `- Diferencia: ${(promedioFisicoPonderado - promedioFisicoSimple).toFixed(
      2
    )} puntos`
  );

  console.log("\nEJECUCIÓN FINANCIERA:");
  console.log(`- Promedio Simple: ${promedioFinancieroSimple.toFixed(2)}%`);
  console.log(
    `- Promedio Ponderado: ${promedioFinancieroPonderado.toFixed(2)}%`
  );
  console.log(
    `- Diferencia: ${(
      promedioFinancieroPonderado - promedioFinancieroSimple
    ).toFixed(2)} puntos`
  );

  console.log("\n✅ INTERPRETACIÓN:");
  console.log(
    "El promedio ponderado da más peso a los contratos de mayor valor."
  );
  console.log(
    "En este ejemplo, el contrato más grande (1 mil millones) tiene avances bajos,"
  );
  console.log(
    "por lo que el promedio ponderado será menor que el promedio simple."
  );
  console.log(
    "Esto refleja mejor la realidad del proyecto considerando el impacto monetario."
  );
}

testPromedioVsPonderado();

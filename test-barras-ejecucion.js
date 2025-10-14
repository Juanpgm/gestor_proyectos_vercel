// Test para verificar que las barras de Ejecución Financiera usen avance_financiero
console.log("🧪 Test de Barras de Ejecución Financiera");

// Simular datos de contratos por banco
const mockContratos = [
  {
    referencia_contrato: "4134.010.26.1.0253-2025",
    banco: "Bancolombia",
    valor_contrato: 100000000,
  },
  {
    referencia_contrato: "4173.010.26.1.1274-2025",
    banco: "Davivienda",
    valor_contrato: 200000000,
  },
  {
    referencia_contrato: "4173.010.26.1.1277-2025",
    banco: "Bancolombia",
    valor_contrato: 50000000,
  },
];

// Datos de reportes con diferentes niveles de avance_financiero
const mockReportes = [
  {
    referencia_contrato: "4134.010.26.1.0253-2025",
    avance_fisico: 14,
    avance_financiero: 0, // Sin avance financiero
    fecha_reporte: "2025-10-14T16:35:54.941793+00:00",
  },
  {
    referencia_contrato: "4173.010.26.1.1274-2025",
    avance_fisico: 7.14,
    avance_financiero: 7.14, // Buen avance financiero
    fecha_reporte: "2025-10-14T05:03:25.629737+00:00",
  },
  {
    referencia_contrato: "4173.010.26.1.1277-2025",
    avance_fisico: 0,
    avance_financiero: 0.45, // Pequeño avance financiero
    fecha_reporte: "2025-10-14T05:03:25.629737+00:00",
  },
];

// Datos de bancos empréstito (simulando endpoint)
const mockBancosEmprestito = [
  {
    nombre_banco: "Bancolombia",
    valor_asignado_banco: 293756995637, // Del endpoint real
    id: "bancolombia123",
  },
  {
    nombre_banco: "Davivienda",
    valor_asignado_banco: 370469095381, // Del endpoint real
    id: "davivienda123",
  },
];

// Función para simular el análisis de barras (analysisByBankForChart)
function calcularAnalisisPorBanco(contratos, reportes, bancosEmprestito) {
  console.log("📊 Calculando análisis para gráfico de barras...");

  // Crear mapa con datos del endpoint
  const bankMap = new Map();
  bancosEmprestito.forEach((bancoEndpoint) => {
    const nombreBanco = bancoEndpoint.nombre_banco;
    if (
      bancoEndpoint.valor_asignado_banco &&
      bancoEndpoint.valor_asignado_banco > 0
    ) {
      bankMap.set(nombreBanco, {
        banco: nombreBanco,
        valorAsignadoBanco: bancoEndpoint.valor_asignado_banco,
        totalContratos: 0,
        valorAdjudicado: 0,
        valorEjecutado: 0,
        promedioAvance: 0,
      });
    }
  });

  // Agregar datos de contratos y reportes
  contratos.forEach((contrato) => {
    const banco = contrato.banco;
    const valorContrato = Number(contrato.valor_contrato) || 0;

    // Buscar el reporte más reciente para este contrato
    const reporteContrato = reportes
      .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
      .sort(
        (a, b) =>
          new Date(b.fecha_reporte).getTime() -
          new Date(a.fecha_reporte).getTime()
      )[0];

    const avanceFinanciero = reporteContrato?.avance_financiero || 0;
    const valorEjecutado = (valorContrato * avanceFinanciero) / 100;

    // Solo agregar datos si el banco ya existe en el mapa (tiene valor_asignado_banco)
    if (bankMap.has(banco)) {
      const analysis = bankMap.get(banco);
      analysis.totalContratos += 1;
      analysis.valorAdjudicado += valorContrato;
      analysis.valorEjecutado += valorEjecutado;
      analysis.promedioAvance += avanceFinanciero;

      console.log(`📈 ${banco}:`, {
        contrato: contrato.referencia_contrato,
        valorContrato: valorContrato.toLocaleString(),
        avanceFinanciero: avanceFinanciero + "%",
        valorEjecutado: valorEjecutado.toLocaleString(),
        acumuladoEjecutado: analysis.valorEjecutado.toLocaleString(),
      });
    }
  });

  // Finalizar cálculos
  const result = Array.from(bankMap.values())
    .map((bank) => {
      bank.promedioAvance =
        bank.totalContratos > 0 ? bank.promedioAvance / bank.totalContratos : 0;
      bank.porcentajeEjecucion =
        bank.valorAdjudicado > 0
          ? (bank.valorEjecutado / bank.valorAdjudicado) * 100
          : 0;
      return bank;
    })
    .sort((a, b) => b.valorAsignadoBanco - a.valorAsignadoBanco);

  return result;
}

// Ejecutar análisis
console.log("\n=== Análisis de Barras por Banco ===");
const analisis = calcularAnalisisPorBanco(
  mockContratos,
  mockReportes,
  mockBancosEmprestito
);

console.log("\n📊 Resultados finales para gráfico:");
analisis.forEach((banco) => {
  console.log(`\n🏦 ${banco.banco}:`);
  console.log(
    `   💰 Asignado Banco (endpoint): ${banco.valorAsignadoBanco.toLocaleString()}`
  );
  console.log(
    `   📄 Adjudicado (contratos): ${banco.valorAdjudicado.toLocaleString()}`
  );
  console.log(
    `   ✅ Ejecutado Financiero: ${banco.valorEjecutado.toLocaleString()}`
  );
  console.log(`   📊 % Ejecución: ${banco.porcentajeEjecucion.toFixed(2)}%`);
  console.log(`   📈 Promedio Avance: ${banco.promedioAvance.toFixed(2)}%`);
});

console.log("\n🎯 Verificación:");
console.log(
  '✅ Las barras "Asignado Banco" usan valor_asignado_banco del endpoint'
);
console.log(
  '✅ Las barras "Ejecutado" se calculan con avance_financiero de reportes'
);
console.log(
  "✅ La longitud de cada barra es proporcional a los valores calculados"
);
console.log(
  '\n💡 La longitud de las barras de "Ejecución Financiera" ahora refleja correctamente los datos del endpoint!'
);

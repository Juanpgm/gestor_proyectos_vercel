// Test para verificar el comportamiento de los filtros y gauge charts
console.log("🧪 Test de Filtros y Gauge Charts");

// Simular datos de contratos
const mockContratos = [
  {
    referencia_contrato: "C001",
    banco: "Banco A",
    valor_contrato: 1000000,
  },
  {
    referencia_contrato: "C002",
    banco: "Banco B",
    valor_contrato: 2000000,
  },
  {
    referencia_contrato: "C003",
    banco: "Banco A",
    valor_contrato: 500000,
  },
];

// Simular datos de reportes
const mockReportes = [
  {
    referencia_contrato: "C001",
    avance_fisico: 30,
    porcentaje_financiero: 25,
    fecha_reporte: "2024-01-15",
  },
  {
    referencia_contrato: "C002",
    avance_fisico: 50,
    porcentaje_financiero: 45,
    fecha_reporte: "2024-01-15",
  },
  {
    referencia_contrato: "C003",
    avance_fisico: 80,
    porcentaje_financiero: 75,
    fecha_reporte: "2024-01-15",
  },
];

// Función para calcular gauge charts
function calcularGaugeCharts(filteredContratos, reportes) {
  console.log(
    "📊 Calculando para contratos:",
    filteredContratos.map((c) => c.referencia_contrato)
  );

  // Cálculo del porcentaje físico promedio ponderado
  let totalPonderadoFisico = 0;
  let totalPesoFisico = 0;

  // Cálculo del porcentaje financiero promedio ponderado
  let totalPonderadoFinanciero = 0;
  let totalPesoFinanciero = 0;

  filteredContratos.forEach((contrato) => {
    const reporteContrato = reportes
      .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
      .sort(
        (a, b) =>
          new Date(b.fecha_reporte).getTime() -
          new Date(a.fecha_reporte).getTime()
      )[0];

    if (reporteContrato) {
      const valorContrato = Number(contrato.valor_contrato) || 0;
      const avanceFisico = reporteContrato.avance_fisico || 0;
      const avanceFinanciero = reporteContrato.porcentaje_financiero || 0;

      // Para físico
      totalPonderadoFisico += avanceFisico * valorContrato;
      totalPesoFisico += valorContrato;

      // Para financiero
      totalPonderadoFinanciero += avanceFinanciero * valorContrato;
      totalPesoFinanciero += valorContrato;

      console.log(`Contrato ${contrato.referencia_contrato}:`, {
        valorContrato,
        avanceFisico,
        avanceFinanciero,
        aporteAlTotalFisico: avanceFisico * valorContrato,
        aporteAlTotalFinanciero: avanceFinanciero * valorContrato,
      });
    }
  });

  const porcentajeFisicoPromedio =
    totalPesoFisico > 0 ? totalPonderadoFisico / totalPesoFisico : 0;
  const porcentajeFinancieroPromedio =
    totalPesoFinanciero > 0
      ? totalPonderadoFinanciero / totalPesoFinanciero
      : 0;

  return {
    porcentajeFisicoPromedio: porcentajeFisicoPromedio.toFixed(2),
    porcentajeFinancieroPromedio: porcentajeFinancieroPromedio.toFixed(2),
    totalPesoFisico,
    totalPesoFinanciero,
  };
}

// Test 1: Sin filtros (todos los contratos)
console.log("\n=== Test 1: Sin filtros ===");
const resultadoSinFiltros = calcularGaugeCharts(mockContratos, mockReportes);
console.log("Resultado sin filtros:", resultadoSinFiltros);

// Test 2: Filtro por Banco A
console.log("\n=== Test 2: Filtro Banco A ===");
const contratosBancoA = mockContratos.filter((c) => c.banco === "Banco A");
const resultadoBancoA = calcularGaugeCharts(contratosBancoA, mockReportes);
console.log("Resultado Banco A:", resultadoBancoA);

// Test 3: Filtro por Banco B
console.log("\n=== Test 3: Filtro Banco B ===");
const contratosBancoB = mockContratos.filter((c) => c.banco === "Banco B");
const resultadoBancoB = calcularGaugeCharts(contratosBancoB, mockReportes);
console.log("Resultado Banco B:", resultadoBancoB);

// Verificar que los resultados cambien según los filtros
console.log("\n=== Verificación ===");
console.log(
  "¿Los resultados cambian con filtros?",
  resultadoSinFiltros.porcentajeFisicoPromedio !==
    resultadoBancoA.porcentajeFisicoPromedio
);

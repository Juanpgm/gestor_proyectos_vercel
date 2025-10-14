// Test para verificar los cálculos corregidos de Ejecución Financiera y Pagos Realizados
console.log("🧪 Test de Cálculos Corregidos - Físico, Financiero y Pagado");

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
    porcentaje_pagado: 20,
    fecha_reporte: "2024-01-15",
  },
  {
    referencia_contrato: "C002",
    avance_fisico: 50,
    porcentaje_financiero: 45,
    porcentaje_pagado: 40,
    fecha_reporte: "2024-01-15",
  },
  {
    referencia_contrato: "C003",
    avance_fisico: 80,
    porcentaje_financiero: 75,
    porcentaje_pagado: 70,
    fecha_reporte: "2024-01-15",
  },
];

// Función para calcular valores totales (nueva lógica)
function calcularValoresTotales(filteredContratos, reportes) {
  console.log(
    "📊 Calculando para contratos:",
    filteredContratos.map((c) => c.referencia_contrato)
  );

  let valorTotalFisico = 0;
  let valorTotalEjecutado = 0;
  let valorTotalPagado = 0;
  let valorTotalAsignado = 0;

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
      const porcentajeFinanciero = reporteContrato.porcentaje_financiero || 0;
      const porcentajePagado = reporteContrato.porcentaje_pagado || 0;

      valorTotalAsignado += valorContrato;
      valorTotalFisico += (valorContrato * avanceFisico) / 100;
      valorTotalEjecutado += (valorContrato * porcentajeFinanciero) / 100;
      valorTotalPagado += (valorContrato * porcentajePagado) / 100;

      console.log(`Contrato ${contrato.referencia_contrato}:`, {
        valorContrato: valorContrato.toLocaleString(),
        avanceFisico: avanceFisico + "%",
        porcentajeFinanciero: porcentajeFinanciero + "%",
        porcentajePagado: porcentajePagado + "%",
        valorFisico: ((valorContrato * avanceFisico) / 100).toLocaleString(),
        valorEjecutado: (
          (valorContrato * porcentajeFinanciero) /
          100
        ).toLocaleString(),
        valorPagado: (
          (valorContrato * porcentajePagado) /
          100
        ).toLocaleString(),
      });
    }
  });

  return {
    valorTotalAsignado,
    valorTotalFisico,
    valorTotalEjecutado,
    valorTotalPagado,
    porcentajeFisico: ((valorTotalFisico / valorTotalAsignado) * 100).toFixed(
      2
    ),
    porcentajeEjecutado: (
      (valorTotalEjecutado / valorTotalAsignado) *
      100
    ).toFixed(2),
    porcentajePagado: ((valorTotalPagado / valorTotalAsignado) * 100).toFixed(
      2
    ),
  };
}

// Test 1: Sin filtros (todos los contratos)
console.log("\n=== Test 1: Sin filtros ===");
const resultadoSinFiltros = calcularValoresTotales(mockContratos, mockReportes);
console.log("📈 Resumen sin filtros:", {
  asignado: resultadoSinFiltros.valorTotalAsignado.toLocaleString(),
  fisico:
    resultadoSinFiltros.valorTotalFisico.toLocaleString() +
    " (" +
    resultadoSinFiltros.porcentajeFisico +
    "%)",
  ejecutado:
    resultadoSinFiltros.valorTotalEjecutado.toLocaleString() +
    " (" +
    resultadoSinFiltros.porcentajeEjecutado +
    "%)",
  pagado:
    resultadoSinFiltros.valorTotalPagado.toLocaleString() +
    " (" +
    resultadoSinFiltros.porcentajePagado +
    "%)",
});

// Test 2: Filtro por Banco A
console.log("\n=== Test 2: Filtro Banco A ===");
const contratosBancoA = mockContratos.filter((c) => c.banco === "Banco A");
const resultadoBancoA = calcularValoresTotales(contratosBancoA, mockReportes);
console.log("📈 Resumen Banco A:", {
  asignado: resultadoBancoA.valorTotalAsignado.toLocaleString(),
  fisico:
    resultadoBancoA.valorTotalFisico.toLocaleString() +
    " (" +
    resultadoBancoA.porcentajeFisico +
    "%)",
  ejecutado:
    resultadoBancoA.valorTotalEjecutado.toLocaleString() +
    " (" +
    resultadoBancoA.porcentajeEjecutado +
    "%)",
  pagado:
    resultadoBancoA.valorTotalPagado.toLocaleString() +
    " (" +
    resultadoBancoA.porcentajePagado +
    "%)",
});

// Test 3: Filtro por Banco B
console.log("\n=== Test 3: Filtro Banco B ===");
const contratosBancoB = mockContratos.filter((c) => c.banco === "Banco B");
const resultadoBancoB = calcularValoresTotales(contratosBancoB, mockReportes);
console.log("📈 Resumen Banco B:", {
  asignado: resultadoBancoB.valorTotalAsignado.toLocaleString(),
  fisico:
    resultadoBancoB.valorTotalFisico.toLocaleString() +
    " (" +
    resultadoBancoB.porcentajeFisico +
    "%)",
  ejecutado:
    resultadoBancoB.valorTotalEjecutado.toLocaleString() +
    " (" +
    resultadoBancoB.porcentajeEjecutado +
    "%)",
  pagado:
    resultadoBancoB.valorTotalPagado.toLocaleString() +
    " (" +
    resultadoBancoB.porcentajePagado +
    "%)",
});

// Verificar que los valores cambien con filtros
console.log("\n=== Verificación ===");
console.log("¿Los valores cambian correctamente con filtros?");
console.log(
  "Físico:",
  resultadoSinFiltros.valorTotalFisico !== resultadoBancoA.valorTotalFisico
);
console.log(
  "Ejecutado:",
  resultadoSinFiltros.valorTotalEjecutado !==
    resultadoBancoA.valorTotalEjecutado
);
console.log(
  "Pagado:",
  resultadoSinFiltros.valorTotalPagado !== resultadoBancoA.valorTotalPagado
);

console.log(
  "\n🎯 Los tres valores (físico, ejecutado, pagado) ahora siguen la misma lógica de cálculo!"
);

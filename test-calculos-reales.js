// Test con datos reales del endpoint para verificar cálculos corregidos
console.log("🧪 Test con Datos Reales - Cálculo de Ejecución Financiera");

// Datos de ejemplo basados en la respuesta real del endpoint
const mockContratos = [
  {
    referencia_contrato: "4134.010.26.1.0253-2025",
    banco: "Banco A",
    valor_contrato: 1000000,
  },
  {
    referencia_contrato: "4173.010.26.1.1274-2025",
    banco: "Banco B",
    valor_contrato: 2000000,
  },
  {
    referencia_contrato: "4173.010.26.1.1277-2025",
    banco: "Banco A",
    valor_contrato: 500000,
  },
];

// Datos reales del endpoint reportes-contratos
const mockReportes = [
  {
    referencia_contrato: "4134.010.26.1.0253-2025",
    avance_fisico: 14,
    avance_financiero: 0, // Campo correcto para ejecución financiera
    porcentaje_pagado: 0, // Campo para pagos (actualmente sin datos)
    fecha_reporte: "2025-10-14T16:35:54.941793+00:00",
  },
  {
    referencia_contrato: "4173.010.26.1.1274-2025",
    avance_fisico: 7.14,
    avance_financiero: 7.14, // Tiene datos financieros
    porcentaje_pagado: 0,
    fecha_reporte: "2025-10-14T05:03:25.629737+00:00",
  },
  {
    referencia_contrato: "4173.010.26.1.1277-2025",
    avance_fisico: 0,
    avance_financiero: 0.45, // Pequeño avance financiero
    porcentaje_pagado: 0,
    fecha_reporte: "2025-10-14T05:03:25.629737+00:00",
  },
];

// Función para calcular valores totales (lógica corregida)
function calcularValoresTotalesCorregidos(filteredContratos, reportes) {
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
      const avanceFinanciero = reporteContrato.avance_financiero || 0; // Campo correcto
      const porcentajePagado = reporteContrato.porcentaje_pagado || 0;

      valorTotalAsignado += valorContrato;
      valorTotalFisico += (valorContrato * avanceFisico) / 100;
      valorTotalEjecutado += (valorContrato * avanceFinanciero) / 100; // Usando avance_financiero
      valorTotalPagado += (valorContrato * porcentajePagado) / 100;

      console.log(`Contrato ${contrato.referencia_contrato}:`, {
        valorContrato: valorContrato.toLocaleString(),
        avanceFisico: avanceFisico + "%",
        avanceFinanciero: avanceFinanciero + "%", // Mostrando el campo correcto
        porcentajePagado: porcentajePagado + "%",
        valorFisico: ((valorContrato * avanceFisico) / 100).toLocaleString(),
        valorEjecutado: (
          (valorContrato * avanceFinanciero) /
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

// Test con datos reales
console.log("\n=== Test con Datos Reales del Endpoint ===");
const resultado = calcularValoresTotalesCorregidos(mockContratos, mockReportes);
console.log("📈 Resumen con datos reales:", {
  asignado: resultado.valorTotalAsignado.toLocaleString(),
  fisico:
    resultado.valorTotalFisico.toLocaleString() +
    " (" +
    resultado.porcentajeFisico +
    "%)",
  ejecutado:
    resultado.valorTotalEjecutado.toLocaleString() +
    " (" +
    resultado.porcentajeEjecutado +
    "%)",
  pagado:
    resultado.valorTotalPagado.toLocaleString() +
    " (" +
    resultado.porcentajePagado +
    "%)",
});

console.log("\n🔍 Análisis:");
console.log('- Ejecución Física: Basada en campo "avance_fisico" ✅');
console.log(
  '- Ejecución Financiera: Ahora basada en campo "avance_financiero" ✅'
);
console.log(
  '- Pagos Realizados: Basado en "porcentaje_pagado" (actualmente sin datos) ⚠️'
);

console.log(
  "\n✨ ¡La Ejecución Financiera ahora debería mostrar valores correctos en lugar de 0.0%!"
);

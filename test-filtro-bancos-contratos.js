// Test para verificar que solo se muestren bancos con contratos asignados
console.log("🧪 Test de Filtro - Solo Bancos con Contratos");

// Simular datos de contratos (solo algunos bancos tienen contratos)
const mockContratos = [
  {
    referencia_contrato: "C001",
    banco: "Bancolombia", // Banco CON contratos
    valor_contrato: 100000000,
  },
  {
    referencia_contrato: "C002",
    banco: "Davivienda", // Banco CON contratos
    valor_contrato: 200000000,
  },
  // Nota: BBVA y Banco de Occidente NO tienen contratos
];

// Datos de reportes
const mockReportes = [
  {
    referencia_contrato: "C001",
    avance_financiero: 5,
    fecha_reporte: "2025-10-14T16:35:54.941793+00:00",
  },
  {
    referencia_contrato: "C002",
    avance_financiero: 7.14,
    fecha_reporte: "2025-10-14T05:03:25.629737+00:00",
  },
];

// Datos de bancos empréstito (TODOS los bancos del endpoint)
const mockBancosEmprestito = [
  {
    nombre_banco: "Bancolombia",
    valor_asignado_banco: 293756995637,
    id: "bancolombia123",
  },
  {
    nombre_banco: "Davivienda",
    valor_asignado_banco: 370469095381,
    id: "davivienda123",
  },
  {
    nombre_banco: "BBVA", // Banco SIN contratos
    valor_asignado_banco: 155448161609,
    id: "bbva123",
  },
  {
    nombre_banco: "Banco de Occidente", // Banco SIN contratos
    valor_asignado_banco: 143711171465,
    id: "occidente123",
  },
];

// Función para simular analysisByBankForChart con el nuevo filtro
function calcularAnalisisConFiltro(contratos, reportes, bancosEmprestito) {
  console.log("📊 Iniciando análisis con filtro...");

  const bankMap = new Map();

  // PASO 1: Inicializar TODOS los bancos que tienen valor_asignado_banco válido del endpoint
  console.log("\n🏦 Bancos inicializados (del endpoint):");
  bancosEmprestito.forEach((datosBanco) => {
    if (
      datosBanco.valor_asignado_banco &&
      datosBanco.valor_asignado_banco > 0
    ) {
      const nombreBanco = datosBanco.nombre_banco;
      bankMap.set(nombreBanco, {
        banco: nombreBanco,
        totalContratos: 0,
        valorAsignadoBanco: datosBanco.valor_asignado_banco,
        valorAdjudicado: 0,
        valorEjecutado: 0,
        porcentajeEjecucion: 0,
        promedioAvance: 0,
      });
      console.log(
        `   - ${nombreBanco}: ${datosBanco.valor_asignado_banco.toLocaleString()}`
      );
    }
  });

  // PASO 2: Agregar datos de contratos
  console.log("\n📄 Procesando contratos:");
  contratos.forEach((contrato) => {
    const banco = contrato.banco;
    const valorContrato = Number(contrato.valor_contrato) || 0;

    const reporteContrato = reportes
      .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
      .sort(
        (a, b) =>
          new Date(b.fecha_reporte).getTime() -
          new Date(a.fecha_reporte).getTime()
      )[0];

    const avanceFinanciero = reporteContrato?.avance_financiero || 0;
    const valorEjecutado = (valorContrato * avanceFinanciero) / 100;

    if (bankMap.has(banco)) {
      const analysis = bankMap.get(banco);
      analysis.totalContratos += 1;
      analysis.valorAdjudicado += valorContrato;
      analysis.valorEjecutado += valorEjecutado;
      analysis.promedioAvance += avanceFinanciero;

      console.log(
        `   ✅ ${banco}: +1 contrato (total: ${analysis.totalContratos})`
      );
    } else {
      console.log(`   ❌ ${banco}: No está en endpoint (ignorado)`);
    }
  });

  // PASO 3: Finalizar cálculos
  bankMap.forEach((analysis) => {
    analysis.porcentajeEjecucion =
      analysis.valorAdjudicado > 0
        ? (analysis.valorEjecutado / analysis.valorAdjudicado) * 100
        : 0;
    analysis.promedioAvance =
      analysis.totalContratos > 0
        ? analysis.promedioAvance / analysis.totalContratos
        : 0;
  });

  console.log("\n📋 Estado antes del filtro:");
  bankMap.forEach((analysis) => {
    console.log(`   ${analysis.banco}: ${analysis.totalContratos} contratos`);
  });

  // PASO 4: NUEVO FILTRO - Solo bancos con contratos
  const resultado = Array.from(bankMap.values())
    .filter((banco) => banco.totalContratos > 0) // ← FILTRO APLICADO
    .sort((a, b) => b.valorAsignadoBanco - a.valorAsignadoBanco);

  return resultado;
}

// Ejecutar análisis
console.log("\n=== Análisis con Filtro de Contratos ===");
const analisis = calcularAnalisisConFiltro(
  mockContratos,
  mockReportes,
  mockBancosEmprestito
);

console.log("\n📊 RESULTADO FINAL (solo bancos con contratos):");
analisis.forEach((banco) => {
  console.log(`\n🏦 ${banco.banco}:`);
  console.log(`   📄 Contratos: ${banco.totalContratos}`);
  console.log(`   💰 Asignado: ${banco.valorAsignadoBanco.toLocaleString()}`);
  console.log(`   📊 Adjudicado: ${banco.valorAdjudicado.toLocaleString()}`);
  console.log(`   ✅ Ejecutado: ${banco.valorEjecutado.toLocaleString()}`);
});

console.log("\n🎯 Verificación:");
console.log(`Total bancos en endpoint: ${mockBancosEmprestito.length}`);
console.log(`Total bancos con contratos: ${analisis.length}`);
console.log(
  `Bancos filtrados: ${mockBancosEmprestito.length - analisis.length}`
);

const bancosSinContratos = mockBancosEmprestito
  .filter((b) => !analisis.some((a) => a.banco === b.nombre_banco))
  .map((b) => b.nombre_banco);

console.log(
  `Bancos excluidos (sin contratos): ${bancosSinContratos.join(", ")}`
);
console.log(
  "\n✅ El gráfico ahora solo muestra bancos que tienen contratos asignados!"
);

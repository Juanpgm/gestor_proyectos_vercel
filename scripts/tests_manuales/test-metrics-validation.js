/**
 * Script de validación de métricas
 * Verifica que los cálculos de métricas sean correctos comparando con el backend
 */

const https = require("https");

// Usar el backend de producción
const API_URL = "https://gestorproyectoapi-production.up.railway.app";

function fetchAttributes() {
  return new Promise((resolve, reject) => {
    console.log("🔄 Obteniendo datos de attributes...");
    const url = `${API_URL}/unidades-proyecto/attributes`;

    https
      .get(
        url,
        {
          headers: {
            Accept: "application/json",
          },
        },
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
              return;
            }

            try {
              const result = JSON.parse(data);
              resolve(result.data || result);
            } catch (error) {
              reject(new Error(`Error parsing JSON: ${error.message}`));
            }
          });
        },
      )
      .on("error", (error) => {
        reject(error);
      });
  });
}

function calculateMetrics(data) {
  // Total de intervenciones (suma de n_intervenciones)
  const totalIntervenciones = data.reduce(
    (sum, item) => sum + (item.n_intervenciones || 0),
    0,
  );

  // Total de unidades de proyecto (número de registros)
  const totalUnidadesProyecto = data.length;

  // Frentes activos (unidades de proyecto con frente activo)
  const activeFronts = data.filter(
    (item) => item.frente_activo === "Frente activo",
  ).length;

  // Estados únicos
  const estadosUnicos = [...new Set(data.map((item) => item.estado))].length;

  // Avance promedio
  const avgProgress =
    data.length > 0
      ? data.reduce((sum, item) => sum + (item.avance_obra || 0), 0) /
        data.length
      : 0;

  // Presupuesto total
  const totalBudget = data.reduce(
    (sum, item) => sum + (item.presupuesto_base || 0),
    0,
  );

  return {
    totalIntervenciones,
    totalUnidadesProyecto,
    activeFronts,
    estadosUnicos,
    avgProgress: Math.round(avgProgress * 10) / 10,
    totalBudget,
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

async function main() {
  try {
    console.log("\n========================================");
    console.log("🔍 VALIDACIÓN DE MÉTRICAS DEL BACKEND");
    console.log("========================================\n");

    const data = await fetchAttributes();
    console.log(`✅ Datos obtenidos: ${data.length} registros\n`);

    const metrics = calculateMetrics(data);

    console.log("📊 MÉTRICAS CALCULADAS:");
    console.log("────────────────────────────────────────");
    console.log(`📌 Total Intervenciones: ${metrics.totalIntervenciones}`);
    console.log(
      `📌 Total Unidades de Proyecto: ${metrics.totalUnidadesProyecto}`,
    );
    console.log(`📌 Frentes de Obra Activos: ${metrics.activeFronts}`);
    console.log(`📌 Estados Únicos: ${metrics.estadosUnicos}`);
    console.log(`📌 Avance Promedio: ${metrics.avgProgress}%`);
    console.log(`📌 Presupuesto Total: ${formatCurrency(metrics.totalBudget)}`);
    console.log("────────────────────────────────────────\n");

    // Comparar con valores esperados de la imagen
    const expectedValues = {
      totalIntervenciones: 1628,
      totalUnidadesProyecto: 2079,
      activeFronts: 118,
      estadosUnicos: 5,
      avgProgress: 49.8,
      totalBudget: 690966192602,
    };

    console.log("🔍 COMPARACIÓN CON VALORES ESPERADOS:");
    console.log("────────────────────────────────────────");

    const compareMetric = (name, actual, expected) => {
      const match = actual === expected;
      const icon = match ? "✅" : "❌";
      const diff = actual - expected;
      const diffText =
        diff !== 0 ? ` (diferencia: ${diff > 0 ? "+" : ""}${diff})` : "";
      console.log(
        `${icon} ${name}: ${actual} ${match ? "==" : "!="} ${expected}${diffText}`,
      );
      return match;
    };

    const results = {
      intervenciones: compareMetric(
        "Intervenciones",
        metrics.totalIntervenciones,
        expectedValues.totalIntervenciones,
      ),
      unidades: compareMetric(
        "Unidades de Proyecto",
        metrics.totalUnidadesProyecto,
        expectedValues.totalUnidadesProyecto,
      ),
      frentes: compareMetric(
        "Frentes Activos",
        metrics.activeFronts,
        expectedValues.activeFronts,
      ),
      estados: compareMetric(
        "Estados",
        metrics.estadosUnicos,
        expectedValues.estadosUnicos,
      ),
      avance: compareMetric(
        "Avance Promedio",
        metrics.avgProgress,
        expectedValues.avgProgress,
      ),
      presupuesto: compareMetric(
        "Presupuesto Total",
        metrics.totalBudget,
        expectedValues.totalBudget,
      ),
    };

    console.log("────────────────────────────────────────\n");

    const allMatch = Object.values(results).every((r) => r);
    if (allMatch) {
      console.log("✅ TODAS LAS MÉTRICAS SON CORRECTAS\n");
    } else {
      console.log("⚠️  ALGUNAS MÉTRICAS NO COINCIDEN\n");

      // Análisis adicional para frentes activos si no coincide
      if (!results.frentes) {
        console.log("🔍 ANÁLISIS DE FRENTES ACTIVOS:");
        const frentesActivos = data.filter(
          (item) => item.frente_activo === "Frente activo",
        );
        console.log(`   - UPs con frente activo: ${frentesActivos.length}`);
        console.log(
          `   - Suma de intervenciones de UPs con frente activo: ${frentesActivos.reduce((sum, item) => sum + (item.n_intervenciones || 0), 0)}`,
        );
        console.log("   - Muestra:");
        frentesActivos.slice(0, 5).forEach((item) => {
          console.log(
            `     * ${item.upid}: ${item.n_intervenciones} intervenciones`,
          );
        });
        console.log("");
      }
    }

    // Información adicional sobre estados
    console.log("📋 DISTRIBUCIÓN POR ESTADO:");
    const byStatus = data.reduce((acc, item) => {
      const status = item.estado || "Sin estado";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(byStatus).forEach(([estado, count]) => {
      console.log(`   - ${estado}: ${count} UPs`);
    });
    console.log("");

    // Información adicional sobre frentes activos
    console.log("📋 VALORES ÚNICOS DE FRENTE_ACTIVO:");
    const frentesActivosValues = [
      ...new Set(data.map((item) => item.frente_activo)),
    ];
    console.log(`   Total valores únicos: ${frentesActivosValues.length}`);
    frentesActivosValues.forEach((value) => {
      const count = data.filter((item) => item.frente_activo === value).length;
      console.log(`   - "${value}": ${count} UPs`);
    });
    console.log("");

    // Muestra de datos para verificar estructura
    console.log("📋 MUESTRA DE DATOS (primeros 3 registros):");
    data.slice(0, 3).forEach((item, i) => {
      console.log(`\n   Registro ${i + 1}:`);
      console.log(`   - UPID: ${item.upid}`);
      console.log(`   - Estado: ${item.estado}`);
      console.log(`   - N Intervenciones: ${item.n_intervenciones}`);
      console.log(`   - Frente Activo: "${item.frente_activo}"`);
      console.log(`   - Avance Obra: ${item.avance_obra}%`);
      console.log(`   - Presupuesto: ${item.presupuesto_base}`);
    });
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();

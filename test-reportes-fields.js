// Test para verificar los campos disponibles en reportes de contratos
console.log("🔍 Verificando campos en reportes de contratos...");

const baseUrl = "http://localhost:3000";

async function testReportesContratos() {
  try {
    const response = await fetch(
      "https://gestorproyectoapi-production.up.railway.app/reportes_contratos/"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("✅ Respuesta del endpoint reportes-contratos:", {
      success: true,
      responseType: typeof responseData,
      hasData: !!responseData.data,
      dataLength: responseData.data
        ? responseData.data.length
        : "no data property",
    });

    const data = responseData.data || responseData || [];
    console.log("📊 Datos procesados:", { count: data.length });

    if (data.length > 0) {
      console.log("\n📊 Estructura de datos:");
      console.log(
        "Campos disponibles en el primer reporte:",
        Object.keys(data[0])
      );

      console.log("\nPrimeros 3 registros:");
      console.log(
        JSON.stringify(
          data.slice(0, 3).map((item) => {
            const cleanItem = {};
            // Mostrar solo los campos más relevantes para no saturar
            const fieldsToShow = [
              "referencia_contrato",
              "avance_fisico",
              "porcentaje_financiero",
              "porcentaje_pagado",
              "avance_financiero",
              "ejecutado_financiero",
              "valor_ejecutado",
              "valor_pagado",
              "fecha_reporte",
            ];

            fieldsToShow.forEach((field) => {
              if (item[field] !== undefined) {
                cleanItem[field] = item[field];
              }
            });

            return cleanItem;
          }),
          null,
          2
        )
      );

      // Verificar qué campos tienen valores no nulos/no cero
      console.log("\n🔍 Análisis de campos financieros:");

      const fieldsToAnalyze = [
        "avance_fisico",
        "porcentaje_financiero",
        "porcentaje_pagado",
        "avance_financiero",
        "ejecutado_financiero",
        "valor_ejecutado",
        "valor_pagado",
      ];

      fieldsToAnalyze.forEach((field) => {
        const nonZeroValues = data.filter((item) => {
          const value = item[field];
          return (
            value !== undefined &&
            value !== null &&
            value !== 0 &&
            value !== "0"
          );
        });

        console.log(
          `${field}: ${nonZeroValues.length}/${data.length} registros con valores > 0`
        );

        if (nonZeroValues.length > 0) {
          const sample = nonZeroValues.slice(0, 3).map((item) => ({
            referencia: item.referencia_contrato,
            valor: item[field],
          }));
          console.log(`  Ejemplos:`, sample);
        }
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testReportesContratos();

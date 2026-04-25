// Test script para verificar métricas
const url = "http://localhost:3000/api/proxy/unidades-proyecto/attributes";

fetch(url)
  .then((r) => r.json())
  .then((data) => {
    console.log("✅ API Response Success:", data.success);
    console.log("📊 Total records:", data.data ? data.data.length : 0);

    if (data.data && data.data.length > 0) {
      // Calcular métricas
      const totalIntervenciones = data.data.reduce(
        (sum, item) => sum + (item.n_intervenciones || 0),
        0
      );
      const totalUnidadesProyecto = data.data.length;

      console.log("\n🔢 MÉTRICAS:");
      console.log(
        "  Total Intervenciones (suma n_intervenciones):",
        totalIntervenciones
      );
      console.log(
        "  Total Unidades de Proyecto (registros):",
        totalUnidadesProyecto
      );

      console.log("\n📋 Muestra de n_intervenciones (primeros 5):");
      data.data.slice(0, 5).forEach((item, i) => {
        console.log(
          `  ${i + 1}. UPID: ${item.upid}, n_intervenciones: ${
            item.n_intervenciones
          }`
        );
      });

      // Verificar si hay valores nulos
      const conIntervenciones = data.data.filter(
        (item) => item.n_intervenciones && item.n_intervenciones > 0
      );
      console.log(
        "\n✓ Registros con n_intervenciones > 0:",
        conIntervenciones.length
      );
      console.log(
        "✗ Registros sin n_intervenciones:",
        data.data.length - conIntervenciones.length
      );
    }
  })
  .catch((err) => console.error("❌ Error:", err));

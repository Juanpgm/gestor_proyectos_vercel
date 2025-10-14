// Test script para verificar datos de bancos_emprestito_all
async function testBancosEndpoint() {
  try {
    console.log("🔍 Probando endpoint bancos_emprestito_all...");

    const response = await fetch(
      "https://gestorproyectoapi-production.up.railway.app/bancos_emprestito_all"
    );
    const data = await response.json();

    console.log("✅ Respuesta del endpoint:", {
      success: data.success,
      count: data.count,
      totalBancos: data.data?.length,
    });

    if (data.data) {
      console.log("\n📊 Estructura de datos:");

      // Mostrar los primeros 3 registros
      console.log("Primeros 3 registros:", data.data.slice(0, 3));

      // Filtrar bancos que tienen valor_asignado_banco
      const bancosConValor = data.data.filter((b) => b.valor_asignado_banco);
      console.log(
        `\n💰 Bancos con valor_asignado_banco (${bancosConValor.length}):`
      );
      bancosConValor.forEach((banco) => {
        console.log(
          `- ${
            banco.nombre_banco
          }: ${banco.valor_asignado_banco?.toLocaleString("es-CO")} COP`
        );
        if (banco.nombre_centro_gestor) {
          console.log(`  Centro Gestor: ${banco.nombre_centro_gestor}`);
        }
      });

      // Mostrar todos los nombres de bancos únicos
      const nombresUnicos = [...new Set(data.data.map((b) => b.nombre_banco))];
      console.log(`\n🏦 Nombres de bancos únicos (${nombresUnicos.length}):`);
      nombresUnicos.forEach((nombre) => console.log(`- ${nombre}`));

      // Verificar si hay centros gestores
      const centrosGestores = data.data
        .filter((b) => b.nombre_centro_gestor)
        .map((b) => b.nombre_centro_gestor);
      const centrosUnicos = [...new Set(centrosGestores)];
      console.log(
        `\n🏢 Centros Gestores encontrados (${centrosUnicos.length}):`
      );
      centrosUnicos.forEach((centro) => console.log(`- ${centro}`));
    }
  } catch (error) {
    console.error("❌ Error al probar endpoint:", error);
  }
}

// Ejecutar test
testBancosEndpoint();

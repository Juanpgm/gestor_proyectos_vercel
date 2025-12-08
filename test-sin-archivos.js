/**
 * Test para verificar si el endpoint funciona SIN archivos
 */

const FormData = require("form-data");

const API_URL = "https://gestorproyectoapi-production.up.railway.app";

async function testSinArchivos() {
  console.log("\n🧪 TEST: Cargar RPC SIN documentos en producción\n");

  try {
    const formData = new FormData();
    const timestamp = Date.now();

    formData.append("numero_rpc", `RPC-NO-DOCS-${timestamp}`);
    formData.append("beneficiario_id", "900123456");
    formData.append("beneficiario_nombre", "Empresa Test Sin Docs S.A.S.");
    formData.append("descripcion_rpc", "Test sin documentos");
    formData.append("fecha_contabilizacion", "2024-11-24");
    formData.append("fecha_impresion", "2024-11-24");
    formData.append("estado_liberacion", "Contabilizado");
    formData.append("bp", `BP-NO-DOCS-${timestamp}`);
    formData.append("valor_rpc", "8000000");
    formData.append("nombre_centro_gestor", "Centro Gestor Test");
    formData.append("referencia_contrato", `CONT-NO-DOCS-${timestamp}`);

    console.log("📤 Enviando request SIN archivos...\n");

    const response = await fetch(`${API_URL}/emprestito/cargar-rpc`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    console.log(`📊 Status: ${response.status}`);

    const result = await response.json();
    console.log("📋 Response:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ RPC sin documentos cargado exitosamente");
      console.log("✅ El problema es específicamente con los ARCHIVOS");
    } else {
      console.log("\n❌ Error incluso sin archivos");
      console.log("❌ El problema es con el parsing de FormData en general");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSinArchivos();

/**
 * Script de prueba para verificar la carga de documentos a S3
 * mediante los endpoints /emprestito/cargar-rpc y /emprestito/cargar-pago
 */

const fs = require("fs");
const FormData = require("form-data");
// fetch es nativo en Node.js 18+

const API_URL = "https://gestorproyectoapi-production.up.railway.app";

// Crear un archivo de prueba temporal
function createTestFile() {
  const content = "Este es un documento de prueba para verificar la carga a S3";
  const filename = "test-documento.txt";
  fs.writeFileSync(filename, content);
  console.log(`✅ Archivo de prueba creado: ${filename}`);
  return filename;
}

// Test 1: Cargar RPC con documento
async function testCargarRPC() {
  console.log("\n========== TEST: Cargar RPC con documento ==========");

  const testFile = createTestFile();

  try {
    const formData = new FormData();

    // Campos obligatorios
    formData.append("numero_rpc", `RPC-TEST-${Date.now()}`);
    formData.append("beneficiario_id", "890123456");
    formData.append("beneficiario_nombre", "Proveedor Test S.A.S.");
    formData.append("descripcion_rpc", "Test de carga de documentos a S3");
    formData.append("fecha_contabilizacion", "2024-11-24");
    formData.append("fecha_impresion", "2024-11-24");
    formData.append("estado_liberacion", "Contabilizado");
    formData.append("bp", "BP-TEST-001");
    formData.append("valor_rpc", "1000000");
    formData.append("nombre_centro_gestor", "Centro Gestor Test");
    formData.append("referencia_contrato", "CONT-TEST-001");

    // Agregar archivo de prueba
    const fileStream = fs.createReadStream(testFile);
    formData.append("documentos", fileStream, {
      filename: testFile,
      contentType: "text/plain",
    });

    console.log("📤 Enviando request a /emprestito/cargar-rpc...");

    const response = await fetch(`${API_URL}/emprestito/cargar-rpc`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    console.log("📊 Status:", response.status);

    const result = await response.json();
    console.log("📋 Response:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("✅ RPC cargado exitosamente");
      if (
        result.data?.documentos_urls &&
        result.data.documentos_urls.length > 0
      ) {
        console.log("📎 URLs de documentos en S3:");
        result.data.documentos_urls.forEach((url, i) => {
          console.log(`   ${i + 1}. ${url}`);
        });
      } else {
        console.log(
          "⚠️  WARNING: No se recibieron URLs de documentos en la respuesta"
        );
        console.log(
          "   Verifica que el backend esté subiendo los archivos a S3"
        );
      }
    } else {
      console.log("❌ Error al cargar RPC:", result.error);
    }
  } catch (error) {
    console.error("❌ Error en test:", error.message);
  } finally {
    // Limpiar archivo de prueba
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log("🧹 Archivo de prueba eliminado");
    }
  }
}

// Test 2: Cargar Pago con documento
async function testCargarPago() {
  console.log("\n========== TEST: Cargar Pago con documento ==========");

  const testFile = createTestFile();

  try {
    const formData = new FormData();

    // Campos obligatorios
    formData.append("numero_rpc", `RPC-TEST-${Date.now()}`);
    formData.append("valor_pago", "500000");
    formData.append("fecha_transaccion", "2024-11-24");
    formData.append("referencia_contrato", "CONT-TEST-001");
    formData.append("nombre_centro_gestor", "Centro Gestor Test");

    // Agregar archivo de prueba
    const fileStream = fs.createReadStream(testFile);
    formData.append("documentos", fileStream, {
      filename: testFile,
      contentType: "text/plain",
    });

    console.log("📤 Enviando request a /emprestito/cargar-pago...");

    const response = await fetch(`${API_URL}/emprestito/cargar-pago`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    console.log("📊 Status:", response.status);

    const result = await response.json();
    console.log("📋 Response:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("✅ Pago registrado exitosamente");
      if (
        result.data?.documentos_urls &&
        result.data.documentos_urls.length > 0
      ) {
        console.log("📎 URLs de documentos en S3:");
        result.data.documentos_urls.forEach((url, i) => {
          console.log(`   ${i + 1}. ${url}`);
        });
      } else {
        console.log(
          "⚠️  WARNING: No se recibieron URLs de documentos en la respuesta"
        );
        console.log(
          "   Verifica que el backend esté subiendo los archivos a S3"
        );
      }
    } else {
      console.log("❌ Error al cargar pago:", result.error);
    }
  } catch (error) {
    console.error("❌ Error en test:", error.message);
  } finally {
    // Limpiar archivo de prueba
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log("🧹 Archivo de prueba eliminado");
    }
  }
}

// Test 3: Verificar sin documentos (opcional)
async function testSinDocumentos() {
  console.log("\n========== TEST: Cargar RPC sin documentos ==========");

  try {
    const formData = new FormData();

    // Campos obligatorios
    formData.append("numero_rpc", `RPC-TEST-NO-DOCS-${Date.now()}`);
    formData.append("beneficiario_id", "890123456");
    formData.append("beneficiario_nombre", "Proveedor Test S.A.S.");
    formData.append("descripcion_rpc", "Test sin documentos");
    formData.append("fecha_contabilizacion", "2024-11-24");
    formData.append("fecha_impresion", "2024-11-24");
    formData.append("estado_liberacion", "Contabilizado");
    formData.append("bp", "BP-TEST-002");
    formData.append("valor_rpc", "2000000");
    formData.append("nombre_centro_gestor", "Centro Gestor Test");
    formData.append("referencia_contrato", "CONT-TEST-002");

    console.log("📤 Enviando request sin documentos...");

    const response = await fetch(`${API_URL}/emprestito/cargar-rpc`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    console.log("📊 Status:", response.status);

    const result = await response.json();
    console.log("📋 Response:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("✅ RPC cargado exitosamente sin documentos");
    } else {
      console.log("❌ Error al cargar RPC:", result.error);
    }
  } catch (error) {
    console.error("❌ Error en test:", error.message);
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log("🚀 Iniciando tests de carga de documentos a S3...\n");

  await testCargarRPC();
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2 segundos

  await testCargarPago();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testSinDocumentos();

  console.log("\n✅ Tests completados");
}

// Ejecutar
runAllTests().catch(console.error);

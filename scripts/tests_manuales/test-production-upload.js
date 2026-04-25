/**
 * Test automatizado de carga de documentos en PRODUCCIÓN
 * Prueba directamente contra el backend de Railway
 */

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const API_URL = "https://gestorproyectoapi-production.up.railway.app";

// Crear un archivo de prueba
function createTestFile(filename = "test-documento.txt") {
  const content = `Documento de prueba generado automáticamente
Fecha: ${new Date().toISOString()}
Propósito: Verificar carga a S3
Contenido: Este archivo fue creado para probar la funcionalidad de carga de documentos.`;

  fs.writeFileSync(filename, content);
  console.log(`✅ Archivo creado: ${filename} (${content.length} bytes)`);
  return filename;
}

// Test automatizado de Cargar RPC
async function testCargarRPCProduccion() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TEST AUTOMÁTICO: Cargar RPC en PRODUCCIÓN con documento");
  console.log("=".repeat(70));

  const testFile = createTestFile("rpc-test-doc.txt");

  try {
    const formData = new FormData();
    const timestamp = Date.now();

    // Campos obligatorios
    const rpcNumber = `RPC-AUTO-TEST-${timestamp}`;
    formData.append("numero_rpc", rpcNumber);
    formData.append("beneficiario_id", "900123456");
    formData.append("beneficiario_nombre", "Empresa Test Automatizada S.A.S.");
    formData.append(
      "descripcion_rpc",
      "Test automático de carga de documentos a S3"
    );
    formData.append("fecha_contabilizacion", "2024-11-24");
    formData.append("fecha_impresion", "2024-11-24");
    formData.append("estado_liberacion", "Contabilizado");
    formData.append("bp", `BP-AUTO-${timestamp}`);
    formData.append("valor_rpc", "10000000");
    formData.append("nombre_centro_gestor", "Centro Gestor Automatizado");
    formData.append("referencia_contrato", `CONT-AUTO-${timestamp}`);

    // Agregar archivo
    const fileStream = fs.createReadStream(testFile);
    formData.append("documentos", fileStream, {
      filename: path.basename(testFile),
      contentType: "text/plain",
    });

    console.log(`\n📋 Datos del RPC:`);
    console.log(`   Número RPC: ${rpcNumber}`);
    console.log(
      `   Beneficiario: 900123456 - Empresa Test Automatizada S.A.S.`
    );
    console.log(`   Valor: $10,000,000`);
    console.log(`   BP: BP-AUTO-${timestamp}`);
    console.log(`   Contrato: CONT-AUTO-${timestamp}`);
    console.log(`\n📎 Archivo adjunto: ${testFile}`);

    console.log(`\n📤 Enviando POST a: ${API_URL}/emprestito/cargar-rpc`);
    console.log("⏳ Esperando respuesta...\n");

    const response = await fetch(`${API_URL}/emprestito/cargar-rpc`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    console.log(`📋 Content-Type: ${contentType}`);

    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.log(`⚠️  Respuesta no es JSON:\n${text.substring(0, 500)}`);
      throw new Error("La respuesta del servidor no es JSON");
    }

    console.log(`\n📦 Respuesta completa:`);
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n" + "✅".repeat(35));
      console.log("✅ RPC CARGADO EXITOSAMENTE EN PRODUCCIÓN");
      console.log("✅".repeat(35));

      // Verificar si hay URLs de S3
      if (
        result.data?.documentos_urls &&
        result.data.documentos_urls.length > 0
      ) {
        console.log(`\n🎉 ¡ÉXITO! Documentos subidos a S3:`);
        console.log(
          `📎 Total de documentos: ${result.data.documentos_urls.length}`
        );
        result.data.documentos_urls.forEach((url, i) => {
          console.log(`   ${i + 1}. ${url}`);
        });
        console.log("\n✅ LA CARGA DE DOCUMENTOS A S3 FUNCIONA CORRECTAMENTE");
      } else if (
        result.data?.documentos_s3 &&
        result.data.documentos_s3.length > 0
      ) {
        console.log(`\n🎉 ¡ÉXITO! Documentos en S3 (campo alternativo):`);
        console.log(
          `📎 Total de documentos: ${result.data.documentos_s3.length}`
        );
        result.data.documentos_s3.forEach((doc, i) => {
          console.log(
            `   ${i + 1}. ${
              typeof doc === "string" ? doc : JSON.stringify(doc)
            }`
          );
        });
        console.log("\n✅ LA CARGA DE DOCUMENTOS A S3 FUNCIONA CORRECTAMENTE");
      } else {
        console.log(
          "\n⚠️  ADVERTENCIA: RPC creado pero sin URLs de S3 en la respuesta"
        );
        console.log(
          "❌ EL BACKEND NO ESTÁ SUBIENDO ARCHIVOS A S3 O NO DEVUELVE LAS URLs"
        );
        console.log("\n🔍 Campos en result.data:");
        console.log(Object.keys(result.data || {}).join(", "));
      }

      return true;
    } else {
      console.log("\n❌ ERROR: La operación no fue exitosa");
      console.log(
        `   Mensaje: ${
          result.error || result.message || "Sin mensaje de error"
        }`
      );
      return false;
    }
  } catch (error) {
    console.log("\n" + "❌".repeat(35));
    console.log("❌ ERROR EN EL TEST");
    console.log("❌".repeat(35));
    console.log(`\n💥 Tipo de error: ${error.name}`);
    console.log(`💥 Mensaje: ${error.message}`);
    if (error.stack) {
      console.log(`\n📋 Stack trace:\n${error.stack}`);
    }
    return false;
  } finally {
    // Limpiar archivo de prueba
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log(`\n🧹 Archivo temporal eliminado: ${testFile}`);
    }
  }
}

// Test automatizado de Cargar Pago
async function testCargarPagoProduccion() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TEST AUTOMÁTICO: Cargar Pago en PRODUCCIÓN con documento");
  console.log("=".repeat(70));

  const testFile = createTestFile("pago-test-doc.txt");

  try {
    const formData = new FormData();
    const timestamp = Date.now();

    const rpcNumber = `RPC-PAGO-AUTO-${timestamp}`;
    formData.append("numero_rpc", rpcNumber);
    formData.append("valor_pago", "5000000");
    formData.append("fecha_transaccion", "2024-11-24");
    formData.append("referencia_contrato", `CONT-AUTO-${timestamp}`);
    formData.append("nombre_centro_gestor", "Centro Gestor Automatizado");

    // Agregar archivo
    const fileStream = fs.createReadStream(testFile);
    formData.append("documentos", fileStream, {
      filename: path.basename(testFile),
      contentType: "text/plain",
    });

    console.log(`\n📋 Datos del Pago:`);
    console.log(`   Número RPC: ${rpcNumber}`);
    console.log(`   Valor Pago: $5,000,000`);
    console.log(`   Fecha: 2024-11-24`);
    console.log(`   Contrato: CONT-AUTO-${timestamp}`);
    console.log(`\n📎 Archivo adjunto: ${testFile}`);

    console.log(`\n📤 Enviando POST a: ${API_URL}/emprestito/cargar-pago`);
    console.log("⏳ Esperando respuesta...\n");

    const response = await fetch(`${API_URL}/emprestito/cargar-pago`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    console.log(`📋 Content-Type: ${contentType}`);

    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.log(`⚠️  Respuesta no es JSON:\n${text.substring(0, 500)}`);
      throw new Error("La respuesta del servidor no es JSON");
    }

    console.log(`\n📦 Respuesta completa:`);
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n" + "✅".repeat(35));
      console.log("✅ PAGO REGISTRADO EXITOSAMENTE EN PRODUCCIÓN");
      console.log("✅".repeat(35));

      // Verificar si hay URLs de S3
      if (
        result.data?.documentos_urls &&
        result.data.documentos_urls.length > 0
      ) {
        console.log(`\n🎉 ¡ÉXITO! Documentos subidos a S3:`);
        console.log(
          `📎 Total de documentos: ${result.data.documentos_urls.length}`
        );
        result.data.documentos_urls.forEach((url, i) => {
          console.log(`   ${i + 1}. ${url}`);
        });
        console.log("\n✅ LA CARGA DE DOCUMENTOS A S3 FUNCIONA CORRECTAMENTE");
      } else if (
        result.data?.documentos_s3 &&
        result.data.documentos_s3.length > 0
      ) {
        console.log(`\n🎉 ¡ÉXITO! Documentos en S3 (campo alternativo):`);
        console.log(
          `📎 Total de documentos: ${result.data.documentos_s3.length}`
        );
        result.data.documentos_s3.forEach((doc, i) => {
          console.log(
            `   ${i + 1}. ${
              typeof doc === "string" ? doc : JSON.stringify(doc)
            }`
          );
        });
        console.log("\n✅ LA CARGA DE DOCUMENTOS A S3 FUNCIONA CORRECTAMENTE");
      } else {
        console.log(
          "\n⚠️  ADVERTENCIA: Pago registrado pero sin URLs de S3 en la respuesta"
        );
        console.log(
          "❌ EL BACKEND NO ESTÁ SUBIENDO ARCHIVOS A S3 O NO DEVUELVE LAS URLs"
        );
        console.log("\n🔍 Campos en result.data:");
        console.log(Object.keys(result.data || {}).join(", "));
      }

      return true;
    } else {
      console.log("\n❌ ERROR: La operación no fue exitosa");
      console.log(
        `   Mensaje: ${
          result.error || result.message || "Sin mensaje de error"
        }`
      );
      return false;
    }
  } catch (error) {
    console.log("\n" + "❌".repeat(35));
    console.log("❌ ERROR EN EL TEST");
    console.log("❌".repeat(35));
    console.log(`\n💥 Tipo de error: ${error.name}`);
    console.log(`💥 Mensaje: ${error.message}`);
    if (error.stack) {
      console.log(`\n📋 Stack trace:\n${error.stack}`);
    }
    return false;
  } finally {
    // Limpiar archivo de prueba
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log(`\n🧹 Archivo temporal eliminado: ${testFile}`);
    }
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log("\n" + "🚀".repeat(35));
  console.log("🚀 INICIANDO TESTS AUTOMÁTICOS EN PRODUCCIÓN");
  console.log("🚀 Backend: " + API_URL);
  console.log("🚀".repeat(35));

  const results = {
    rpc: false,
    pago: false,
  };

  // Test 1: Cargar RPC
  results.rpc = await testCargarRPCProduccion();
  await new Promise((resolve) => setTimeout(resolve, 3000)); // Esperar 3 segundos

  // Test 2: Cargar Pago
  results.pago = await testCargarPagoProduccion();

  // Resumen final
  console.log("\n" + "=".repeat(70));
  console.log("📊 RESUMEN DE TESTS AUTOMÁTICOS");
  console.log("=".repeat(70));
  console.log(
    `\n✅ Cargar RPC con documentos: ${
      results.rpc ? "EXITOSO ✅" : "FALLIDO ❌"
    }`
  );
  console.log(
    `✅ Cargar Pago con documentos: ${
      results.pago ? "EXITOSO ✅" : "FALLIDO ❌"
    }`
  );

  const allSuccess = results.rpc && results.pago;

  if (allSuccess) {
    console.log("\n" + "🎉".repeat(35));
    console.log("🎉 TODOS LOS TESTS PASARON EXITOSAMENTE");
    console.log("🎉 LA CARGA DE DOCUMENTOS A S3 ESTÁ FUNCIONANDO");
    console.log("🎉".repeat(35));
  } else {
    console.log("\n" + "⚠️ ".repeat(35));
    console.log("⚠️  ALGUNOS TESTS FALLARON - REVISAR LOGS ARRIBA");
    console.log("⚠️ ".repeat(35));
  }

  console.log("\n✅ Tests completados\n");
}

// Ejecutar
runAllTests().catch((err) => {
  console.error("💥 Error fatal ejecutando tests:", err);
  process.exit(1);
});

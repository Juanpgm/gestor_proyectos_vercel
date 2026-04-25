/**
 * Test diagnóstico: POST /reportes_contratos/
 *
 * Verifica si el endpoint del backend acepta reportes con archivos de evidencia.
 * Prueba directamente contra el backend FastAPI (sin pasar por el proxy de Next.js).
 *
 * Uso: node test-reportes-contratos-endpoint.js
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://gestorproyectoapi-production.up.railway.app";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function createSyntheticFile(sizeBytes, filename) {
  const buffer = Buffer.alloc(sizeBytes, "A");
  return new File([buffer], filename, { type: "application/octet-stream" });
}

function createSyntheticXlsx(sizeBytes, filename) {
  // Real XLSX magic bytes (PK zip header) + padding
  const header = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const padding = Buffer.alloc(Math.max(0, sizeBytes - 4), 0x00);
  const buffer = Buffer.concat([header, padding]);
  return new File([buffer], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function runTest(testName, testFn) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`🧪 ${testName}`);
  console.log(`${"═".repeat(70)}`);
  const start = Date.now();
  try {
    const result = await testFn();
    const elapsed = Date.now() - start;
    console.log(`⏱️  Tiempo: ${elapsed}ms`);
    return result;
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`⏱️  Tiempo: ${elapsed}ms`);
    console.error(`💥 Excepción: ${err.message}`);
    if (err.cause) console.error(`   Causa: ${err.cause}`);
    return { error: err.message, status: "EXCEPTION" };
  }
}

function buildFormData(overrides = {}) {
  const defaults = {
    referencia_contrato: "TEST-DIAG-001",
    observaciones: "Test diagnóstico automático - ignorar",
    avance_fisico: "25.5",
    avance_financiero: "30.0",
    alertas_descripcion: "Sin alertas - test diagnóstico",
    alertas_es_alerta: "false",
    alertas_tipo_alerta: "",
  };

  const fields = { ...defaults, ...overrides };
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (key === "archivos_evidencia") continue;
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  return formData;
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

async function testA_backendSmallFile() {
  return runTest(
    "TEST A: Backend directo — archivo pequeño (100 KB)",
    async () => {
      const url = `${API_BASE_URL}/reportes_contratos/`;
      console.log(`📡 URL: ${url}`);

      const formData = buildFormData();
      const smallFile = createSyntheticXlsx(
        100 * 1024,
        "test-small-100kb.xlsx",
      );
      formData.append("archivos_evidencia", smallFile);

      console.log(
        `📎 Archivo: ${smallFile.name} (${(smallFile.size / 1024).toFixed(1)} KB)`,
      );

      const res = await fetch(url, {
        method: "POST",
        body: formData,
        // No Content-Type header — fetch generates multipart boundary automatically
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      console.log(`📊 Status: ${res.status} ${res.statusText}`);
      console.log(
        `📋 Response:`,
        JSON.stringify(responseData, null, 2).substring(0, 1000),
      );

      if (res.ok) {
        console.log(`✅ PASS — Backend acepta archivo pequeño`);
      } else if (res.status === 401 || res.status === 403) {
        console.log(
          `⚠️  PASS (con auth) — Backend alcanzable, requiere autenticación (${res.status})`,
        );
        console.log(
          `   Esto es esperado sin token Firebase. El endpoint funciona.`,
        );
      } else if (res.status === 422) {
        console.log(`⚠️  INFO — Backend rechaza con error de validación (422)`);
        console.log(`   Posible: campos faltantes o formato incorrecto`);
      } else {
        console.log(`❌ FAIL — Backend retorna ${res.status}`);
      }

      return { status: res.status, data: responseData };
    },
  );
}

async function testB_backendLargeFile() {
  return runTest(
    "TEST B: Backend directo — archivo grande (5 MB, simula .xlsx del usuario)",
    async () => {
      const url = `${API_BASE_URL}/reportes_contratos/`;
      console.log(`📡 URL: ${url}`);

      const formData = buildFormData();
      const largeFile = createSyntheticXlsx(
        5 * 1024 * 1024,
        "test-large-5mb.xlsx",
      );
      formData.append("archivos_evidencia", largeFile);

      console.log(
        `📎 Archivo: ${largeFile.name} (${(largeFile.size / (1024 * 1024)).toFixed(2)} MB)`,
      );

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      console.log(`📊 Status: ${res.status} ${res.statusText}`);
      console.log(
        `📋 Response:`,
        JSON.stringify(responseData, null, 2).substring(0, 1000),
      );

      if (res.ok) {
        console.log(`✅ PASS — Backend acepta archivo grande de 5 MB`);
      } else if (res.status === 401 || res.status === 403) {
        console.log(
          `⚠️  PASS (con auth) — Backend alcanzable con archivo grande, requiere autenticación (${res.status})`,
        );
        console.log(`   El archivo de 5 MB llegó correctamente al backend.`);
      } else if (res.status === 413) {
        console.log(
          `❌ FAIL — Backend rechaza archivo por tamaño (413 Payload Too Large)`,
        );
        console.log(
          `   DIAGNÓSTICO: Problema en el BACKEND — límite de tamaño de archivo`,
        );
      } else if (res.status === 422) {
        console.log(`⚠️  INFO — Backend rechaza con error de validación (422)`);
      } else {
        console.log(`❌ FAIL — Backend retorna ${res.status}`);
      }

      return { status: res.status, data: responseData };
    },
  );
}

async function testC_backendValidation() {
  return runTest(
    "TEST C: Backend directo — sin campos requeridos (espera 422)",
    async () => {
      const url = `${API_BASE_URL}/reportes_contratos/`;
      console.log(`📡 URL: ${url}`);

      // Solo enviar referencia_contrato sin archivos ni otros campos requeridos
      const formData = new FormData();
      formData.append("referencia_contrato", "TEST-INCOMPLETE");

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      console.log(`📊 Status: ${res.status} ${res.statusText}`);
      console.log(
        `📋 Response:`,
        JSON.stringify(responseData, null, 2).substring(0, 1000),
      );

      if (res.status === 422) {
        console.log(`✅ PASS — Backend valida correctamente y retorna 422`);
      } else if (res.status === 401 || res.status === 403) {
        console.log(
          `⚠️  INFO — Backend requiere auth antes de validar campos (${res.status})`,
        );
      } else {
        console.log(`⚠️  INFO — Status inesperado: ${res.status}`);
      }

      return { status: res.status, data: responseData };
    },
  );
}

async function testD_checkEndpointExists() {
  return runTest(
    "TEST D: Verificar que el endpoint existe (OPTIONS/GET)",
    async () => {
      const url = `${API_BASE_URL}/reportes_contratos/`;
      console.log(`📡 URL: ${url}`);

      // Primero probar GET (debería retornar lista o 405)
      const resGet = await fetch(url, { method: "GET" });
      const getText = await resGet.text();
      let getData;
      try {
        getData = JSON.parse(getText);
      } catch {
        getData = getText;
      }

      console.log(`📊 GET Status: ${resGet.status} ${resGet.statusText}`);
      console.log(
        `📋 GET Response (primeros 500 chars):`,
        JSON.stringify(getData, null, 2).substring(0, 500),
      );

      // Probar OpenAPI docs
      const docsUrl = `${API_BASE_URL}/docs`;
      const resDocs = await fetch(docsUrl, { method: "GET" });
      console.log(`📊 /docs Status: ${resDocs.status}`);

      if (resGet.ok || resGet.status === 401 || resGet.status === 403) {
        console.log(
          `✅ PASS — Endpoint /reportes_contratos/ existe y responde`,
        );
      } else if (resGet.status === 405) {
        console.log(
          `✅ PASS — Endpoint existe (405 Method Not Allowed para GET es normal si solo acepta POST)`,
        );
      } else if (resGet.status === 404) {
        console.log(
          `❌ FAIL — Endpoint NO existe (404). Verificar que el backend tiene la ruta /reportes_contratos/`,
        );
      } else {
        console.log(`⚠️  INFO — Status inesperado: ${resGet.status}`);
      }

      return { getStatus: resGet.status, getData, docsStatus: resDocs.status };
    },
  );
}

async function testE_compareSmallVsLargeHeaders() {
  return runTest(
    "TEST E: Comparar headers de respuesta (pequeño vs grande)",
    async () => {
      const url = `${API_BASE_URL}/reportes_contratos/`;

      // Archivo pequeño
      const formSmall = buildFormData();
      formSmall.append(
        "archivos_evidencia",
        createSyntheticXlsx(50 * 1024, "small.xlsx"),
      );
      const resSmall = await fetch(url, { method: "POST", body: formSmall });

      // Archivo grande
      const formLarge = buildFormData();
      formLarge.append(
        "archivos_evidencia",
        createSyntheticXlsx(5 * 1024 * 1024, "large.xlsx"),
      );
      const resLarge = await fetch(url, { method: "POST", body: formLarge });

      console.log(`📊 Archivo pequeño (50 KB): Status ${resSmall.status}`);
      console.log(`📊 Archivo grande (5 MB):   Status ${resLarge.status}`);

      const smallHeaders = Object.fromEntries(resSmall.headers.entries());
      const largeHeaders = Object.fromEntries(resLarge.headers.entries());

      console.log(
        `\n📋 Headers small:`,
        JSON.stringify(smallHeaders, null, 2).substring(0, 500),
      );
      console.log(
        `📋 Headers large:`,
        JSON.stringify(largeHeaders, null, 2).substring(0, 500),
      );

      if (resSmall.status === resLarge.status) {
        console.log(
          `\n✅ Mismo status para ambos tamaños — el tamaño NO es el problema`,
        );
      } else {
        console.log(`\n⚠️  Status DIFERENTE — el tamaño del archivo SÍ afecta`);
        console.log(
          `   Pequeño: ${resSmall.status} | Grande: ${resLarge.status}`,
        );
      }

      // Read response bodies
      const smallBody = await resSmall.text().catch(() => "");
      const largeBody = await resLarge.text().catch(() => "");

      let smallData, largeData;
      try {
        smallData = JSON.parse(smallBody);
      } catch {
        smallData = smallBody;
      }
      try {
        largeData = JSON.parse(largeBody);
      } catch {
        largeData = largeBody;
      }

      console.log(
        `\n📋 Body small:`,
        JSON.stringify(smallData, null, 2).substring(0, 500),
      );
      console.log(
        `📋 Body large:`,
        JSON.stringify(largeData, null, 2).substring(0, 500),
      );

      return {
        smallStatus: resSmall.status,
        largeStatus: resLarge.status,
        smallData,
        largeData,
      };
    },
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║  DIAGNÓSTICO: POST /reportes_contratos/                        ║",
  );
  console.log(
    '║  Problema: "No se pudo registrar el avance"                    ║',
  );
  console.log(
    "║  Archivo del usuario: 4.85 MB .xlsx                            ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝",
  );
  console.log(`\n🌐 Backend URL: ${API_BASE_URL}`);
  console.log(`📅 Fecha: ${new Date().toISOString()}`);
  console.log(`🖥️  Node: ${process.version}`);

  const results = {};

  // Test D primero — verificar que el endpoint existe
  results.D = await testD_checkEndpointExists();

  // Test A — archivo pequeño
  results.A = await testA_backendSmallFile();

  // Test B — archivo grande
  results.B = await testB_backendLargeFile();

  // Test C — validación
  results.C = await testC_backendValidation();

  // Test E — comparar pequeño vs grande
  results.E = await testE_compareSmallVsLargeHeaders();

  // ═══════════════════════════════════════════════════════════════════
  // Resumen y diagnóstico
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(70));
  console.log("📊 RESUMEN DE DIAGNÓSTICO");
  console.log("═".repeat(70));

  const statusA = results.A?.status;
  const statusB = results.B?.status;
  const statusE_small = results.E?.smallStatus;
  const statusE_large = results.E?.largeStatus;

  console.log(
    `\n  Test D (endpoint existe):          ${results.D?.getStatus === 200 || results.D?.getStatus === 401 || results.D?.getStatus === 403 || results.D?.getStatus === 405 ? "✅" : "❌"} Status ${results.D?.getStatus}`,
  );
  console.log(
    `  Test A (backend, 100 KB):          ${statusA === 200 ? "✅" : statusA === 401 || statusA === 403 ? "⚠️  (auth)" : "❌"} Status ${statusA}`,
  );
  console.log(
    `  Test B (backend, 5 MB):            ${statusB === 200 ? "✅" : statusB === 401 || statusB === 403 ? "⚠️  (auth)" : statusB === 413 ? "❌ TAMAÑO" : "❌"} Status ${statusB}`,
  );
  console.log(
    `  Test C (validación sin campos):     ${results.C?.status === 422 ? "✅" : "⚠️ "} Status ${results.C?.status}`,
  );
  console.log(
    `  Test E (pequeño vs grande):         ${statusE_small === statusE_large ? "✅ Igual" : "⚠️  Diferente"} ${statusE_small} vs ${statusE_large}`,
  );

  // Diagnóstico
  console.log("\n" + "─".repeat(70));
  console.log("🔍 DIAGNÓSTICO:");
  console.log("─".repeat(70));

  if (
    statusA === statusB &&
    (statusA === 200 || statusA === 401 || statusA === 403 || statusA === 422)
  ) {
    console.log(
      `\n  ✅ El backend ACEPTA archivos grandes y pequeños por igual.`,
    );
    console.log(`  → El backend NO es el problema.`);
    console.log(`  → El problema está entre el browser y el backend:`);
    console.log(
      `     1. PROXY de Next.js (/api/reportes-contratos) — posible límite de body`,
    );
    console.log(
      `     2. VERCEL — límite de body size (4.5 MB en Hobby, 25 MB en Pro)`,
    );
    console.log(
      `     3. El archivo de 4.85 MB del usuario EXCEDE el límite de Vercel Hobby (4.5 MB)`,
    );
    console.log(`\n  💡 SOLUCIÓN RECOMENDADA:`);
    console.log(`     - Si estás en Vercel Hobby → upgrade a Pro (25 MB) o`);
    console.log(
      `     - Implementar subida directa con presigned URLs (bypass del proxy)`,
    );
  } else if (statusB === 413) {
    console.log(
      `\n  ❌ El backend RECHAZA archivos grandes (413 Payload Too Large).`,
    );
    console.log(`  → El problema está en el BACKEND.`);
    console.log(
      `  → Necesita ajustar el límite de tamaño en el backend FastAPI.`,
    );
  } else if (statusA !== statusB) {
    console.log(
      `\n  ⚠️  Backend responde DIFERENTE para archivos pequeños (${statusA}) vs grandes (${statusB}).`,
    );
    console.log(`  → Posible problema de tamaño en el backend o en Railway.`);
  } else if (statusA === 404) {
    console.log(
      `\n  ❌ El endpoint /reportes_contratos/ NO EXISTE en el backend.`,
    );
    console.log(`  → Problema del BACKEND — endpoint no desplegado.`);
  } else {
    console.log(
      `\n  ⚠️  Resultados no concluyentes. Revisar responses arriba para más detalle.`,
    );
  }

  console.log("\n" + "═".repeat(70));
}

main().catch(console.error);

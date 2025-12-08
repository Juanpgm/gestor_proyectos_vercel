/**
 * Test de diagnóstico para comparar filtros de API vs Frontend
 */

// Usar fetch global de Node.js 18+
const fetch = globalThis.fetch;

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log("\n" + "=".repeat(80));
  log(title, "bright");
  console.log("=".repeat(80) + "\n");
}

async function testDirectAPI() {
  section("TEST 1: API DIRECTA (Railway)");

  try {
    const url =
      "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/filters";
    log(`📡 Consultando: ${url}`, "cyan");

    const response = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const data = await response.json();

    log("✅ Respuesta recibida", "green");
    log(`📦 Estructura:`, "yellow");
    console.log(JSON.stringify(Object.keys(data), null, 2));

    if (data.filters) {
      log("\n📋 Filtros disponibles:", "magenta");
      const filters = data.filters;

      console.log(`  - estados: ${filters.estados?.length || 0} valores`);
      console.log(`    Muestra: ${filters.estados?.slice(0, 3).join(", ")}`);

      console.log(
        `\n  - tipos_intervencion: ${
          filters.tipos_intervencion?.length || 0
        } valores`
      );
      console.log(
        `    Muestra: ${filters.tipos_intervencion?.slice(0, 3).join(", ")}`
      );

      console.log(
        `\n  - tipos_equipamiento: ${
          filters.tipos_equipamiento?.length || 0
        } valores`
      );
      console.log(
        `    Muestra: ${filters.tipos_equipamiento?.slice(0, 3).join(", ")}`
      );

      console.log(
        `\n  - centros_gestores: ${
          filters.centros_gestores?.length || 0
        } valores`
      );
      console.log(
        `    Muestra: ${filters.centros_gestores?.slice(0, 3).join(", ")}`
      );

      console.log(`\n  - comunas: ${filters.comunas?.length || 0} valores`);
      console.log(`    Muestra: ${filters.comunas?.slice(0, 5).join(", ")}`);

      console.log(
        `\n  - barrios_veredas: ${filters.barrios_veredas?.length || 0} valores`
      );
      console.log(
        `    Muestra: ${filters.barrios_veredas?.slice(0, 3).join(", ")}`
      );

      console.log(
        `\n  - fuentes_financiacion: ${
          filters.fuentes_financiacion?.length || 0
        } valores`
      );
      console.log(`    Muestra: ${filters.fuentes_financiacion?.join(", ")}`);

      console.log(`\n  - anos: ${filters.anos?.length || 0} valores`);
      console.log(`    Muestra: ${filters.anos?.join(", ")}`);

      return filters;
    }

    return null;
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    return null;
  }
}

async function testProxyAPI() {
  section("TEST 2: API PROXY (Next.js)");

  try {
    const url = "http://localhost:3000/api/proxy/unidades-proyecto/filters";
    log(`📡 Consultando: ${url}`, "cyan");

    const response = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    const data = await response.json();

    log("✅ Respuesta recibida", "green");
    log(`📦 Estructura:`, "yellow");
    console.log(JSON.stringify(Object.keys(data), null, 2));

    log("\n📋 Filtros desde Proxy:", "magenta");

    console.log(`  - estados: ${data.estados?.length || 0} valores`);
    console.log(`    Muestra: ${data.estados?.slice(0, 3).join(", ")}`);

    console.log(
      `\n  - tipos_intervencion: ${
        data.tipos_intervencion?.length || 0
      } valores`
    );
    console.log(
      `    Muestra: ${data.tipos_intervencion?.slice(0, 3).join(", ")}`
    );

    console.log(
      `\n  - tipos_equipamiento: ${
        data.tipos_equipamiento?.length || 0
      } valores`
    );
    console.log(
      `    Muestra: ${data.tipos_equipamiento?.slice(0, 3).join(", ")}`
    );

    console.log(
      `\n  - centros_gestores: ${data.centros_gestores?.length || 0} valores`
    );
    console.log(
      `    Muestra: ${data.centros_gestores?.slice(0, 3).join(", ")}`
    );

    console.log(`\n  - comunas: ${data.comunas?.length || 0} valores`);
    console.log(`    Muestra: ${data.comunas?.slice(0, 5).join(", ")}`);

    console.log(
      `\n  - barrios_veredas: ${data.barrios_veredas?.length || 0} valores`
    );
    console.log(`    Muestra: ${data.barrios_veredas?.slice(0, 3).join(", ")}`);

    console.log(
      `\n  - fuentes_financiacion: ${
        data.fuentes_financiacion?.length || 0
      } valores`
    );
    console.log(`    Muestra: ${data.fuentes_financiacion?.join(", ")}`);

    console.log(`\n  - anos: ${data.anos?.length || 0} valores`);
    console.log(`    Muestra: ${data.anos?.join(", ")}`);

    return data;
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    return null;
  }
}

async function testAttributesAPI() {
  section("TEST 3: ATTRIBUTES API (Generación de Filtros)");

  try {
    const url = "http://localhost:3000/api/proxy/unidades-proyecto/attributes";
    log(`📡 Consultando: ${url}`, "cyan");

    const response = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    const data = await response.json();

    log("✅ Respuesta recibida", "green");
    log(`📊 Total de registros: ${data.length}`, "yellow");

    // Generar filtros desde los datos
    const extractUniqueValues = (items, key) => {
      const values = items
        .map((item) => item[key])
        .filter(
          (val) =>
            val !== undefined && val !== null && String(val).trim() !== ""
        )
        .map((val) => String(val).trim());

      return Array.from(new Set(values)).sort((a, b) =>
        a.localeCompare(b, "es")
      );
    };

    const extractUniqueYears = (items, key) => {
      const years = items
        .map((item) => String(item[key]).replace(".0", ""))
        .filter(
          (year) =>
            year &&
            year !== "undefined" &&
            year !== "null" &&
            !isNaN(Number(year))
        );

      return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
    };

    const generatedFilters = {
      estados: extractUniqueValues(data, "estado"),
      tipos_intervencion: extractUniqueValues(data, "tipo_intervencion"),
      tipos_equipamiento: extractUniqueValues(data, "tipo_equipamiento"),
      centros_gestores: extractUniqueValues(data, "nombre_centro_gestor"),
      comunas: extractUniqueValues(data, "comuna_corregimiento"),
      barrios_veredas: extractUniqueValues(data, "barrio_vereda"),
      fuentes_financiacion: extractUniqueValues(data, "fuente_financiacion"),
      anos: extractUniqueYears(data, "ano"),
    };

    log("\n📋 Filtros Generados desde Attributes:", "magenta");

    console.log(`  - estados: ${generatedFilters.estados.length} valores`);
    console.log(
      `    Muestra: ${generatedFilters.estados.slice(0, 3).join(", ")}`
    );

    console.log(
      `\n  - tipos_intervencion: ${generatedFilters.tipos_intervencion.length} valores`
    );
    console.log(
      `    Muestra: ${generatedFilters.tipos_intervencion
        .slice(0, 3)
        .join(", ")}`
    );

    console.log(
      `\n  - tipos_equipamiento: ${generatedFilters.tipos_equipamiento.length} valores`
    );
    console.log(
      `    Muestra: ${generatedFilters.tipos_equipamiento
        .slice(0, 3)
        .join(", ")}`
    );

    console.log(
      `\n  - centros_gestores: ${generatedFilters.centros_gestores.length} valores`
    );
    console.log(
      `    Muestra: ${generatedFilters.centros_gestores.slice(0, 3).join(", ")}`
    );

    console.log(`\n  - comunas: ${generatedFilters.comunas.length} valores`);
    console.log(
      `    Muestra: ${generatedFilters.comunas.slice(0, 5).join(", ")}`
    );

    console.log(
      `\n  - barrios_veredas: ${generatedFilters.barrios_veredas.length} valores`
    );
    console.log(
      `    Muestra: ${generatedFilters.barrios_veredas.slice(0, 3).join(", ")}`
    );

    console.log(
      `\n  - fuentes_financiacion: ${generatedFilters.fuentes_financiacion.length} valores`
    );
    console.log(
      `    Muestra: ${generatedFilters.fuentes_financiacion.join(", ")}`
    );

    console.log(`\n  - anos: ${generatedFilters.anos.length} valores`);
    console.log(`    Muestra: ${generatedFilters.anos.join(", ")}`);

    return generatedFilters;
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    return null;
  }
}

function compareFilters(apiFilters, proxyFilters, generatedFilters) {
  section("TEST 4: COMPARACIÓN DE RESULTADOS");

  if (!apiFilters || !proxyFilters || !generatedFilters) {
    log("❌ No se pueden comparar: falta información", "red");
    return;
  }

  const fields = [
    "estados",
    "tipos_intervencion",
    "tipos_equipamiento",
    "centros_gestores",
    "comunas",
    "barrios_veredas",
    "fuentes_financiacion",
    "anos",
  ];

  fields.forEach((field) => {
    log(`\n📊 Campo: ${field}`, "cyan");

    const apiCount = apiFilters[field]?.length || 0;
    const proxyCount = proxyFilters[field]?.length || 0;
    const generatedCount = generatedFilters[field]?.length || 0;

    console.log(`  API Directa:      ${apiCount} valores`);
    console.log(`  Proxy Next.js:    ${proxyCount} valores`);
    console.log(`  Generado (attrs): ${generatedCount} valores`);

    if (apiCount === proxyCount && proxyCount === generatedCount) {
      log(`  ✅ MATCH - Todos coinciden`, "green");
    } else {
      log(`  ⚠️  DIFERENCIA DETECTADA`, "yellow");

      // Mostrar diferencias específicas
      if (apiCount !== generatedCount) {
        log(`     API vs Generado: ${apiCount} vs ${generatedCount}`, "red");

        const apiSet = new Set(apiFilters[field] || []);
        const genSet = new Set(generatedFilters[field] || []);

        const inApiNotGen = [...apiSet].filter((x) => !genSet.has(x));
        const inGenNotApi = [...genSet].filter((x) => !apiSet.has(x));

        if (inApiNotGen.length > 0) {
          console.log(
            `     En API pero no en Generado: ${inApiNotGen
              .slice(0, 5)
              .join(", ")}`
          );
        }
        if (inGenNotApi.length > 0) {
          console.log(
            `     En Generado pero no en API: ${inGenNotApi
              .slice(0, 5)
              .join(", ")}`
          );
        }
      }

      if (proxyCount !== generatedCount) {
        log(
          `     Proxy vs Generado: ${proxyCount} vs ${generatedCount}`,
          "red"
        );
      }
    }
  });
}

async function main() {
  log("\n🔍 DIAGNÓSTICO DE FILTROS - Unidades de Proyecto\n", "bright");
  log("Este test compara los filtros de 3 fuentes diferentes:", "cyan");
  log("  1. API Directa de Railway", "cyan");
  log("  2. Proxy de Next.js (/api/proxy/...)", "cyan");
  log("  3. Generados desde attributes\n", "cyan");

  const apiFilters = await testDirectAPI();
  const proxyFilters = await testProxyAPI();
  const generatedFilters = await testAttributesAPI();

  compareFilters(apiFilters, proxyFilters, generatedFilters);

  section("RESUMEN");
  log("✅ Test completado", "green");
  log(
    "Revisa las diferencias arriba para identificar problemas de caché o mapeo",
    "yellow"
  );
}

main().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});

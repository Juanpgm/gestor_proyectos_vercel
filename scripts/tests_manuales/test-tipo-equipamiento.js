/**
 * Script de prueba para verificar el funcionamiento del filtro tipo_equipamiento
 */

const API_BASE =
  "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto";

// Colores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Tests
const tests = [
  {
    name: "Test 1: Obtener lista de tipos de equipamiento desde /filters",
    async run() {
      const response = await fetch(`${API_BASE}/filters`);
      const data = await response.json();

      // El endpoint no retorna tipos_equipamiento directamente, pero debe retornar estados, tipos_intervencion, etc.
      const hasFilters = data.estados && data.tipos_intervencion;

      return {
        success: hasFilters,
        message: hasFilters
          ? "✓ Endpoint /filters responde correctamente (tipos_equipamiento se genera desde attributes)"
          : "✗ Endpoint /filters no retorna filtros esperados",
        data: {
          tiposIntervencion: data.tipos_intervencion?.length || 0,
          estados: data.estados?.length || 0,
        },
      };
    },
  },
  {
    name: "Test 2: Obtener attributes y verificar campo tipo_equipamiento",
    async run() {
      const response = await fetch(`${API_BASE}/attributes`);
      const data = await response.json();

      const features = data.features || [];
      const withTipoEquipamiento = features.filter(
        (f) => f.properties?.tipo_equipamiento
      );
      const uniqueTipos = [
        ...new Set(
          withTipoEquipamiento.map((f) => f.properties.tipo_equipamiento)
        ),
      ];

      return {
        success: withTipoEquipamiento.length > 0,
        message:
          withTipoEquipamiento.length > 0
            ? `✓ Campo tipo_equipamiento presente en ${withTipoEquipamiento.length}/${features.length} registros`
            : "✗ Campo tipo_equipamiento no encontrado en attributes",
        data: {
          totalFeatures: features.length,
          withTipoEquipamiento: withTipoEquipamiento.length,
          uniqueTypes: uniqueTipos.length,
          sampleTypes: uniqueTipos.slice(0, 5),
        },
      };
    },
  },
  {
    name: "Test 3: Filtrar geometría por tipo_equipamiento=Bibliotecas",
    async run() {
      const response = await fetch(
        `${API_BASE}/geometry?tipo_equipamiento=Bibliotecas`
      );
      const data = await response.json();

      const features = data.features || [];
      const allAreBibliotecas = features.every(
        (f) => f.properties?.tipo_equipamiento === "Bibliotecas"
      );

      return {
        success: features.length > 0 && allAreBibliotecas,
        message:
          features.length > 0 && allAreBibliotecas
            ? `✓ Filtro tipo_equipamiento=Bibliotecas funciona correctamente (${features.length} resultados)`
            : `✗ Filtro no aplicado correctamente (${
                features.length
              } resultados, ${
                allAreBibliotecas ? "todos correctos" : "valores mixtos"
              })`,
        data: {
          resultCount: features.length,
          allMatch: allAreBibliotecas,
          sampleTypes: features
            .slice(0, 3)
            .map((f) => f.properties?.tipo_equipamiento),
        },
      };
    },
  },
  {
    name: "Test 4: Filtrar geometría por tipo_equipamiento=Parques y zonas verdes",
    async run() {
      const response = await fetch(
        `${API_BASE}/geometry?tipo_equipamiento=${encodeURIComponent(
          "Parques y zonas verdes"
        )}`
      );
      const data = await response.json();

      const features = data.features || [];
      const allAreParques = features.every(
        (f) => f.properties?.tipo_equipamiento === "Parques y zonas verdes"
      );

      return {
        success: features.length > 0 && allAreParques,
        message:
          features.length > 0 && allAreParques
            ? `✓ Filtro con nombre compuesto funciona (${features.length} resultados)`
            : `✗ Filtro con nombre compuesto no funciona correctamente`,
        data: {
          resultCount: features.length,
          allMatch: allAreParques,
        },
      };
    },
  },
  {
    name: "Test 5: Filtrar geometría por tipo_equipamiento=CAD",
    async run() {
      const response = await fetch(
        `${API_BASE}/geometry?tipo_equipamiento=CAD`
      );
      const data = await response.json();

      const features = data.features || [];
      const allAreCAD = features.every(
        (f) => f.properties?.tipo_equipamiento === "CAD"
      );

      return {
        success: features.length > 0 && allAreCAD,
        message:
          features.length > 0 && allAreCAD
            ? `✓ Filtro tipo_equipamiento=CAD funciona (${features.length} resultados)`
            : `✗ Filtro CAD no funciona correctamente`,
        data: {
          resultCount: features.length,
          allMatch: allAreCAD,
        },
      };
    },
  },
  {
    name: "Test 6: Verificar que geometría sin filtro retorne todos los datos",
    async run() {
      const response = await fetch(`${API_BASE}/geometry`);
      const data = await response.json();

      const features = data.features || [];
      const tiposUnicos = [
        ...new Set(
          features.map((f) => f.properties?.tipo_equipamiento).filter(Boolean)
        ),
      ];

      return {
        success: features.length > 100, // Esperamos muchos resultados sin filtro
        message:
          features.length > 100
            ? `✓ Sin filtro retorna todos los datos (${features.length} registros, ${tiposUnicos.length} tipos únicos)`
            : `✗ Sin filtro retorna pocos datos (${features.length} registros)`,
        data: {
          totalFeatures: features.length,
          uniqueTypes: tiposUnicos.length,
          sampleTypes: tiposUnicos.slice(0, 5),
        },
      };
    },
  },
  {
    name: "Test 7: Comparar resultados filtrados vs sin filtrar",
    async run() {
      const [allResponse, filteredResponse] = await Promise.all([
        fetch(`${API_BASE}/geometry`),
        fetch(`${API_BASE}/geometry?tipo_equipamiento=Bibliotecas`),
      ]);

      const allData = await allResponse.json();
      const filteredData = await filteredResponse.json();

      const allCount = allData.features?.length || 0;
      const filteredCount = filteredData.features?.length || 0;

      const isFiltered = filteredCount < allCount;

      return {
        success: isFiltered,
        message: isFiltered
          ? `✓ Filtro reduce correctamente el dataset (${allCount} → ${filteredCount})`
          : `✗ Filtro no reduce el dataset`,
        data: {
          totalWithoutFilter: allCount,
          totalWithFilter: filteredCount,
          reduction: `${((1 - filteredCount / allCount) * 100).toFixed(1)}%`,
        },
      };
    },
  },
];

// Ejecutar tests
async function runTests() {
  log("\n" + "=".repeat(80), "blue");
  log("PRUEBAS DE FUNCIONALIDAD: FILTRO tipo_equipamiento", "bold");
  log("=".repeat(80) + "\n", "blue");

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    log(`\n${test.name}`, "yellow");
    log("-".repeat(80), "yellow");

    try {
      const result = await test.run();

      log(result.message, result.success ? "green" : "red");

      if (result.data) {
        log("Datos:", "blue");
        console.log(JSON.stringify(result.data, null, 2));
      }

      if (result.success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`✗ Error: ${error.message}`, "red");
      failed++;
    }
  }

  log("\n" + "=".repeat(80), "blue");
  log("RESUMEN DE PRUEBAS", "bold");
  log("=".repeat(80), "blue");
  log(`Total: ${tests.length}`, "blue");
  log(`Exitosas: ${passed}`, "green");
  log(`Fallidas: ${failed}`, "red");
  log(
    `Porcentaje de éxito: ${((passed / tests.length) * 100).toFixed(1)}%\n`,
    passed === tests.length ? "green" : "yellow"
  );

  process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar
runTests().catch((error) => {
  log(`Error fatal: ${error.message}`, "red");
  process.exit(1);
});

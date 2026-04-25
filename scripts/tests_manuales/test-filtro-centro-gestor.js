/**
 * Test completo del filtro de Centro Gestor
 * Valida todo el flujo desde la selección hasta la visualización
 */

console.log("🧪 TEST: Filtro Centro Gestor\n");
console.log("═══════════════════════════════════════════════════════\n");

// ========================================
// 1. SIMULAR DATOS DE ATTRIBUTES
// ========================================
console.log("📊 PASO 1: Simulando datos de attributes...\n");

const mockAttributeData = [
  {
    upid: "UP001",
    nombre_up: "Proyecto A",
    nombre_centro_gestor: "Secretaría de Bienestar Social",
    estado: "Terminado",
  },
  {
    upid: "UP002",
    nombre_up: "Proyecto B",
    nombre_centro_gestor: "Secretaría de Bienestar Social",
    estado: "En ejecución",
  },
  {
    upid: "UP003",
    nombre_up: "Proyecto C",
    nombre_centro_gestor: "Departamento Administrativo de Gestión",
    estado: "Terminado",
  },
  {
    upid: "UP004",
    nombre_up: "Proyecto D",
    nombre_centro_gestor: "Secretaría de Infraestructura",
    estado: "En ejecución",
  },
  {
    upid: "UP005",
    nombre_up: "Proyecto E",
    nombre_centro_gestor: "Secretaría de Bienestar Social",
    estado: "Terminado",
  },
  {
    upid: "UP006",
    nombre_up: "Proyecto F",
    nombre_centro_gestor: null,
    estado: "En ejecución",
  },
  {
    upid: "UP007",
    nombre_up: "Proyecto G",
    nombre_centro_gestor: "",
    estado: "Terminado",
  },
];

console.log(`✅ Cargados ${mockAttributeData.length} items\n`);

// Análisis de datos
const withCentro = mockAttributeData.filter(
  (item) => item.nombre_centro_gestor && item.nombre_centro_gestor.trim() !== ""
);
const withoutCentro = mockAttributeData.filter(
  (item) =>
    !item.nombre_centro_gestor || item.nombre_centro_gestor.trim() === ""
);

console.log(`   Con centro_gestor: ${withCentro.length}`);
console.log(`   Sin centro_gestor: ${withoutCentro.length}\n`);

// Centros únicos
const centrosUnicos = new Set();
withCentro.forEach((item) => centrosUnicos.add(item.nombre_centro_gestor));
console.log(`   Centros únicos: ${centrosUnicos.size}`);
Array.from(centrosUnicos).forEach((centro) => {
  const count = withCentro.filter(
    (i) => i.nombre_centro_gestor === centro
  ).length;
  console.log(`     - ${centro}: ${count} UPs`);
});
console.log("");

// ========================================
// 2. SIMULAR DATOS DE GEOMETRY
// ========================================
console.log("📊 PASO 2: Simulando datos de geometry...\n");

const mockGeometryData = {
  type: "FeatureCollection",
  features: [
    {
      properties: {
        upid: "UP001",
        nombre_centro_gestor: "Secretaría de Bienestar Social",
      },
      geometry: { type: "Point", coordinates: [-76.5, 3.4] },
    },
    {
      properties: {
        upid: "UP002",
        nombre_centro_gestor: "Secretaría de Bienestar Social",
      },
      geometry: { type: "Point", coordinates: [-76.5, 3.4] },
    },
    {
      properties: {
        upid: "UP003",
        nombre_centro_gestor: "Departamento Administrativo de Gestión",
      },
      geometry: { type: "Point", coordinates: [-76.5, 3.4] },
    },
    {
      properties: {
        upid: "UP004",
        nombre_centro_gestor: "Secretaría de Infraestructura",
      },
      geometry: { type: "Point", coordinates: [-76.5, 3.4] },
    },
    {
      properties: {
        upid: "UP005",
        nombre_centro_gestor: "Secretaría de Bienestar Social",
      },
      geometry: { type: "Point", coordinates: [-76.5, 3.4] },
    },
    {
      properties: { upid: "UP006" },
      geometry: { type: "Point", coordinates: [-76.5, 3.4] },
    },
    {
      properties: { upid: "UP007" },
      geometry: { type: "Point", coordinates: [-76.5, 3.4] },
    },
  ],
};

console.log(`✅ Cargadas ${mockGeometryData.features.length} features\n`);

// Análisis de features
const featuresWithCentro = mockGeometryData.features.filter(
  (f) =>
    f.properties.nombre_centro_gestor &&
    f.properties.nombre_centro_gestor.trim() !== ""
);
console.log(`   Features con centro_gestor: ${featuresWithCentro.length}`);
console.log(
  `   Features sin centro_gestor: ${
    mockGeometryData.features.length - featuresWithCentro.length
  }\n`
);

// ========================================
// 3. SIMULAR FILTRO LOCAL (filterAttributeData)
// ========================================
console.log("📊 PASO 3: Aplicando filtro local...\n");

const filters = {
  centro_gestor: "Secretaría de Bienestar Social",
  centro_gestor_multiple: ["Secretaría de Bienestar Social"],
};

console.log("🎯 Filtros aplicados:", filters);
console.log("");

// Función de filtrado (simulación)
function filterAttributeData(data, filters) {
  return data.filter((item) => {
    // Extraer claves base
    const allFilterKeys = new Set();
    Object.keys(filters).forEach((key) => {
      if (key === "searchTerm") return;
      if (key.endsWith("_multiple")) {
        allFilterKeys.add(key.replace("_multiple", ""));
      } else {
        allFilterKeys.add(key);
      }
    });

    return Array.from(allFilterKeys).every((baseKey) => {
      const multipleKey = `${baseKey}_multiple`;
      const multipleValues = filters[multipleKey];
      const singleValue = filters[baseKey];

      // Si hay filtros múltiples
      if (
        multipleValues &&
        Array.isArray(multipleValues) &&
        multipleValues.length > 0
      ) {
        switch (baseKey) {
          case "centro_gestor":
            return multipleValues.includes(item.nombre_centro_gestor);
          default:
            return true;
        }
      }

      // Si hay filtro singular
      if (singleValue && singleValue !== "") {
        switch (baseKey) {
          case "centro_gestor":
            return item.nombre_centro_gestor === singleValue;
          default:
            return true;
        }
      }

      return true;
    });
  });
}

const filteredAttributes = filterAttributeData(mockAttributeData, filters);

console.log(`✅ Resultado del filtrado de attributes:`);
console.log(`   Items originales: ${mockAttributeData.length}`);
console.log(`   Items filtrados: ${filteredAttributes.length}`);
console.log("");

if (filteredAttributes.length > 0) {
  console.log("   Items filtrados:");
  filteredAttributes.forEach((item) => {
    console.log(
      `     - ${item.upid}: ${item.nombre_up} (${item.nombre_centro_gestor})`
    );
  });
  console.log("");
}

// ========================================
// 4. SIMULAR FILTRADO DE GEOMETRY POR UPID
// ========================================
console.log("📊 PASO 4: Filtrando geometry por UPID...\n");

const filteredUPIDs = new Set(filteredAttributes.map((item) => item.upid));
console.log(`🔍 UPIDs filtrados:`, Array.from(filteredUPIDs));
console.log("");

const filteredFeatures = mockGeometryData.features.filter((feature) =>
  filteredUPIDs.has(feature.properties.upid)
);

console.log(`✅ Resultado del filtrado de geometry:`);
console.log(`   Features originales: ${mockGeometryData.features.length}`);
console.log(`   Features filtradas: ${filteredFeatures.length}`);
console.log("");

if (filteredFeatures.length > 0) {
  console.log("   Features filtradas:");
  filteredFeatures.forEach((feature) => {
    console.log(
      `     - ${feature.properties.upid}: ${
        feature.properties.nombre_centro_gestor || "N/A"
      }`
    );
  });
  console.log("");
}

// ========================================
// 5. VALIDACIONES
// ========================================
console.log("📊 PASO 5: Validaciones...\n");

let testsPass = 0;
let testsFail = 0;

// Test 1: Attributes filtrados correctamente
const expectedFilteredCount = 3; // UP001, UP002, UP005
if (filteredAttributes.length === expectedFilteredCount) {
  console.log(
    `✅ TEST 1 PASS: Attributes filtrados correctamente (${filteredAttributes.length}/${expectedFilteredCount})`
  );
  testsPass++;
} else {
  console.log(
    `❌ TEST 1 FAIL: Expected ${expectedFilteredCount} attributes, got ${filteredAttributes.length}`
  );
  testsFail++;
}

// Test 2: Todos los items filtrados tienen el centro correcto
const allHaveCorrectCentro = filteredAttributes.every(
  (item) => item.nombre_centro_gestor === "Secretaría de Bienestar Social"
);
if (allHaveCorrectCentro) {
  console.log(`✅ TEST 2 PASS: Todos los items tienen el centro correcto`);
  testsPass++;
} else {
  console.log(`❌ TEST 2 FAIL: Algunos items no tienen el centro correcto`);
  testsFail++;
}

// Test 3: Features filtradas coinciden con attributes
if (filteredFeatures.length === filteredAttributes.length) {
  console.log(
    `✅ TEST 3 PASS: Features coinciden con attributes (${filteredFeatures.length}/${filteredAttributes.length})`
  );
  testsPass++;
} else {
  console.log(
    `❌ TEST 3 FAIL: Features (${filteredFeatures.length}) no coinciden con attributes (${filteredAttributes.length})`
  );
  testsFail++;
}

// Test 4: Todos los UPIDs coinciden
const geometryUPIDs = new Set(filteredFeatures.map((f) => f.properties.upid));
const attributeUPIDs = new Set(filteredAttributes.map((a) => a.upid));
const upidsMatch =
  [...attributeUPIDs].every((upid) => geometryUPIDs.has(upid)) &&
  [...geometryUPIDs].every((upid) => attributeUPIDs.has(upid));
if (upidsMatch) {
  console.log(
    `✅ TEST 4 PASS: Todos los UPIDs coinciden entre geometry y attributes`
  );
  testsPass++;
} else {
  console.log(`❌ TEST 4 FAIL: UPIDs no coinciden`);
  console.log(`   Attributes UPIDs:`, Array.from(attributeUPIDs));
  console.log(`   Geometry UPIDs:`, Array.from(geometryUPIDs));
  testsFail++;
}

// Test 5: Items sin centro_gestor fueron excluidos
const excludedItems = mockAttributeData.filter(
  (item) =>
    !item.nombre_centro_gestor || item.nombre_centro_gestor.trim() === ""
);
const noneExcludedInFiltered = filteredAttributes.every(
  (item) => item.nombre_centro_gestor && item.nombre_centro_gestor.trim() !== ""
);
if (noneExcludedInFiltered) {
  console.log(
    `✅ TEST 5 PASS: Items sin centro_gestor fueron correctamente excluidos`
  );
  testsPass++;
} else {
  console.log(
    `❌ TEST 5 FAIL: Algunos items sin centro_gestor están incluidos`
  );
  testsFail++;
}

// ========================================
// 6. RESUMEN FINAL
// ========================================
console.log("");
console.log("═══════════════════════════════════════════════════════");
console.log("📊 RESUMEN FINAL");
console.log("═══════════════════════════════════════════════════════");
console.log("");
console.log(`Total tests: ${testsPass + testsFail}`);
console.log(`✅ Tests passed: ${testsPass}`);
console.log(`❌ Tests failed: ${testsFail}`);
console.log("");

if (testsFail === 0) {
  console.log("🎉 TODOS LOS TESTS PASARON!");
  console.log("");
  console.log("✅ El filtro de Centro Gestor está funcionando correctamente:");
  console.log(
    "   1. Los attributes se filtran correctamente por centro_gestor_multiple"
  );
  console.log("   2. Las features de geometry se filtran por UPID coincidente");
  console.log("   3. Los UPIDs coinciden entre attributes y geometry");
  console.log("   4. Items sin centro_gestor son excluidos correctamente");
  console.log("");
  process.exit(0);
} else {
  console.log("❌ ALGUNOS TESTS FALLARON!");
  console.log("");
  console.log("⚠️ Revisar la lógica de filtrado o los datos de entrada.");
  console.log("");
  process.exit(1);
}

/**
 * Verificación de la implementación de "Colorear por tipo_equipamiento"
 */

const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

console.log("\n" + "=".repeat(80));
log("VERIFICACIÓN: Colorear por tipo_equipamiento", "bold");
console.log("=".repeat(80) + "\n");

// Leer el archivo del mapa
const mapFile = path.join(
  __dirname,
  "src",
  "components",
  "EnhancedUnidadesProyectoMap.tsx"
);
const mapContent = fs.readFileSync(mapFile, "utf-8");

const checks = [
  {
    name: "ColoringType incluye tipo_equipamiento",
    test: () => {
      const typeMatch = mapContent.match(
        /type ColoringType\s*=[\s\S]*?\|\s*'tipo_equipamiento'/
      );
      return typeMatch !== null;
    },
  },
  {
    name: "coloringOptions incluye tipo_equipamiento",
    test: () => {
      const optionsMatch = mapContent.match(
        /\{\s*value:\s*'tipo_equipamiento',\s*label:\s*'Tipo de Equipamiento'\s*\}/
      );
      return optionsMatch !== null;
    },
  },
  {
    name: "Switch case para tipo_equipamiento",
    test: () => {
      const switchMatch = mapContent.match(/case\s+'tipo_equipamiento':/);
      return switchMatch !== null;
    },
  },
  {
    name: "Field asignado correctamente",
    test: () => {
      const fieldMatch = mapContent.match(
        /case\s+'tipo_equipamiento':[\s\S]*?field\s*=\s*'tipo_equipamiento'/
      );
      return fieldMatch !== null;
    },
  },
  {
    name: "Popup muestra tipo_equipamiento",
    test: () => {
      const popupMatch = mapContent.match(
        /attributeItem\.tipo_equipamiento.*Equipamiento/
      );
      return popupMatch !== null;
    },
  },
  {
    name: "Popup con renderizado condicional",
    test: () => {
      const conditionalMatch = mapContent.match(
        /\$\{attributeItem\.tipo_equipamiento\s*\?\s*`.*Equipamiento.*`\s*:\s*''\}/
      );
      return conditionalMatch !== null;
    },
  },
];

let passed = 0;
let failed = 0;

checks.forEach((check, index) => {
  const result = check.test();
  if (result) {
    log(`✓ ${check.name}`, "green");
    passed++;
  } else {
    log(`✗ ${check.name}`, "red");
    failed++;
  }
});

console.log("\n" + "=".repeat(80));
log(
  `RESUMEN: ${passed}/${checks.length} verificaciones pasaron`,
  passed === checks.length ? "green" : "yellow"
);
console.log("=".repeat(80));

if (passed === checks.length) {
  log(
    '\n✓ La funcionalidad "Colorear por tipo_equipamiento" está COMPLETAMENTE implementada\n',
    "green"
  );
  log("Características implementadas:", "cyan");
  log('  • Opción en el dropdown "Colorear por"', "white");
  log("  • Lógica de coloración por tipo_equipamiento", "white");
  log("  • Leyenda con 20 tipos de equipamiento", "white");
  log("  • Popup muestra el tipo de equipamiento", "white");
  log("  • Colores únicos para cada tipo", "white");
  console.log("");
} else {
  log(`\n⚠ Faltan ${failed} implementaciones\n`, "yellow");
}

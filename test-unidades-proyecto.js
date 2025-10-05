/**
 * Script de Testing para Unidades de Proyecto
 * Pruebas automatizadas para validar funcionalidad y rendimiento
 */

const fs = require("fs");
const path = require("path");

// Configuración de pruebas
const TEST_CONFIG = {
  baseUrl: "http://localhost:3000",
  apiUrl: "https://gestorproyectoapi-production.up.railway.app",
  timeout: 10000,
  retries: 3,
};

// Colores para output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

// Utilitarios de logging
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) =>
    console.log(`${colors.bold}${colors.blue}🧪 ${msg}${colors.reset}`),
};

// Clase para manejar pruebas
class UnidadesProyectoTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
  }

  // Test de estructura de archivos
  async testFileStructure() {
    log.title("Testing File Structure");

    const requiredFiles = [
      "src/components/UnidadesProyecto.tsx",
      "src/components/UnidadesProyectoDashboard.tsx",
      "src/components/UnidadesProyectoFilters.tsx",
      "src/components/UnidadesProyectoMapSimple.tsx",
      "src/hooks/useUnidadesProyectoEnhanced.ts",
      "src/services/unidades-proyecto.service.ts",
    ];

    const obsoleteFiles = [
      "src/components/UnidadesProyectoNew.tsx",
      "src/components/EnhancedUnidadesProyecto.tsx",
      "src/components/UnidadesProyectoMap.tsx",
    ];

    // Verificar archivos requeridos
    for (const file of requiredFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        log.success(`Required file exists: ${file}`);
        this.results.passed++;
      } else {
        log.error(`Missing required file: ${file}`);
        this.results.failed++;
      }
    }

    // Verificar que archivos obsoletos no existan
    for (const file of obsoleteFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        log.success(`Obsolete file properly removed: ${file}`);
        this.results.passed++;
      } else {
        log.warning(`Obsolete file still exists: ${file}`);
        this.results.warnings++;
      }
    }
  }

  // Test de imports y exports
  async testImportsExports() {
    log.title("Testing Imports and Exports");

    const filesToCheck = [
      {
        file: "src/components/UnidadesProyecto.tsx",
        shouldImport: [
          "useUnidadesProyecto",
          "useUnidadesProyectoDashboard",
          "FilterParams",
        ],
        shouldExport: ["default"],
      },
      {
        file: "src/hooks/useUnidadesProyectoEnhanced.ts",
        shouldExport: [
          "useUnidadesProyecto",
          "useUnidadesProyectoDashboard",
          "useUnidadesProyectoFilters",
        ],
      },
      {
        file: "src/services/unidades-proyecto.service.ts",
        shouldExport: [
          "fetchGeometryData",
          "fetchAttributeData",
          "fetchFilterData",
          "fetchDashboardData",
          "GeometryData",
          "AttributeData",
          "FilterData",
          "DashboardData",
          "FilterParams",
        ],
      },
    ];

    for (const { file, shouldImport = [], shouldExport = [] } of filesToCheck) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");

        // Check imports
        for (const importName of shouldImport) {
          if (content.includes(importName)) {
            log.success(`${file} correctly imports ${importName}`);
            this.results.passed++;
          } else {
            log.error(`${file} missing import: ${importName}`);
            this.results.failed++;
          }
        }

        // Check exports
        for (const exportName of shouldExport) {
          const exportPattern = new RegExp(`export.*${exportName}`, "g");
          if (exportPattern.test(content)) {
            log.success(`${file} correctly exports ${exportName}`);
            this.results.passed++;
          } else {
            log.error(`${file} missing export: ${exportName}`);
            this.results.failed++;
          }
        }
      }
    }
  }

  // Test de TypeScript compilation
  async testTypeScriptCompilation() {
    log.title("Testing TypeScript Compilation");

    const { exec } = require("child_process");

    return new Promise((resolve) => {
      exec("npx tsc --noEmit", (error, stdout, stderr) => {
        if (error) {
          log.error("TypeScript compilation failed");
          log.error(stderr);
          this.results.failed++;
        } else {
          log.success("TypeScript compilation passed");
          this.results.passed++;
        }
        resolve();
      });
    });
  }

  // Test de API endpoints
  async testAPIEndpoints() {
    log.title("Testing API Endpoints");

    const endpoints = [
      "/api/proxy/unidades-proyecto/geometry",
      "/api/proxy/unidades-proyecto/attributes",
      "/api/proxy/unidades-proyecto/filters",
      "/api/proxy/unidades-proyecto/dashboard",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`);
        if (response.ok) {
          log.success(
            `Endpoint ${endpoint} is accessible (${response.status})`
          );
          this.results.passed++;
        } else {
          log.error(`Endpoint ${endpoint} returned ${response.status}`);
          this.results.failed++;
        }
      } catch (error) {
        log.error(`Endpoint ${endpoint} failed: ${error.message}`);
        this.results.failed++;
      }
    }
  }

  // Test de rendimiento de API calls
  async testAPIPerformance() {
    log.title("Testing API Performance");

    const endpoint = "/api/proxy/unidades-proyecto/dashboard";
    const maxAcceptableTime = 500; // 500ms
    const testRuns = 5;

    let totalTime = 0;
    let successCount = 0;

    for (let i = 0; i < testRuns; i++) {
      const startTime = Date.now();
      try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`);
        const endTime = Date.now();
        const duration = endTime - startTime;
        totalTime += duration;

        if (response.ok) {
          successCount++;
          if (duration <= maxAcceptableTime) {
            log.success(`API call ${i + 1} completed in ${duration}ms`);
          } else {
            log.warning(
              `API call ${
                i + 1
              } slow: ${duration}ms (max: ${maxAcceptableTime}ms)`
            );
          }
        }
      } catch (error) {
        log.error(`API call ${i + 1} failed: ${error.message}`);
      }
    }

    const avgTime = totalTime / testRuns;
    if (avgTime <= maxAcceptableTime) {
      log.success(`Average API response time: ${avgTime.toFixed(2)}ms`);
      this.results.passed++;
    } else {
      log.warning(
        `Average API response time too high: ${avgTime.toFixed(2)}ms`
      );
      this.results.warnings++;
    }
  }

  // Test de schema validation
  async testSchemaValidation() {
    log.title("Testing Schema Validation");

    try {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/proxy/unidades-proyecto/dashboard`
      );
      const data = await response.json();

      // Verificar estructura esperada del dashboard
      const requiredFields = [
        "total_proyectos",
        "proyectos_por_estado",
        "proyectos_por_tipo",
        "presupuesto_total",
        "avance_promedio",
      ];

      let allFieldsPresent = true;
      for (const field of requiredFields) {
        if (data.hasOwnProperty(field)) {
          log.success(`Dashboard data contains required field: ${field}`);
        } else {
          log.error(`Dashboard data missing field: ${field}`);
          allFieldsPresent = false;
        }
      }

      if (allFieldsPresent) {
        this.results.passed++;
      } else {
        this.results.failed++;
      }
    } catch (error) {
      log.error(`Schema validation failed: ${error.message}`);
      this.results.failed++;
    }
  }

  // Test de Build
  async testBuild() {
    log.title("Testing Build Process");

    const { exec } = require("child_process");

    return new Promise((resolve) => {
      exec("npm run build", (error, stdout, stderr) => {
        if (error) {
          log.error("Build process failed");
          log.error(stderr);
          this.results.failed++;
        } else {
          log.success("Build process completed successfully");
          this.results.passed++;
        }
        resolve();
      });
    });
  }

  // Ejecutar todas las pruebas
  async runAllTests() {
    console.log(
      `${colors.bold}${colors.blue}🚀 Starting Unidades de Proyecto Test Suite${colors.reset}\n`
    );

    await this.testFileStructure();
    await this.testImportsExports();
    await this.testTypeScriptCompilation();
    await this.testAPIEndpoints();
    await this.testAPIPerformance();
    await this.testSchemaValidation();
    await this.testBuild();

    this.generateReport();
  }

  // Generar reporte final
  generateReport() {
    console.log(
      `\n${colors.bold}${colors.blue}📊 TEST RESULTS SUMMARY${colors.reset}`
    );
    console.log(
      `${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`
    );
    console.log(
      `${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`
    );
    console.log(
      `${colors.yellow}⚠️  Warnings: ${this.results.warnings}${colors.reset}`
    );

    const total =
      this.results.passed + this.results.failed + this.results.warnings;
    const successRate = ((this.results.passed / total) * 100).toFixed(2);

    console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}`);

    if (this.results.failed > 0) {
      console.log(
        `\n${colors.red}${colors.bold}❌ TESTS FAILED - Issues need to be addressed${colors.reset}`
      );
      process.exit(1);
    } else if (this.results.warnings > 0) {
      console.log(
        `\n${colors.yellow}${colors.bold}⚠️  TESTS PASSED WITH WARNINGS${colors.reset}`
      );
    } else {
      console.log(
        `\n${colors.green}${colors.bold}🎉 ALL TESTS PASSED${colors.reset}`
      );
    }
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  const tester = new UnidadesProyectoTester();
  tester.runAllTests().catch(console.error);
}

module.exports = UnidadesProyectoTester;

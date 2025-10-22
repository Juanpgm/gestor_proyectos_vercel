/**
 * Test para verificar endpoints de autenticación
 * Ejecutar con: node test-auth-endpoints.js
 */

const BASE_URL = "http://localhost:3000"; // Cambia por tu URL local o de producción

// Colores para output en consola
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test del endpoint de configuración de Firebase
async function testFirebaseConfig() {
  try {
    log("blue", "\n🔧 Testing Firebase Config endpoint...");

    const response = await fetch(`${BASE_URL}/api/proxy/auth/config`);
    const data = await response.json();

    if (response.ok) {
      log("green", "✅ Firebase Config OK");
      console.log("   Response:", data);

      // Verificar campos esperados
      if (data.projectId && data.authDomain) {
        log("green", "✅ Required fields present");
      } else {
        log("yellow", "⚠️  Some required fields missing");
      }
    } else {
      log("red", "❌ Firebase Config failed");
      console.log("   Error:", data);
    }
  } catch (error) {
    log("red", "❌ Firebase Config error: " + error.message);
  }
}

// Test del health check de registro
async function testRegisterHealthCheck() {
  try {
    log("blue", "\n🏥 Testing Register Health Check...");

    const response = await fetch(
      `${BASE_URL}/api/proxy/auth/register/health-check`
    );
    const data = await response.json();

    if (response.ok) {
      log("green", "✅ Register Health Check OK");
      console.log("   Status:", data.overall_status);
      console.log("   Environment:", data.environment);
      console.log(
        "   Firebase available:",
        data.configuration?.firebase_available
      );
      console.log(
        "   Service account:",
        data.configuration?.has_firebase_service_account
      );
    } else {
      log("red", "❌ Register Health Check failed");
      console.log("   Error:", data);
    }
  } catch (error) {
    log("red", "❌ Register Health Check error: " + error.message);
  }
}

// Test de validación de sesión (sin token, debería dar error)
async function testValidateSession() {
  try {
    log(
      "blue",
      "\n🔐 Testing Session Validation (should fail without token)..."
    );

    const response = await fetch(
      `${BASE_URL}/api/proxy/auth/validate-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (response.status === 401 || response.status === 400) {
      log("green", "✅ Session validation correctly rejects invalid request");
    } else if (response.ok) {
      log("yellow", "⚠️  Session validation passed unexpectedly");
      console.log("   Response:", data);
    } else {
      log("red", "❌ Session validation unexpected error");
      console.log("   Status:", response.status);
      console.log("   Error:", data);
    }
  } catch (error) {
    log("red", "❌ Session validation error: " + error.message);
  }
}

// Test de login (con credenciales inválidas, debería dar error)
async function testLogin() {
  try {
    log("blue", "\n🔑 Testing Login (should fail with invalid credentials)...");

    const response = await fetch(`${BASE_URL}/api/proxy/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "invalidpassword",
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      log("green", "✅ Login correctly rejects invalid credentials");
    } else if (response.status === 400 || response.status === 422) {
      log("green", "✅ Login correctly validates input");
      console.log("   Validation error:", data.message || data.error);
    } else if (response.ok) {
      log("yellow", "⚠️  Login passed unexpectedly");
      console.log("   Response:", data);
    } else {
      log("red", "❌ Login unexpected error");
      console.log("   Status:", response.status);
      console.log("   Error:", data);
    }
  } catch (error) {
    log("red", "❌ Login error: " + error.message);
  }
}

// Test de registro (con datos inválidos, debería dar error de validación)
async function testRegister() {
  try {
    log("blue", "\n📝 Testing Register (should fail with invalid data)...");

    const response = await fetch(`${BASE_URL}/api/proxy/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "invalid-email",
        password: "123", // Too short
        confirmPassword: "456", // Doesn't match
        name: "",
        cellphone: "",
        nombre_centro_gestor: "",
      }),
    });

    const data = await response.json();

    if (response.status === 422 || response.status === 400) {
      log("green", "✅ Register correctly validates input");
      console.log("   Validation errors detected");
    } else if (response.ok) {
      log("yellow", "⚠️  Register passed unexpectedly");
      console.log("   Response:", data);
    } else {
      log("red", "❌ Register unexpected error");
      console.log("   Status:", response.status);
      console.log("   Error:", data);
    }
  } catch (error) {
    log("red", "❌ Register error: " + error.message);
  }
}

// Test endpoints de unidades de proyecto
async function testUnidadesProyectoFilters() {
  try {
    log("blue", "\n📊 Testing Unidades de Proyecto Filters...");

    const response = await fetch(
      `${BASE_URL}/api/proxy/unidades-proyecto/filters`
    );
    const data = await response.json();

    if (response.ok) {
      log("green", "✅ Unidades Proyecto Filters OK");

      // Verificar que tiene los filtros esperados
      const expectedFilters = [
        "estados",
        "tipos_intervencion",
        "centros_gestores",
      ];
      const hasFilters = data.filters || data;

      expectedFilters.forEach((filter) => {
        if (hasFilters[filter] && Array.isArray(hasFilters[filter])) {
          log("green", `   ✅ ${filter}: ${hasFilters[filter].length} items`);
        } else {
          log("yellow", `   ⚠️  ${filter}: missing or invalid`);
        }
      });
    } else {
      log("red", "❌ Unidades Proyecto Filters failed");
      console.log("   Error:", data);
    }
  } catch (error) {
    log("red", "❌ Unidades Proyecto Filters error: " + error.message);
  }
}

// Test geometry endpoint con estructura completa
async function testUnidadesProyectoGeometry() {
  try {
    log("blue", "\n�️  Testing Unidades de Proyecto Geometry...");

    const response = await fetch(
      `${BASE_URL}/api/proxy/unidades-proyecto/geometry?limit=3`
    );
    const data = await response.json();

    if (response.ok) {
      log("green", `✅ Unidades Proyecto Geometry OK`);

      // Verificar estructura GeoJSON
      if (data.type === "FeatureCollection") {
        log("green", `   ✅ Valid GeoJSON FeatureCollection`);
        log("green", `   ✅ Features: ${data.features?.length || 0} items`);

        if (data.features && data.features.length > 0) {
          const firstFeature = data.features[0];
          log(
            "green",
            `   ✅ Sample feature UPID: ${firstFeature.properties?.upid}`
          );
          log("green", `   ✅ Geometry type: ${firstFeature.geometry?.type}`);
          log(
            "green",
            `   ✅ Has coordinates: ${!!firstFeature.geometry?.coordinates}`
          );
          log(
            "green",
            `   ✅ Valid geometry: ${firstFeature.properties?.has_valid_geometry}`
          );
        }

        // Verificar metadatos
        if (data.properties) {
          log(
            "green",
            `   ✅ Has metadata: success=${data.properties.success}, count=${data.properties.count}`
          );
        }
      } else {
        log(
          "yellow",
          `   ⚠️  Not a valid GeoJSON FeatureCollection: ${data.type}`
        );
      }
    } else {
      log("red", "❌ Unidades Proyecto Geometry failed");
      console.log("   Error:", data);
    }
  } catch (error) {
    log("red", "❌ Unidades Proyecto Geometry error: " + error.message);
  }
}

// Test geometry endpoint con estructura completa
async function testUnidadesProyectoGeometry() {
  try {
    log("blue", "\n🗺️  Testing Unidades de Proyecto Geometry...");

    const response = await fetch(
      `${BASE_URL}/api/proxy/unidades-proyecto/geometry?limit=3`
    );
    const data = await response.json();

    if (response.ok) {
      log("green", `✅ Unidades Proyecto Geometry OK`);

      // Verificar estructura GeoJSON
      if (data.type === "FeatureCollection") {
        log("green", `   ✅ Valid GeoJSON FeatureCollection`);
        log("green", `   ✅ Features: ${data.features?.length || 0} items`);

        if (data.features && data.features.length > 0) {
          const firstFeature = data.features[0];
          log(
            "green",
            `   ✅ Sample feature UPID: ${firstFeature.properties?.upid}`
          );
          log("green", `   ✅ Geometry type: ${firstFeature.geometry?.type}`);
          log(
            "green",
            `   ✅ Has coordinates: ${!!firstFeature.geometry?.coordinates}`
          );
          log(
            "green",
            `   ✅ Valid geometry: ${firstFeature.properties?.has_valid_geometry}`
          );
        }

        // Verificar metadatos
        if (data.properties) {
          log(
            "green",
            `   ✅ Has metadata: success=${data.properties.success}, count=${data.properties.count}`
          );
        }
      } else {
        log(
          "yellow",
          `   ⚠️  Not a valid GeoJSON FeatureCollection: ${data.type}`
        );
      }
    } else {
      log("red", "❌ Unidades Proyecto Geometry failed");
      console.log("   Error:", data);
    }
  } catch (error) {
    log("red", "❌ Unidades Proyecto Geometry error: " + error.message);
  }
}

// Función principal
async function runTests() {
  log("blue", "🚀 Starting API Endpoint Tests...");
  log("blue", `Testing against: ${BASE_URL}`);

  // Tests de autenticación
  await testFirebaseConfig();
  await testRegisterHealthCheck();
  await testValidateSession();
  await testLogin();
  await testRegister();

  // Tests de unidades de proyecto
  await testUnidadesProyectoFilters();
  await testUnidadesProyectoAttributes();
  await testUnidadesProyectoGeometry();

  log("blue", "\n🏁 Tests completed!");
  log(
    "yellow",
    "\nNOTE: Some tests are expected to fail (like login with invalid credentials)"
  );
  log(
    "yellow",
    "Green checkmarks indicate the endpoints are working correctly."
  );
}

// Verificar si se está ejecutando directamente
if (require.main === module) {
  runTests().catch((error) => {
    log("red", "❌ Test runner error: " + error.message);
    process.exit(1);
  });
}

module.exports = { runTests };

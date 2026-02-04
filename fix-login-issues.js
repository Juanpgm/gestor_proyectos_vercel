#!/usr/bin/env node

/**
 * Corrección automática de problemas de login en Next.js
 */

const fs = require("fs");
const path = require("path");

console.log("🔧 APLICANDO CORRECCIONES AUTOMÁTICAS");
console.log("=".repeat(40));

let fixes = 0;

// 1. Verificar y corregir firebase.ts
console.log("\n1. 🔥 Corrigiendo firebase.ts...");

const firebasePath = path.join(__dirname, "src", "lib", "firebase.ts");
if (fs.existsSync(firebasePath)) {
  let firebaseContent = fs.readFileSync(firebasePath, "utf8");

  // Verificar si usa dummy values
  if (firebaseContent.includes("dummy-key")) {
    console.log("⚠️ Valores dummy encontrados, actualizando...");

    // Reemplazar configuración dummy por configuración real
    const newFirebaseConfig = `const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
};

// Verificar que las variables de entorno estén configuradas
const hasRealConfig = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);`;

    // Buscar y reemplazar la configuración existente
    const configRegex =
      /const firebaseConfig = \{[\s\S]*?\};[\s\S]*?const hasRealConfig = !!\([^)]*\);/;

    if (configRegex.test(firebaseContent)) {
      firebaseContent = firebaseContent.replace(configRegex, newFirebaseConfig);
      fs.writeFileSync(firebasePath, firebaseContent);
      console.log("✅ firebase.ts actualizado");
      fixes++;
    }
  } else {
    console.log("✅ firebase.ts ya está correcto");
  }
} else {
  console.log("❌ firebase.ts no encontrado");
}

// 2. Verificar inicialización de Firebase más robusta
console.log("\n2. 🔥 Verificando inicialización robusta...");

if (fs.existsSync(firebasePath)) {
  let firebaseContent = fs.readFileSync(firebasePath, "utf8");

  // Mejorar la lógica de inicialización
  if (
    !firebaseContent.includes(
      "Firebase initialization with improved error handling",
    )
  ) {
    const improvedInit = `
// Firebase initialization with improved error handling
if (!hasRealConfig) {
  console.warn('⚠️ Firebase: Configuración incompleta detectada');
  console.warn('Variables faltantes:', {
    apiKey: !process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: !process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  });
}`;

    // Insertar después de hasRealConfig
    firebaseContent = firebaseContent.replace(
      /const hasRealConfig = !!\([^)]*\);/,
      (match) => match + improvedInit,
    );

    fs.writeFileSync(firebasePath, firebaseContent);
    console.log("✅ Inicialización mejorada agregada");
    fixes++;
  } else {
    console.log("✅ Inicialización ya está mejorada");
  }
}

// 3. Crear test de login automático
console.log("\n3. 🧪 Creando test de login automático...");

const testLoginPath = path.join(__dirname, "test-login-auto.js");
const testLoginContent = `#!/usr/bin/env node

/**
 * Test automático de login
 */

const https = require('https');

async function testLogin() {
    console.log('🧪 Iniciando test de login automático...');
    
    // Test 1: Backend directo
    console.log('\\n1. 🌐 Testing backend directo...');
    try {
        const loginData = JSON.stringify({
            email: 'testuser@cali.gov.co',
            password: 'TestPass123!!'
        });
        
        const options = {
            hostname: 'gestorproyectoapi-production.up.railway.app',
            port: 443,
            path: '/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(\`Status: \${res.statusCode}\`);
                if (res.statusCode === 200) {
                    console.log('✅ Backend login: ÉXITO');
                    const response = JSON.parse(data);
                    console.log('Usuario:', response.user?.email);
                } else {
                    console.log('❌ Backend login: FALLO');
                    console.log('Error:', data);
                }
                
                testLocalProxy();
            });
        });
        
        req.on('error', (err) => {
            console.log('❌ Error de conexión:', err.message);
            testLocalProxy();
        });
        
        req.write(loginData);
        req.end();
    } catch (error) {
        console.log('❌ Error en test backend:', error.message);
        testLocalProxy();
    }
}

async function testLocalProxy() {
    console.log('\\n2. 🔗 Testing proxy local...');
    
    const http = require('http');
    
    try {
        const loginData = JSON.stringify({
            email: 'testuser@cali.gov.co',
            password: 'TestPass123!!'
        });
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/proxy/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(\`Status: \${res.statusCode}\`);
                if (res.statusCode === 200) {
                    console.log('✅ Proxy local: ÉXITO');
                } else {
                    console.log('❌ Proxy local: FALLO');
                    console.log('Error:', data);
                }
                
                console.log('\\n📋 RESUMEN DEL TEST:');
                console.log('- Backend directo: Verificar arriba');
                console.log('- Proxy local: Verificar arriba');
                console.log('\\n🎯 SIGUIENTE PASO:');
                console.log('Abrir: http://localhost:3000/test-clean-login.html');
                console.log('Email: testuser@cali.gov.co');
                console.log('Password: TestPass123!!');
            });
        });
        
        req.on('error', (err) => {
            console.log('❌ Error de proxy:', err.message);
            console.log('💡 Asegurar que el servidor Next.js esté corriendo: npm run dev');
        });
        
        req.write(loginData);
        req.end();
    } catch (error) {
        console.log('❌ Error en test proxy:', error.message);
    }
}

testLogin();`;

fs.writeFileSync(testLoginPath, testLoginContent);
console.log("✅ Test automático creado: test-login-auto.js");
fixes++;

// 4. Resultado
console.log(`\n🎉 CORRECCIONES APLICADAS: ${fixes}`);
console.log("\n🚀 PASOS SIGUIENTES:");
console.log("1. Reiniciar servidor: npm run dev");
console.log("2. Ejecutar test: node test-login-auto.js");
console.log("3. Probar frontend: http://localhost:3000/test-clean-login.html");

console.log("\n✅ Correcciones completadas exitosamente");

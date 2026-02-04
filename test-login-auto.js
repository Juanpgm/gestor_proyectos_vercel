#!/usr/bin/env node

/**
 * Test automático de login
 */

const https = require('https');

async function testLogin() {
    console.log('🧪 Iniciando test de login automático...');
    
    // Test 1: Backend directo
    console.log('\n1. 🌐 Testing backend directo...');
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
                console.log(`Status: ${res.statusCode}`);
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
    console.log('\n2. 🔗 Testing proxy local...');
    
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
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log('✅ Proxy local: ÉXITO');
                } else {
                    console.log('❌ Proxy local: FALLO');
                    console.log('Error:', data);
                }
                
                console.log('\n📋 RESUMEN DEL TEST:');
                console.log('- Backend directo: Verificar arriba');
                console.log('- Proxy local: Verificar arriba');
                console.log('\n🎯 SIGUIENTE PASO:');
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

testLogin();
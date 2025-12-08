# Script para limpiar sesión y hacer login
# Este script abre el navegador con el test de login

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Test de Login con Limpieza de Sesión                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar si el servidor está corriendo
Write-Host "🔍 Verificando servidor local..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Servidor corriendo en http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ El servidor no está corriendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, inicia el servidor primero:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "🚀 Abriendo test en el navegador..." -ForegroundColor Yellow
Write-Host ""

# Abrir el navegador con el test
$url = "http://localhost:3000/test-clean-login.html"
Start-Process $url

Write-Host "✅ Test abierto en: $url" -ForegroundColor Green
Write-Host ""
Write-Host "Instrucciones:" -ForegroundColor Cyan
Write-Host "  1. Ingresa tu email y contraseña" -ForegroundColor White
Write-Host "  2. Haz click en 'Limpiar Sesión y Hacer Login'" -ForegroundColor White
Write-Host "  3. Verifica que el token JWT se haya guardado correctamente" -ForegroundColor White
Write-Host "  4. Si todo funciona, prueba asignar roles en el panel de admin" -ForegroundColor White
Write-Host ""
Write-Host "Archivos de prueba disponibles:" -ForegroundColor Cyan
Write-Host "  • http://localhost:3000/test-clean-login.html" -ForegroundColor White
Write-Host "  • http://localhost:3000/test-roles-assignment.html" -ForegroundColor White
Write-Host ""

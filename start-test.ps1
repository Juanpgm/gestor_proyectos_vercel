# Script para iniciar el servidor y ejecutar el test

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Iniciar Servidor y Test de Login                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del proyecto
Set-Location "a:\programing_workspace\gestor_proyectos_vercel"

Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Yellow
Write-Host ""
Write-Host "El servidor se iniciará en segundo plano." -ForegroundColor Gray
Write-Host "Espera unos segundos hasta que esté listo..." -ForegroundColor Gray
Write-Host ""

# Iniciar el servidor en segundo plano
$job = Start-Job -ScriptBlock {
    Set-Location "a:\programing_workspace\gestor_proyectos_vercel"
    npm run dev
}

Write-Host "⏳ Esperando que el servidor esté listo..." -ForegroundColor Yellow

# Esperar hasta que el servidor responda
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
        }
    } catch {
        # Ignorar errores
    }
    $attempt++
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""

if ($serverReady) {
    Write-Host "✅ Servidor listo en http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Abriendo test en el navegador..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    
    # Abrir el navegador
    Start-Process "http://localhost:3000/test-clean-login.html"
    
    Write-Host "✅ Test abierto en el navegador" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "INSTRUCCIONES:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. 📧 Ingresa tu email y contraseña de administrador" -ForegroundColor White
    Write-Host "2. 🚀 Haz click en 'Limpiar Sesión y Hacer Login'" -ForegroundColor White
    Write-Host "3. ✅ Verifica que el test pase todos los pasos:" -ForegroundColor White
    Write-Host "   • Limpiar sesión" -ForegroundColor Gray
    Write-Host "   • Hacer login" -ForegroundColor Gray
    Write-Host "   • Verificar sesión guardada" -ForegroundColor Gray
    Write-Host "   • Probar API call" -ForegroundColor Gray
    Write-Host "4. 🔍 Verifica que 'Tiene idToken: ✅ Sí'" -ForegroundColor White
    Write-Host "5. 🎉 Si todo está OK, prueba asignar roles" -ForegroundColor White
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Archivos de prueba disponibles:" -ForegroundColor Yellow
    Write-Host "  • http://localhost:3000/test-clean-login.html" -ForegroundColor Cyan
    Write-Host "  • http://localhost:3000/test-roles-assignment.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Para detener el servidor, cierra esta ventana o presiona Ctrl+C" -ForegroundColor Yellow
    Write-Host ""
    
    # Mantener el script corriendo y mostrar logs del servidor
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "LOGS DEL SERVIDOR:" -ForegroundColor Gray
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    # Recibir y mostrar logs del job
    while ($job.State -eq 'Running') {
        $output = Receive-Job $job -ErrorAction SilentlyContinue
        if ($output) {
            Write-Host $output
        }
        Start-Sleep -Milliseconds 100
    }
    
} else {
    Write-Host "❌ El servidor no pudo iniciarse después de 30 segundos" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta iniciar manualmente:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Cyan
    Write-Host ""
    
    # Detener el job
    Stop-Job $job
    Remove-Job $job
}

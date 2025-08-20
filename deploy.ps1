# Script de deploy para Vercel - Dashboard Alcaldía Cali
# PowerShell version para Windows

Write-Host "🚀 Iniciando proceso de deploy a Vercel..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Verificar que Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado. Instala Node.js desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias." -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Ejecutando build de prueba..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build. Revisa los errores antes de hacer deploy." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build exitoso!" -ForegroundColor Green

# Verificar si Vercel CLI está instalado
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI detectado: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "📥 Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando Vercel CLI." -ForegroundColor Red
        exit 1
    }
}

Write-Host "🌐 Ejecutando deploy a Vercel..." -ForegroundColor Yellow
Write-Host "💡 Asegúrate de estar logueado en Vercel (vercel login)" -ForegroundColor Cyan

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy completado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Tu aplicación está desplegada en Vercel." -ForegroundColor Green
    Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
    Write-Host "  - vercel --logs: Ver logs del deployment" -ForegroundColor White
    Write-Host "  - vercel domains: Gestionar dominios" -ForegroundColor White
    Write-Host "  - vercel env: Gestionar variables de entorno" -ForegroundColor White
    Write-Host "  - vercel inspect [url]: Inspeccionar deployment" -ForegroundColor White
} else {
    Write-Host "❌ Error en el deploy. Revisa los logs." -ForegroundColor Red
    exit 1
}

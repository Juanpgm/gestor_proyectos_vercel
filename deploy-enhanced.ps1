#!/usr/bin/env pwsh

# Script de deploy con verificación de entorno
# Asegura que la configuración sea consistente entre desarrollo y producción

param(
    [string]$Environment = "production",
    [switch]$VerifyOnly = $false,
    [switch]$Verbose = $false
)

Write-Host "🚀 Deploy Script - Dashboard Alcaldía Cali" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Función para logging
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    if ($Verbose) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
    }
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Ejecuta desde el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

Write-Log "Verificando estructura del proyecto..." "Cyan"

# Verificar archivos de configuración esenciales
$requiredFiles = @(
    "src/config/environment.ts",
    "src/utils/assets.ts",
    "src/hooks/useAppState.ts",
    "src/components/AppProvider.tsx",
    ".env.$Environment"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Archivos de configuración faltantes:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    exit 1
}

Write-Log "Archivos de configuración verificados ✓" "Green"

# Verificar variables de entorno
Write-Log "Verificando variables de entorno..." "Cyan"

$envFile = ".env.$Environment"
if (Test-Path $envFile) {
    Write-Log "Archivo de entorno encontrado: $envFile ✓" "Green"
    
    # Leer y validar variables críticas
    $envContent = Get-Content $envFile
    $requiredVars = @(
        "NODE_ENV",
        "NEXT_PUBLIC_APP_ENV",
        "NEXT_PUBLIC_BASE_URL",
        "NEXT_PUBLIC_API_BASE_URL"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        $found = $envContent | Where-Object { $_ -match "^$var=" }
        if (-not $found) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "❌ Variables de entorno faltantes en $envFile:" -ForegroundColor Red
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Red
        }
        exit 1
    }
    
    Write-Log "Variables de entorno validadas ✓" "Green"
} else {
    Write-Host "⚠️ Advertencia: No se encontró $envFile" -ForegroundColor Yellow
}

# Verificar consistencia de TypeScript
Write-Log "Verificando TypeScript..." "Cyan"

try {
    $tsCheckResult = npm run type-check 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Errores de TypeScript encontrados:" -ForegroundColor Red
        Write-Host $tsCheckResult -ForegroundColor Red
        
        if ($Environment -eq "production") {
            Write-Host "❌ No se puede continuar con errores de TypeScript en producción." -ForegroundColor Red
            exit 1
        } else {
            Write-Host "⚠️ Continuando con advertencias de TypeScript en desarrollo..." -ForegroundColor Yellow
        }
    } else {
        Write-Log "TypeScript verificado ✓" "Green"
    }
} catch {
    Write-Host "⚠️ No se pudo ejecutar verificación de TypeScript" -ForegroundColor Yellow
}

# Si solo verificación, terminar aquí
if ($VerifyOnly) {
    Write-Host "✅ Verificación completada exitosamente" -ForegroundColor Green
    exit 0
}

# Limpiar cache antes del build
Write-Log "Limpiando cache..." "Cyan"
try {
    if (Test-Path ".next") {
        npm run clean 2>$null
        Write-Log "Cache limpiado ✓" "Green"
    }
} catch {
    Write-Host "⚠️ No se pudo limpiar el cache, continuando..." -ForegroundColor Yellow
}

# Build según el entorno
Write-Log "Iniciando build para $Environment..." "Cyan"

$buildCommand = switch ($Environment) {
    "development" { "npm run build:dev" }
    "production" { "npm run build:vercel" }
    default { "npm run build" }
}

Write-Host "🔨 Ejecutando: $buildCommand" -ForegroundColor Blue

try {
    Invoke-Expression $buildCommand
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en el build" -ForegroundColor Red
        exit 1
    }
    Write-Log "Build completado ✓" "Green"
} catch {
    Write-Host "❌ Error ejecutando build: $_" -ForegroundColor Red
    exit 1
}

# Verificar que el build se completó correctamente
if (-not (Test-Path ".next")) {
    Write-Host "❌ Error: No se generó el directorio .next" -ForegroundColor Red
    exit 1
}

Write-Log "Verificando archivos de build..." "Cyan"

$buildFiles = @(
    ".next/server",
    ".next/static"
)

foreach ($file in $buildFiles) {
    if (Test-Path $file) {
        Write-Log "$file ✓" "Green"
    } else {
        Write-Host "⚠️ $file no encontrado" -ForegroundColor Yellow
    }
}

# Mostrar información del build
Write-Host "`n📊 Información del Build:" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

if (Test-Path ".next/BUILD_ID") {
    $buildId = Get-Content ".next/BUILD_ID"
    Write-Host "Build ID: $buildId" -ForegroundColor White
}

# Deploy a Vercel si es producción
if ($Environment -eq "production") {
    Write-Host "`n🚀 ¿Desplegar a Vercel? (y/N): " -ForegroundColor Yellow -NoNewline
    $deploy = Read-Host
    
    if ($deploy -eq "y" -or $deploy -eq "Y") {
        Write-Log "Desplegando a Vercel..." "Cyan"
        try {
            vercel --prod
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Deploy a producción completado" -ForegroundColor Green
            } else {
                Write-Host "❌ Error en deploy a producción" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "❌ Error ejecutando vercel: $_" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "`n✅ Script completado exitosamente!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Para preview local: npm run preview" -ForegroundColor White
Write-Host "  - Para desarrollo: npm run dev" -ForegroundColor White
if ($Environment -eq "development") {
    Write-Host "  - Para producción: .\deploy.ps1 -Environment production" -ForegroundColor White
}
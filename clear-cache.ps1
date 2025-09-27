#!/usr/bin/env pwsh
# Script para limpiar todos los cachés del proyecto Next.js

Write-Host "🧹 Iniciando limpieza de caché..." -ForegroundColor Cyan

# Limpiar caché de Next.js
Write-Host "📁 Eliminando directorio .next..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Limpiar caché de npm
Write-Host "📦 Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null

# Limpiar otros directorios de caché comunes
Write-Host "🗑️  Eliminando otros cachés..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
Remove-Item -Force "*.tsbuildinfo" -ErrorAction SilentlyContinue

# Limpiar caché de TypeScript si existe
Write-Host "📝 Limpiando archivos TypeScript temporales..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Name "*.tsbuildinfo" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Limpiar archivos temporales del sistema
Write-Host "🧽 Limpiando archivos temporales del sistema..." -ForegroundColor Yellow
Remove-Item -Force ".DS_Store" -ErrorAction SilentlyContinue
Get-ChildItem -Recurse -Name ".DS_Store" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Remove-Item -Force "Thumbs.db" -ErrorAction SilentlyContinue
Get-ChildItem -Recurse -Name "Thumbs.db" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "✅ Limpieza de caché completada!" -ForegroundColor Green
Write-Host "💡 Ahora puedes ejecutar 'npm run dev' o 'npm run build' para un nuevo inicio limpio." -ForegroundColor Blue
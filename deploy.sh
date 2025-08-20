#!/bin/bash

# Script de deploy para Vercel - Dashboard Alcaldía Cali
# Este script automatiza el proceso de deploy a Vercel

echo "🚀 Iniciando proceso de deploy a Vercel..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que Next.js está instalado
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx no está disponible. Instala Node.js y npm."
    exit 1
fi

echo "📦 Instalando dependencias..."
npm install --legacy-peer-deps

echo "🔧 Ejecutando build de prueba..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build. Revisa los errores antes de hacer deploy."
    exit 1
fi

echo "✅ Build exitoso!"

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📥 Instalando Vercel CLI..."
    npm install -g vercel
fi

echo "🌐 Ejecutando deploy a Vercel..."
vercel --prod

echo "✅ Deploy completado!"
echo ""
echo "🎉 Tu aplicación está desplegada en Vercel."
echo "📝 Comandos útiles:"
echo "  - vercel --logs: Ver logs del deployment"
echo "  - vercel domains: Gestionar dominios"
echo "  - vercel env: Gestionar variables de entorno"

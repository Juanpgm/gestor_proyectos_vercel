#!/bin/bash
# Script para Vercel: ignora builds de producción que no sean del propietario
# Se configura en vercel.json como "ignoreCommand"
#
# Vercel ejecuta este script para decidir si debe hacer build:
# - Exit code 0 = NO hacer build (ignorar)
# - Exit code 1 = SÍ hacer build (continuar)

echo "🔍 Verificando permisos de deploy..."

# En preview (ramas != master), siempre permitir builds
BRANCH_NAME="${VERCEL_GIT_COMMIT_REF}"
if [ "$BRANCH_NAME" != "master" ]; then
  echo "✅ Build de preview permitido para rama: $BRANCH_NAME"
  exit 1  # Continuar build
fi

# Para producción (master), verificar autor del commit
COMMIT_AUTHOR="${VERCEL_GIT_COMMIT_AUTHOR_LOGIN}"
ALLOWED_USER="juanpgm"

echo "Rama: $BRANCH_NAME"
echo "Autor del commit: $COMMIT_AUTHOR"

# Comparacion case-insensitive para evitar fallos por capitalización
if [ "${COMMIT_AUTHOR,,}" != "${ALLOWED_USER,,}" ]; then
  echo "❌ Build de producción bloqueado."
  echo "Solo $ALLOWED_USER puede hacer deploy a producción."
  echo "Autor del commit: $COMMIT_AUTHOR"
  exit 0  # Ignorar build
fi

echo "✅ Deploy de producción autorizado para $ALLOWED_USER"
exit 1  # Continuar build

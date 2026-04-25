# ============================================================
# setup-vercel-secrets.ps1
# Configura los GitHub Secrets necesarios para el CI/CD de Vercel
# Uso: .\setup-vercel-secrets.ps1 -VercelToken "tu_token_aqui" -GhToken "tu_gh_token"
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$VercelToken,
    
    [Parameter(Mandatory=$false)]
    [string]$GhToken = ""
)

$REPO = "Juanpgm/gestor_proyectos_vercel"
$VERCEL_PROJECT_ID = "prj_cgN6j6t6SBf6hAP9IOScdxcwWG9l"
$VERCEL_ORG_ID = "team_SzZM9UUotBq10Z80gIsZpAzv"
$DEV_API_URL = "https://gestorproyectoapi-dev.up.railway.app"

Write-Host "Configurando GitHub Secrets para $REPO..." -ForegroundColor Cyan

if ($GhToken) {
    $env:GH_TOKEN = $GhToken
}

$secrets = @{
    "VERCEL_TOKEN"                  = $VercelToken
    "VERCEL_PROJECT_ID"             = $VERCEL_PROJECT_ID
    "VERCEL_ORG_ID"                 = $VERCEL_ORG_ID
    "NEXT_PUBLIC_API_BASE_URL_DEV"  = $DEV_API_URL
}

foreach ($key in $secrets.Keys) {
    Write-Host "Setting $key..." -NoNewline
    $val = $secrets[$key]
    echo $val | gh secret set $key --repo $REPO 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
    }
}

Write-Host "`nDone. Ahora pushea a la rama 'dev' para disparar el deploy automatico:" -ForegroundColor Green
Write-Host "  git push origin dev" -ForegroundColor Yellow
Write-Host "`nO despliega manualmente desde front/:" -ForegroundColor Green
Write-Host "  vercel --token=$VercelToken --yes" -ForegroundColor Yellow

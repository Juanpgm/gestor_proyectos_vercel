# 🚀 Deploy Rápido - Dashboard Alcaldía Cali

## Opción 1: Deploy Automático (Recomendado)

1. **Push a GitHub:**
   ```bash
   git add .
   git commit -m "feat: dashboard ready for production"
   git push origin main
   ```

2. **Conectar en Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - "New Project" → Importar tu repo
   - Deploy automático ✅

## Opción 2: Deploy Manual

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
npm run deploy
```

## Opción 3: Script Automatizado

```bash
# Windows PowerShell
.\deploy.ps1

# Linux/Mac
chmod +x deploy.sh && ./deploy.sh
```

## ✅ Verificación Rápida

Después del deploy, verifica:

- [ ] Página principal carga
- [ ] Mapas funcionan
- [ ] Datos GeoJSON cargan
- [ ] Responsive design OK

## 🔧 Variables de Entorno Mínimas

En Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_APP_NAME=Dashboard Alcaldía Cali
NEXT_PUBLIC_DEFAULT_LATITUDE=3.4516
NEXT_PUBLIC_DEFAULT_LONGITUDE=-76.5320
NODE_ENV=production
```

---

**¡Listo en menos de 5 minutos! 🎉**

Para más detalles, consulta [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md)

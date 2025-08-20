# 🚀 Guía de Deploy en Vercel - Dashboard Alcaldía Cali

Esta guía te llevará paso a paso para desplegar el Dashboard Alcaldía Cali en Vercel.

## ✅ Pre-requisitos

- [x] Node.js 18+ instalado
- [x] Cuenta en [Vercel](https://vercel.com)
- [x] Código del proyecto actualizado
- [x] Build exitoso (`npm run build`)

## 🛠️ Métodos de Deploy

### Método 1: Deploy Automático con Git (Recomendado)

1. **Conectar repositorio a Vercel:**

   ```bash
   # 1. Ve a vercel.com y haz login
   # 2. Click en "New Project"
   # 3. Importa tu repositorio GitHub
   # 4. Vercel detectará automáticamente que es un proyecto Next.js
   ```

2. **Configurar variables de entorno en Vercel:**

   - Ve a tu proyecto en Vercel Dashboard
   - Settings → Environment Variables
   - Agrega las siguientes variables:

   ```
   NEXT_PUBLIC_APP_NAME=Dashboard Alcaldía Cali
   NEXT_PUBLIC_APP_VERSION=1.0.0
   NEXT_PUBLIC_DEFAULT_LATITUDE=3.4516
   NEXT_PUBLIC_DEFAULT_LONGITUDE=-76.5320
   NEXT_PUBLIC_DEFAULT_ZOOM=11
   NODE_ENV=production
   ```

3. **Deploy automático:**
   - Cada push a la rama `main` desplegará automáticamente
   - Los PRs crearán preview deployments

### Método 2: Deploy Manual con Vercel CLI

1. **Instalar Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Login en Vercel:**

   ```bash
   vercel login
   ```

3. **Deploy inicial:**

   ```bash
   cd dashboard-alcaldia-cali
   vercel
   ```

4. **Deploy a producción:**
   ```bash
   vercel --prod
   ```

### Método 3: Script Automatizado

Usa el script incluido en el proyecto:

```bash
# En Windows (PowerShell)
./deploy.ps1

# En Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ Configuraciones Importantes

### 1. Archivos de Configuración

| Archivo          | Descripción                         |
| ---------------- | ----------------------------------- |
| `vercel.json`    | Configuración específica de Vercel  |
| `next.config.js` | Configuración de Next.js optimizada |
| `.env.example`   | Template de variables de entorno    |
| `.gitignore`     | Archivos excluidos del repositorio  |

### 2. Optimizaciones Incluidas

- ✅ **Caching agresivo** para archivos estáticos (geodata, leaflet)
- ✅ **Headers de seguridad** (CSP, XSS Protection, etc.)
- ✅ **Compresión** habilitada
- ✅ **Tree shaking** para reducir bundle size
- ✅ **Dynamic imports** para cargar mapas solo cuando se necesiten

### 3. Estructura de Archivos Públicos

```
public/
├── data/                    # Datos JSON (cacheados 1 hora)
│   ├── unidades_proyecto/   # GeoJSON de unidades de proyecto
│   └── atributos/          # Datos tabulares
├── geodata/                # Datos geográficos (cacheados 24 horas)
│   ├── comunas.geojson
│   ├── barrios.geojson
│   └── ...
└── leaflet/                # Assets de Leaflet (cacheados 24 horas)
    ├── marker-icon.png
    └── ...
```

## 🔧 Configuración de Variables de Entorno

### Variables Requeridas

```bash
# Configuración básica
NEXT_PUBLIC_APP_NAME="Dashboard Alcaldía Cali"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Configuración del mapa
NEXT_PUBLIC_DEFAULT_LATITUDE=3.4516
NEXT_PUBLIC_DEFAULT_LONGITUDE=-76.5320
NEXT_PUBLIC_DEFAULT_ZOOM=11

# Entorno
NODE_ENV=production
```

### Variables Opcionales

```bash
# Mapbox (para Kepler.gl si se usa)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# API externa (si se implementa)
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
```

## 📊 Métricas de Performance

El build optimizado incluye:

- **Bundle size total**: ~272 kB
- **First Load JS**: 87.5 kB shared
- **Página principal**: 181 kB
- **Lighthouse Score**: 90+ (objetivo)

## 🔍 Verificación Post-Deploy

### 1. Funcionalidades a Verificar

- [ ] **Página principal** se carga correctamente
- [ ] **Mapas interactivos** funcionan sin errores
- [ ] **Datos GeoJSON** se cargan desde `/data/`
- [ ] **Filtros** funcionan correctamente
- [ ] **Responsive design** se ve bien en móvil
- [ ] **Dark mode** funciona

### 2. Comandos de Verificación

```bash
# Ver logs en tiempo real
vercel logs

# Ver información del deployment
vercel inspect [deployment-url]

# Listar todos los deployments
vercel list

# Ver dominios configurados
vercel domains list
```

### 3. URLs de Prueba

Después del deploy, verifica estas rutas:

- `https://tu-app.vercel.app/` - Página principal
- `https://tu-app.vercel.app/data/unidades_proyecto/equipamientos.geojson` - API de datos
- `https://tu-app.vercel.app/geodata/comunas.geojson` - Datos geográficos

## 🔒 Configuración de Dominio Personalizado

1. **En Vercel Dashboard:**

   - Ve a tu proyecto → Settings → Domains
   - Agrega tu dominio personalizado
   - Configura DNS según las instrucciones

2. **Configuración DNS:**
   ```
   Type: CNAME
   Name: www (o subdominio deseado)
   Value: cname.vercel-dns.com
   ```

## 🚨 Solución de Problemas Comunes

### Build Fails

```bash
# Error: Module not found
npm install --legacy-peer-deps

# Error: Memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Runtime Errors

```bash
# Error de hidratación SSR
# Verificar que no hay useEffect sin dependencias
# Verificar dynamic imports para componentes de mapa

# Error 404 en datos
# Verificar que los archivos están en public/
# Verificar las rutas en fetch()
```

### Performance Issues

```bash
# Bundle muy grande
# Verificar dynamic imports
# Usar React.lazy() para componentes pesados
# Verificar tree shaking en next.config.js
```

## 📞 Soporte y Recursos

- **Documentación Vercel**: https://vercel.com/docs
- **Documentación Next.js**: https://nextjs.org/docs
- **Status de Vercel**: https://vercel-status.com

## 🎯 Próximos Pasos

Después del deploy exitoso:

1. **Configurar monitoreo** (Sentry, LogRocket)
2. **Configurar analytics** (Google Analytics, Vercel Analytics)
3. **Setup CI/CD** más avanzado con tests
4. **Configurar alertas** de downtime
5. **Optimizar SEO** con meta tags

---

**¡Tu Dashboard Alcaldía Cali está listo para producción! 🎉**

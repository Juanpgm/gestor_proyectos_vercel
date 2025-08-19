# Dashboard Alcaldía de Cali - Despliegue en Vercel

## 🚀 Despliegue Automático

Este proyecto está configurado para desplegarse automáticamente en Vercel.

### Datos Incluidos

- ✅ Archivos JSON de proyectos en `/public/data/`
- ✅ Datos geoespaciales en `/public/geodata/`
- ✅ Configuración optimizada para producción

### Configuración de Vercel

- **Framework Preset**: Next.js
- **Build Command**: `npm run build:vercel`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Variables de Entorno

Actualmente no se requieren variables de entorno específicas.

### Optimizaciones Incluidas

- Cache de archivos estáticos (24h para geodata, 1h para datos)
- Compresión automática
- Optimización de imágenes
- Fallbacks para dependencias del lado servidor

## 📁 Estructura de Datos

```
public/
├── data/
│   ├── atributos/
│   ├── contratos/
│   ├── ejecucion_presupuestal/
│   ├── seguimiento_pa/
│   └── unidades_proyecto/
└── geodata/
    ├── barrios.geojson
    ├── comunas.geojson
    ├── corregimientos.geojson
    └── veredas.geojson
```

## 🔧 Comandos de Desarrollo

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run preview      # Preview local del build
npm run build:vercel # Build optimizado para Vercel
```

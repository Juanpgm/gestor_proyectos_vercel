# 🧹 Script de Limpieza - Sistema Unificado de Mapas

## 📁 **Archivos Obsoletos a Remover**

### **Componentes de Mapa Fragmentados**

```bash
# Estos componentes han sido reemplazados por UnifiedMapInterface
rm src/components/ProjectMapWithPanels.tsx
rm src/components/ProjectMapCore.tsx
rm src/components/OptimizedMapLayout.tsx
rm src/components/OptimizedMapLayoutFixed.tsx
rm src/components/SimpleMapLayout.tsx
```

### **Componentes de Gestión de Capas Antiguos**

```bash
# Reemplazados por LayerControlAdvanced
rm src/components/LayerManagementPanel.tsx
rm src/components/NewLayerManagementPanel.tsx
rm src/components/OptimizedLayerControl.tsx
rm src/components/CompactSymbologyControl.tsx
rm src/components/ColorCustomizationControl.tsx
```

### **Hooks Obsoletos de Customización**

```bash
# Reemplazados por useUnifiedLayerManagement
rm src/hooks/useLayerCustomization.ts
```

### **Componentes de Diagnóstico Temporales**

```bash
# Ya no necesarios con el sistema estable
rm src/components/GeoJSONDiagnostics.tsx
rm src/components/GeoJSONHealthDashboard.tsx
rm src/components/MapClickDiagnostics.tsx
rm src/components/MapClickDiagnosticsWrapper.tsx
```

### **Hooks Experimentales/Duplicados**

```bash
# Mantener solo useUnidadesProyecto.ts principal
rm src/hooks/useUnidadesProyecto_fixed.ts
rm src/hooks/useUnidadesProyectoSimple.ts
rm src/hooks/useUnidadesProyectoOptimized.ts
rm src/hooks/useUnidadesProyectoForced.ts
rm src/hooks/useUnidadesProyectoFixed.ts
rm src/hooks/useUnidadesProyectoClient.ts
rm src/hooks/useUnidadesProyecto.ts.backup
rm src/hooks/useUnidadesProyecto.backup.ts
```

## 🔧 **Comandos de Limpieza**

### **Ejecutar en PowerShell (Windows)**

```powershell
# Navegar al directorio del proyecto
cd a:\programing_workspace\gestor_proyectos_vercel

# Remover componentes obsoletos de mapa
Remove-Item "src\components\ProjectMapWithPanels.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\ProjectMapCore.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\OptimizedMapLayout.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\OptimizedMapLayoutFixed.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\SimpleMapLayout.tsx" -ErrorAction SilentlyContinue

# Remover gestión de capas antigua
Remove-Item "src\components\LayerManagementPanel.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\NewLayerManagementPanel.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\OptimizedLayerControl.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\CompactSymbologyControl.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\ColorCustomizationControl.tsx" -ErrorAction SilentlyContinue

# Remover hooks obsoletos
Remove-Item "src\hooks\useLayerCustomization.ts" -ErrorAction SilentlyContinue

# Remover componentes de diagnóstico
Remove-Item "src\components\GeoJSONDiagnostics.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\GeoJSONHealthDashboard.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\MapClickDiagnostics.tsx" -ErrorAction SilentlyContinue
Remove-Item "src\components\MapClickDiagnosticsWrapper.tsx" -ErrorAction SilentlyContinue

# Remover hooks experimentales
Remove-Item "src\hooks\useUnidadesProyecto_fixed.ts" -ErrorAction SilentlyContinue
Remove-Item "src\hooks\useUnidadesProyectoSimple.ts" -ErrorAction SilentlyContinue
Remove-Item "src\hooks\useUnidadesProyectoOptimized.ts" -ErrorAction SilentlyContinue
Remove-Item "src\hooks\useUnidadesProyectoForced.ts" -ErrorAction SilentlyContinue
Remove-Item "src\hooks\useUnidadesProyectoFixed.ts" -ErrorAction SilentlyContinue
Remove-Item "src\hooks\useUnidadesProyectoClient.ts" -ErrorAction SilentlyContinue
Remove-Item "src\hooks\useUnidadesProyecto.ts.backup" -ErrorAction SilentlyContinue
Remove-Item "src\hooks\useUnidadesProyecto.backup.ts" -ErrorAction SilentlyContinue

Write-Host "✅ Limpieza completada - Archivos obsoletos removidos" -ForegroundColor Green
```

## 📝 **Archivos que se Mantienen**

### **✅ Componentes Principales**

- ✅ `UnifiedMapInterface.tsx` - **NUEVO** Componente principal
- ✅ `UniversalMapCore.tsx` - Motor del mapa (actualizado)
- ✅ `LayerControlAdvanced.tsx` - **NUEVO** Control de capas
- ✅ `LayerSymbologyModal.tsx` - Modal de simbología
- ✅ `PropertiesPanel.tsx` - Panel de propiedades

### **✅ Hooks Principales**

- ✅ `useUnifiedLayerManagement.ts` - **NUEVO** Gestión unificada
- ✅ `useUnidadesProyecto.ts` - Hook principal de datos
- ✅ `useLayerSymbology.ts` - Simbología personalizada

### **✅ Utilidades y Contextos**

- ✅ `coordinateUtils.ts` - Utilidades de coordenadas
- ✅ `geoJSONLoader.ts` - Cargador de datos
- ✅ `DataContext.tsx` - Contexto global
- ✅ `customIcons.ts` - Iconos personalizados

## 🔄 **Verificación Post-Limpieza**

### **1. Verificar Compilación**

```powershell
npm run build
```

### **2. Verificar Desarrollo**

```powershell
npm run dev
```

### **3. Verificar Tests**

```powershell
npm run test
```

### **4. Verificar Dependencias**

```powershell
npm run lint
```

## 🚨 **Posibles Errores Post-Limpieza**

### **Import Statements**

```tsx
// ❌ Si encuentras errores como estos:
import ProjectMapWithPanels from "./ProjectMapWithPanels";
import { useLayerCustomization } from "@/hooks/useLayerCustomization";

// ✅ Reemplazar por:
import UnifiedMapInterface from "./UnifiedMapInterface";
import useUnifiedLayerManagement from "@/hooks/useUnifiedLayerManagement";
```

### **Referencias en Otros Componentes**

```tsx
// ❌ Buscar y reemplazar referencias como:
<ProjectMapWithPanels />

// ✅ Por:
<UnifiedMapInterface />
```

## 📊 **Beneficios de la Limpieza**

### **📉 Reducción de Código**

- **-15 archivos** obsoletos removidos
- **-2000+ líneas** de código duplicado eliminadas
- **-5 hooks** experimentales removidos

### **🚀 Mejoras de Rendimiento**

- Menor bundle size
- Menos dependencias circulares
- Imports más eficientes

### **🧹 Mantenibilidad**

- Código más limpio y enfocado
- Menos confusión entre componentes
- Arquitectura más clara

### **🎯 Funcionalidad Concentrada**

- Un solo punto de entrada para mapas
- Estado unificado y consistente
- Mejor experiencia de desarrollo

## ✅ **Checklist de Limpieza**

- [ ] Ejecutar comandos de PowerShell
- [ ] Verificar que no hay errores de compilación
- [ ] Probar la funcionalidad del mapa unificado
- [ ] Verificar que los filtros funcionan
- [ ] Confirmar que la simbología se aplica
- [ ] Probar la comunicación entre paneles
- [ ] Verificar persistencia de configuración
- [ ] Ejecutar tests si existen

**¡Una vez completada la limpieza, el sistema estará optimizado y listo para producción!** 🎉

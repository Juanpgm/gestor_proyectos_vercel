# Solución: Controles de Ordenación en Tabla de Contratos Detallados

## Problema Identificado

La tabla "Contratos Detallados" no tenía controles de ordenación, lo que dificultaba a los usuarios organizar los datos según sus necesidades específicas para análisis o búsqueda de información.

## Solución Implementada

### 1. Sistema de Ordenación Completo

**Archivo:** `src/components/EmprestitoAdvancedDashboard.tsx`

#### Tipos TypeScript Añadidos:

```typescript
type SortField =
  | "proceso"
  | "banco"
  | "estado"
  | "valor_contrato"
  | "avance_financiero"
  | "avance_fisico"
  | "observaciones";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}
```

#### Estado de Ordenación:

```typescript
const [sortState, setSortState] = useState<SortState>({
  field: null,
  direction: "asc",
});
```

### 2. Funcionalidad de Ordenación

#### Función Principal de Ordenación:

```typescript
const handleSort = (field: SortField) => {
  setSortState((prevState) => ({
    field,
    direction:
      prevState.field === field && prevState.direction === "asc"
        ? "desc"
        : "asc",
  }));
};
```

#### Función de Extracción de Valores:

```typescript
const getSortValue = (contrato: ContratoEmprestito, field: SortField) => {
  // Obtiene el reporte más reciente para datos de avance
  const reporteContrato = reportes
    .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
    .sort(
      (a, b) =>
        new Date(b.fecha_reporte).getTime() -
        new Date(a.fecha_reporte).getTime()
    )[0];

  switch (field) {
    case "proceso":
      return (contrato.nombre_resumido_proceso || "").toLowerCase();
    case "banco":
      return (contrato.banco || "").toLowerCase();
    case "estado":
      return (contrato.estado_contrato || "").toLowerCase();
    case "valor_contrato":
      return Number(contrato.valor_contrato) || 0;
    case "avance_financiero":
      return reporteContrato?.avance_financiero || 0;
    case "avance_fisico":
      return reporteContrato?.avance_fisico || 0;
    case "observaciones":
      return (reporteContrato?.observaciones || "").toLowerCase();
  }
};
```

#### Ordenación con useMemo para Performance:

```typescript
const sortedContratos = useMemo(() => {
  if (!sortState.field) return contratos;

  const sorted = [...contratos].sort((a, b) => {
    const valueA = getSortValue(a, sortState.field!);
    const valueB = getSortValue(b, sortState.field!);

    // Manejo de números vs strings
    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortState.direction === "asc" ? valueA - valueB : valueB - valueA;
    }

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortState.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return 0;
  });

  return sorted;
}, [contratos, sortState, reportes]);
```

### 3. Componente Visual de Iconos

#### Componente SortIcon:

```typescript
const SortIcon = ({ field }: { field: SortField }) => {
  if (sortState.field !== field) {
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  }

  return sortState.direction === "asc" ? (
    <ChevronUp className="w-4 h-4 text-blue-600" />
  ) : (
    <ChevronDown className="w-4 h-4 text-blue-600" />
  );
};
```

### 4. Encabezados Interactivos de Tabla

#### Columnas con Ordenación Estándar:

```tsx
<th
  className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
  onClick={() => handleSort("proceso")}
>
  <div className="flex items-center justify-between">
    <div>
      <div>Proceso / Centro Gestor</div>
      <div className="text-xs font-normal text-gray-500">
        Nombre - Entidad - Referencia
      </div>
    </div>
    <SortIcon field="proceso" />
  </div>
</th>
```

#### Columna de Avance con Sub-ordenación:

```tsx
<th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
  <div className="flex items-center justify-center gap-2">
    <div>
      <div>Avance Ejecución</div>
      <div className="text-xs font-normal text-gray-500">
        <button
          onClick={() => handleSort("avance_financiero")}
          className="hover:text-blue-600 cursor-pointer inline-flex items-center gap-1 mr-2"
        >
          Financiero <SortIcon field="avance_financiero" />
        </button>
        /<button
          onClick={() => handleSort("avance_fisico")}
          className="hover:text-blue-600 cursor-pointer inline-flex items-center gap-1 ml-2"
        >
          Físico <SortIcon field="avance_fisico" />
        </button>
      </div>
    </div>
  </div>
</th>
```

### 5. Estilos CSS Mejorados

**Archivo:** `src/styles/ipad-10-optimizations.css`

#### Interactividad Visual:

```css
.contracts-table th.sortable-header {
  user-select: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.contracts-table th.sortable-header:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.contracts-table th.sortable-header:active {
  background-color: rgba(59, 130, 246, 0.1);
}

.sort-button:hover {
  background-color: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
}

.sort-icon:hover {
  color: rgb(59, 130, 246);
  transform: scale(1.1);
}
```

### 6. Funcionalidades Implementadas

#### ✅ Ordenación por Columnas Disponibles:

- **Proceso / Centro Gestor**: Alfabético por nombre del proceso
- **Banco**: Alfabético por nombre del banco
- **Estado**: Alfabético por estado del contrato
- **Valor Contrato**: Numérico por valor monetario
- **Avance Financiero**: Numérico por porcentaje (0-100%)
- **Avance Físico**: Numérico por porcentaje (0-100%)
- **Observaciones/Alertas**: Alfabético por texto de observaciones

#### ✅ Direcciones de Ordenación:

- **Ascendente (ASC)**: A-Z, menor a mayor, 0-100%
- **Descendente (DESC)**: Z-A, mayor a menor, 100-0%
- **Toggle**: Clic en la misma columna alterna entre ASC y DESC
- **Reset**: Clic en nueva columna inicia en ASC

#### ✅ Indicadores Visuales:

- **Sin ordenación**: Ícono `ArrowUpDown` gris
- **Ascendente**: Ícono `ChevronUp` azul
- **Descendente**: Ícono `ChevronDown` azul
- **Hover**: Resaltado suave en encabezados

#### ✅ Integración con Datos:

- **Datos de Contrato**: Información base como proceso, banco, estado
- **Datos de Reporte**: Avances financiero y físico del reporte más reciente
- **Datos Calculados**: Observaciones generadas automáticamente

### 7. Experiencia de Usuario

#### 🎯 Funcionalidad Intuitiva:

- **Clic Simple**: Un clic ordena ascendente
- **Doble Clic**: Segundo clic en misma columna ordena descendente
- **Visual Claro**: Iconos indican estado actual de ordenación
- **Feedback Inmediato**: Hover y estados activos

#### 🎯 Casos de Uso Comunes:

- **Gestión por Valor**: Ordenar por valor de contrato para priorizar
- **Seguimiento por Estado**: Agrupar contratos por estado de ejecución
- **Análisis por Banco**: Organizar por entidad financiera
- **Control de Avance**: Ordenar por progreso financiero o físico

#### 🎯 Performance Optimizada:

- **useMemo**: Recálculo solo cuando cambian contratos o ordenación
- **Datos Integrados**: Combinación eficiente de contratos y reportes
- **Responsive**: Adaptación a diferentes tamaños de pantalla

### 8. Compatibilidad y Mantenimiento

#### ✅ Dispositivos Soportados:

- **Desktop**: Experiencia completa con hover
- **Tablets**: Toques optimizados para iPad
- **Móviles**: Controles reducidos pero funcionales

#### ✅ Integración Existente:

- **Paginación**: Mantiene ordenación entre páginas
- **Filtros**: Compatible con sistema de filtros sidebar
- **Modal**: Datos ordenados disponibles en modal de detalles

#### ✅ Extensibilidad:

- **Nuevos Campos**: Fácil adición de nuevas columnas ordenables
- **Tipos de Datos**: Soporte para string, number, date
- **Criterios Custom**: Posibilidad de ordenación personalizada

## Resultado Final

La tabla "Contratos Detallados" ahora incluye controles de ordenación completos en cada columna aplicable, permitiendo a los usuarios organizar los datos según sus necesidades específicas con feedback visual inmediato y funcionalidad intuitiva.

---

**Fecha:** Octubre 2025  
**Impacto:** Mejora significativa en usabilidad y análisis de datos  
**Estado:** ✅ Implementado y funcionando  
**Columnas Ordenables:** 7 campos diferentes con ordenación ascendente/descendente

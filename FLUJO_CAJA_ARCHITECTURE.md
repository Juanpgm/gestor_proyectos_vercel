# Estructura de Componentes - Dashboard Flujo de Caja Empréstito

```
EmprestitoPage
│
└── EmprestitoTabs
    │
    ├── Tab: Dashboard
    │   └── EmprestitoAdvancedDashboard
    │
    └── Tab: Flujo de caja - Empréstito ⭐ NUEVO
        └── EmprestitoFlujoCajaDashboard
            │
            ├── EmprestitoFinancialMetrics
            │   ├── Cumplimiento General
            │   ├── Desembolso Promedio Mensual
            │   ├── Proyectos en Ejecución
            │   ├── Variación vs Planeado
            │   ├── Tasa de Ejecución
            │   └── Tendencia Trimestral
            │
            ├── KPIs Principales (4 Cards)
            │   ├── Total Desembolso Planeado
            │   ├── Desembolso Ejecutado
            │   ├── Bancos Participantes
            │   └── Porcentaje de Cumplimiento
            │
            ├── Filtros Dinámicos
            │   ├── Filtro por Bancos (checkboxes)
            │   └── Filtro por Organismos (checkboxes)
            │
            ├── Visualizaciones
            │   ├── Serie de Tiempo (ComposedChart)
            │   │   ├── Barras apiladas por banco
            │   │   └── Línea de acumulado total
            │   │
            │   ├── Distribución por Banco (PieChart)
            │   │   └── Participación porcentual
            │   │
            │   ├── Top Organismos (Barras Horizontales)
            │   │   ├── Top 10 organismos
            │   │   └── Indicadores de proyectos/bancos
            │   │
            │   └── Planeado vs Real (AreaChart)
            │       ├── Área de desembolso planeado
            │       └── Área de desembolso real
            │
            └── EmprestitoProjectAnalysis
                ├── Controles
                │   ├── Buscador de proyectos
                │   └── Selector de ordenamiento
                │
                └── Lista de Proyectos (Expandibles)
                    └── Para cada proyecto:
                        ├── Header
                        │   ├── ID y descripción del BP
                        │   ├── Organismo (badge)
                        │   └── 4 métricas clave
                        │
                        └── Detalles Expandidos
                            ├── Información adicional
                            ├── Bancos asociados
                            └── Timeline mensual
```

## 🎨 Flujo de Datos

```
API Endpoint
   │
   └── /emprestito/flujo-caja/all
       │
       ├── GET request (on component mount)
       │
       └── Response: FlujoCajaResponse
           │
           ├── data: FlujoCajaRegistro[] (337 registros)
           ├── summary: Estadísticas agregadas
           └── metadata: Listas de valores únicos
               │
               └── Procesamiento en EmprestitoFlujoCajaDashboard
                   │
                   ├── State: selectedBancos (Set)
                   ├── State: selectedOrganismos (Set)
                   │
                   ├── useMemo: timeSeriesData
                   │   └── Agrupa por mes, calcula acumulados
                   │
                   ├── useMemo: bankAnalysis
                   │   └── Totaliza por banco
                   │
                   ├── useMemo: organismoAnalysis
                   │   └── Totaliza por organismo
                   │
                   └── useMemo: plannedVsRealData
                       └── Compara planeado vs real
                       │
                       └── Props a componentes hijos
                           │
                           ├── EmprestitoFinancialMetrics
                           │   └── data: filtered FlujoCajaRegistro[]
                           │
                           └── EmprestitoProjectAnalysis
                               ├── data: FlujoCajaRegistro[]
                               ├── selectedBancos: Set<string>
                               └── selectedOrganismos: Set<string>
```

## 📊 Visualizaciones por Tipo

### 1. ComposedChart (Serie de Tiempo)
```
Eje Y Izquierdo: Acumulado Total
Eje Y Derecho: Flujo Mensual
Eje X: Períodos (meses)

Elementos:
├── Bar (stackId="bancos")
│   ├── Bancolombia (#2563EB)
│   ├── BBVA (#EAB308)
│   ├── Davivienda (#16A34A)
│   └── [otros bancos...]
│
└── Line (acumulado)
    └── Color: #DC2626 (rojo)
```

### 2. PieChart (Distribución por Banco)
```
Elementos:
└── Pie
    ├── dataKey: "total"
    ├── nameKey: "banco"
    └── Cell colors: BANCO_COLORS
```

### 3. Barras Horizontales (Top Organismos)
```
Para cada organismo:
├── Barra de progreso
│   ├── Ancho: (total / maxTotal) * 100%
│   ├── Color: ORGANISMO_COLORS[index]
│   └── Altura: 8px
│
└── Metadata
    ├── Número de proyectos
    └── Número de bancos
```

### 4. AreaChart (Planeado vs Real)
```
Eje Y: Montos
Eje X: Meses

Elementos:
├── Area (stackId="1")
│   ├── dataKey: "planeado"
│   └── Color: #3B82F6 (azul)
│
└── Area (stackId="2")
    ├── dataKey: "real"
    └── Color: #10B981 (verde)
```

## 🔄 Ciclo de Vida de Filtros

```
Interacción del Usuario
   │
   ├── Checkbox de Banco
   │   └── onChange
   │       └── setSelectedBancos(new Set)
   │           └── Trigger useMemo recalculations
   │
   └── Checkbox de Organismo
       └── onChange
           └── setSelectedOrganismos(new Set)
               └── Trigger useMemo recalculations
                   │
                   └── Datos filtrados automáticamente
                       │
                       ├── timeSeriesData
                       ├── bankAnalysis
                       ├── organismoAnalysis
                       └── plannedVsRealData
                           │
                           └── Re-render de gráficos
```

## 💾 Optimizaciones de Performance

### 1. Memoización
```typescript
// Previene recalculos innecesarios
useMemo(() => {
  // Procesamiento pesado de datos
}, [dependencies])
```

### 2. Lazy Loading de Detalles
```typescript
// Solo se renderizan detalles cuando se expanden
{isExpanded && (
  <motion.div>
    {/* Detalles del proyecto */}
  </motion.div>
)}
```

### 3. Virtualización Implícita
```typescript
// Scroll nativo para listas largas
<div className="max-h-80 overflow-y-auto">
  {items.map(...)}
</div>
```

## 🎯 Puntos de Entrada para Extensión

### 1. Agregar Nueva Visualización
```typescript
// En EmprestitoFlujoCajaDashboard.tsx

// 1. Crear useMemo para procesar datos
const newVisualizationData = useMemo(() => {
  // Procesamiento
}, [dependencies])

// 2. Agregar motion.div con gráfico
<motion.div>
  <ResponsiveContainer>
    <NewChartType data={newVisualizationData} />
  </ResponsiveContainer>
</motion.div>
```

### 2. Agregar Nueva Métrica
```typescript
// En EmprestitoFinancialMetrics.tsx

// 1. Calcular en useMemo
const metrics = useMemo(() => {
  // ...existing calculations
  const newMetric = calculateNewMetric(data)
  return { ...existingMetrics, newMetric }
}, [data])

// 2. Agregar a metricCards array
const metricCards: MetricCard[] = [
  // ...existing cards
  {
    title: 'Nueva Métrica',
    value: metrics.newMetric,
    // ...
  }
]
```

### 3. Agregar Nuevo Filtro
```typescript
// En EmprestitoFlujoCajaDashboard.tsx

// 1. Agregar state
const [selectedNewFilter, setSelectedNewFilter] = useState<Set<string>>(new Set())

// 2. Usar en filtros
const filteredData = data.filter(row => 
  selectedBancos.has(row.banco) && 
  selectedOrganismos.has(row.organismo) &&
  selectedNewFilter.has(row.newField) // NUEVO
)

// 3. Agregar UI en sección de filtros
```

---

**Última actualización**: 19 de Noviembre de 2025

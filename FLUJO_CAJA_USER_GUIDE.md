# Guía de Uso - Dashboard Flujo de Caja Empréstito

## 🚀 Inicio Rápido

### Acceso al Dashboard
1. Navegar a la sección **Empréstito** en la barra principal
2. Hacer clic en la pestaña **"Flujo de caja - Empréstito"**
3. El dashboard cargará automáticamente los datos del endpoint

### Primera Vista
Al cargar, verás:
- 6 métricas financieras en la parte superior
- 4 KPIs principales
- Filtros de bancos y organismos (todos seleccionados por defecto)
- 4 visualizaciones principales
- Lista de proyectos al final

## 📊 Casos de Uso

### Caso 1: Análisis General de Cumplimiento
**Objetivo**: Ver el estado general de ejecución del empréstito

**Pasos**:
1. Observar las 6 métricas superiores
2. Revisar el card "Cumplimiento General" - debe mostrar el % total
3. Ver la métrica "Tasa de Ejecución"
4. Verificar "Tendencia Trimestral" para ver si va mejorando o empeorando

**Interpretación**:
- ✅ Verde (≥80%): Buen cumplimiento
- ⚠️ Amarillo (50-79%): Cumplimiento medio, requiere atención
- ❌ Rojo (<50%): Bajo cumplimiento, requiere acción inmediata

---

### Caso 2: Análisis por Banco
**Objetivo**: Identificar qué banco tiene mayor participación

**Pasos**:
1. Ir a la sección "Distribución por Banco" (gráfico de torta)
2. Identificar el banco con mayor porción
3. Ver el monto específico en el tooltip al hacer hover
4. Comparar con otros bancos

**Ejemplo de Análisis**:
```
Si Bancolombia tiene 45% de participación:
- Es el banco principal del empréstito
- Revisar si hay concentración de riesgo
- Verificar cumplimiento específico de este banco
```

**Acción de Filtro**:
1. Deseleccionar todos los bancos excepto uno
2. Observar cómo cambian todas las visualizaciones
3. Analizar el comportamiento mensual de ese banco específico

---

### Caso 3: Identificar Organismos con Bajo Desembolso
**Objetivo**: Encontrar centros gestores que necesitan impulso

**Pasos**:
1. Ir a "Top Organismos"
2. Los últimos de la lista son los de menor desembolso
3. Hacer clic en el organismo para filtrar
4. Ver su evolución en la serie de tiempo

**Análisis Detallado**:
1. Deseleccionar todos los organismos
2. Seleccionar solo el organismo de interés
3. Ver en qué meses ha tenido desembolsos
4. Identificar patrones o problemas

---

### Caso 4: Comparar Planeado vs Real
**Objetivo**: Ver desviaciones en la ejecución

**Pasos**:
1. Ir al gráfico "Planeado vs Real"
2. Observar las áreas azul (planeado) y verde (real)
3. Identificar meses con mayor brecha
4. Analizar tendencias

**Interpretación**:
```
Área Verde > Área Azul: Sobre-ejecución (puede ser bueno o malo)
Área Azul > Área Verde: Sub-ejecución (requiere investigación)
Áreas similares: Buena planificación
```

---

### Caso 5: Análisis de Proyecto Específico
**Objetivo**: Revisar el estado de un proyecto particular

**Pasos**:
1. Ir a la sección "Análisis por Proyecto"
2. Usar el buscador para encontrar el BP
3. Hacer clic en el proyecto para expandir
4. Revisar:
   - Responsable
   - Bancos asociados
   - Timeline mensual
   - Cumplimiento por mes

**Ejemplo de Búsqueda**:
```
Buscar: "26005788"
Resultado: Proyecto de Educación
Análisis:
- Total planeado: $12,000,000,000
- Total real: $12,000,000,000
- Cumplimiento: 100%
- Bancos: Bancolombia, BBVA
- Meses activos: jul-25, sep-25
```

---

### Caso 6: Tendencia Mensual
**Objetivo**: Ver cómo evoluciona el flujo mes a mes

**Pasos**:
1. Ver el gráfico de "Serie de Tiempo"
2. Observar las barras por banco cada mes
3. Seguir la línea roja de acumulado
4. Identificar meses pico y valles

**Análisis**:
```
Mes con mayor desembolso: oct-25 ($20B+)
Mes con menor desembolso: ago-25 ($1B)
Tendencia: Creciente
Acumulado final: $412B+
```

---

### Caso 7: Filtrado Combinado
**Objetivo**: Análisis específico por banco y organismo

**Pasos**:
1. Seleccionar solo "Bancolombia"
2. Seleccionar solo "Educación"
3. Ver proyectos específicos de esta combinación
4. Analizar cumplimiento conjunto

**Resultado Esperado**:
- Solo proyectos de Educación financiados por Bancolombia
- Métricas recalculadas para este subconjunto
- Visualizaciones actualizadas automáticamente

---

### Caso 8: Ordenar Proyectos
**Objetivo**: Priorizar proyectos por diferentes criterios

**Opción 1 - Mayor Desembolso**:
1. Seleccionar "Mayor desembolso" en el dropdown
2. Los proyectos con más recursos aparecen primero
3. Útil para identificar proyectos grandes

**Opción 2 - Mayor Cumplimiento**:
1. Seleccionar "Mayor cumplimiento"
2. Ver qué proyectos están ejecutando mejor
3. Identificar buenas prácticas

**Opción 3 - Nombre A-Z**:
1. Seleccionar "Nombre A-Z"
2. Orden alfabético por descripción
3. Útil para buscar proyecto conocido

---

## 🎯 Escenarios de Decisión

### Escenario 1: Reunión de Seguimiento Ejecutivo
**Contexto**: Presentar estado general al director

**Dashboard a Usar**:
1. Mostrar las 6 métricas superiores
2. Destacar "Cumplimiento General"
3. Mostrar gráfico de "Serie de Tiempo"
4. Explicar tendencia trimestral

**Mensaje Clave**:
```
"Actualmente tenemos un cumplimiento del X% 
con una tendencia [positiva/negativa] del Y% 
en el último trimestre"
```

---

### Escenario 2: Auditoría Bancaria
**Contexto**: Banco solicita informe de desembolsos

**Pasos**:
1. Filtrar solo el banco específico
2. Ir a "Distribución por Banco"
3. Ver proyectos específicos de ese banco
4. Exportar timeline mensual (próxima versión)

**Datos a Reportar**:
- Total desembolsado por el banco
- Proyectos financiados
- Cumplimiento por proyecto
- Distribución mensual

---

### Escenario 3: Replanning Presupuestal
**Contexto**: Ajustar presupuesto para próximo período

**Análisis Necesario**:
1. Ver "Variación vs Planeado"
2. Identificar proyectos con sobre/sub ejecución
3. Revisar tendencia trimestral
4. Analizar organismos con bajo desembolso

**Decisiones Basadas en Datos**:
```
Si cumplimiento < 70%:
  → Reasignar recursos
  → Revisar causas de retraso
  
Si cumplimiento > 90%:
  → Considerar acelerar más proyectos
  → Evaluar capacidad de absorción
```

---

### Escenario 4: Investigación de Proyecto Retrasado
**Contexto**: Un proyecto tiene bajo cumplimiento

**Pasos de Investigación**:
1. Buscar el proyecto en "Análisis por Proyecto"
2. Expandir detalles
3. Ver timeline mensual
4. Identificar meses problemáticos
5. Revisar bancos asociados
6. Contactar responsable

**Ejemplo de Hallazgos**:
```
Proyecto: BP 26005399
Cumplimiento: 45%
Meses sin desembolso: mayo, junio
Banco: Bancolombia
Responsable: Juan Pérez

Acción: Reunión con responsable para 
identificar bloqueos
```

---

## 📈 Indicadores de Alerta

### Alerta Roja 🔴
**Condiciones**:
- Cumplimiento global < 50%
- Proyecto con 0% de ejecución después de 3 meses
- Desviación > 30% entre planeado y real

**Acciones Recomendadas**:
1. Reunión urgente con responsables
2. Revisión de causas raíz
3. Plan de acción correctivo inmediato

---

### Alerta Amarilla ⚠️
**Condiciones**:
- Cumplimiento entre 50-79%
- Tendencia trimestral negativa > -10%
- Organismo sin desembolsos en 2 meses

**Acciones Recomendadas**:
1. Monitoreo cercano
2. Identificar barreras
3. Apoyo técnico si es necesario

---

### Estado Verde ✅
**Condiciones**:
- Cumplimiento ≥ 80%
- Tendencia trimestral positiva
- Ejecución consistente mensual

**Acciones Recomendadas**:
1. Continuar con el plan
2. Documentar buenas prácticas
3. Compartir aprendizajes

---

## 🔍 Tips y Trucos

### Tip 1: Análisis Rápido
Para análisis express, solo mirar:
1. Cumplimiento General (primera métrica)
2. Tendencia Trimestral (última métrica)
3. Gráfico de Serie de Tiempo (línea acumulada)

### Tip 2: Comparación de Períodos
1. Seleccionar todos los filtros
2. Observar serie de tiempo completa
3. Comparar alturas de barras mes a mes
4. Identificar patrones estacionales

### Tip 3: Uso de Colores
- Azul: Información general
- Verde: Ejecución positiva
- Rojo: Alertas o cumplimiento bajo
- Naranja: Advertencias

### Tip 4: Performance
Si el dashboard va lento:
1. Reducir número de organismos seleccionados
2. Filtrar por período específico (próxima versión)
3. Analizar un banco a la vez

---

## 📱 Acceso Móvil

### Recomendaciones
1. Rotar dispositivo a horizontal para gráficos
2. Hacer zoom en métricas específicas
3. Usar scroll vertical para navegar secciones
4. Tocar para expandir detalles de proyectos

### Limitaciones
- Gráficos complejos mejor en desktop
- Filtros múltiples más fáciles en pantalla grande
- Exportación solo disponible en desktop (próxima versión)

---

## 🎓 Capacitación Recomendada

### Para Usuarios Básicos (15 min)
1. Navegación del dashboard
2. Lectura de métricas principales
3. Uso de filtros simples
4. Interpretación de gráficos

### Para Analistas (30 min)
1. Todo lo de usuario básico
2. Análisis por proyecto
3. Comparaciones avanzadas
4. Interpretación de tendencias

### Para Directivos (10 min)
1. Vista ejecutiva (6 métricas + 4 KPIs)
2. Lectura de cumplimiento global
3. Identificación de alertas
4. Toma de decisiones basada en datos

---

## ❓ Preguntas Frecuentes

**P: ¿Con qué frecuencia se actualizan los datos?**
R: Los datos se cargan en tiempo real del endpoint al abrir el dashboard.

**P: ¿Puedo exportar los datos?**
R: Próximamente se agregará funcionalidad de exportación a Excel/PDF.

**P: ¿Los filtros afectan las métricas?**
R: Sí, al filtrar por banco u organismo, todas las métricas se recalculan.

**P: ¿Qué significa "desembolso real"?**
R: Es el monto efectivamente ejecutado vs el planeado.

**P: ¿Puedo ver datos históricos?**
R: Actualmente muestra todos los meses disponibles. Filtro por rango de fechas en desarrollo.

**P: ¿Cómo interpreto la tendencia trimestral?**
R: Compara los últimos 3 meses con los primeros 3 para ver si mejora o empeora.

---

**Fecha de Última Actualización**: 19 de Noviembre de 2025
**Versión del Dashboard**: 2.0.0
**Soporte**: Contactar al equipo de desarrollo para dudas

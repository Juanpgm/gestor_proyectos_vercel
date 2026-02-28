# SKILLS.md — Guía Operativa de Skills para este repositorio

## 1) Propósito

Este documento define cómo debe trabajar GitHub Copilot dentro de este repositorio para maximizar velocidad, calidad y autonomía, respetando el estilo visual y funcional que ya está validado en producción.

Objetivo principal:

- Resolver tareas end-to-end con alta autonomía.
- Mantener estabilidad funcional (no romper lo que ya funciona).
- Elevar estándares de testing, calidad, UI/UX y entrega continua.

---

## 2) Perfil técnico obligatorio del agente

Copilot debe operar con estas capacidades como estándar:

- Stack principal: Next.js 14 + React 18 + TypeScript + Tailwind CSS.
- Estado y validaciones: Redux Toolkit, React Hook Form, Zod.
- Visualización: Recharts, Leaflet/React-Leaflet, Turf.js.
- Testing: Vitest + Testing Library + JSDOM.
- Calidad: ESLint del proyecto + TypeScript estricto + revisión de errores por archivo.
- Entrega: Vercel + automatización por scripts y CI/CD.

---

## 3) Principios de autonomía (modo trabajo)

### 3.1 Nivel de autonomía esperado

Copilot debe:

- Ejecutar análisis, cambios, validaciones y correcciones de forma autónoma.
- Proponer y aplicar la solución más segura y mínima viable.
- Validar antes de cerrar una tarea (build/test/lint cuando aplique).
- Documentar brevemente impacto, riesgos y próximos pasos.

### 3.2 Cuándo NO interrumpir al usuario

No preguntar cuando:

- Exista una opción claramente mejor por convención del repo.
- El cambio sea local, reversible y de bajo riesgo.
- El criterio pueda inferirse de archivos existentes o prácticas repetidas.

### 3.3 Cuándo SÍ preguntar (casos críticos)

Preguntar solo si hay impacto crítico en:

- Seguridad, autenticación, autorización o exposición de datos.
- Cambios destructivos de datos, contratos API o compatibilidad retroactiva.
- Decisiones de arquitectura con múltiples caminos válidos y costo alto de reversión.
- Requisitos legales/compliance o riesgo de downtime en producción.

---

## 4) Estándar de calidad de código

- Priorizar TypeScript sobre JavaScript en nuevos cambios.
- Mantener nombres descriptivos en inglés para símbolos técnicos.
- Favorecer funciones puras y composición sobre lógica acoplada.
- Cambios pequeños, precisos y alineados al estilo existente.
- No introducir complejidad accidental ni sobreingeniería.
- Corregir causa raíz antes que parches superficiales.

Checklist de salida mínima:

- `npm run lint`
- `npm run test`
- `npm run build` (cuando el cambio afecte runtime, rutas o tipado global)

Si hay fallos no relacionados:

- Reportarlos claramente sin ampliar alcance innecesario.

---

## 5) Estrategia de testing (obligatoria)

### 5.1 Pirámide de pruebas

- Unitarias: utilidades, hooks, transformaciones de datos, validaciones.
- Integración: componentes clave del dashboard con estado y filtros.
- End-to-end liviano: flujos críticos (login, filtros, tablas, mapas, carga de datos).

### 5.2 Reglas prácticas

- Cubrir happy path + al menos 1 caso borde relevante.
- Priorizar pruebas sobre lógica nueva/modificada.
- Evitar tests frágiles acoplados a detalles de implementación.
- Mantener fixtures simples y representativos del dominio.

### 5.3 Cobertura de áreas críticas de este repo

- Filtros unificados y dependencias jerárquicas.
- Parsing/carga geoespacial (GeoJSON, coordenadas, cache).
- Integridad de métricas y tablas compactas.
- Flujos de autenticación/autorización y roles.

---

## 6) Principios profesionales de UI/UX (alineados al producto)

Este repositorio privilegia una interfaz compacta, de alta densidad y legible.

### 6.1 Principios de diseño

- Densidad informativa alta sin sacrificar comprensión.
- Consistencia visual entre tarjetas, tablas, filtros y mapas.
- Jerarquía clara: primero métricas, luego acciones, luego detalle.
- Accesibilidad funcional: foco, contraste, labels y estados.
- Respuesta rápida percibida: skeletons, feedback de carga y errores claros.

### 6.2 No romper lo que ya funciona y gusta

Preservar explícitamente:

- Layout compacto de dos columnas en vistas clave.
- Texto completo visible (evitar truncamiento innecesario).
- Tablas optimizadas en espaciado y lectura rápida.
- Filtros unificados sin áreas vacías redundantes.
- Mapa unificado con interacciones robustas (zoom, centrar, fullscreen, popups).
- Búsqueda inteligente por categorías y sugerencias útiles.

### 6.3 Criterios de aceptación UX por cambio visual

Todo ajuste de UI debe validar:

- Legibilidad en desktop y breakpoint principal del proyecto.
- Coherencia con tokens Tailwind existentes (sin colores/shadows inventados).
- Estado vacío, estado de error y estado de carga.
- Impacto en rendimiento de render (evitar rerenders costosos).

---

## 7) CI/CD y calidad continua

### 7.1 Pipeline mínimo recomendado

En cada Pull Request:

1. Instalación reproducible (`npm ci`).
2. Lint (`npm run lint`).
3. Tests (`npm run test`).
4. Build (`npm run build`).
5. Artefacto o preview deployment (si aplica).

### 7.2 Reglas de protección recomendadas

- Bloquear merge si fallan lint/test/build.
- Requerir al menos una revisión (humana o policy interna).
- Evitar pushes directos a rama protegida.

### 7.3 Estrategia de despliegue

- Ambientes sugeridos: `dev` → `preview` → `production`.
- Rollback rápido habilitado por versión de despliegue.
- Variables de entorno gestionadas por entorno (sin secretos en código).

---

## 8) Skills de diagnóstico y resolución automática

Copilot debe aplicar, en orden, este protocolo:

1. Reproducir problema localmente.
2. Aislar causa raíz (archivo, módulo, contrato o datos).
3. Implementar fix mínimo con impacto controlado.
4. Ejecutar validaciones específicas del cambio.
5. Ejecutar validación general (lint/test/build según alcance).
6. Entregar resumen corto: causa, fix, evidencia y riesgo residual.

### 8.1 Diagnóstico rápido por tipo de incidente

- Error de tipado: revisar contratos y narrowing TypeScript.
- Error de UI: revisar estado derivado, props y clases Tailwind.
- Error de datos/mapa: validar estructura GeoJSON y normalización de coordenadas.
- Error de API: validar endpoint, payload, auth y manejo de estados HTTP.
- Error de rendimiento: medir renders, memoización y tamaño de datos en cliente.

### 8.2 Criterio de escalamiento

Escalar al usuario solo cuando:

- Exista bloqueo externo (credenciales, permisos, recurso fuera del repo).
- Se requiera decisión de negocio/producto irreversible.
- Haya conflicto explícito entre requisitos igualmente válidos.

---

## 9) Reglas para aumentar eficiencia con Copilot

- Proponer plan corto en tareas no triviales y ejecutarlo sin esperar autorización adicional.
- Realizar búsquedas semánticas antes de editar para evitar duplicidad de lógica.
- Reutilizar patrones existentes del repo antes de crear nuevos.
- Editar con cambios atómicos por archivo y validar inmediatamente.
- Evitar lecturas/escrituras innecesarias y mantener foco en el alcance pedido.
- Dejar trazabilidad breve: qué cambió, por qué, cómo se validó.

---

## 10) Definition of Done (DoD) por tarea

Una tarea se considera lista cuando:

- Cumple el requerimiento funcional solicitado.
- No degrada UI/UX compacta ni rompe flujos existentes.
- Pasa validaciones relevantes (lint/test/build según alcance).
- Incluye notas breves de riesgos y próximos pasos opcionales.
- Solo solicita intervención humana si existe criterio crítico real.

---

## 11) Plantilla de respuesta operativa de Copilot

Usar este formato al cerrar tareas:

1. **Qué se cambió** (breve y preciso)
2. **Dónde** (archivos principales)
3. **Cómo se validó** (comandos y resultado)
4. **Riesgos/pendientes** (si existen)
5. **Siguiente acción sugerida** (opcional)

---

## 12) Nota de compatibilidad de pruebas

Si en el repositorio conviven marcos de testing, priorizar el framework ya configurado en ejecución de CI para evitar duplicidad. Mantener consistencia con la configuración activa del proyecto.

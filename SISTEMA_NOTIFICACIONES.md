# Sistema de Notificaciones

Sistema completo de notificaciones **automáticas** con redirección para la aplicación de gestión de proyectos.

## Características

- ✅ **Notificaciones automáticas** generadas en tiempo real al detectar cambios
- ✅ Notificaciones con redirección automática a secciones específicas
- ✅ Clasificación por categoría (proyectos, contratos, actividades, etc.)
- ✅ Niveles de prioridad (bajo, medio, alto, urgente)
- ✅ Filtros por estado, fecha y categoría
- ✅ Marcado como leído/no leído
- ✅ Persistencia en localStorage
- ✅ Notificaciones de ejemplo para demostración

## 🔔 Sistema de Notificaciones Automáticas

### ¿Cómo funciona?

El sistema monitorea constantemente los datos de la aplicación y genera notificaciones automáticamente cuando detecta:

#### 1. **Reportes de Empréstito**
- ✅ Nuevo reporte registrado
- ✅ Actualización de avance físico/financiero
- ⚠️ Avance físico bajo (<30%)
- 🎯 Hitos alcanzados (25%, 50%, 75%, 100%)
- 💰 Ejecución presupuestal alta (>85%)

#### 2. **Contratos**
- ✅ Nuevo contrato registrado
- ✅ Contrato actualizado
- ⚠️ Contrato próximo a vencer (7 días o menos)
- ⚠️ Contrato vence en 3 días (alerta urgente)

#### 3. **Proyectos**
- ✅ Nuevo proyecto creado
- ✅ Cambio de estado de proyecto
- 🎉 Proyecto completado
- 🎯 Hito de proyecto alcanzado

#### 4. **Presupuesto**
- ⚠️ Ejecución presupuestal >85%
- ⚠️ Ejecución presupuestal >70%
- ✅ Actualización de presupuesto

#### 5. **Actividades**
- ✅ Nueva actividad programada
- ✅ Actividad completada

### Integración en el Código

```typescript
// En el componente principal (page.tsx)
import { useEmprestitoAutoNotifications } from '@/hooks/useEmprestitoNotifications';

// Dentro del componente
useEmprestitoAutoNotifications({
  reportes: emprestitoState.data.reportes,
  contratos: emprestitoState.data.contratos,
  enabled: true // Cambiar a false para desactivar
});
```

### Configuración

Puedes configurar qué tipos de notificaciones automáticas se generan:

```javascript
import { setAutoNotificationConfig } from '@/utils/autoNotifications';

// Configurar desde la consola
setAutoNotificationConfig({
  enabled: true,
  types: {
    reportes: true,      // Notificaciones de reportes de empréstito
    contratos: true,     // Notificaciones de contratos
    proyectos: true,     // Notificaciones de proyectos
    actividades: true,   // Notificaciones de actividades
    presupuesto: true    // Notificaciones de presupuesto
  }
});
```

## Tipos de Notificaciones Incluidas

### 1. Alertas de Vencimiento
- Contratos próximos a vencer
- Actividades con fecha límite cercana
- Productos pendientes de entrega

### 2. Cambios de Estado
- Proyectos actualizados
- Contratos aprobados
- Actividades completadas
- Unidades de proyecto modificadas

### 3. Presupuesto y Finanzas
- Alertas de exceso presupuestario
- Nuevos desembolsos
- Pagos pendientes

### 4. Avance de Proyectos
- Hitos alcanzados
- Unidades completadas
- Retrasos detectados

### 5. Aprobaciones Pendientes
- Contratos pendientes de revisión
- Solicitudes de modificación
- Documentos que requieren firma

### 6. Hitos y Logros
- Proyectos completados
- Fases finalizadas

## Archivos Principales

```
src/
├── types/
│   └── notifications.ts                    # Tipos TypeScript
├── services/
│   └── notificationService.ts              # Servicio principal
├── utils/
│   ├── sampleNotifications.ts              # Datos de ejemplo
│   ├── initializeNotifications.ts          # Inicializador de ejemplos
│   └── autoNotifications.ts                # Sistema automático (NUEVO)
├── hooks/
│   ├── useNotifications.ts                 # Hook del panel
│   └── useEmprestitoNotifications.ts       # Hook automático empréstito (NUEVO)
├── components/
│   ├── NotificationPanel.tsx               # Panel de notificaciones
│   └── NotificationInitializer.tsx         # Componente inicializador
└── app/
    └── page.tsx                            # Integración principal (ACTUALIZADO)
```

## Uso

### Ver Notificaciones

El botón de notificaciones en el header muestra:
- Badge con número de notificaciones sin leer
- Panel lateral al hacer clic

### Interactuar con Notificaciones

Al hacer clic en una notificación:
1. Se marca automáticamente como leída
2. El panel se cierra
3. Redirige a la página/sección correspondiente
4. Puede incluir parámetros de búsqueda o filtros

### Ejemplos de URLs de Redirección

```typescript
// Buscar un proyecto específico
actionUrl: '/proyectos?search=Hospital+del+Valle'

// Ver contratos pendientes de revisión
actionUrl: '/contratos?filter=pendiente_revision'

// Ir a una actividad específica
actionUrl: '/actividades?id=xxx'

// Ver sección de presupuesto de un proyecto
actionUrl: '/proyectos?id=xxx&tab=presupuesto'

// Resaltar un elemento específico
actionUrl: '/emprestito?highlight=desembolso_reciente'
```

## Gestión de Notificaciones

### Funciones Disponibles en Consola

```javascript
// Resetear y recargar todas las notificaciones
resetAndReloadNotifications()

// Limpiar todas las notificaciones
clearAllNotifications()
```

### Crear Notificaciones Programáticamente

```typescript
import { notificationService } from '@/services/notificationService';

notificationService.create({
  type: 'status_change',
  priority: 'high',
  title: 'Proyecto Actualizado',
  message: 'El proyecto "X" cambió de estado',
  category: 'proyecto',
  actionUrl: '/proyectos?id=123'
});
```

## Personalización

### Agregar Nuevos Tipos de Notificaciones

1. Editar `src/types/notifications.ts` y agregar nuevo tipo:
```typescript
export type NotificationType = 
  | 'new_project'
  | 'tu_nuevo_tipo' // <-- Agregar aquí
  | ...
```

2. Agregar template en `src/utils/sampleNotifications.ts`:
```typescript
{
  type: 'tu_nuevo_tipo',
  priority: 'medium',
  title: 'Título',
  message: 'Mensaje descriptivo',
  category: 'proyecto',
  actionUrl: '/ruta?params=valor',
  hoursAgo: 2
}
```

### Agregar Nuevas Categorías

1. Actualizar tipo en `src/types/notifications.ts`
2. Agregar color en `NotificationPanel.tsx` función `getCategoryColor()`
3. Agregar estadísticas en el servicio si es necesario

## Estado de Implementación

✅ **Completado:**
- Sistema de tipos TypeScript
- Servicio de notificaciones con persistencia
- Generador de notificaciones de ejemplo
- Inicialización automática al cargar la app
- Panel de notificaciones con filtros
- Redirección con Next.js router
- 25+ notificaciones de ejemplo realistas

🔄 **Próximos pasos (opcional):**
- Integración con API backend para notificaciones reales
- Notificaciones push del navegador
- Notificaciones en tiempo real con WebSockets
- Sistema de suscripciones por categoría
- Notificaciones por correo electrónico

## Notas Técnicas

- Las notificaciones se almacenan en `localStorage` con la clave `calitrack_notifications`
- Límite máximo: 500 notificaciones (configurable en el servicio)
- La inicialización solo ocurre una vez (flag: `notifications_initialized`)
- Para desarrollo, usar `resetAndReloadNotifications()` en consola

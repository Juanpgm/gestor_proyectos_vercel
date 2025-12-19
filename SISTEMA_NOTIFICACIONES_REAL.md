# Sistema de Notificaciones en Tiempo Real

## 🎯 Funcionamiento

El sistema está configurado para **detectar automáticamente cambios reales** en la base de datos y crear notificaciones. **NO se cargan notificaciones de ejemplo**.

## 📊 ¿Qué se detecta?

### Empréstito (Activo)
- ✅ **Nuevos reportes de contratos**
- ✅ **Cambios en avance físico** (> 0.1% de diferencia)
- ✅ **Cambios en avance financiero** (> 0.1% de diferencia)
- ✅ **Hitos alcanzados** (25%, 50%, 75%, 100%)
- ✅ **Alertas de bajo avance** (< 30%)
- ✅ **Alertas de presupuesto** (> 85% ejecutado)

### Otros módulos (Por implementar)
- Contratos próximos a vencer
- Nuevas actividades
- Cambios en productos
- Nuevos procesos

## ⏱️ Configuración Actual

- **Ventana de notificaciones**: Últimos 5 días
- **Monitoreo**: Tiempo real (cada vez que se actualizan los datos)
- **Badge en Header**: Cuenta notificaciones no leídas de los últimos 5 días

## 🔍 Cómo verificar

### En consola del navegador:

```javascript
// Ver todas las notificaciones
debugNotifications.getAll()

// Ver notificaciones de los últimos 5 días
debugNotifications.getRecent(5)

// Ver estadísticas
debugNotifications.getStats()

// Limpiar todas las notificaciones
debugNotifications.clear()

// Crear notificaciones de prueba (solo para testing)
debugNotifications.reset()
```

## 🚀 Cuándo aparecerán notificaciones

Las notificaciones aparecerán **automáticamente** cuando:

1. Se agregue un nuevo reporte en la sección Empréstito
2. Se actualice el avance físico o financiero de un contrato
3. Un proyecto alcance un hito importante (25%, 50%, 75%, 100%)
4. Se detecten problemas (bajo avance, presupuesto alto)

## 📝 Logs en consola

El sistema muestra logs para debugging:

- `📊 Sistema de notificaciones inicializado` - Al cargar la página
- `🆕 Nuevo reporte detectado: [referencia]` - Cuando se agrega un reporte
- `🔄 Cambios detectados en [referencia]` - Cuando se actualiza un reporte
- `✅ Total de cambios detectados: X` - Resumen de cambios

## 🧪 Testing

Para probar el sistema sin esperar cambios reales:

```javascript
// Crear notificaciones de ejemplo
debugNotifications.reset()
```

Esto creará ~25 notificaciones de prueba distribuidas en los últimos 2 días.

## 🎨 Filtros en el Panel

- **Recientes (5d)**: Muestra notificaciones de los últimos 5 días (filtro por defecto)
- **Sin leer**: Solo notificaciones no leídas
- **Todas**: Todas las notificaciones en el sistema

## 💾 Persistencia

Las notificaciones se guardan en `localStorage` con clave `calitrack_notifications` y persisten entre sesiones.

Límite: 500 notificaciones máximo.

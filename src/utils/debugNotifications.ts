/**
 * Utilidad de Debug para Notificaciones
 * Funciones helper para debugging en consola
 */

import { notificationService } from '@/services/notificationService';
import { resetAndReloadNotifications, clearAllNotifications } from '@/utils/initializeNotifications';

// Exportar a window para uso en consola
if (typeof window !== 'undefined') {
  const debugNotifications = {
    // Ver todas las notificaciones
    getAll: () => {
      const notifications = notificationService.getAll();
      console.table(notifications.map(n => ({
        id: n.id.substring(0, 8),
        title: n.title,
        category: n.category,
        priority: n.priority,
        read: n.read,
        timestamp: n.timestamp.toLocaleString()
      })));
      return notifications;
    },
    
    // Ver estadísticas
    getStats: () => {
      const stats = notificationService.getStats();
      console.log('📊 Estadísticas de Notificaciones:', stats);
      return stats;
    },
    
    // Ver notificaciones de hoy
    getToday: () => {
      const today = notificationService.getTodayNotifications(true);
      console.log(`📅 Notificaciones de hoy: ${today.length}`);
      console.table(today.map(n => ({
        title: n.title,
        read: n.read,
        timestamp: n.timestamp.toLocaleTimeString()
      })));
      return today;
    },
    
    // Ver notificaciones recientes (últimos N días)
    getRecent: (days = 5) => {
      const recent = notificationService.getRecentNotifications(days, true);
      console.log(`📅 Notificaciones de los últimos ${days} días: ${recent.length}`);
      console.table(recent.map(n => ({
        title: n.title.substring(0, 40),
        priority: n.priority,
        read: n.read,
        hoursAgo: Math.floor((Date.now() - new Date(n.timestamp).getTime()) / (1000 * 60 * 60)),
        timestamp: new Date(n.timestamp).toLocaleString()
      })));
      return recent;
    },
    
    // Crear notificación de prueba
    createTest: () => {
      const notification = notificationService.create({
        type: 'system',
        priority: 'high',
        title: 'Notificación de Prueba',
        message: 'Esta es una notificación de prueba creada manualmente',
        category: 'sistema',
        actionUrl: '/dashboard'
      });
      console.log('✅ Notificación de prueba creada:', notification);
      return notification;
    },
    
    // Resetear todo
    reset: resetAndReloadNotifications,
    
    // Limpiar todo
    clear: clearAllNotifications,
    
    // Ver localStorage
    checkStorage: () => {
      const stored = localStorage.getItem('calitrack_notifications');
      const initFlag = localStorage.getItem('notifications_initialized');
      console.log('💾 localStorage:');
      console.log('- Inicializado:', initFlag);
      console.log('- Notificaciones guardadas:', stored ? JSON.parse(stored).length : 0);
      return { initFlag, notifications: stored ? JSON.parse(stored) : [] };
    }
  };
  
  // Exponer globalmente
  (window as any).debugNotifications = debugNotifications;
  
  console.log(`
🔧 Debug de Notificaciones disponible:

  debugNotifications.getAll()        - Ver todas las notificaciones
  debugNotifications.getRecent(5)    - Ver últimos 5 días
  debugNotifications.getStats()      - Ver estadísticas
  debugNotifications.getToday()      - Ver notificaciones de hoy
  debugNotifications.createTest()    - Crear notificación de prueba
  debugNotifications.reset()         - Resetear y recargar
  debugNotifications.clear()         - Limpiar todas
  debugNotifications.checkStorage()  - Ver localStorage

O usar las funciones globales directas:
  resetAndReloadNotifications()
  clearAllNotifications()
  `);
}

export {};

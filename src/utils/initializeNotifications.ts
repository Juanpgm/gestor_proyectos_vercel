/**
 * Inicializar Notificaciones
 * Carga notificaciones de ejemplo al iniciar la aplicación (solo en desarrollo o primera carga)
 */

import { notificationService } from '@/services/notificationService';
import { generateSampleNotifications } from './sampleNotifications';

const INIT_KEY = 'notifications_initialized';

/**
 * Inicializar notificaciones de ejemplo si es la primera vez
 */
export function initializeSampleNotifications(): void {
  if (typeof window === 'undefined') return;

  try {
    const isInitialized = localStorage.getItem(INIT_KEY);
    
    // Solo inicializar si no se ha hecho antes
    if (!isInitialized) {
      const sampleNotifications = generateSampleNotifications();
      
      console.log('📬 Cargando notificaciones de ejemplo...', sampleNotifications.length);
      
      // Crear cada notificación y mostrar sus timestamps
      sampleNotifications.forEach((notif, index) => {
        const created = notificationService.create(notif);
        if (index < 3) { // Mostrar las primeras 3 para debug
          console.log(`  ✓ ${notif.title.substring(0, 40)}... - ${new Date(created.timestamp).toLocaleString()}`);
        }
      });
      
      localStorage.setItem(INIT_KEY, 'true');
      console.log('✅ Notificaciones de ejemplo cargadas:', sampleNotifications.length);
      console.log('💡 Usa debugNotifications.getRecent(5) para ver las notificaciones recientes');
    } else {
      console.log('ℹ️ Notificaciones ya inicializadas previamente');
      console.log('💡 Usa debugNotifications.reset() para recargar con nuevos timestamps');
    }
  } catch (error) {
    console.error('❌ Error al inicializar notificaciones:', error);
  }
}

/**
 * Resetear y recargar notificaciones de ejemplo (útil para desarrollo)
 */
export function resetAndReloadNotifications(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🔄 Reseteando notificaciones...');
  localStorage.removeItem(INIT_KEY);
  notificationService.deleteAll();
  
  const sampleNotifications = generateSampleNotifications();
  console.log(`📬 Creando ${sampleNotifications.length} notificaciones con timestamps ajustados...`);
  
  // Mostrar algunas para debug
  sampleNotifications.slice(0, 5).forEach((notif) => {
    const hoursAgo = notif.data?.metadata?.hoursAgo || 0;
    console.log(`  • ${notif.title.substring(0, 50)}... (hace ${hoursAgo}h)`);
  });
  
  // Crear todas
  sampleNotifications.forEach((notif) => {
    notificationService.create(notif);
  });
  
  localStorage.setItem(INIT_KEY, 'true');
  
  const stats = notificationService.getStats();
  const recent5Days = notificationService.getRecentNotifications(5, true);
  
  console.log('✅ Notificaciones recargadas');
  console.log(`📊 Total: ${stats.total} | Sin leer: ${stats.unread}`);
  console.log(`📅 Últimos 5 días: ${recent5Days.length} notificaciones`);
  console.log('💡 Usa debugNotifications.getRecent(5) para verlas en detalle');
}

/**
 * Limpiar todas las notificaciones y resetear inicialización
 */
export function clearAllNotifications(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(INIT_KEY);
  notificationService.deleteAll();
  console.log('🗑️ Todas las notificaciones eliminadas');
}

// Exportar funciones globalmente para debugging en consola
if (typeof window !== 'undefined') {
  (window as any).resetAndReloadNotifications = resetAndReloadNotifications;
  (window as any).clearAllNotifications = clearAllNotifications;
  (window as any).initializeSampleNotifications = initializeSampleNotifications;
}

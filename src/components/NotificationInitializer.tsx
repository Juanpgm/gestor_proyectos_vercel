/**
 * Componente para inicializar notificaciones
 * Se monta una sola vez al cargar la aplicación
 */

'use client';

import { useEffect } from 'react';
import { initializeSampleNotifications } from '@/utils/initializeNotifications';

export default function NotificationInitializer() {
  useEffect(() => {
    console.log('🚀 NotificationInitializer montado');
    
    // Limpiar notificaciones de ejemplo si existen
    if (typeof window !== 'undefined') {
      const initFlag = localStorage.getItem('notifications_initialized');
      if (initFlag) {
        console.log('🧹 Limpiando notificaciones de ejemplo anteriores...');
        localStorage.removeItem('notifications_initialized');
        localStorage.removeItem('calitrack_notifications');
      }
    }
    
    // NO inicializar notificaciones de ejemplo automáticamente
    // Solo se crearán notificaciones reales cuando haya cambios en la BD
    console.log('💡 Sistema de notificaciones activo - detectará cambios en tiempo real');
    console.log('💡 Las notificaciones aparecerán cuando:');
    console.log('   - Se agreguen nuevos reportes de empréstito');
    console.log('   - Se actualicen datos de contratos');
    console.log('   - Haya cambios en avances físicos/financieros');
    console.log('💡 Para notificaciones de prueba: debugNotifications.reset()');
  }, []);

  return null; // Este componente no renderiza nada
}

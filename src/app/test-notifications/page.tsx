/**
 * Página de Prueba del Sistema de Notificaciones
 * Permite probar y demostrar todas las funcionalidades del sistema
 */

'use client';

import React from 'react';
import NotificationDemo from '@/components/NotificationDemo';

export default function NotificationsTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <NotificationDemo />
    </div>
  );
}

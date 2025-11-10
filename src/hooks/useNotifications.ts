/**
 * Hook personalizado para gestionar notificaciones
 * Proporciona estado y funciones para interactuar con el sistema de notificaciones
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import type { 
  Notification, 
  NotificationFilter, 
  NotificationStats 
} from '@/types/notifications';

export function useNotifications(filter?: NotificationFilter) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byCategory: {
      proyecto: 0,
      unidad: 0,
      contrato: 0,
      actividad: 0,
      proceso: 0,
      presupuesto: 0,
      sistema: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    }
  });
  const [loading, setLoading] = useState(true);

  // Cargar notificaciones
  const loadNotifications = useCallback(() => {
    try {
      const data = notificationService.getAll(filter);
      setNotifications(data);
      
      const statsData = notificationService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Suscribirse a cambios en el servicio
  useEffect(() => {
    loadNotifications();
    
    const unsubscribe = notificationService.subscribe(() => {
      loadNotifications();
    });

    return unsubscribe;
  }, [loadNotifications]);

  // Marcar como leída
  const markAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback((id: string) => {
    notificationService.delete(id);
  }, []);

  // Eliminar todas las leídas
  const deleteAllRead = useCallback(() => {
    notificationService.deleteAllRead();
  }, []);

  // Eliminar todas
  const deleteAll = useCallback(() => {
    notificationService.deleteAll();
  }, []);

  // Solicitar permiso para notificaciones del navegador
  const requestPermission = useCallback(async () => {
    return await notificationService.requestPermission();
  }, []);

  return {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    deleteAll,
    requestPermission,
    refresh: loadNotifications
  };
}

/**
 * Hook simplificado para obtener solo notificaciones no leídas
 */
export function useUnreadNotifications() {
  return useNotifications({ read: false });
}

/**
 * Hook para obtener el conteo de notificaciones no leídas
 */
export function useNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const stats = notificationService.getStats();
      setCount(stats.unread);
    };

    updateCount();
    const unsubscribe = notificationService.subscribe(updateCount);

    return unsubscribe;
  }, []);

  return count;
}

/**
 * Hook para obtener el conteo de notificaciones no leídas del día actual
 * Muestra solo las notificaciones de hoy en el badge
 */
export function useTodayNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const todayCount = notificationService.getTodayUnreadCount();
      setCount(todayCount);
    };

    updateCount();
    
    // Actualizar cada vez que cambian las notificaciones
    const unsubscribe = notificationService.subscribe(updateCount);

    // Actualizar cada minuto para refrescar el conteo del día
    const interval = setInterval(updateCount, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return count;
}

/**
 * Hook para obtener las notificaciones del día actual
 */
export function useTodayNotifications(includeRead: boolean = false) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const updateNotifications = () => {
      const todayNotifs = notificationService.getTodayNotifications(includeRead);
      setNotifications(todayNotifs);
    };

    updateNotifications();
    const unsubscribe = notificationService.subscribe(updateNotifications);

    // Actualizar cada minuto para refrescar las notificaciones del día
    const interval = setInterval(updateNotifications, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [includeRead]);

  return notifications;
}

/**
 * Hook personalizado para gestionar notificaciones
 * Proporciona estado y funciones para interactuar con el sistema de notificaciones
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { notificationService } from "@/services/notificationService";
import {
  fetchNotificaciones,
  fetchNotificacionesCount,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
} from "@/services/backendNotificationsService";
import type { BackendNotification } from "@/types/notifications";
import type {
  Notification,
  NotificationFilter,
  NotificationStats,
} from "@/types/notifications";

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
      sistema: 0,
      solicitud_cambio: 0,
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
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
      console.error("Error loading notifications:", error);
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
    refresh: loadNotifications,
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
 * Hook para obtener el conteo de notificaciones no leídas de los últimos N días
 * Por defecto muestra las notificaciones de los últimos 5 días
 */
export function useRecentNotificationCount(days: number = 5) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const recentCount = notificationService.getRecentUnreadCount(days);
      setCount(recentCount);
    };

    updateCount();

    // Actualizar cada vez que cambian las notificaciones
    const unsubscribe = notificationService.subscribe(updateCount);

    // Actualizar cada minuto para refrescar el conteo
    const interval = setInterval(updateCount, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [days]);

  return count;
}

/**
 * Hook para obtener las notificaciones del día actual
 */
export function useTodayNotifications(includeRead: boolean = false) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const updateNotifications = () => {
      const todayNotifs =
        notificationService.getTodayNotifications(includeRead);
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

// ---------------------------------------------------------------------------
// Hooks para notificaciones del backend (Firestore via REST API)
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 30_000; // 30 s

export interface UseBackendNotificationsOptions {
  /** Rol del usuario actual (admin_centro_gestor | admin_general | super_admin) */
  role: string;
  /** Nombre del centro gestor — requerido para admin_centro_gestor */
  centro_gestor?: string;
  /** Si es true, la suscripción se activa. Default true. */
  enabled?: boolean;
}

export interface UseBackendNotificationsResult {
  notifications: BackendNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook para obtener y gestionar notificaciones del backend (Tier 1 y Tier 2).
 * Hace polling cada 30 s y se refresca en window focus.
 */
export function useBackendNotifications({
  role,
  centro_gestor,
  enabled = true,
}: UseBackendNotificationsOptions): UseBackendNotificationsResult {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!enabled || !role) return;
    try {
      const resp = await fetchNotificaciones({ role, centro_gestor });
      if (isMounted.current) {
        setNotifications(resp.data);
        setUnreadCount(resp.unread_count);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current)
        setError("No se pudieron cargar las notificaciones.");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [role, centro_gestor, enabled]);

  // initial load + polling
  useEffect(() => {
    if (!enabled) return;
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load, enabled]);

  // reload on window focus
  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load, enabled]);

  const markAsRead = useCallback(async (id: string) => {
    await marcarNotificacionLeida(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, leida: true, leida_en: new Date().toISOString() }
          : n,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await marcarTodasLeidas(role, centro_gestor);
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, leida: true, leida_en: n.leida_en ?? now })),
    );
    setUnreadCount(0);
  }, [role, centro_gestor]);

  const deleteNotification = useCallback(async (id: string) => {
    await eliminarNotificacion(id);
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      if (removed && !removed.leida) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllRead,
    deleteNotification,
    refresh: load,
  };
}

/**
 * Hook ligero que retorna solo el conteo de no leídas del backend.
 * Útil para el badge en el Header sin cargar el panel completo.
 */
export function useBackendUnreadCount(
  role: string | undefined,
  centro_gestor?: string,
): number {
  const [count, setCount] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!role) return;
    try {
      const c = await fetchNotificacionesCount(role, centro_gestor);
      if (isMounted.current) setCount(c);
    } catch {
      /* silencioso */
    }
  }, [role, centro_gestor]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  return count;
}

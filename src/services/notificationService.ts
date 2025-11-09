/**
 * Servicio de Notificaciones
 * Gestiona el almacenamiento, recuperación y manipulación de notificaciones
 */

import type { 
  Notification as AppNotification, 
  NotificationFilter, 
  NotificationStats,
  NotificationPriority 
} from '@/types/notifications';

const STORAGE_KEY = 'calitrack_notifications';
const MAX_NOTIFICATIONS = 500; // Límite para evitar sobrecarga

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Cargar notificaciones desde localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Guardar notificaciones en localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  /**
   * Notificar a los listeners sobre cambios
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Suscribirse a cambios en las notificaciones
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Crear una nueva notificación
   */
  create(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);

    // Limitar el número de notificaciones
    if (this.notifications.length > MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, MAX_NOTIFICATIONS);
    }

    this.saveToStorage();

    // Mostrar notificación del navegador si está permitido
    this.showBrowserNotification(newNotification);

    return newNotification;
  }

  /**
   * Obtener todas las notificaciones con filtros opcionales
   */
  getAll(filter?: NotificationFilter): AppNotification[] {
    let filtered = [...this.notifications];

    if (filter) {
      if (filter.read !== undefined) {
        filtered = filtered.filter(n => n.read === filter.read);
      }

      if (filter.type && filter.type.length > 0) {
        filtered = filtered.filter(n => filter.type!.includes(n.type));
      }

      if (filter.category && filter.category.length > 0) {
        filtered = filtered.filter(n => filter.category!.includes(n.category));
      }

      if (filter.priority && filter.priority.length > 0) {
        filtered = filtered.filter(n => filter.priority!.includes(n.priority));
      }

      if (filter.startDate) {
        filtered = filtered.filter(n => n.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        filtered = filtered.filter(n => n.timestamp <= filter.endDate!);
      }
    }

    return filtered;
  }

  /**
   * Obtener una notificación por ID
   */
  getById(id: string): AppNotification | undefined {
    return this.notifications.find(n => n.id === id);
  }

  /**
   * Marcar una notificación como leída
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveToStorage();
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllAsRead(): void {
    let changed = false;
    this.notifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.saveToStorage();
    }
  }

  /**
   * Eliminar una notificación
   */
  delete(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToStorage();
    }
  }

  /**
   * Eliminar todas las notificaciones leídas
   */
  deleteAllRead(): void {
    this.notifications = this.notifications.filter(n => !n.read);
    this.saveToStorage();
  }

  /**
   * Eliminar todas las notificaciones
   */
  deleteAll(): void {
    this.notifications = [];
    this.saveToStorage();
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  getStats(): NotificationStats {
    const stats: NotificationStats = {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.read).length,
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
    };

    this.notifications.forEach(n => {
      stats.byCategory[n.category]++;
      stats.byPriority[n.priority]++;
    });

    return stats;
  }

  /**
   * Obtener notificaciones no leídas del día actual
   */
  getTodayUnreadCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Fin del día

    return this.notifications.filter(n => 
      !n.read && 
      n.timestamp >= today && 
      n.timestamp < tomorrow
    ).length;
  }

  /**
   * Obtener notificaciones del día actual
   */
  getTodayNotifications(includeRead: boolean = false): AppNotification[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Fin del día

    return this.notifications.filter(n => {
      const isToday = n.timestamp >= today && n.timestamp < tomorrow;
      return includeRead ? isToday : isToday && !n.read;
    });
  }

  /**
   * Mostrar notificación del navegador
   */
  private async showBrowserNotification(notification: AppNotification): Promise<void> {
    if (typeof window === 'undefined' || notification.priority === 'low') return;

    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
          requireInteraction: notification.priority === 'urgent'
        });
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Solicitar permiso para notificaciones del navegador
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }
}

// Instancia singleton
export const notificationService = new NotificationService();

// Helpers para crear notificaciones específicas
export const NotificationHelpers = {
  newProject: (projectName: string, projectId: string) => 
    notificationService.create({
      type: 'new_project',
      priority: 'medium',
      title: 'Nuevo Proyecto Creado',
      message: `Se ha creado el proyecto: ${projectName}`,
      category: 'proyecto',
      data: { entityId: projectId, entityName: projectName },
      actionUrl: `/proyectos/${projectId}`
    }),

  newUnit: (unitName: string, unitId: string, projectName: string) =>
    notificationService.create({
      type: 'new_unit',
      priority: 'medium',
      title: 'Nueva Unidad de Proyecto',
      message: `Se ha creado la unidad "${unitName}" en el proyecto ${projectName}`,
      category: 'unidad',
      data: { entityId: unitId, entityName: unitName },
      actionUrl: `/unidades/${unitId}`
    }),

  newContract: (contractNumber: string, contractId: string, amount: number) =>
    notificationService.create({
      type: 'new_contract',
      priority: 'high',
      title: 'Nuevo Contrato Registrado',
      message: `Contrato ${contractNumber} por $${amount.toLocaleString('es-CO')}`,
      category: 'contrato',
      data: { entityId: contractId, entityName: contractNumber },
      actionUrl: `/contratos/${contractId}`
    }),

  newActivity: (activityName: string, activityId: string) =>
    notificationService.create({
      type: 'new_activity',
      priority: 'medium',
      title: 'Nueva Actividad Registrada',
      message: `Se ha registrado la actividad: ${activityName}`,
      category: 'actividad',
      data: { entityId: activityId, entityName: activityName }
    }),

  updateProject: (projectName: string, projectId: string, changes: Record<string, any>) =>
    notificationService.create({
      type: 'update_project',
      priority: 'low',
      title: 'Proyecto Actualizado',
      message: `El proyecto "${projectName}" ha sido modificado`,
      category: 'proyecto',
      data: { entityId: projectId, entityName: projectName, changes },
      actionUrl: `/proyectos/${projectId}`
    }),

  budgetUpdate: (entityName: string, oldAmount: number, newAmount: number) =>
    notificationService.create({
      type: 'update_budget',
      priority: 'high',
      title: 'Actualización Presupuestal',
      message: `Presupuesto de "${entityName}" cambió de $${oldAmount.toLocaleString('es-CO')} a $${newAmount.toLocaleString('es-CO')}`,
      category: 'presupuesto',
      data: { 
        entityName,
        oldValue: oldAmount,
        newValue: newAmount
      }
    }),

  deadlineWarning: (entityName: string, daysLeft: number, entityType: string) =>
    notificationService.create({
      type: 'deadline_warning',
      priority: daysLeft <= 7 ? 'urgent' : 'high',
      title: 'Alerta de Vencimiento',
      message: `${entityType} "${entityName}" vence en ${daysLeft} días`,
      category: entityType === 'Contrato' ? 'contrato' : 'proyecto',
      data: { entityName, metadata: { daysLeft } }
    }),

  statusChange: (entityName: string, oldStatus: string, newStatus: string, category: AppNotification['category']) =>
    notificationService.create({
      type: 'status_change',
      priority: 'medium',
      title: 'Cambio de Estado',
      message: `"${entityName}" cambió de ${oldStatus} a ${newStatus}`,
      category,
      data: {
        entityName,
        oldValue: oldStatus,
        newValue: newStatus
      }
    })
};

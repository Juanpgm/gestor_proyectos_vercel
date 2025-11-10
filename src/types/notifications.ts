/**
 * Tipos del Sistema de Notificaciones
 * Sistema para rastrear cambios y nuevos registros en la aplicación
 */

export type NotificationType = 
  | 'new_project'
  | 'new_unit'
  | 'new_contract'
  | 'new_activity'
  | 'new_process'
  | 'update_project'
  | 'update_unit'
  | 'update_contract'
  | 'update_activity'
  | 'update_budget'
  | 'deadline_warning'
  | 'status_change'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationData {
  entityId?: string;
  entityName?: string;
  oldValue?: any;
  newValue?: any;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: NotificationData;
  read: boolean;
  timestamp: Date;
  userId?: string;
  category: 'proyecto' | 'unidad' | 'contrato' | 'actividad' | 'proceso' | 'presupuesto' | 'sistema';
  actionUrl?: string;
}

export interface NotificationFilter {
  read?: boolean;
  type?: NotificationType[];
  category?: Notification['category'][];
  priority?: NotificationPriority[];
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<Notification['category'], number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  categories: Record<Notification['category'], boolean>;
}

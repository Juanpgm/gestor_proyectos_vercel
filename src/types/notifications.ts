/**
 * Tipos del Sistema de Notificaciones
 * Sistema para rastrear cambios y nuevos registros en la aplicación
 */

export type NotificationType =
  | "new_project"
  | "new_unit"
  | "new_contract"
  | "new_activity"
  | "new_process"
  | "update_project"
  | "update_unit"
  | "update_contract"
  | "update_activity"
  | "update_budget"
  | "deadline_warning"
  | "status_change"
  | "system"
  // Solicitudes de cambio
  | "solicitud_aprobada"
  | "solicitud_rechazada"
  | "nueva_solicitud";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type NotificationCategory =
  | "proyecto"
  | "unidad"
  | "contrato"
  | "actividad"
  | "proceso"
  | "presupuesto"
  | "sistema"
  | "solicitud_cambio";

export interface NotificationData {
  entityId?: string;
  entityName?: string;
  oldValue?: any;
  newValue?: any;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

/** Notificación local (localStorage) — formato anterior, sigue usándose para eventos del sistema */
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
  category: NotificationCategory;
  actionUrl?: string;
}

/** Notificación del backend (Firestore) — para solicitudes de cambio */
export interface BackendNotification {
  id: string;
  tipo: "solicitud_aprobada" | "solicitud_rechazada" | "nueva_solicitud";
  categoria: "solicitud_cambio";
  titulo: string;
  mensaje: string;
  actor_nombre: string;
  actor_email?: string | null;
  actor_role: string;
  actor_centro_gestor: string | null;
  destinatario_role: string;
  destinatario_centro_gestor: string | null;
  modulo: "emprestito" | "unidades_proyecto" | "intervenciones";
  referencia_id: string | null;
  leida: boolean;
  leida_en: string | null; // ISO timestamp — expira 7d después
  created_at: string; // ISO timestamp
}

export interface NotificationFilter {
  read?: boolean;
  type?: NotificationType[];
  category?: NotificationCategory[];
  priority?: NotificationPriority[];
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  categories: Record<NotificationCategory, boolean>;
}

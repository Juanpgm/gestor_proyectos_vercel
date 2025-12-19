/**
 * Generador de Notificaciones de Ejemplo
 * Crea notificaciones realistas para demostración y pruebas
 */

import type { Notification, NotificationType, NotificationPriority } from '@/types/notifications';

interface NotificationTemplate {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  category: Notification['category'];
  actionUrl: string;
  hoursAgo?: number; // Hace cuántas horas se creó
}

const notificationTemplates: NotificationTemplate[] = [
  // ========== ALERTAS DE VENCIMIENTO ==========
  {
    type: 'deadline_warning',
    priority: 'urgent',
    title: 'Contrato próximo a vencer',
    message: 'El contrato "Construcción Puente Cañaveralejo" vence en 3 días',
    category: 'contrato',
    actionUrl: '/contratos?search=Cañaveralejo&highlight=true',
    hoursAgo: 2
  },
  {
    type: 'deadline_warning',
    priority: 'high',
    title: 'Actividad debe finalizar pronto',
    message: 'La actividad "Estudios de Suelos - Fase 1" debe completarse mañana',
    category: 'actividad',
    actionUrl: '/actividades?filter=proximas_vencer',
    hoursAgo: 5
  },
  {
    type: 'deadline_warning',
    priority: 'medium',
    title: 'Productos próximos a su fecha límite',
    message: '5 productos están próximos a su fecha límite de entrega',
    category: 'presupuesto',
    actionUrl: '/productos?filter=proximos_vencer',
    hoursAgo: 8
  },

  // ========== CAMBIOS DE ESTADO ==========
  {
    type: 'status_change',
    priority: 'high',
    title: 'Proyecto actualizado',
    message: 'El proyecto \'Vía Alternativa Ciudad Jardín\' cambió a estado \'En ejecución\'',
    category: 'proyecto',
    actionUrl: '/proyectos?search=Ciudad+Jardín',
    hoursAgo: 1
  },
  {
    type: 'status_change',
    priority: 'medium',
    title: 'Contrato aprobado',
    message: 'El contrato #5678 \'Mejoramiento Parque El Ingenio\' fue aprobado',
    category: 'contrato',
    actionUrl: '/contratos?id=5678',
    hoursAgo: 3
  },
  {
    type: 'status_change',
    priority: 'low',
    title: 'Actividad completada',
    message: 'La actividad "Diseño Arquitectónico" fue marcada como completada',
    category: 'actividad',
    actionUrl: '/actividades?status=completadas',
    hoursAgo: 12
  },
  {
    type: 'update_unit',
    priority: 'medium',
    title: 'Unidad de proyecto actualizada',
    message: 'La unidad "Bloque A - Hospital del Sur" fue actualizada con nuevos datos',
    category: 'unidad',
    actionUrl: '/project_units?search=Hospital+del+Sur',
    hoursAgo: 6
  },

  // ========== PRESUPUESTO Y FINANZAS ==========
  {
    type: 'update_budget',
    priority: 'urgent',
    title: 'Alerta de presupuesto',
    message: 'El proyecto "Parque Central" superó el 85% del presupuesto asignado',
    category: 'presupuesto',
    actionUrl: '/proyectos?search=Parque+Central&tab=presupuesto',
    hoursAgo: 4
  },
  {
    type: 'update_budget',
    priority: 'high',
    title: 'Nuevo desembolso registrado',
    message: 'Desembolso de $500.000.000 en empréstito BID - Proyecto Movilidad',
    category: 'presupuesto',
    actionUrl: '/emprestito?highlight=desembolso_reciente',
    hoursAgo: 7
  },
  {
    type: 'new_process',
    priority: 'medium',
    title: 'Pago pendiente de aprobación',
    message: 'El proceso #9876 tiene un pago pendiente de revisión',
    category: 'proceso',
    actionUrl: '/procesos?id=9876&tab=pagos',
    hoursAgo: 10
  },

  // ========== AVANCE DE PROYECTOS ==========
  {
    type: 'update_project',
    priority: 'high',
    title: 'Hito alcanzado',
    message: 'El proyecto "Hospital del Valle" alcanzó el 50% de avance físico',
    category: 'proyecto',
    actionUrl: '/proyectos?search=Hospital+del+Valle',
    hoursAgo: 2
  },
  {
    type: 'status_change',
    priority: 'medium',
    title: 'Unidad completada',
    message: 'La unidad "Bloque A - Etapa 1" fue marcada como completada',
    category: 'unidad',
    actionUrl: '/project_units?status=completadas',
    hoursAgo: 15
  },
  {
    type: 'deadline_warning',
    priority: 'high',
    title: 'Retrasos detectados',
    message: 'Se detectaron retrasos en 3 actividades del proyecto "Puente Ortiz"',
    category: 'proyecto',
    actionUrl: '/proyectos?search=Puente+Ortiz&tab=actividades&filter=retrasadas',
    hoursAgo: 5
  },

  // ========== APROBACIONES Y TAREAS PENDIENTES ==========
  {
    type: 'new_contract',
    priority: 'urgent',
    title: 'Contratos pendientes de revisión',
    message: 'Tienes 2 contratos pendientes de revisión y aprobación',
    category: 'contrato',
    actionUrl: '/contratos?filter=pendiente_revision',
    hoursAgo: 1
  },
  {
    type: 'update_project',
    priority: 'high',
    title: 'Solicitud de modificación',
    message: 'Nueva solicitud de modificación en proyecto "Acueducto Oriental"',
    category: 'proyecto',
    actionUrl: '/proyectos?search=Acueducto+Oriental&tab=modificaciones',
    hoursAgo: 3
  },
  {
    type: 'new_contract',
    priority: 'medium',
    title: 'Documento requiere firma',
    message: 'El Acta de Inicio del contrato #1234 requiere tu firma',
    category: 'contrato',
    actionUrl: '/contratos?id=1234&doc=acta_inicio',
    hoursAgo: 9
  },

  // ========== HITOS Y LOGROS ==========
  {
    type: 'status_change',
    priority: 'low',
    title: '¡Proyecto completado!',
    message: 'El proyecto "Escuela Rural Pance" se completó exitosamente',
    category: 'proyecto',
    actionUrl: '/proyectos?search=Escuela+Rural+Pance',
    hoursAgo: 24
  },
  {
    type: 'update_project',
    priority: 'medium',
    title: 'Ejecución al 100%',
    message: 'La Fase 1 del proyecto "Vías Terciarias" alcanzó el 100% de ejecución',
    category: 'proyecto',
    actionUrl: '/proyectos?search=Vías+Terciarias&tab=fases',
    hoursAgo: 18
  },

  // ========== NUEVOS REGISTROS ==========
  {
    type: 'new_project',
    priority: 'medium',
    title: 'Nuevo proyecto creado',
    message: 'Se creó el proyecto "Parque Lineal Meléndez" en el sistema',
    category: 'proyecto',
    actionUrl: '/proyectos?sort=recientes&highlight=nuevo',
    hoursAgo: 6
  },
  {
    type: 'new_unit',
    priority: 'low',
    title: 'Nueva unidad de proyecto',
    message: 'Se registró la unidad "Zona Verde Sur" en el proyecto Parque Central',
    category: 'unidad',
    actionUrl: '/project_units?sort=recientes',
    hoursAgo: 14
  },
  {
    type: 'new_activity',
    priority: 'medium',
    title: 'Nueva actividad programada',
    message: 'Se programó la actividad "Interventoría Técnica" para el 15 de diciembre',
    category: 'actividad',
    actionUrl: '/actividades?sort=recientes',
    hoursAgo: 11
  },

  // ========== ALERTAS DE SISTEMA ==========
  {
    type: 'system',
    priority: 'low',
    title: 'Actualización del sistema',
    message: 'El sistema fue actualizado con nuevas funcionalidades de reportes',
    category: 'sistema',
    actionUrl: '/dashboard',
    hoursAgo: 48
  },
  {
    type: 'system',
    priority: 'medium',
    title: 'Mantenimiento programado',
    message: 'Mantenimiento del sistema programado para el domingo a las 2:00 AM',
    category: 'sistema',
    actionUrl: '/dashboard',
    hoursAgo: 20
  }
];

/**
 * Generar notificaciones de ejemplo con IDs y timestamps realistas
 */
export function generateSampleNotifications(): Omit<Notification, 'id' | 'read'>[] {
  const now = Date.now();
  
  return notificationTemplates.map((template) => {
    // Calcular timestamp en el pasado basado en hoursAgo
    const hoursAgo = template.hoursAgo || 0;
    const timestampMs = now - (hoursAgo * 60 * 60 * 1000);
    
    return {
      type: template.type,
      priority: template.priority,
      title: template.title,
      message: template.message,
      category: template.category,
      actionUrl: template.actionUrl,
      timestamp: new Date(timestampMs), // ✅ Timestamp como Date en el pasado
      data: {
        // Datos adicionales específicos según el tipo
        entityName: template.title.split('"')[1] || 'Sin especificar',
        metadata: {
          hoursAgo: template.hoursAgo || 0
        }
      }
    };
  });
}

/**
 * Obtener notificaciones filtradas por categoría
 */
export function getSampleNotificationsByCategory(category: Notification['category']) {
  return notificationTemplates.filter(n => n.category === category);
}

/**
 * Obtener notificaciones filtradas por prioridad
 */
export function getSampleNotificationsByPriority(priority: NotificationPriority) {
  return notificationTemplates.filter(n => n.priority === priority);
}

/**
 * Obtener notificaciones urgentes (últimas 24 horas)
 */
export function getUrgentNotifications() {
  return notificationTemplates.filter(n => 
    n.priority === 'urgent' || (n.hoursAgo && n.hoursAgo <= 24)
  );
}

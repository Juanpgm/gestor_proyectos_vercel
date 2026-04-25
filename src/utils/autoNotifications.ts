/**
 * Sistema de Notificaciones Automáticas
 * Genera notificaciones cuando ocurren eventos reales en la aplicación
 */

import { notificationService } from '@/services/notificationService';
import type { NotificationType, NotificationPriority, Notification } from '@/types/notifications';

interface AutoNotificationConfig {
  enabled: boolean;
  types: {
    reportes: boolean;
    contratos: boolean;
    proyectos: boolean;
    actividades: boolean;
    presupuesto: boolean;
  };
}

// Configuración por defecto
const defaultConfig: AutoNotificationConfig = {
  enabled: true,
  types: {
    reportes: true,
    contratos: true,
    proyectos: true,
    actividades: true,
    presupuesto: true
  }
};

/**
 * Obtener configuración desde localStorage
 */
function getConfig(): AutoNotificationConfig {
  if (typeof window === 'undefined') return defaultConfig;
  
  try {
    const stored = localStorage.getItem('auto_notifications_config');
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading auto-notification config:', error);
  }
  
  return defaultConfig;
}

/**
 * Guardar configuración
 */
export function setAutoNotificationConfig(config: Partial<AutoNotificationConfig>): void {
  if (typeof window === 'undefined') return;
  
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem('auto_notifications_config', JSON.stringify(updated));
}

/**
 * Notificar cuando se registra un nuevo reporte de empréstito
 */
export function notifyNewEmprestitoReport(data: {
  referencia_contrato: string;
  nombre_contrato?: string;
  avance_fisico?: number;
  avance_financiero?: number;
  fecha_reporte: string;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.reportes) return;

  const priority: NotificationPriority = 
    (data.avance_fisico && data.avance_fisico < 50) ? 'high' : 'medium';

  notificationService.create({
    type: 'update_contract',
    priority,
    title: 'Nuevo reporte de empréstito registrado',
    message: `Se registró un reporte para el contrato "${data.nombre_contrato || data.referencia_contrato}"`,
    category: 'contrato',
    actionUrl: `/emprestito?search=${encodeURIComponent(data.referencia_contrato)}&highlight=true`,
    data: {
      entityId: data.referencia_contrato,
      entityName: data.nombre_contrato || data.referencia_contrato,
      metadata: {
        avance_fisico: data.avance_fisico,
        avance_financiero: data.avance_financiero,
        fecha_reporte: data.fecha_reporte
      }
    }
  });
}

/**
 * Notificar cuando se actualiza un reporte existente
 */
export function notifyEmprestitoReportUpdate(data: {
  referencia_contrato: string;
  nombre_contrato?: string;
  cambios: {
    avance_fisico?: { old: number; new: number };
    avance_financiero?: { old: number; new: number };
  };
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.reportes) return;

  let message = `Se actualizó el reporte del contrato "${data.nombre_contrato || data.referencia_contrato}"`;
  
  if (data.cambios.avance_fisico) {
    const diff = data.cambios.avance_fisico.new - data.cambios.avance_fisico.old;
    message += `. Avance físico: ${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  }

  notificationService.create({
    type: 'update_contract',
    priority: 'medium',
    title: 'Reporte de empréstito actualizado',
    message,
    category: 'contrato',
    actionUrl: `/emprestito?search=${encodeURIComponent(data.referencia_contrato)}`,
    data: {
      entityId: data.referencia_contrato,
      entityName: data.nombre_contrato || data.referencia_contrato,
      changes: data.cambios
    }
  });
}

/**
 * Notificar cuando el avance está muy bajo
 */
export function notifyLowProgress(data: {
  referencia_contrato: string;
  nombre_contrato?: string;
  avance_fisico: number;
  dias_transcurridos?: number;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.reportes) return;

  notificationService.create({
    type: 'deadline_warning',
    priority: 'urgent',
    title: 'Alerta: Avance físico bajo',
    message: `El contrato "${data.nombre_contrato || data.referencia_contrato}" tiene un avance de solo ${data.avance_fisico.toFixed(1)}%`,
    category: 'contrato',
    actionUrl: `/emprestito?search=${encodeURIComponent(data.referencia_contrato)}&tab=reportes`,
    data: {
      entityId: data.referencia_contrato,
      entityName: data.nombre_contrato || data.referencia_contrato,
      metadata: {
        avance_fisico: data.avance_fisico,
        dias_transcurridos: data.dias_transcurridos
      }
    }
  });
}

/**
 * Notificar cuando se crea un nuevo contrato
 */
export function notifyNewContract(data: {
  id: string;
  numero_contrato?: string;
  nombre?: string;
  valor?: number;
  centro_gestor?: string;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.contratos) return;

  notificationService.create({
    type: 'new_contract',
    priority: 'medium',
    title: 'Nuevo contrato registrado',
    message: `Se registró el contrato "${data.nombre || data.numero_contrato || data.id}"`,
    category: 'contrato',
    actionUrl: `/contratos?search=${encodeURIComponent(data.numero_contrato || data.id)}&highlight=true`,
    data: {
      entityId: data.id,
      entityName: data.nombre || data.numero_contrato,
      metadata: {
        valor: data.valor,
        centro_gestor: data.centro_gestor
      }
    }
  });
}

/**
 * Notificar cuando se actualiza un contrato
 */
export function notifyContractUpdate(data: {
  id: string;
  nombre?: string;
  campo_actualizado: string;
  valor_anterior?: any;
  valor_nuevo?: any;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.contratos) return;

  notificationService.create({
    type: 'update_contract',
    priority: 'low',
    title: 'Contrato actualizado',
    message: `Se actualizó "${data.campo_actualizado}" en el contrato "${data.nombre || data.id}"`,
    category: 'contrato',
    actionUrl: `/contratos?search=${encodeURIComponent(data.id)}`,
    data: {
      entityId: data.id,
      entityName: data.nombre,
      changes: {
        [data.campo_actualizado]: {
          old: data.valor_anterior,
          new: data.valor_nuevo
        }
      }
    }
  });
}

/**
 * Notificar cuando se actualiza presupuesto
 */
export function notifyBudgetUpdate(data: {
  proyecto_id: string;
  nombre_proyecto?: string;
  porcentaje_ejecutado: number;
  monto_ejecutado: number;
  monto_total: number;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.presupuesto) return;

  const priority: NotificationPriority = 
    data.porcentaje_ejecutado > 85 ? 'urgent' :
    data.porcentaje_ejecutado > 70 ? 'high' : 'medium';

  notificationService.create({
    type: 'update_budget',
    priority,
    title: data.porcentaje_ejecutado > 85 ? 'Alerta de presupuesto' : 'Actualización de presupuesto',
    message: `El proyecto "${data.nombre_proyecto || data.proyecto_id}" ha ejecutado el ${data.porcentaje_ejecutado.toFixed(1)}% del presupuesto`,
    category: 'presupuesto',
    actionUrl: `/proyectos?search=${encodeURIComponent(data.proyecto_id)}&tab=presupuesto`,
    data: {
      entityId: data.proyecto_id,
      entityName: data.nombre_proyecto,
      metadata: {
        porcentaje_ejecutado: data.porcentaje_ejecutado,
        monto_ejecutado: data.monto_ejecutado,
        monto_total: data.monto_total
      }
    }
  });
}

/**
 * Notificar cuando se crea un nuevo proyecto
 */
export function notifyNewProject(data: {
  bpin: string;
  nombre: string;
  presupuesto?: number;
  estado?: string;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.proyectos) return;

  notificationService.create({
    type: 'new_project',
    priority: 'medium',
    title: 'Nuevo proyecto creado',
    message: `Se creó el proyecto "${data.nombre}"`,
    category: 'proyecto',
    actionUrl: `/proyectos?search=${encodeURIComponent(data.bpin)}&highlight=true`,
    data: {
      entityId: data.bpin,
      entityName: data.nombre,
      metadata: {
        presupuesto: data.presupuesto,
        estado: data.estado
      }
    }
  });
}

/**
 * Notificar cuando un proyecto cambia de estado
 */
export function notifyProjectStatusChange(data: {
  bpin: string;
  nombre: string;
  estado_anterior: string;
  estado_nuevo: string;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.proyectos) return;

  const priority: NotificationPriority = 
    data.estado_nuevo === 'Completado' ? 'high' : 'medium';

  notificationService.create({
    type: 'status_change',
    priority,
    title: data.estado_nuevo === 'Completado' ? '¡Proyecto completado!' : 'Cambio de estado de proyecto',
    message: `El proyecto "${data.nombre}" cambió de "${data.estado_anterior}" a "${data.estado_nuevo}"`,
    category: 'proyecto',
    actionUrl: `/proyectos?search=${encodeURIComponent(data.bpin)}`,
    data: {
      entityId: data.bpin,
      entityName: data.nombre,
      changes: {
        estado: {
          old: data.estado_anterior,
          new: data.estado_nuevo
        }
      }
    }
  });
}

/**
 * Notificar cuando se alcanza un hito de proyecto
 */
export function notifyProjectMilestone(data: {
  bpin: string;
  nombre: string;
  hito: string;
  porcentaje_avance: number;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.proyectos) return;

  notificationService.create({
    type: 'update_project',
    priority: 'high',
    title: '¡Hito alcanzado!',
    message: `El proyecto "${data.nombre}" alcanzó el ${data.porcentaje_avance}% de avance - ${data.hito}`,
    category: 'proyecto',
    actionUrl: `/proyectos?search=${encodeURIComponent(data.bpin)}`,
    data: {
      entityId: data.bpin,
      entityName: data.nombre,
      metadata: {
        hito: data.hito,
        porcentaje_avance: data.porcentaje_avance
      }
    }
  });
}

/**
 * Notificar cuando se crea una actividad
 */
export function notifyNewActivity(data: {
  id: string;
  nombre: string;
  proyecto?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.actividades) return;

  notificationService.create({
    type: 'new_activity',
    priority: 'low',
    title: 'Nueva actividad programada',
    message: `Se programó la actividad "${data.nombre}"`,
    category: 'actividad',
    actionUrl: `/actividades?search=${encodeURIComponent(data.id)}&highlight=true`,
    data: {
      entityId: data.id,
      entityName: data.nombre,
      metadata: {
        proyecto: data.proyecto,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin
      }
    }
  });
}

/**
 * Notificar cuando una actividad se completa
 */
export function notifyActivityCompleted(data: {
  id: string;
  nombre: string;
  proyecto?: string;
}) {
  const config = getConfig();
  if (!config.enabled || !config.types.actividades) return;

  notificationService.create({
    type: 'status_change',
    priority: 'medium',
    title: 'Actividad completada',
    message: `La actividad "${data.nombre}" fue marcada como completada`,
    category: 'actividad',
    actionUrl: `/actividades?search=${encodeURIComponent(data.id)}`,
    data: {
      entityId: data.id,
      entityName: data.nombre,
      metadata: {
        proyecto: data.proyecto
      }
    }
  });
}

/**
 * Verificar y notificar deadlines próximos
 */
export function checkAndNotifyDeadlines(contratos: any[]): void {
  const config = getConfig();
  if (!config.enabled || !config.types.contratos) return;

  const now = new Date();
  
  contratos.forEach(contrato => {
    if (!contrato.fecha_terminacion) return;
    
    const fechaTerminacion = new Date(contrato.fecha_terminacion);
    const diasRestantes = Math.ceil((fechaTerminacion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes > 0 && diasRestantes <= 7) {
      notificationService.create({
        type: 'deadline_warning',
        priority: diasRestantes <= 3 ? 'urgent' : 'high',
        title: 'Contrato próximo a vencer',
        message: `El contrato "${contrato.nombre || contrato.numero_contrato}" vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`,
        category: 'contrato',
        actionUrl: `/contratos?search=${encodeURIComponent(contrato.numero_contrato || contrato.id)}`,
        data: {
          entityId: contrato.id,
          entityName: contrato.nombre || contrato.numero_contrato,
          metadata: {
            dias_restantes: diasRestantes,
            fecha_terminacion: contrato.fecha_terminacion
          }
        }
      });
    }
  });
}

/**
 * Notification Tracker
 * Sistema para rastrear cambios en datos y generar notificaciones automáticas
 */

'use client';

import { useEffect, useRef } from 'react';
import { NotificationHelpers } from '@/services/notificationService';

interface TrackedData {
  proyectos?: any[];
  unidades?: any[];
  contratos?: any[];
  actividades?: any[];
  procesos?: any[];
}

/**
 * Hook para rastrear cambios en datos y generar notificaciones automáticamente
 */
export function useDataChangeTracker(data: TrackedData) {
  const previousData = useRef<TrackedData>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    // No procesar en el primer render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousData.current = data;
      return;
    }

    // Detectar nuevos proyectos
    if (data.proyectos && previousData.current.proyectos) {
      const newProjects = data.proyectos.filter(
        proyecto => !previousData.current.proyectos?.some(p => p.id === proyecto.id)
      );
      
      newProjects.forEach(proyecto => {
        NotificationHelpers.newProject(
          proyecto.nombre || proyecto.nombre_proyecto || 'Proyecto sin nombre',
          proyecto.id || proyecto.codigo
        );
      });

      // Detectar cambios en proyectos existentes
      data.proyectos.forEach(proyecto => {
        const oldProject = previousData.current.proyectos?.find(p => p.id === proyecto.id);
        if (oldProject) {
          // Verificar cambios significativos
          const changes: Record<string, any> = {};

          if (oldProject.estado !== proyecto.estado) {
            changes.estado = { old: oldProject.estado, new: proyecto.estado };
            NotificationHelpers.statusChange(
              proyecto.nombre || proyecto.nombre_proyecto,
              oldProject.estado,
              proyecto.estado,
              'proyecto'
            );
          }

          if (oldProject.presupuesto !== proyecto.presupuesto) {
            changes.presupuesto = { old: oldProject.presupuesto, new: proyecto.presupuesto };
            NotificationHelpers.budgetUpdate(
              proyecto.nombre || proyecto.nombre_proyecto,
              oldProject.presupuesto,
              proyecto.presupuesto
            );
          }

          if (Object.keys(changes).length > 0) {
            NotificationHelpers.updateProject(
              proyecto.nombre || proyecto.nombre_proyecto,
              proyecto.id || proyecto.codigo,
              changes
            );
          }
        }
      });
    }

    // Detectar nuevas unidades de proyecto
    if (data.unidades && previousData.current.unidades) {
      const newUnits = data.unidades.filter(
        unidad => !previousData.current.unidades?.some(u => u.id === unidad.id)
      );
      
      newUnits.forEach(unidad => {
        NotificationHelpers.newUnit(
          unidad.nombre_unidad_proyecto || unidad.nombre || 'Unidad sin nombre',
          unidad.id || unidad.codigo,
          unidad.nombre_proyecto || 'Proyecto'
        );
      });
    }

    // Detectar nuevos contratos
    if (data.contratos && previousData.current.contratos) {
      const newContracts = data.contratos.filter(
        contrato => !previousData.current.contratos?.some(c => c.id === contrato.id)
      );
      
      newContracts.forEach(contrato => {
        NotificationHelpers.newContract(
          contrato.numero_contrato || contrato.codigo || 'Contrato',
          contrato.id || contrato.codigo,
          contrato.valor_inicial || contrato.valor || 0
        );
      });

      // Detectar cambios en contratos
      data.contratos.forEach(contrato => {
        const oldContract = previousData.current.contratos?.find(c => c.id === contrato.id);
        if (oldContract) {
          if (oldContract.estado !== contrato.estado) {
            NotificationHelpers.statusChange(
              contrato.numero_contrato || contrato.codigo,
              oldContract.estado,
              contrato.estado,
              'contrato'
            );
          }

          // Alerta de vencimiento (7 días antes)
          if (contrato.fecha_finalizacion) {
            const endDate = new Date(contrato.fecha_finalizacion);
            const now = new Date();
            const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft > 0 && daysLeft <= 7 && oldContract.notifiedDeadline !== true) {
              NotificationHelpers.deadlineWarning(
                contrato.numero_contrato || contrato.codigo,
                daysLeft,
                'Contrato'
              );
              // Marcar como notificado
              contrato.notifiedDeadline = true;
            }
          }
        }
      });
    }

    // Detectar nuevas actividades
    if (data.actividades && previousData.current.actividades) {
      const newActivities = data.actividades.filter(
        actividad => !previousData.current.actividades?.some(a => a.id === actividad.id)
      );
      
      newActivities.forEach(actividad => {
        NotificationHelpers.newActivity(
          actividad.nombre || actividad.descripcion || 'Actividad',
          actividad.id || actividad.codigo
        );
      });
    }

    // Actualizar la referencia para la próxima comparación
    previousData.current = JSON.parse(JSON.stringify(data));
  }, [data]);
}


/**
 * Hook centralizado para notificaciones automáticas de todos los módulos
 * Monitorea cambios en proyectos, contratos, actividades y productos
 */

'use client';

import { useEffect, useRef } from 'react';
import {
  notifyNewContract,
  notifyContractUpdate,
  notifyNewActivity,
  notifyActivityCompleted,
  notifyNewProject,
  notifyProjectStatusChange,
  checkAndNotifyDeadlines
} from '@/utils/autoNotifications';

interface Contrato {
  id?: string;
  numero_contrato?: string;
  nombre?: string;
  valor?: number;
  centro_gestor?: string;
  estado?: string;
  fecha_terminacion?: string;
}

interface Actividad {
  id: string;
  nombre_actividad?: string;
  descripcion_actividad?: string;
  bpin?: number;
  estado?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

interface Proyecto {
  bpin: string | number;
  nombre_proyecto?: string;
  presupuesto_total?: number;
  estado?: string;
}

/**
 * Hook para monitorear cambios en contratos
 */
export function useContractNotifications(
  contratos: any[],
  enabled: boolean = true
) {
  const previousContratosRef = useRef<Map<string, any>>(new Map());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!enabled || !contratos || contratos.length === 0) return;

    // Primera carga: solo guardar estado inicial
    if (initialLoadRef.current) {
      contratos.forEach(contrato => {
        if (contrato.id) {
          previousContratosRef.current.set(contrato.id, { ...contrato });
        }
      });
      initialLoadRef.current = false;
      console.log(`📋 Monitoreando ${contratos.length} contratos`);
      return;
    }

    const currentContratos = new Map<string, Contrato>();

    contratos.forEach(contrato => {
      if (!contrato.id) return;

      currentContratos.set(contrato.id, contrato);
      const previous = previousContratosRef.current.get(contrato.id);

      // NUEVO CONTRATO
      if (!previous) {
        console.log(`🆕 Nuevo contrato detectado: ${contrato.numero_contrato || contrato.id}`);
        notifyNewContract({
          id: contrato.id,
          numero_contrato: contrato.numero_contrato,
          nombre: contrato.nombre,
          valor: contrato.valor,
          centro_gestor: contrato.centro_gestor
        });
      }
      // CONTRATO ACTUALIZADO
      else {
        // Detectar cambios en el estado
        if (previous.estado !== contrato.estado && contrato.estado) {
          notifyContractUpdate({
            id: contrato.id,
            nombre: contrato.nombre || contrato.numero_contrato,
            campo_actualizado: 'estado',
            valor_anterior: previous.estado,
            valor_nuevo: contrato.estado
          });
        }
      }
    });

    // Actualizar referencia
    previousContratosRef.current = currentContratos;

  }, [contratos, enabled]);
}

/**
 * Hook para verificar deadlines de contratos
 */
export function useContractDeadlineNotifications(
  contratos: any[],
  enabled: boolean = true,
  checkIntervalMinutes: number = 60
) {
  const lastCheckRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!enabled || !contratos || contratos.length === 0) return;

    const now = new Date();
    
    // Verificar si ya pasó el intervalo
    if (
      lastCheckRef.current &&
      (now.getTime() - lastCheckRef.current.getTime()) < checkIntervalMinutes * 60 * 1000
    ) {
      return;
    }

    checkAndNotifyDeadlines(contratos);
    lastCheckRef.current = now;

  }, [contratos, enabled, checkIntervalMinutes]);
}

/**
 * Hook para monitorear cambios en actividades
 */
export function useActivityNotifications(
  actividades: any[],
  enabled: boolean = true
) {
  const previousActividadesRef = useRef<Map<string, any>>(new Map());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!enabled || !actividades || actividades.length === 0) return;

    // Primera carga
    if (initialLoadRef.current) {
      actividades.forEach(actividad => {
        if (actividad.id) {
          previousActividadesRef.current.set(actividad.id, { ...actividad });
        }
      });
      initialLoadRef.current = false;
      console.log(`📅 Monitoreando ${actividades.length} actividades`);
      return;
    }

    const currentActividades = new Map<string, Actividad>();

    actividades.forEach(actividad => {
      if (!actividad.id) return;

      currentActividades.set(actividad.id, actividad);
      const previous = previousActividadesRef.current.get(actividad.id);

      // NUEVA ACTIVIDAD
      if (!previous) {
        console.log(`🆕 Nueva actividad detectada: ${actividad.nombre_actividad || actividad.id}`);
        notifyNewActivity({
          id: actividad.id,
          nombre: actividad.nombre_actividad || 'Actividad sin nombre',
          proyecto: actividad.bpin?.toString(),
          fecha_inicio: actividad.fecha_inicio,
          fecha_fin: actividad.fecha_fin
        });
      }
      // ACTIVIDAD ACTUALIZADA
      else {
        // Detectar si se completó
        if (
          previous.estado !== 'completada' &&
          actividad.estado === 'completada'
        ) {
          console.log(`✅ Actividad completada: ${actividad.nombre_actividad || actividad.id}`);
          notifyActivityCompleted({
            id: actividad.id,
            nombre: actividad.nombre_actividad || 'Actividad sin nombre',
            proyecto: actividad.bpin?.toString()
          });
        }
      }
    });

    // Actualizar referencia
    previousActividadesRef.current = currentActividades;

  }, [actividades, enabled]);
}

/**
 * Hook para monitorear cambios en proyectos
 */
export function useProjectNotifications(
  proyectos: any[],
  enabled: boolean = true
) {
  const previousProyectosRef = useRef<Map<string, any>>(new Map());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!enabled || !proyectos || proyectos.length === 0) return;

    // Primera carga
    if (initialLoadRef.current) {
      proyectos.forEach(proyecto => {
        if (proyecto.bpin) {
          const key = String(proyecto.bpin);
          previousProyectosRef.current.set(key, { ...proyecto });
        }
      });
      initialLoadRef.current = false;
      console.log(`🏗️ Monitoreando ${proyectos.length} proyectos`);
      return;
    }

    const currentProyectos = new Map<string, Proyecto>();

    proyectos.forEach(proyecto => {
      if (!proyecto.bpin) return;

      const key = String(proyecto.bpin);
      currentProyectos.set(key, proyecto);
      const previous = previousProyectosRef.current.get(key);

      // NUEVO PROYECTO
      if (!previous) {
        console.log(`🆕 Nuevo proyecto detectado: ${proyecto.nombre_proyecto || proyecto.bpin}`);
        notifyNewProject({
          bpin: String(proyecto.bpin),
          nombre: proyecto.nombre_proyecto || 'Proyecto sin nombre',
          presupuesto: proyecto.presupuesto_total,
          estado: proyecto.estado
        });
      }
      // PROYECTO ACTUALIZADO
      else {
        // Detectar cambios en el estado
        if (previous.estado !== proyecto.estado && proyecto.estado) {
          console.log(`🔄 Cambio de estado en proyecto: ${proyecto.nombre_proyecto || proyecto.bpin}`);
          notifyProjectStatusChange({
            bpin: String(proyecto.bpin),
            nombre: proyecto.nombre_proyecto || 'Proyecto sin nombre',
            estado_anterior: previous.estado || 'Desconocido',
            estado_nuevo: proyecto.estado
          });
        }
      }
    });

    // Actualizar referencia
    previousProyectosRef.current = currentProyectos;

  }, [proyectos, enabled]);
}

/**
 * Hook combinado para todas las notificaciones automáticas
 */
export function useAllAutoNotifications(data: {
  proyectos?: any[];
  contratos?: any[];
  actividades?: any[];
  enabled?: boolean;
}) {
  const { proyectos = [], contratos = [], actividades = [], enabled = true } = data;

  // Monitorear proyectos
  useProjectNotifications(proyectos, enabled);

  // Monitorear contratos
  useContractNotifications(contratos, enabled);
  useContractDeadlineNotifications(contratos, enabled);

  // Monitorear actividades
  useActivityNotifications(actividades, enabled);
}

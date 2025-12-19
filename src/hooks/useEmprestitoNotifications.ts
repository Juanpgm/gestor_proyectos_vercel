/**
 * Hook para Notificaciones Automáticas de Empréstito
 * Monitorea cambios y genera notificaciones en tiempo real
 */

'use client';

import { useEffect, useRef } from 'react';
import {
  notifyNewEmprestitoReport,
  notifyEmprestitoReportUpdate,
  notifyLowProgress,
  notifyBudgetUpdate,
  notifyProjectMilestone,
  checkAndNotifyDeadlines
} from '@/utils/autoNotifications';

interface ReporteContrato {
  referencia_del_contrato?: string;
  id_contrato?: string;
  descripcion_del_proceso?: string;
  proveedor_adjudicado?: string;
  valor_del_contrato?: number;
  valor_pagado?: number;
  valor_facturado?: number;
  fecha_de_firma?: string;
  fecha_de_fin_del_contrato?: string;
}

/**
 * Hook para monitorear cambios en reportes de empréstito
 */
export function useEmprestitoNotifications(
  reportes: ReporteContrato[],
  enabled: boolean = true
) {
  const previousReportesRef = useRef<Map<string, ReporteContrato>>(new Map());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!enabled || !reportes || reportes.length === 0) return;

    // En la primera carga, solo guardar el estado inicial
    if (initialLoadRef.current) {
      reportes.forEach(reporte => {
        const key = reporte.referencia_del_contrato || reporte.id_contrato;
        if (key) {
          previousReportesRef.current.set(key, { ...reporte });
        }
      });
      initialLoadRef.current = false;
      console.log(`📊 Sistema de notificaciones inicializado - monitoreando ${reportes.length} contratos`);
      return;
    }

    const currentReportes = new Map<string, ReporteContrato>();
    let cambiosDetectados = 0;

    reportes.forEach(reporte => {
      const key = reporte.referencia_del_contrato || reporte.id_contrato;
      if (!key) return;

      currentReportes.set(key, reporte);
      const previous = previousReportesRef.current.get(key);

      // NUEVO REPORTE/CONTRATO
      if (!previous) {
        console.log(`🆕 Nuevo contrato detectado: ${key}`);
        cambiosDetectados++;
        notifyNewEmprestitoReport({
          referencia_contrato: key,
          nombre_contrato: reporte.descripcion_del_proceso,
          avance_fisico: reporte.valor_facturado && reporte.valor_del_contrato 
            ? (reporte.valor_facturado / reporte.valor_del_contrato) * 100 
            : 0,
          avance_financiero: reporte.valor_pagado && reporte.valor_del_contrato
            ? (reporte.valor_pagado / reporte.valor_del_contrato) * 100
            : 0,
          fecha_reporte: reporte.fecha_de_firma || new Date().toISOString()
        });

        // Verificar si el avance es muy bajo
        const avanceFisico = reporte.valor_facturado && reporte.valor_del_contrato 
          ? (reporte.valor_facturado / reporte.valor_del_contrato) * 100 
          : 0;
          
        if (avanceFisico < 30 && avanceFisico > 0) {
          notifyLowProgress({
            referencia_contrato: key,
            nombre_contrato: reporte.descripcion_del_proceso,
            avance_fisico: avanceFisico
          });
        }
      }
      // CONTRATO ACTUALIZADO
      else {
        const cambios: any = {};
        let hasChanges = false;

        // Detectar cambios en valor pagado (avance financiero)
        if (
          previous.valor_pagado !== undefined &&
          reporte.valor_pagado !== undefined &&
          Math.abs(previous.valor_pagado - reporte.valor_pagado) > 1000 // Cambios mayores a 1000
        ) {
          cambios.valor_pagado = {
            old: previous.valor_pagado,
            new: reporte.valor_pagado
          };
          hasChanges = true;
        }

        // Detectar cambios en valor facturado
        if (
          previous.valor_facturado !== undefined &&
          reporte.valor_facturado !== undefined &&
          Math.abs(previous.valor_facturado - reporte.valor_facturado) > 1000
        ) {
          cambios.valor_facturado = {
            old: previous.valor_facturado,
            new: reporte.valor_facturado
          };
          hasChanges = true;
        }

        // Notificar si hubo cambios significativos
        if (hasChanges) {
          console.log(`🔄 Cambios detectados en ${key}:`, cambios);
          cambiosDetectados++;
          notifyEmprestitoReportUpdate({
            referencia_contrato: key,
            nombre_contrato: reporte.descripcion_del_proceso,
            cambios
          });
        }

        // Calcular avance actual
        const avanceFisico = reporte.valor_facturado && reporte.valor_del_contrato 
          ? (reporte.valor_facturado / reporte.valor_del_contrato) * 100 
          : 0;

        // Alertas especiales - solo si el avance es bajo
        if (avanceFisico < 30 && avanceFisico > 0) {
          const previousAvance = previous.valor_facturado && previous.valor_del_contrato
            ? (previous.valor_facturado / previous.valor_del_contrato) * 100
            : 0;
          
          // Solo notificar si no había alerta antes
          if (previousAvance >= 30) {
            notifyLowProgress({
              referencia_contrato: key,
              nombre_contrato: reporte.descripcion_del_proceso,
              avance_fisico: avanceFisico
            });
          }
        }

        // Notificar hitos alcanzados basados en avance
        const previousAvance = previous.valor_facturado && previous.valor_del_contrato
          ? (previous.valor_facturado / previous.valor_del_contrato) * 100
          : 0;
        
        if (previousAvance > 0 && avanceFisico > 0) {
          const hitos = [25, 50, 75, 100];
          hitos.forEach(hito => {
            if (previousAvance < hito && avanceFisico >= hito) {
              notifyProjectMilestone({
                bpin: key,
                nombre: reporte.descripcion_del_proceso || key,
                hito: `${hito}% de ejecución`,
                porcentaje_avance: hito
              });
            }
          });
        }
      }

      // Notificar si el presupuesto está alto
      if (
        reporte.valor_pagado !== undefined &&
        reporte.valor_del_contrato !== undefined &&
        reporte.valor_del_contrato > 0
      ) {
        const porcentajeEjecutado = (reporte.valor_pagado / reporte.valor_del_contrato) * 100;
        
        if (porcentajeEjecutado > 85) {
          const previous = previousReportesRef.current.get(key);
          const previousPorcentaje = previous?.valor_pagado && previous?.valor_del_contrato
            ? (previous.valor_pagado / previous.valor_del_contrato) * 100
            : 0;

          // Solo notificar si cruzó el umbral del 85%
          if (previousPorcentaje <= 85) {
            notifyBudgetUpdate({
              proyecto_id: key,
              nombre_proyecto: reporte.descripcion_del_proceso,
              porcentaje_ejecutado: porcentajeEjecutado,
              monto_ejecutado: reporte.valor_pagado,
              monto_total: reporte.valor_del_contrato
            });
          }
        }
      }
    });

    // Actualizar referencia para la próxima comparación
    previousReportesRef.current = currentReportes;
    
    if (cambiosDetectados > 0) {
      console.log(`✅ Total de cambios detectados: ${cambiosDetectados}`);
    }

  }, [reportes, enabled]);
}

/**
 * Hook para verificar deadlines de contratos
 */
export function useContractDeadlineNotifications(
  contratos: any[],
  enabled: boolean = true,
  checkIntervalMinutes: number = 60 // Verificar cada hora por defecto
) {
  const lastCheckRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!enabled || !contratos || contratos.length === 0) return;

    const now = new Date();
    
    // Verificar si ya pasó el intervalo desde la última revisión
    if (
      lastCheckRef.current &&
      (now.getTime() - lastCheckRef.current.getTime()) < checkIntervalMinutes * 60 * 1000
    ) {
      return;
    }

    // Verificar y notificar deadlines
    checkAndNotifyDeadlines(contratos);
    lastCheckRef.current = now;

  }, [contratos, enabled, checkIntervalMinutes]);
}

/**
 * Hook combinado para todas las notificaciones de empréstito
 */
export function useEmprestitoAutoNotifications(data: {
  reportes?: ReporteContrato[];
  contratos?: any[];
  enabled?: boolean;
}) {
  const { reportes = [], contratos = [], enabled = true } = data;

  // Monitorear cambios en reportes
  useEmprestitoNotifications(reportes, enabled);

  // Monitorear deadlines de contratos
  useContractDeadlineNotifications(contratos, enabled);
}

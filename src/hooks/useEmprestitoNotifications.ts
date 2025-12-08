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
  referencia_contrato: string;
  nombre_contrato?: string;
  avance_fisico?: number;
  avance_financiero?: number;
  fecha_reporte?: string;
  valor_ejecutado?: number;
  valor_contrato?: number;
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
        if (reporte.referencia_contrato) {
          previousReportesRef.current.set(reporte.referencia_contrato, { ...reporte });
        }
      });
      initialLoadRef.current = false;
      console.log(`📊 Sistema de notificaciones inicializado - monitoreando ${reportes.length} contratos`);
      return;
    }

    const currentReportes = new Map<string, ReporteContrato>();
    let cambiosDetectados = 0;

    reportes.forEach(reporte => {
      if (!reporte.referencia_contrato) return;

      currentReportes.set(reporte.referencia_contrato, reporte);
      const previous = previousReportesRef.current.get(reporte.referencia_contrato);

      // NUEVO REPORTE
      if (!previous) {
        console.log(`🆕 Nuevo reporte detectado: ${reporte.referencia_contrato}`);
        cambiosDetectados++;
        notifyNewEmprestitoReport({
          referencia_contrato: reporte.referencia_contrato,
          nombre_contrato: reporte.nombre_contrato,
          avance_fisico: reporte.avance_fisico,
          avance_financiero: reporte.avance_financiero,
          fecha_reporte: reporte.fecha_reporte || new Date().toISOString()
        });

        // Verificar si el avance es muy bajo
        if (reporte.avance_fisico !== undefined && reporte.avance_fisico < 30) {
          notifyLowProgress({
            referencia_contrato: reporte.referencia_contrato,
            nombre_contrato: reporte.nombre_contrato,
            avance_fisico: reporte.avance_fisico
          });
        }
      }
      // REPORTE ACTUALIZADO
      else {
        const cambios: any = {};
        let hasChanges = false;

        // Detectar cambios en avance físico
        if (
          previous.avance_fisico !== undefined &&
          reporte.avance_fisico !== undefined &&
          Math.abs(previous.avance_fisico - reporte.avance_fisico) > 0.1
        ) {
          cambios.avance_fisico = {
            old: previous.avance_fisico,
            new: reporte.avance_fisico
          };
          hasChanges = true;
        }

        // Detectar cambios en avance financiero
        if (
          previous.avance_financiero !== undefined &&
          reporte.avance_financiero !== undefined &&
          Math.abs(previous.avance_financiero - reporte.avance_financiero) > 0.1
        ) {
          cambios.avance_financiero = {
            old: previous.avance_financiero,
            new: reporte.avance_financiero
          };
          hasChanges = true;
        }

        // Notificar si hubo cambios significativos
        if (hasChanges) {
          console.log(`🔄 Cambios detectados en ${reporte.referencia_contrato}:`, cambios);
          cambiosDetectados++;
          notifyEmprestitoReportUpdate({
            referencia_contrato: reporte.referencia_contrato,
            nombre_contrato: reporte.nombre_contrato,
            cambios
          });
        }

        // Alertas especiales
        if (reporte.avance_fisico !== undefined && reporte.avance_fisico < 30) {
          notifyLowProgress({
            referencia_contrato: reporte.referencia_contrato,
            nombre_contrato: reporte.nombre_contrato,
            avance_fisico: reporte.avance_fisico
          });
        }

        // Notificar hitos alcanzados
        if (
          reporte.avance_fisico !== undefined &&
          previous.avance_fisico !== undefined
        ) {
          const hitos = [25, 50, 75, 100];
          hitos.forEach(hito => {
            if (previous.avance_fisico! < hito && reporte.avance_fisico! >= hito) {
              notifyProjectMilestone({
                bpin: reporte.referencia_contrato,
                nombre: reporte.nombre_contrato || reporte.referencia_contrato,
                hito: `${hito}% de ejecución`,
                porcentaje_avance: hito
              });
            }
          });
        }
      }

      // Notificar si el presupuesto está alto
      if (
        reporte.valor_ejecutado !== undefined &&
        reporte.valor_contrato !== undefined &&
        reporte.valor_contrato > 0
      ) {
        const porcentajeEjecutado = (reporte.valor_ejecutado / reporte.valor_contrato) * 100;
        
        if (porcentajeEjecutado > 85) {
          const previous = previousReportesRef.current.get(reporte.referencia_contrato);
          const previousPorcentaje = previous?.valor_ejecutado && previous?.valor_contrato
            ? (previous.valor_ejecutado / previous.valor_contrato) * 100
            : 0;

          // Solo notificar si cruzó el umbral del 85%
          if (previousPorcentaje <= 85) {
            notifyBudgetUpdate({
              proyecto_id: reporte.referencia_contrato,
              nombre_proyecto: reporte.nombre_contrato,
              porcentaje_ejecutado: porcentajeEjecutado,
              monto_ejecutado: reporte.valor_ejecutado,
              monto_total: reporte.valor_contrato
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

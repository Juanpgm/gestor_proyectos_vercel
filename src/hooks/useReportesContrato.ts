"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentIdToken } from "@/lib/firebase";
import { proxyFetch } from "@/utils/errorHandler";
import type {
  ReporteContrato,
  ReporteContratoFormData,
  ResumenReportesContrato,
} from "@/types/avances-emprestito";

const API_BASE = "/api/proxy";
// URL directa del backend — se usa para subir archivos grandes y evitar
// el límite de body size de Vercel (4.5 MB en Hobby).
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * Hook para gestionar reportes de contratos de empréstito
 * Usa endpoints reales del backend (Firebase + Google Drive)
 */
export function useReportesContrato(referenciaContrato?: string) {
  const [reportes, setReportes] = useState<ReporteContrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cargar reportes por referencia de contrato
  const fetchReportes = useCallback(async () => {
    if (!referenciaContrato) return;

    setLoading(true);
    setError(null);

    try {
      const res = await proxyFetch(
        `${API_BASE}/reportes_contratos/referencia/${encodeURIComponent(referenciaContrato)}`,
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const reportesList: ReporteContrato[] = data.data || [];

      // Ordenar por fecha descendente
      reportesList.sort((a, b) => {
        const dateA = new Date(a.fecha_reporte || 0).getTime();
        const dateB = new Date(b.fecha_reporte || 0).getTime();
        return dateB - dateA;
      });

      setReportes(reportesList);
    } catch (err) {
      console.error("Error fetching reportes:", err);
      setError(err instanceof Error ? err.message : "Error cargando reportes");
    } finally {
      setLoading(false);
    }
  }, [referenciaContrato]);

  // Crear reporte de avance (usa FormData para subir archivos)
  const crearReporte = useCallback(
    async (formData: ReporteContratoFormData): Promise<boolean> => {
      setSubmitting(true);
      setError(null);

      try {
        const body = new FormData();
        body.append("referencia_contrato", formData.referencia_contrato);
        body.append("observaciones", formData.observaciones);
        body.append("avance_fisico", String(formData.avance_fisico));
        body.append("avance_financiero", String(formData.avance_financiero));
        body.append("alertas_descripcion", formData.alertas_descripcion);
        body.append("alertas_es_alerta", String(formData.alertas_es_alerta));

        if (formData.alertas_tipo_alerta) {
          body.append("alertas_tipo_alerta", formData.alertas_tipo_alerta);
        }

        // Adjuntar archivos
        formData.archivos_evidencia.forEach((file) => {
          body.append("archivos_evidencia", file);
        });

        // Obtener token de autenticación para identificar usuario y rol
        const idToken = await getCurrentIdToken();
        const authHeaders: Record<string, string> = idToken
          ? { Authorization: `Bearer ${idToken}` }
          : {};

        // Calcular tamaño total de archivos para decidir ruta de envío
        const totalFileSize = formData.archivos_evidencia.reduce(
          (sum, f) => sum + f.size,
          0,
        );
        // Vercel Hobby limita el body de serverless functions a 4.5 MB.
        // Si los archivos superan 4 MB (con margen para campos del form),
        // enviamos directo al backend para evitar el error.
        const VERCEL_SAFE_LIMIT = 4 * 1024 * 1024; // 4 MB con margen de seguridad
        const useDirectUpload =
          BACKEND_URL && totalFileSize > VERCEL_SAFE_LIMIT;

        let res: Response;

        if (useDirectUpload) {
          // Subida directa al backend — evita límite de Vercel
          console.log(
            `📤 Subida directa al backend (${(totalFileSize / (1024 * 1024)).toFixed(2)} MB)`,
          );
          res = await fetch(`${BACKEND_URL}/reportes_contratos/`, {
            method: "POST",
            body,
            headers: authHeaders,
          });
        } else {
          // Subida a través del proxy de Next.js (archivos pequeños)
          res = await fetch("/api/reportes-contratos", {
            method: "POST",
            body,
            headers: authHeaders,
          });
        }

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const detail = errorData.detail;
          let errorMsg: string;
          if (Array.isArray(detail)) {
            // FastAPI validation errors
            errorMsg = detail
              .map(
                (d: { loc?: string[]; msg?: string }) =>
                  `${(d.loc || []).join(".")}: ${d.msg}`,
              )
              .join("; ");
          } else {
            errorMsg =
              errorData.error ||
              errorData.detail ||
              errorData.message ||
              `Error ${res.status}: ${res.statusText}`;
          }
          throw new Error(errorMsg);
        }

        // Recargar reportes después de crear
        await fetchReportes();
        return true;
      } catch (err) {
        console.error("Error creando reporte:", err);
        const msg =
          err instanceof Error ? err.message : "Error creando reporte";
        setError(msg);
        // Re-throw para que el modal pueda mostrar el mensaje específico
        throw new Error(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [fetchReportes],
  );

  // Eliminar reporte por ID (solo super_admin)
  const eliminarReporte = useCallback(
    async (reporteId: string): Promise<boolean> => {
      try {
        const res = await proxyFetch(
          `${API_BASE}/reportes_contratos/${encodeURIComponent(reporteId)}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData?.detail || errData?.error || `Error ${res.status}`,
          );
        }
        await fetchReportes();
        return true;
      } catch (err) {
        console.error("Error eliminando reporte:", err);
        setError(
          err instanceof Error ? err.message : "Error eliminando reporte",
        );
        return false;
      }
    },
    [fetchReportes],
  );

  // Cargar reportes al montar y cuando cambie la referencia
  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  return {
    reportes,
    loading,
    error,
    submitting,
    crearReporte,
    eliminarReporte,
    refetch: fetchReportes,
  };
}

/**
 * Hook para calcular resumen de reportes de un contrato
 */
export function useResumenReportes(
  reportes: ReporteContrato[],
): ResumenReportesContrato {
  if (reportes.length === 0) {
    return {
      total_reportes: 0,
      ultimo_avance_fisico: 0,
      ultimo_avance_financiero: 0,
      ultima_fecha_reporte: null,
      tiene_alertas_activas: false,
      tendencia_fisica: "sin_datos",
      tendencia_financiera: "sin_datos",
    };
  }

  // Los reportes ya vienen ordenados desc por fecha
  const ultimo = reportes[0];
  const penultimo = reportes.length > 1 ? reportes[1] : null;

  const calcTendencia = (
    actual: number,
    anterior: number | null,
  ): "subiendo" | "bajando" | "estable" | "sin_datos" => {
    if (anterior === null) return "sin_datos";
    if (actual > anterior) return "subiendo";
    if (actual < anterior) return "bajando";
    return "estable";
  };

  return {
    total_reportes: reportes.length,
    ultimo_avance_fisico: ultimo.avance_fisico || 0,
    ultimo_avance_financiero: ultimo.avance_financiero || 0,
    ultima_fecha_reporte: ultimo.fecha_reporte || null,
    tiene_alertas_activas: reportes.some((r) => r.alertas?.es_alerta),
    tendencia_fisica: calcTendencia(
      ultimo.avance_fisico || 0,
      penultimo ? penultimo.avance_fisico || 0 : null,
    ),
    tendencia_financiera: calcTendencia(
      ultimo.avance_financiero || 0,
      penultimo ? penultimo.avance_financiero || 0 : null,
    ),
  };
}

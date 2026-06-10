"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Clock,
  Loader2,
  Activity,
  BarChart3,
  Calendar,
  ExternalLink,
  Download,
  Trash2,
} from "lucide-react";
import {
  useReportesCentroGestorDashboard,
  type CentroGestorResumen,
} from "@/hooks/useReportesCentroGestor";
import type { ReporteContrato } from "@/types/avances-emprestito";
import { getCentroGestorAccessFromSession } from "@/utils/centroGestorAccess";
import { useAuth } from "@/context/AuthContext";
import { generarReporteEmprestitoPorCentroGestor } from "@/utils/reporteEmprestitoPdf";
import { proxyFetch } from "@/utils/errorHandler";

// ── Helpers ──────────────────────────────────────────────────────

function formatFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function diasDesde(fecha: string | null): number | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

type FiltroEstado =
  | "todos"
  | "con_reportes"
  | "sin_reportes"
  | "recientes"
  | "alertas";
type OrdenCampo =
  | "nombre"
  | "total_reportes"
  | "ultimo_reporte"
  | "reportes_ultimos_10_dias";

// ── Componente principal ─────────────────────────────────────────

export default function AvancesEmprestitoTab() {
  const { state: authState } = useAuth();
  const centroGestorAccess = useMemo(
    () => getCentroGestorAccessFromSession(),
    [authState.user],
  );
  const canViewAll = centroGestorAccess.canViewAll;
  const userCentroGestor = centroGestorAccess.userCentroGestor || "";
  const isSuperAdmin = useMemo(
    () =>
      Array.isArray(authState.user?.roles) &&
      authState.user.roles.includes("super_admin"),
    [authState.user?.roles],
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    reportes,
    resumenPorCentroGestor,
    centrosConReportes,
    centrosSinReportes,
    totalReportes,
    loading,
    error,
    refetch,
  } = useReportesCentroGestorDashboard();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [ordenCampo, setOrdenCampo] = useState<OrdenCampo>("nombre");
  const [ordenDir, setOrdenDir] = useState<"asc" | "desc">("asc");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const handleEliminarReporte = useCallback(
    async (reporteId: string) => {
      if (!reporteId || deletingId) return;
      setDeletingId(reporteId);
      try {
        const res = await proxyFetch(
          `/api/proxy/reportes_contratos/${encodeURIComponent(reporteId)}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          await refetch();
        } else {
          console.error("Error eliminando reporte:", res.status);
        }
      } catch (err) {
        console.error("Error eliminando reporte:", err);
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, refetch],
  );

  // Filtrado y orden
  const listaFiltrada = useMemo(() => {
    let lista = resumenPorCentroGestor;

    if (!canViewAll && userCentroGestor) {
      const normalizado = userCentroGestor
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
      lista = lista.filter((c) => {
        const nombre = c.nombre_centro_gestor
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
        return (
          nombre === normalizado ||
          nombre.includes(normalizado) ||
          normalizado.includes(nombre)
        );
      });
    }

    if (busqueda.trim()) {
      const _norm = (s: string) =>
        s
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const term = _norm(busqueda.trim());
      lista = lista.filter((c) => _norm(c.nombre_centro_gestor).includes(term));
    }

    switch (filtroEstado) {
      case "con_reportes":
        lista = lista.filter((c) => c.total_reportes > 0);
        break;
      case "sin_reportes":
        lista = lista.filter((c) => c.total_reportes === 0);
        break;
      case "recientes":
        lista = lista.filter((c) => c.reportes_ultimos_10_dias > 0);
        break;
      case "alertas":
        lista = lista.filter((c) => c.tiene_alertas);
        break;
    }

    const dir = ordenDir === "asc" ? 1 : -1;
    lista = [...lista].sort((a, b) => {
      switch (ordenCampo) {
        case "nombre":
          return (
            dir *
            a.nombre_centro_gestor.localeCompare(b.nombre_centro_gestor, "es")
          );
        case "total_reportes":
          return dir * (a.total_reportes - b.total_reportes);
        case "ultimo_reporte": {
          const fa = a.ultimo_reporte
            ? new Date(a.ultimo_reporte).getTime()
            : 0;
          const fb = b.ultimo_reporte
            ? new Date(b.ultimo_reporte).getTime()
            : 0;
          return dir * (fa - fb);
        }
        case "reportes_ultimos_10_dias":
          return (
            dir * (a.reportes_ultimos_10_dias - b.reportes_ultimos_10_dias)
          );
        default:
          return 0;
      }
    });

    return lista;
  }, [
    resumenPorCentroGestor,
    busqueda,
    filtroEstado,
    ordenCampo,
    ordenDir,
    canViewAll,
    userCentroGestor,
  ]);

  const toggleOrden = useCallback(
    (campo: OrdenCampo) => {
      if (ordenCampo === campo) {
        setOrdenDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setOrdenCampo(campo);
        setOrdenDir(campo === "nombre" ? "asc" : "desc");
      }
    },
    [ordenCampo],
  );

  // Reportes por contrato para detalle expandido
  const reportesPorContrato = useMemo(() => {
    if (!expandido) return {};
    const cgReportes = reportes.filter(
      (r) =>
        (
          r.nombre_centro_gestor ||
          r.nombre_centro_gestor_source ||
          ""
        ).toLowerCase() === expandido.toLowerCase(),
    );
    const agrupados: Record<string, ReporteContrato[]> = {};
    for (const r of cgReportes) {
      const key = r.referencia_contrato || "SIN-REF";
      if (!agrupados[key]) agrupados[key] = [];
      agrupados[key].push(r);
    }
    // Ordenar por fecha desc dentro de cada contrato
    for (const refs of Object.values(agrupados)) {
      refs.sort(
        (a, b) =>
          new Date(b.fecha_reporte).getTime() -
          new Date(a.fecha_reporte).getTime(),
      );
    }
    return agrupados;
  }, [expandido, reportes]);

  const handleDescargarPdf = useCallback(async () => {
    if (generandoPdf) return;
    setGenerandoPdf(true);
    try {
      // Cargar contratos de empréstito para el detalle del PDF
      let contratos: any[] = [];
      try {
        const res = await fetch("/data/emprestito/emp_contratos.json");
        if (res.ok) {
          const data = await res.json();
          const raw =
            data.contratos_encontrados || (Array.isArray(data) ? data : []);
          // Normalizar: el JSON usa nombre_entidad, el reporte espera nombre_centro_gestor
          contratos = raw.map((c: any) => ({
            ...c,
            nombre_centro_gestor:
              c.nombre_centro_gestor || c.nombre_entidad || c.sector || "",
          }));
        }
      } catch {
        console.warn(
          "No se pudieron cargar contratos para el PDF, se generará sin detalle de contratos",
        );
      }

      await generarReporteEmprestitoPorCentroGestor({
        resumenPorCentroGestor,
        centrosConReportes,
        centrosSinReportes,
        totalReportes,
        contratos,
      });
    } catch (err) {
      console.error("Error generando PDF de Empréstito:", err);
    } finally {
      setGenerandoPdf(false);
    }
  }, [
    generandoPdf,
    resumenPorCentroGestor,
    centrosConReportes,
    centrosSinReportes,
    totalReportes,
  ]);

  // ── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Cargando avances de contratos de empréstito...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Total Reportes
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalReportes}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              CG con Reportes
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {centrosConReportes.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              CG sin Reportes
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {centrosSinReportes.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Con Alertas
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {resumenPorCentroGestor.filter((c) => c.tiene_alertas).length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar centro gestor..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "todos",
              "con_reportes",
              "sin_reportes",
              "recientes",
              "alertas",
            ] as FiltroEstado[]
          ).map((f) => {
            const labels: Record<FiltroEstado, string> = {
              todos: "Todos",
              con_reportes: "Con reportes",
              sin_reportes: "Sin reportes",
              recientes: "Últimos 10 días",
              alertas: "Con alertas",
            };
            return (
              <button
                key={f}
                onClick={() => setFiltroEstado(f)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  filtroEstado === f
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
          {canViewAll && (
            <button
              onClick={handleDescargarPdf}
              disabled={generandoPdf || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              title="Descargar reporte PDF por centro gestor"
            >
              {generandoPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {generandoPdf ? "Generando..." : "Reporte PDF"}
            </button>
          )}
        </div>
      </div>

      {/* Lista de CG */}
      <div className="space-y-2">
        {listaFiltrada.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No se encontraron centros gestores
          </div>
        ) : (
          listaFiltrada.map((cg) => {
            const isExpanded = expandido === cg.nombre_centro_gestor;
            const dias = diasDesde(cg.ultimo_reporte);
            return (
              <div
                key={cg.nombre_centro_gestor}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandido(isExpanded ? null : cg.nombre_centro_gestor)
                  }
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cg.nombre_centro_gestor}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cg.total_reportes} reporte(s) ·{" "}
                        {cg.contratos_reportados.length} contrato(s)
                        {dias !== null && ` · Último hace ${dias}d`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cg.tiene_alertas && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <div className="text-right text-xs">
                      <p className="text-slate-600 dark:text-slate-400">
                        Físico:{" "}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {cg.ultimo_avance_fisico}%
                        </span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Financiero:{" "}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {cg.ultimo_avance_financiero}%
                        </span>
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Detalle expandido */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="px-4 py-3 space-y-3">
                        {Object.entries(reportesPorContrato).length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Sin reportes detallados
                          </p>
                        ) : (
                          Object.entries(reportesPorContrato).map(
                            ([ref, reps]) => (
                              <div
                                key={ref}
                                className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                              >
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 font-mono">
                                  {ref}
                                </p>
                                <div className="space-y-2">
                                  {reps.slice(0, 5).map((r, i) => (
                                    <div
                                      key={r.id || i}
                                      className="flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-400">
                                          {formatFecha(r.fecha_reporte)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-slate-700 dark:text-slate-300">
                                          Físico:{" "}
                                          <strong>{r.avance_fisico}%</strong>
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          Financiero:{" "}
                                          <strong>
                                            {r.avance_financiero}%
                                          </strong>
                                        </span>
                                        {r.alertas?.es_alerta && (
                                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                                        )}
                                        {isSuperAdmin && r.id && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEliminarReporte(r.id);
                                            }}
                                            disabled={deletingId === r.id}
                                            title="Eliminar reporte"
                                            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                                          >
                                            {deletingId === r.id ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <Trash2 className="w-3 h-3" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {reps.length > 5 && (
                                    <p className="text-xs text-slate-400">
                                      +{reps.length - 5} reportes más
                                    </p>
                                  )}
                                </div>
                              </div>
                            ),
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

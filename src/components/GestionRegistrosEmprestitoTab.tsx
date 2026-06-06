"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  X,
  Loader2,
  FileText,
  DollarSign,
  Briefcase,
  Building2,
  ClipboardList,
  Pencil,
} from "lucide-react";
import { formatCurrencyFull } from "@/utils/formatCurrency";
import {
  fetchContratosEmprestito,
  fetchProcesosEmprestito,
  fetchRPCsEmprestito,
  fetchPagosEmprestitoAll,
  fetchConveniosEmprestito,
  crearProcesoEmprestito,
  crearRPCEmprestito,
  crearPagoEmprestito,
  crearConvenioEmprestito,
  crearSolicitudCambioContrato,
  crearSolicitudCambioProceso,
  crearSolicitudCambioRPC,
  crearSolicitudCambioPago,
  editarNombreResumidoProceso,
} from "@/services/emprestito-gestion.service";
import type {
  EmprestitoEntityType,
  SolicitudCambioContratoPayload,
  SolicitudCambioProcesoPayload,
  SolicitudCambioRPCPayload,
  SolicitudCambioPagoPayload,
} from "@/types/gestion-emprestito";
import { EMPRESTITO_ENTITY_LABELS } from "@/types/gestion-emprestito";
import { useAuth } from "@/context/AuthContext";
import { getCentroGestorAccessFromSession } from "@/utils/centroGestorAccess";

// ── Types ────────────────────────────────────────────────────────

interface Props {
  onRefresh?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}> = ({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  disabled = false,
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
}> = ({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Selecciona...",
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}> = ({ title, onClose, children, maxWidthClass = "max-w-2xl" }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full ${maxWidthClass} max-h-[85vh] overflow-y-auto`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </motion.div>
);

// ── Entity icons ─────────────────────────────────────────────────

const ENTITY_ICONS: Record<EmprestitoEntityType, React.ElementType> = {
  contrato: Briefcase,
  proceso: FileText,
  rpc: ClipboardList,
  pago: DollarSign,
  convenio: Building2,
  orden_compra: Pencil,
};

// ── Columnas por tipo de entidad ─────────────────────────────────

const ENTITY_COLUMNS: Record<
  EmprestitoEntityType,
  { key: string; label: string; format?: "currency" | "date" }[]
> = {
  contrato: [
    { key: "referencia_del_contrato", label: "Referencia" },
    { key: "nombre_resumido_proceso", label: "Nombre Resumido Proceso" },
    { key: "descripcion_del_proceso", label: "Objeto" },
    { key: "nombre_centro_gestor", label: "Centro Gestor" },
    { key: "valor_del_contrato", label: "Valor", format: "currency" },
    { key: "estado_contrato", label: "Estado" },
    { key: "proveedor_adjudicado", label: "Proveedor" },
  ],
  proceso: [
    { key: "referencia_proceso", label: "Referencia" },
    { key: "nombre_resumido_proceso", label: "Nombre Resumido Proceso" },
    { key: "bp", label: "BP" },
    { key: "nombre_centro_gestor", label: "Centro Gestor" },
    { key: "valor_proyectado", label: "Valor Proyectado", format: "currency" },
    { key: "estado_proceso", label: "Estado" },
    { key: "plataforma", label: "Plataforma" },
  ],
  rpc: [
    { key: "numero_rpc", label: "No. RPC" },
    { key: "referencia_contrato", label: "Ref. Contrato" },
    { key: "nombre_centro_gestor", label: "Centro Gestor" },
    { key: "valor_rpc", label: "Valor RPC", format: "currency" },
    { key: "beneficiario", label: "Beneficiario" },
    { key: "estado", label: "Estado" },
  ],
  pago: [
    { key: "numero_rpc", label: "No. RPC" },
    { key: "referencia_contrato", label: "Ref. Contrato" },
    { key: "nombre_centro_gestor", label: "Centro Gestor" },
    { key: "valor_pago", label: "Valor Pago", format: "currency" },
    { key: "fecha_transaccion", label: "Fecha", format: "date" },
    { key: "estado", label: "Estado" },
  ],
  convenio: [
    { key: "referencia_contrato", label: "Ref. Contrato" },
    { key: "banco", label: "Banco" },
    { key: "nombre_centro_gestor", label: "Centro Gestor" },
    { key: "objeto", label: "Objeto" },
    { key: "valor", label: "Valor", format: "currency" },
    { key: "estado", label: "Estado" },
  ],
  orden_compra: [
    { key: "numero_orden", label: "No. Orden" },
    { key: "referencia_contrato", label: "Ref. Contrato" },
    { key: "nombre_centro_gestor", label: "Centro Gestor" },
    { key: "proveedor", label: "Proveedor" },
    { key: "valor", label: "Valor", format: "currency" },
    { key: "estado", label: "Estado" },
  ],
};

// ── Componente principal ─────────────────────────────────────────

export default function GestionRegistrosEmprestitoTab({ onRefresh }: Props) {
  const { state: authState, hasRole } = useAuth();
  const centroGestorAccess = useMemo(
    () => getCentroGestorAccessFromSession(),
    [authState.user],
  );
  const canEdit =
    hasRole("super_admin") ||
    hasRole("admin_general") ||
    hasRole("editor_datos");
  const isAdminCG = hasRole("admin_centro_gestor");

  // State
  const [activeEntity, setActiveEntity] =
    useState<EmprestitoEntityType>("contrato");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState<
    any | null
  >(null);
  const [showEditNombreModal, setShowEditNombreModal] = useState<any | null>(
    null,
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const pageSize = 25;

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: any[] = [];
      switch (activeEntity) {
        case "contrato":
          result = await fetchContratosEmprestito();
          break;
        case "proceso":
          result = await fetchProcesosEmprestito();
          break;
        case "rpc":
          result = await fetchRPCsEmprestito();
          break;
        case "pago":
          result = await fetchPagosEmprestitoAll();
          break;
        case "convenio":
          result = await fetchConveniosEmprestito();
          break;
      }

      // Filtro CG si no es admin global
      if (
        !centroGestorAccess.canViewAll &&
        centroGestorAccess.userCentroGestor
      ) {
        const cg = centroGestorAccess.userCentroGestor.toLowerCase();
        result = result.filter((r) => {
          const val = String(
            r.nombre_centro_gestor || r.centro_gestor || "",
          ).toLowerCase();
          return val.includes(cg);
        });
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [activeEntity, centroGestorAccess]);

  useEffect(() => {
    fetchData();
    setPage(1);
    setExpandedRows(new Set());
    setSearchTerm("");
  }, [activeEntity, fetchData]);

  // Filtered data
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [data, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getRowId = (row: any, idx: number): string => {
    switch (activeEntity) {
      case "contrato":
        return row.referencia_del_contrato || row.id_contrato || `c-${idx}`;
      case "proceso":
        return row.referencia_proceso || `p-${idx}`;
      case "rpc":
        return row.numero_rpc || `r-${idx}`;
      case "pago":
        return `pay-${row.numero_rpc || ""}-${idx}`;
      case "convenio":
        return row.referencia_contrato || `conv-${idx}`;
      case "orden_compra":
        return row.numero_orden || row.id || `oc-${idx}`;
      default:
        return `row-${idx}`;
    }
  };

  const formatValue = (val: any, format?: "currency" | "date"): string => {
    if (val === null || val === undefined) return "—";
    if (format === "currency") return formatCurrencyFull(Number(val) || 0);
    if (format === "date") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("es-CO");
    }
    return String(val);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entity toggle */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(EMPRESTITO_ENTITY_LABELS) as EmprestitoEntityType[]).map(
          (etype) => {
            const Icon = ENTITY_ICONS[etype];
            const isActive = activeEntity === etype;
            return (
              <button
                key={etype}
                onClick={() => setActiveEntity(etype)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {EMPRESTITO_ENTITY_LABELS[etype]}
              </button>
            );
          },
        )}
      </div>

      {/* Toolbar: search + actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={`Buscar en ${EMPRESTITO_ENTITY_LABELS[activeEntity]}...`}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </button>
          {(canEdit || isAdminCG) && activeEntity !== "contrato" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Crear {EMPRESTITO_ENTITY_LABELS[activeEntity].slice(0, -1)}
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>
          Total:{" "}
          <strong className="text-slate-900 dark:text-white">
            {data.length}
          </strong>
        </span>
        {searchTerm && (
          <span>
            Filtrados:{" "}
            <strong className="text-blue-600 dark:text-blue-400">
              {filtered.length}
            </strong>
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-3 text-left w-8" />
                {ENTITY_COLUMNS[activeEntity].map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                {(canEdit || isAdminCG) && (
                  <th className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={ENTITY_COLUMNS[activeEntity].length + 2}
                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                paged.map((row, idx) => {
                  const rowId = getRowId(row, (page - 1) * pageSize + idx);
                  const isExpanded = expandedRows.has(rowId);
                  const columns = ENTITY_COLUMNS[activeEntity];
                  return (
                    <React.Fragment key={rowId}>
                      <tr
                        className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${
                          isExpanded ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                        }`}
                        onClick={() => toggleRow(rowId)}
                      >
                        <td className="px-3 py-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-3 py-3 text-slate-900 dark:text-slate-100 max-w-[200px] truncate"
                          >
                            {formatValue(row[col.key], col.format)}
                          </td>
                        ))}
                        {(canEdit || isAdminCG) && (
                          <td
                            className="px-3 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setShowChangeRequestModal(row)}
                                className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                title="Solicitar cambio"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {canEdit &&
                                (activeEntity === "proceso" ||
                                  activeEntity === "contrato") && (
                                  <button
                                    onClick={() => setShowEditNombreModal(row)}
                                    className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                    title="Editar nombre resumido proceso"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                            </div>
                          </td>
                        )}
                      </tr>
                      {/* Expanded detail */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={columns.length + 2}>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-6 py-4 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                                {Object.entries(row)
                                  .filter(
                                    ([k]) => !k.startsWith("_") && k !== "id",
                                  )
                                  .map(([k, v]) => (
                                    <div
                                      key={k}
                                      className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700"
                                    >
                                      <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">
                                        {k.replace(/_/g, " ")}
                                      </p>
                                      <p className="text-slate-900 dark:text-slate-100 break-all">
                                        {typeof v === "number" &&
                                        k.toLowerCase().includes("valor")
                                          ? formatCurrencyFull(v)
                                          : String(v ?? "—")}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Página {page} de {totalPages} ({filtered.length} registros)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Solicitud de cambio modal */}
      <AnimatePresence>
        {showChangeRequestModal && (
          <ChangeRequestModal
            record={showChangeRequestModal}
            entityType={activeEntity}
            onClose={() => setShowChangeRequestModal(null)}
            onSuccess={() => {
              setToast({
                type: "success",
                message: "Solicitud de cambio enviada exitosamente",
              });
              setShowChangeRequestModal(null);
            }}
            userEmail={authState.user?.email || ""}
          />
        )}
      </AnimatePresence>

      {/* Editar nombre resumido proceso modal (edición directa) */}
      <AnimatePresence>
        {showEditNombreModal && (
          <EditNombreResumidoModal
            record={showEditNombreModal}
            entityType={activeEntity}
            onClose={() => setShowEditNombreModal(null)}
            onSuccess={() => {
              setToast({
                type: "success",
                message: "Nombre resumido proceso actualizado exitosamente",
              });
              setShowEditNombreModal(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateEntityModal
            entityType={activeEntity}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setToast({
                type: "success",
                message: `${EMPRESTITO_ENTITY_LABELS[activeEntity].slice(0, -1)} creado exitosamente`,
              });
              setShowCreateModal(false);
              fetchData();
              onRefresh?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Edición Directa: Nombre Resumido Proceso ───────────────

const EditNombreResumidoModal: React.FC<{
  record: any;
  entityType: EmprestitoEntityType;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ record, entityType, onClose, onSuccess }) => {
  const refProceso: string =
    entityType === "proceso"
      ? record.referencia_proceso || ""
      : record.referencia_proceso || "";
  const [value, setValue] = useState<string>(
    record.nombre_resumido_proceso || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("El nombre resumido no puede estar vacío");
      return;
    }
    if (!refProceso) {
      setError("No se encontró referencia_proceso en este registro");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await editarNombreResumidoProceso(refProceso, value.trim());
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al actualizar el nombre resumido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Editar Nombre Resumido Proceso"
      onClose={onClose}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Referencia proceso:{" "}
            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
              {refProceso || "—"}
            </span>
          </p>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombre resumido proceso <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nombre resumido del proceso..."
            autoFocus
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Modal Solicitud de Cambio ────────────────────────────────────

const ChangeRequestModal: React.FC<{
  record: any;
  entityType: EmprestitoEntityType;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}> = ({ record, entityType, onClose, onSuccess, userEmail }) => {
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [justificacion, setJustificacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editableFields = useMemo(() => {
    switch (entityType) {
      case "contrato":
        return [
          "descripcion_del_proceso",
          "valor_del_contrato",
          "estado_contrato",
          "fecha_de_fin_del_contrato",
          "proveedor_adjudicado",
        ];
      case "proceso":
        return [
          "bp",
          "nombre_resumido_proceso",
          "valor_proyectado",
          "estado_proceso",
          "plataforma",
        ];
      case "rpc":
        return ["valor_rpc", "beneficiario", "estado"];
      case "pago":
        return ["valor_pago", "fecha_transaccion", "estado"];
      case "convenio":
        return ["objeto", "valor", "estado"];
    }
  }, [entityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificacion.trim()) {
      setError("La justificación es obligatoria");
      return;
    }

    const camposModificados: Record<string, { anterior: any; nuevo: any }> = {};
    for (const [field, newVal] of Object.entries(changes)) {
      if (!newVal.trim()) continue;
      camposModificados[field] = {
        anterior: record[field] ?? "",
        nuevo: newVal,
      };
    }

    if (Object.keys(camposModificados).length === 0) {
      setError("Debe modificar al menos un campo");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const base = {
        campos_modificados: camposModificados,
        justificacion: justificacion.trim(),
        solicitado_por: userEmail,
        nombre_centro_gestor:
          record.nombre_centro_gestor || record.centro_gestor || "",
      };

      switch (entityType) {
        case "contrato":
          await crearSolicitudCambioContrato({
            ...base,
            referencia_contrato: record.referencia_del_contrato || "",
          } as SolicitudCambioContratoPayload);
          break;
        case "proceso":
          await crearSolicitudCambioProceso({
            ...base,
            referencia_proceso: record.referencia_proceso || "",
          } as SolicitudCambioProcesoPayload);
          break;
        case "rpc":
          await crearSolicitudCambioRPC({
            ...base,
            numero_rpc: record.numero_rpc || "",
            referencia_contrato: record.referencia_contrato || "",
          } as SolicitudCambioRPCPayload);
          break;
        case "pago":
          await crearSolicitudCambioPago({
            ...base,
            numero_rpc: record.numero_rpc || "",
          } as SolicitudCambioPagoPayload);
          break;
        case "convenio":
          await crearSolicitudCambioContrato({
            ...base,
            referencia_contrato: record.referencia_contrato || "",
          } as SolicitudCambioContratoPayload);
          break;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al crear solicitud de cambio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Solicitar Cambio - ${EMPRESTITO_ENTITY_LABELS[entityType]}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(editableFields ?? []).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {field.replace(/_/g, " ")}
              </label>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Actual:{" "}
                <span className="font-mono">
                  {String(record[field] ?? "—")}
                </span>
              </div>
              <input
                type="text"
                value={changes[field] || ""}
                onChange={(e) =>
                  setChanges((prev) => ({ ...prev, [field]: e.target.value }))
                }
                placeholder="Nuevo valor..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Justificación <span className="text-red-500">*</span>
          </label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            rows={3}
            required
            placeholder="Explique la razón del cambio..."
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Enviar Solicitud
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Modal Crear Entidad ──────────────────────────────────────────

const CreateEntityModal: React.FC<{
  entityType: EmprestitoEntityType;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ entityType, onClose, onSuccess }) => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = useMemo(() => {
    switch (entityType) {
      case "proceso":
        return [
          {
            key: "referencia_proceso",
            label: "Referencia Proceso",
            required: true,
          },
          { key: "bp", label: "BP", required: true },
          { key: "nombre_resumido_proceso", label: "Nombre Resumido" },
          {
            key: "valor_proyectado",
            label: "Valor Proyectado",
            type: "number",
          },
          { key: "estado_proceso", label: "Estado" },
          { key: "plataforma", label: "Plataforma (SECOP/TVEC)" },
          {
            key: "nombre_centro_gestor",
            label: "Centro Gestor",
            required: true,
          },
        ];
      case "rpc":
        return [
          { key: "numero_rpc", label: "Número RPC", required: true },
          {
            key: "referencia_contrato",
            label: "Referencia Contrato",
            required: true,
          },
          {
            key: "valor_rpc",
            label: "Valor RPC",
            type: "number",
            required: true,
          },
          { key: "beneficiario", label: "Beneficiario" },
          {
            key: "nombre_centro_gestor",
            label: "Centro Gestor",
            required: true,
          },
        ];
      case "pago":
        return [
          { key: "numero_rpc", label: "Número RPC", required: true },
          {
            key: "valor_pago",
            label: "Valor Pago",
            type: "number",
            required: true,
          },
          {
            key: "fecha_transaccion",
            label: "Fecha Transacción",
            type: "date",
          },
          {
            key: "nombre_centro_gestor",
            label: "Centro Gestor",
            required: true,
          },
        ];
      case "convenio":
        return [
          {
            key: "referencia_contrato",
            label: "Referencia Contrato",
            required: true,
          },
          { key: "banco", label: "Banco", required: true },
          { key: "objeto", label: "Objeto" },
          { key: "valor", label: "Valor", type: "number" },
          {
            key: "nombre_centro_gestor",
            label: "Centro Gestor",
            required: true,
          },
        ];
      default:
        return [];
    }
  }, [entityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        const val = form[f.key]?.trim();
        if (!val && f.required) throw new Error(`"${f.label}" es obligatorio`);
        if (val) {
          payload[f.key] = f.type === "number" ? Number(val) : val;
        }
      }

      switch (entityType) {
        case "proceso":
          await crearProcesoEmprestito(payload);
          break;
        case "rpc":
          await crearRPCEmprestito(payload);
          break;
        case "pago":
          await crearPagoEmprestito(payload);
          break;
        case "convenio":
          await crearConvenioEmprestito(payload);
          break;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al crear registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Crear ${EMPRESTITO_ENTITY_LABELS[entityType].slice(0, -1)}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={form[f.key] || ""}
              onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              type={f.type}
              required={f.required}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear
          </button>
        </div>
      </form>
    </Modal>
  );
};

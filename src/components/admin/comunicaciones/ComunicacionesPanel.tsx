"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  Send,
  Megaphone,
  Mail,
  Users,
  Building2,
  Tag,
  Paperclip,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  History,
  Beaker,
  Info,
  AlertOctagon,
  Bell,
} from "lucide-react";
import comunicacionesService, {
  AnnouncementPriority,
  AudienceType,
  BroadcastResponse,
  ComunicacionesLogEntry,
  ComunicacionesRoleItem,
  serializeAudience,
} from "@/services/comunicaciones.service";
import RichTextEditor from "./RichTextEditor";
import NotificationsHealthBadge from "./NotificationsHealthBadge";

interface ComunicacionesPanelProps {
  /** Lista de centros gestores precargada (opcional). */
  centrosGestores?: string[];
}

const PRIORITIES: Array<{
  id: AnnouncementPriority;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { id: "info", label: "Informativo", icon: Info, color: "blue" },
  {
    id: "warning",
    label: "Aviso importante",
    icon: AlertTriangle,
    color: "amber",
  },
  { id: "urgent", label: "Urgente", icon: AlertOctagon, color: "red" },
];

const AUDIENCE_TABS: Array<{
  id: AudienceType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "all",
    label: "Todos los usuarios",
    icon: Users,
    description: "Envía el correo a cada usuario registrado con email válido.",
  },
  {
    id: "centros_gestores",
    label: "Por centro gestor",
    icon: Building2,
    description: "Selecciona uno o más centros gestores. Filtra por nombre.",
  },
  {
    id: "roles",
    label: "Por roles",
    icon: Tag,
    description: "Selecciona uno o más roles del sistema.",
  },
  {
    id: "emails",
    label: "Correos individuales",
    icon: Mail,
    description:
      "Pega una lista libre de correos separados por coma, espacio o salto de línea.",
  },
];

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / Math.pow(1024, idx)).toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
};

export default function ComunicacionesPanel({
  centrosGestores: centrosFromParent,
}: ComunicacionesPanelProps) {
  // ----------- estado del formulario -----------
  const [subject, setSubject] = useState("");
  const [messageHtml, setMessageHtml] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("info");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [audienceTab, setAudienceTab] = useState<AudienceType>("all");

  const [selectedCentros, setSelectedCentros] = useState<string[]>([]);
  const [centroSearch, setCentroSearch] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [emailsRaw, setEmailsRaw] = useState("");
  const [extraEmails, setExtraEmails] = useState("");

  const [attachments, setAttachments] = useState<File[]>([]);
  const attachInputRef = useRef<HTMLInputElement | null>(null);

  // ----------- catálogos -----------
  const [centros, setCentros] = useState<string[]>(centrosFromParent || []);
  const [roles, setRoles] = useState<ComunicacionesRoleItem[]>([]);

  // ----------- preview / envío -----------
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewSample, setPreviewSample] = useState<
    Array<{ email: string; name: string }>
  >([]);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<BroadcastResponse | null>(
    null,
  );

  // ----------- test email -----------
  const [testTo, setTestTo] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // ----------- historial -----------
  const [logs, setLogs] = useState<ComunicacionesLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [healthCanSend, setHealthCanSend] = useState<boolean>(true);
  const [healthRefreshKey, setHealthRefreshKey] = useState(0);

  // ----------- preview HTML -----------
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  // -------------------------------------------------------------------------
  // Carga inicial de catálogos
  // -------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const [r, c] = await Promise.all([
          comunicacionesService.getRoles(),
          centrosFromParent && centrosFromParent.length
            ? Promise.resolve(centrosFromParent)
            : comunicacionesService.getCentrosGestores(),
        ]);
        setRoles(r);
        setCentros(c);
      } catch (err) {
        console.warn("No se pudieron cargar catálogos de comunicaciones", err);
      }
    })();
  }, [centrosFromParent]);

  // -------------------------------------------------------------------------
  // Audiencia serializada y validaciones
  // -------------------------------------------------------------------------
  const audienceString = useMemo(() => {
    switch (audienceTab) {
      case "all":
        return serializeAudience({ type: "all" });
      case "centros_gestores":
        return serializeAudience({
          type: "centros_gestores",
          centrosGestores: selectedCentros,
        });
      case "roles":
        return serializeAudience({ type: "roles", roles: selectedRoles });
      case "emails":
        return serializeAudience({ type: "emails", emails: [emailsRaw] });
      default:
        return "all";
    }
  }, [audienceTab, selectedCentros, selectedRoles, emailsRaw]);

  const audienceIsValid = useMemo(() => {
    switch (audienceTab) {
      case "all":
        return true;
      case "centros_gestores":
        return selectedCentros.length > 0;
      case "roles":
        return selectedRoles.length > 0;
      case "emails":
        return /[^\s,;]+@[^\s,;]+\.[^\s,;]+/.test(emailsRaw);
      default:
        return false;
    }
  }, [audienceTab, selectedCentros, selectedRoles, emailsRaw]);

  const canSubmit = useMemo(() => {
    return (
      !sending &&
      healthCanSend &&
      subject.trim().length >= 3 &&
      subject.trim().length <= 200 &&
      messageHtml.trim().length > 0 &&
      audienceIsValid
    );
  }, [sending, healthCanSend, subject, messageHtml, audienceIsValid]);

  // -------------------------------------------------------------------------
  // Acciones
  // -------------------------------------------------------------------------
  const refreshPreview = useCallback(async () => {
    if (!audienceIsValid) {
      setPreviewCount(null);
      setPreviewSample([]);
      setPreviewError(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await comunicacionesService.previewAudience(audienceString);
      setPreviewCount(res.recipients_count);
      setPreviewSample(res.preview || []);
    } catch (err: any) {
      setPreviewError(err?.message || "No se pudo calcular la audiencia.");
      setPreviewCount(null);
      setPreviewSample([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [audienceIsValid, audienceString]);

  // Auto-preview con debounce
  useEffect(() => {
    const handle = setTimeout(() => {
      refreshPreview();
    }, 350);
    return () => clearTimeout(handle);
  }, [refreshPreview]);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const MAX_PER_FILE = 10 * 1024 * 1024;
    const valid = files.filter((f) => {
      if (f.size > MAX_PER_FILE) {
        window.alert(
          `El archivo "${f.name}" supera el límite de 10 MB y será omitido.`,
        );
        return false;
      }
      return true;
    });
    setAttachments((prev) => [...prev, ...valid]);
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!canSubmit) return;
    setSending(true);
    setSendError(null);
    setLastResponse(null);

    try {
      const res = await comunicacionesService.broadcast({
        subject: subject.trim(),
        message_html: messageHtml,
        audience: audienceString,
        priority,
        cta_url: ctaUrl.trim(),
        cta_label: ctaLabel.trim(),
        extra_emails: extraEmails.trim(),
        attachments,
      });
      setLastResponse(res);
      setHealthRefreshKey((k) => k + 1);
    } catch (err: any) {
      setSendError(err?.message || "No se pudo enviar el anuncio.");
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const dest = testTo.trim() || undefined;
      const res = await comunicacionesService.sendTest(dest);
      if (res.sent) {
        setTestResult(`Correo de prueba enviado a ${res.to}.`);
      } else {
        setTestResult(
          `No se pudo enviar el correo: ${res.error || "error desconocido"}`,
        );
      }
      setHealthRefreshKey((k) => k + 1);
    } catch (err: any) {
      setTestResult(err?.message || "Error enviando correo de prueba.");
    } finally {
      setTestSending(false);
    }
  };

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await comunicacionesService.getHistorial(50);
      setLogs(data);
    } catch (err) {
      console.warn("No se pudo cargar historial de envíos", err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showLogs && logs.length === 0) loadLogs();
  }, [showLogs, logs.length, loadLogs]);

  const resetForm = () => {
    setSubject("");
    setMessageHtml("");
    setCtaUrl("");
    setCtaLabel("");
    setAttachments([]);
    setLastResponse(null);
    setSendError(null);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const filteredCentros = useMemo(() => {
    const q = centroSearch.trim().toLowerCase();
    if (!q) return centros;
    return centros.filter((c) => c.toLowerCase().includes(q));
  }, [centros, centroSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Comunicaciones y Anuncios
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
                Envía correos electrónicos a los usuarios del sistema. Puedes
                segmentar por centro gestor, por rol, o ingresar correos
                individuales. Todos los envíos usan la plantilla HTML
                institucional de CaliTrack.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogs((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <History className="w-4 h-4" />
            {showLogs ? "Ocultar historial" : "Ver historial"}
          </button>
        </div>

        <div className="mt-4">
          <NotificationsHealthBadge
            refreshKey={healthRefreshKey}
            onLoaded={(h) => setHealthCanSend(h.can_send)}
          />
        </div>
      </motion.div>

      {/* Correo de prueba */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Beaker className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Correo de prueba
          </h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Destino (opcional, por defecto tu propio correo)
            </label>
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="prueba@dominio.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={testSending || !healthCanSend}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
          >
            {testSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar prueba
          </button>
        </div>
        {testResult && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            {testResult}
          </p>
        )}
      </div>

      {/* Formulario principal */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5"
      >
        {/* Asunto y prioridad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Asunto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              minLength={3}
              maxLength={200}
              required
              placeholder="Ej: Mantenimiento programado del sistema"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Entre 3 y 200 caracteres. {subject.trim().length}/200
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Prioridad
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => {
                const Icon = p.icon;
                const selected = priority === p.id;
                const baseColors: Record<string, string> = {
                  blue: selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
                  amber: selected
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
                  red: selected
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800",
                };
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border text-xs font-medium ${baseColors[p.color]}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
              Contenido del correo <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowHtmlPreview((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Eye className="w-3.5 h-3.5" />
              {showHtmlPreview
                ? "Cerrar vista previa"
                : "Vista previa con plantilla"}
            </button>
          </div>
          <RichTextEditor value={messageHtml} onChange={setMessageHtml} />
          <p className="text-[11px] text-gray-500 mt-1">
            Se aplica la plantilla institucional de CaliTrack al enviarlo.
            Puedes incluir enlaces, listas, imágenes y formato enriquecido.
          </p>
        </div>

        {/* CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Botón de acción — URL (opcional)
            </label>
            <input
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://app.calitrack..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Botón de acción — Texto (opcional)
            </label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              maxLength={60}
              placeholder="Ej: Ver detalles"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Adjuntos */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            Adjuntos (opcional, máx. 10 MB por archivo / 20 MB total)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => attachInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Paperclip className="w-4 h-4" />
              Agregar archivos
            </button>
            <input
              ref={attachInputRef}
              type="file"
              multiple
              onChange={handleAttachmentChange}
              className="hidden"
            />
            {attachments.length > 0 && (
              <span className="text-xs text-gray-500">
                {attachments.length} archivo
                {attachments.length === 1 ? "" : "s"} ·{" "}
                {formatBytes(attachments.reduce((acc, f) => acc + f.size, 0))}
              </span>
            )}
          </div>
          {attachments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {attachments.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between text-xs px-3 py-1.5 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <span className="truncate">
                    {file.name}{" "}
                    <span className="text-gray-500">
                      ({formatBytes(file.size)})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    title="Eliminar adjunto"
                    className="ml-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selector de audiencia */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
            Audiencia <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
            {AUDIENCE_TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = audienceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAudienceTab(tab.id)}
                  className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-left text-xs transition-colors ${
                    selected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold leading-tight">{tab.label}</p>
                    <p className="text-[11px] mt-1 leading-tight opacity-80">
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inputs específicos */}
          {audienceTab === "centros_gestores" && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <input
                type="search"
                value={centroSearch}
                onChange={(e) => setCentroSearch(e.target.value)}
                placeholder="Buscar centro gestor…"
                className="w-full mb-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
              />
              <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1">
                {filteredCentros.map((c) => {
                  const checked = selectedCentros.includes(c);
                  return (
                    <label
                      key={c}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer ${
                        checked
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded text-blue-600"
                        checked={checked}
                        onChange={() => {
                          setSelectedCentros((prev) =>
                            checked
                              ? prev.filter((x) => x !== c)
                              : [...prev, c],
                          );
                        }}
                      />
                      <span className="truncate">{c}</span>
                    </label>
                  );
                })}
                {filteredCentros.length === 0 && (
                  <p className="text-xs text-gray-500 col-span-2 p-2">
                    No se encontraron centros gestores.
                  </p>
                )}
              </div>
              {selectedCentros.length > 0 && (
                <p className="mt-2 text-[11px] text-gray-500">
                  {selectedCentros.length} seleccionados.
                </p>
              )}
            </div>
          )}

          {audienceTab === "roles" && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roles.map((r) => {
                  const checked = selectedRoles.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-2 px-3 py-2 rounded-md text-xs cursor-pointer border ${
                        checked
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded text-blue-600 mt-0.5"
                        checked={checked}
                        onChange={() => {
                          setSelectedRoles((prev) =>
                            checked
                              ? prev.filter((x) => x !== r.id)
                              : [...prev, r.id],
                          );
                        }}
                      />
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-[11px] opacity-80 leading-tight">
                          {r.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {audienceTab === "emails" && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <textarea
                value={emailsRaw}
                onChange={(e) => setEmailsRaw(e.target.value)}
                rows={4}
                placeholder="correo1@dominio.com, correo2@dominio.com&#10;correo3@dominio.com"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Separa los correos por coma, espacio o salto de línea. Los
                duplicados se eliminan automáticamente.
              </p>
            </div>
          )}
        </div>

        {/* Emails extra (independientemente de la audiencia principal) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            Correos adicionales (opcional, además de la audiencia)
          </label>
          <input
            type="text"
            value={extraEmails}
            onChange={(e) => setExtraEmails(e.target.value)}
            placeholder="correo@externo.com, otro@externo.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Resumen / preview de destinatarios */}
        <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/20 p-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Bell className="w-4 h-4" />
              {previewLoading ? (
                <span>Calculando destinatarios…</span>
              ) : previewCount === null ? (
                <span>Define una audiencia válida para ver el conteo.</span>
              ) : (
                <span>
                  <strong>{previewCount}</strong> destinatario
                  {previewCount === 1 ? "" : "s"} resueltos.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={refreshPreview}
              disabled={!audienceIsValid || previewLoading}
              className="text-xs text-blue-700 dark:text-blue-200 hover:underline disabled:opacity-40"
            >
              Recalcular
            </button>
          </div>
          {previewError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-300">
              {previewError}
            </p>
          )}
          {previewSample.length > 0 && (
            <details className="mt-2 text-xs text-blue-900 dark:text-blue-100">
              <summary className="cursor-pointer">
                Ver muestra ({previewSample.length})
              </summary>
              <ul className="mt-1 list-disc list-inside max-h-40 overflow-y-auto">
                {previewSample.map((r) => (
                  <li key={r.email}>
                    {r.email}
                    {r.name ? (
                      <span className="opacity-70"> — {r.name}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar anuncio
          </button>
        </div>

        {sendError && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <span>{sendError}</span>
          </div>
        )}

        {lastResponse && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5" />
            <span>
              {lastResponse.message ||
                `Anuncio encolado para ${lastResponse.recipients_count} destinatario(s).`}
            </span>
          </div>
        )}
      </form>

      {/* Vista previa modal */}
      {showHtmlPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowHtmlPreview(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Vista previa del correo
              </h3>
              <button
                type="button"
                onClick={() => setShowHtmlPreview(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] p-6 bg-gray-100 dark:bg-gray-950">
              <div
                className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto text-sm text-gray-800"
                dangerouslySetInnerHTML={{
                  __html: `<h2 style="color:${
                    priority === "warning"
                      ? "#f59e0b"
                      : priority === "urgent"
                        ? "#dc2626"
                        : "#1a56db"
                  };margin:0 0 12px;">${subject || "(Sin asunto)"}</h2>${messageHtml || "<p>(Sin contenido)</p>"}${
                    ctaUrl && ctaLabel
                      ? `<p style="text-align:center;margin-top:24px;"><a href="${ctaUrl}" style="background:${
                          priority === "warning"
                            ? "#f59e0b"
                            : priority === "urgent"
                              ? "#dc2626"
                              : "#1a56db"
                        };color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">${ctaLabel}</a></p>`
                      : ""
                  }`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {showLogs && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Historial de envíos
              </h3>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              disabled={logsLoading}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {logsLoading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Destinatario</th>
                  <th className="py-2 pr-3">Asunto</th>
                  <th className="py-2 pr-3">Plantilla</th>
                  <th className="py-2 pr-3">Canal</th>
                  <th className="py-2 pr-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && !logsLoading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      Aún no hay envíos registrados.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr
                    key={log.id || `${log.to}-${log.sent_at}`}
                    className="border-b border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {formatDate(log.sent_at)}
                    </td>
                    <td className="py-2 pr-3 text-gray-800 dark:text-gray-100">
                      {log.to}
                    </td>
                    <td className="py-2 pr-3 text-gray-800 dark:text-gray-100 truncate max-w-[260px]">
                      {log.subject}
                    </td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                      {log.template || "—"}
                    </td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                      {log.channel || "—"}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          log.status === "sent"
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200"
                            : log.status === "blocked_quota"
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200"
                              : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200"
                        }`}
                      >
                        {log.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import comunicacionesService, {
  NotificationsHealth,
} from "@/services/comunicaciones.service";

interface Props {
  refreshKey?: number;
  onLoaded?: (health: NotificationsHealth) => void;
}

export default function NotificationsHealthBadge({
  refreshKey = 0,
  onLoaded,
}: Props) {
  const [health, setHealth] = useState<NotificationsHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await comunicacionesService.getHealth();
      setHealth(data);
      onLoaded?.(data);
    } catch (err: any) {
      setError(err?.message || "No se pudo obtener el estado del servicio");
    } finally {
      setLoading(false);
    }
  }, [onLoaded]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading && !health) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Verificando canal…
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/40 text-xs text-red-700 dark:text-red-300">
        <XCircle className="w-3.5 h-3.5" />
        {error || "Servicio no disponible"}
      </div>
    );
  }

  const channel = health.active_channel;
  const isOk = channel !== "none";
  const Icon = isOk
    ? channel === "smtp"
      ? CheckCircle2
      : CheckCircle2
    : XCircle;

  const label =
    channel === "smtp"
      ? "SMTP (Gmail App Password)"
      : channel === "gmail_api"
        ? "Gmail API (OAuth2)"
        : "Sin canal configurado";

  const colorCls = isOk
    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300";

  const usagePct = health.quota_usage_pct ?? 0;
  const usageColor =
    usagePct >= health.block_threshold
      ? "text-red-700 dark:text-red-300"
      : usagePct >= health.warn_threshold
        ? "text-amber-700 dark:text-amber-300"
        : "text-gray-600 dark:text-gray-300";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${colorCls}`}
        title={`Remitente: ${health.sender || "(sin configurar)"}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>

      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs ${usageColor}`}
        title={`Cuota diaria configurada: ${health.daily_quota}`}
      >
        {usagePct >= health.warn_threshold ? (
          <AlertTriangle className="w-3.5 h-3.5" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" />
        )}
        {health.sent_last_24h}/{health.daily_quota} en 24 h (
        {usagePct.toFixed(1)}%)
      </div>

      {!health.can_send && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5" />
          Tu rol no permite enviar comunicaciones
        </div>
      )}

      <button
        type="button"
        onClick={load}
        title="Actualizar estado del canal"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        Actualizar
      </button>
    </div>
  );
}

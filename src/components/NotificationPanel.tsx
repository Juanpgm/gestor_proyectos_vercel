/**
 * NotificationPanel â€” Panel de notificaciones.
 *
 * Muestra dos secciones:
 *   1. Notificaciones del backend (Firestore): solicitudes aprobadas/rechazadas
 *      y nuevas solicitudes de cambio.
 *   2. Notificaciones locales (localStorage): eventos del sistema.
 *
 * DiseÃ±o: GovTech / CaliTrack â€” sin emojis, Lucide icons, cn(), tokens @/theme.
 */

"use client";

import React, { useState } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  FileText,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import {
  useNotifications,
  useBackendNotifications,
} from "@/hooks/useNotifications";
import { formatNotifDateTime } from "@/services/backendNotificationsService";
import type { BackendNotification, Notification } from "@/types/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PanelFilter = "activas" | "no_leidas" | "todas";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODULO_LABEL: Record<string, string> = {
  emprestito: "EmprÃ©stito",
  unidades_proyecto: "Unidades de Proyecto",
  intervenciones: "Intervenciones",
};

function getActorLine(n: BackendNotification): string {
  const parts: string[] = [n.actor_nombre];
  if (n.actor_role) parts.push(`(${n.actor_role})`);
  if (n.actor_centro_gestor) parts.push(`â€” ${n.actor_centro_gestor}`);
  return parts.join(" ");
}

function verboPor(tipo: BackendNotification["tipo"]): string {
  if (tipo === "solicitud_aprobada") return "Aprobada por";
  if (tipo === "solicitud_rechazada") return "Rechazada por";
  return "Registrada por";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BackendNotifItemProps {
  notif: BackendNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function BackendNotifItem({
  notif,
  onMarkRead,
  onDelete,
}: BackendNotifItemProps) {
  const isRead = notif.leida;

  const borderColor =
    notif.tipo === "solicitud_aprobada"
      ? "border-l-emerald-500"
      : notif.tipo === "solicitud_rechazada"
        ? "border-l-red-500"
        : "border-l-teal-500";

  const icon =
    notif.tipo === "solicitud_aprobada" ? (
      <Check size={16} strokeWidth={1.5} className="text-emerald-600" />
    ) : notif.tipo === "solicitud_rechazada" ? (
      <AlertCircle size={16} strokeWidth={1.5} className="text-red-500" />
    ) : (
      <FileText size={16} strokeWidth={1.5} className="text-teal-600" />
    );

  return (
    <div
      className={cn(
        "p-4 border-l-4 group transition-colors",
        borderColor,
        isRead ? "bg-white hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-50/70",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>

        <div className="flex-1 min-w-0">
          {/* Title + timestamp */}
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold leading-snug",
                isRead ? "text-gray-700" : "text-gray-900",
              )}
            >
              {notif.titulo}
            </span>
            <span className="text-[11px] text-gray-400 whitespace-nowrap tabular-nums shrink-0">
              {formatNotifDateTime(notif.created_at)}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 mt-0.5 leading-snug">
            {notif.mensaje}
          </p>

          {/* Actor info */}
          <p className="text-[11px] uppercase tracking-wide font-medium text-gray-500 mt-1">
            {verboPor(notif.tipo)}: {getActorLine(notif)}
          </p>

          {/* Module badge + actions */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {MODULO_LABEL[notif.modulo] ?? notif.modulo}
            </span>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isRead && (
                <button
                  onClick={() => onMarkRead(notif.id)}
                  className="p-1 rounded-md hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Marcar como leÃ­da"
                >
                  <Check
                    size={14}
                    strokeWidth={1.5}
                    className="text-gray-600"
                  />
                </button>
              )}
              <button
                onClick={() => onDelete(notif.id)}
                className="p-1 rounded-md hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Eliminar notificaciÃ³n"
              >
                <Trash2 size={14} strokeWidth={1.5} className="text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LocalNotifItemProps {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function LocalNotifItem({ notif, onMarkRead, onDelete }: LocalNotifItemProps) {
  const isRead = notif.read;
  return (
    <div
      className={cn(
        "p-4 border-l-4 border-l-gray-300 group transition-colors",
        isRead ? "bg-white hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-50/70",
      )}
    >
      <div className="flex items-start gap-3">
        <Info
          size={16}
          strokeWidth={1.5}
          className="text-gray-400 mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold leading-snug",
                isRead ? "text-gray-600" : "text-gray-900",
              )}
            >
              {notif.title}
            </span>
            <span className="text-[11px] text-gray-400 whitespace-nowrap tabular-nums shrink-0">
              {formatNotifDateTime(new Date(notif.timestamp).toISOString())}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">
            {notif.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {notif.category}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isRead && (
                <button
                  onClick={() => onMarkRead(notif.id)}
                  className="p-1 rounded-md hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Marcar como leÃ­da"
                >
                  <Check
                    size={14}
                    strokeWidth={1.5}
                    className="text-gray-600"
                  />
                </button>
              )}
              <button
                onClick={() => onDelete(notif.id)}
                className="p-1 rounded-md hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Eliminar"
              >
                <Trash2 size={14} strokeWidth={1.5} className="text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { state } = useAuth();
  const user = state.user;

  const role = user?.primary_role ?? user?.roles?.[0] ?? "";
  const centro_gestor = user?.nombre_centro_gestor ?? undefined;

  // Backend (Firestore) notifications â€” solicitudes de cambio
  const {
    notifications: backendNotifs,
    unreadCount: backendUnread,
    loading: backendLoading,
    markAsRead: markBackendRead,
    markAllRead: markAllBackendRead,
    deleteNotification: deleteBackend,
    refresh: refreshBackend,
  } = useBackendNotifications({
    role,
    centro_gestor: centro_gestor ?? undefined,
    enabled: !!role,
  });

  // Local (localStorage) notifications â€” sistema
  const {
    notifications: localNotifs,
    stats: localStats,
    markAsRead: markLocalRead,
    markAllAsRead: markAllLocalRead,
    deleteNotification: deleteLocal,
  } = useNotifications();

  const [filter, setFilter] = useState<PanelFilter>("activas");

  // ---- filter backend notifs ----
  const filteredBackend = (() => {
    if (filter === "no_leidas") return backendNotifs.filter((n) => !n.leida);
    if (filter === "activas") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return backendNotifs.filter((n) => {
        if (!n.leida) return true;
        if (!n.leida_en) return false;
        return new Date(n.leida_en) >= sevenDaysAgo;
      });
    }
    return backendNotifs;
  })();

  // ---- filter local notifs ----
  const filteredLocal = (() => {
    if (filter === "no_leidas") return localNotifs.filter((n) => !n.read);
    if (filter === "activas") {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      return localNotifs.filter((n) => new Date(n.timestamp) >= fiveDaysAgo);
    }
    return localNotifs;
  })();

  const totalUnread = backendUnread + localStats.unread;
  const totalCount = backendNotifs.length + localNotifs.length;

  const handleMarkAllRead = async () => {
    await markAllBackendRead();
    markAllLocalRead();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay (mobile) */}
      <div
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white border-l border-gray-200 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell size={18} strokeWidth={1.5} className="text-gray-700" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Notificaciones
              </h2>
              <p className="text-[11px] text-gray-500">
                {totalUnread > 0
                  ? `${totalUnread} sin leer`
                  : "Sin nuevas notificaciones"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Cerrar panel de notificaciones"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Filters + bulk actions */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1">
            {(
              [
                { key: "activas", label: "Activas" },
                { key: "no_leidas", label: `Sin leer (${totalUnread})` },
                { key: "todas", label: `Todas (${totalCount})` },
              ] as { key: PanelFilter; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition-colors",
                  filter === key
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            {totalUnread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-1.5 rounded-md hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Marcar todas como leÃ­das"
                aria-label="Marcar todas como leÃ­das"
              >
                <CheckCheck
                  size={14}
                  strokeWidth={1.5}
                  className="text-gray-600"
                />
              </button>
            )}
            <button
              onClick={refreshBackend}
              className="p-1.5 rounded-md hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Actualizar"
              aria-label="Actualizar notificaciones"
            >
              <ChevronRight
                size={14}
                strokeWidth={1.5}
                className="text-gray-600 rotate-90"
              />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {backendLoading ? (
            <div
              className="flex items-center justify-center h-32"
              role="status"
            >
              <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
            </div>
          ) : filteredBackend.length === 0 && filteredLocal.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Bell size={40} strokeWidth={1} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Sin notificaciones
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {filter === "activas" && "No hay notificaciones activas"}
                {filter === "no_leidas" && "Nada pendiente por leer"}
                {filter === "todas" && "No hay notificaciones registradas"}
              </p>
            </div>
          ) : (
            <>
              {/* Backend notifications â€” solicitudes */}
              {filteredBackend.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[11px] uppercase tracking-wide font-medium text-gray-500">
                      Solicitudes de cambio
                    </span>
                  </div>
                  {filteredBackend.map((n) => (
                    <BackendNotifItem
                      key={n.id}
                      notif={n}
                      onMarkRead={markBackendRead}
                      onDelete={deleteBackend}
                    />
                  ))}
                </div>
              )}

              {/* Local notifications â€” sistema */}
              {filteredLocal.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[11px] uppercase tracking-wide font-medium text-gray-500">
                      Sistema
                    </span>
                  </div>
                  {filteredLocal.map((n) => (
                    <LocalNotifItem
                      key={n.id}
                      notif={n}
                      onMarkRead={markLocalRead}
                      onDelete={deleteLocal}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;

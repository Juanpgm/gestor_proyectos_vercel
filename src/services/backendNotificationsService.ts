/**
 * Servicio de notificaciones del backend (Firestore via API REST).
 *
 * Cubre el Tier 1 (admin_centro_gestor: solicitudes resueltas) y
 * el Tier 2 (admin_general / super_admin: nuevas solicitudes).
 */

import { API_ENDPOINTS } from "@/config/api";
import { BackendNotification } from "@/types/notifications";

const BASE = API_ENDPOINTS.BASE_URL;

// ------------------------------------------------------------------ helpers

function buildUrl(
  path: string,
  params: Record<string, string | boolean | number | undefined>,
): string {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  return url.toString();
}

// ------------------------------------------------------------------ API calls

export interface FetchNotificationsParams {
  role: string;
  centro_gestor?: string;
  solo_no_leidas?: boolean;
  limit?: number;
}

export interface NotificationsResponse {
  success: boolean;
  data: BackendNotification[];
  count: number;
  unread_count: number;
}

export async function fetchNotificaciones(
  params: FetchNotificationsParams,
): Promise<NotificationsResponse> {
  const url = buildUrl("/notificaciones", {
    role: params.role,
    centro_gestor: params.centro_gestor,
    solo_no_leidas: params.solo_no_leidas,
    limit: params.limit ?? 50,
  });

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Error fetching notificaciones: ${res.status}`);
  return res.json();
}

export async function fetchNotificacionesCount(
  role: string,
  centro_gestor?: string,
): Promise<number> {
  const url = buildUrl("/notificaciones/count", { role, centro_gestor });
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.count ?? 0;
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  const res = await fetch(`${BASE}/notificaciones/${id}/leer`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Error marcando notificación: ${res.status}`);
}

export async function marcarTodasLeidas(
  role: string,
  centro_gestor?: string,
): Promise<number> {
  const url = buildUrl("/notificaciones/leer-todas", { role, centro_gestor });
  const res = await fetch(url, { method: "PATCH", credentials: "include" });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.marcadas ?? 0;
}

export async function eliminarNotificacion(id: string): Promise<void> {
  const res = await fetch(`${BASE}/notificaciones/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Error eliminando notificación: ${res.status}`);
}

// ------------------------------------------------------------------ date utils

/**
 * Formatea ISO timestamp como "dd/mm/aaaa HH:mm" (24h).
 */
export function formatNotifDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return isoStr;
  }
}

/**
 * Retorna true si la notificación ha expirado (leída hace >7 días).
 */
export function isNotifExpired(notif: BackendNotification): boolean {
  if (!notif.leida || !notif.leida_en) return false;
  try {
    const leida = new Date(notif.leida_en);
    const now = new Date();
    return now.getTime() - leida.getTime() > 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

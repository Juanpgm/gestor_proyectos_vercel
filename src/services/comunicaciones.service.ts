/**
 * Servicio de Comunicaciones / Anuncios
 * Comunicación con los endpoints `/comunicaciones/*` del backend.
 *
 * Las llamadas pasan por el proxy de Next (`/api/proxy/...`), excepto por
 * `broadcast` que usa `FormData` y un fetch directo para preservar el body
 * binario (adjuntos).
 */

import { apiClient } from "./api";
import { getCurrentIdToken } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type AnnouncementPriority = "info" | "warning" | "urgent";

export type AudienceType =
  | "all"
  | "activos"
  | "centros_gestores"
  | "roles"
  | "uids"
  | "emails";

export interface AudienceSelection {
  type: AudienceType;
  centrosGestores?: string[];
  roles?: string[];
  emails?: string[]; // lista libre de correos
  uids?: string[];
}

export interface BroadcastPayload {
  subject: string;
  message_html: string;
  audience: string; // string ya serializado (ver `serializeAudience`)
  priority?: AnnouncementPriority;
  cta_url?: string;
  cta_label?: string;
  extra_emails?: string; // lista libre adicional separada por comas
  attachments?: File[];
}

export interface BroadcastResponse {
  success: boolean;
  audience: string;
  recipients_count: number;
  status: string;
  message: string;
}

export interface AudiencePreviewResponse {
  audience: string;
  recipients_count: number;
  preview: Array<{ email: string; name: string }>;
}

export interface NotificationsHealth {
  smtp_configured: boolean;
  gmail_api_configured: boolean;
  active_channel: "smtp" | "gmail_api" | "none";
  smtp_host: string;
  smtp_port: number;
  sender: string;
  sender_name: string;
  frontend_url: string;
  daily_quota: number;
  sent_last_24h: number;
  quota_remaining: number;
  warn_threshold: number;
  block_threshold: number;
  quota_usage_pct: number;
  can_send: boolean;
}

export interface TestEmailResponse {
  sent: boolean;
  to: string;
  channel?: string;
  error?: string;
}

export interface ComunicacionesRoleItem {
  id: string;
  name: string;
  level: number;
  description: string;
}

export interface ComunicacionesLogEntry {
  id?: string;
  to?: string;
  subject?: string;
  template?: string;
  status?: string;
  error?: string;
  channel?: string;
  sent_by?: string;
  sent_at?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const splitFreeText = (raw?: string): string[] =>
  (raw || "")
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);

/**
 * Convierte una selección de audiencia en el string que entiende el backend.
 *
 * Formato soportado:
 *  - `all`
 *  - `activos`
 *  - `centros_gestores:n1|n2`
 *  - `roles:r1,r2`
 *  - `uids:u1,u2`
 *  - `emails:a@b.com,c@d.com`
 */
export function serializeAudience(selection: AudienceSelection): string {
  switch (selection.type) {
    case "all":
      return "all";
    case "activos":
      return "activos";
    case "centros_gestores": {
      const list = (selection.centrosGestores || [])
        .map((s) => s.trim())
        .filter(Boolean);
      return `centros_gestores:${list.join("|")}`;
    }
    case "roles": {
      const list = (selection.roles || []).map((s) => s.trim()).filter(Boolean);
      return `roles:${list.join(",")}`;
    }
    case "uids": {
      const list = (selection.uids || []).map((s) => s.trim()).filter(Boolean);
      return `uids:${list.join(",")}`;
    }
    case "emails": {
      const list = (selection.emails || [])
        .flatMap((value) => splitFreeText(value))
        .filter(Boolean);
      return `emails:${list.join(",")}`;
    }
    default:
      return "all";
  }
}

const PROXY_BASE = "/api/proxy";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getCurrentIdToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

class ComunicacionesService {
  async getHealth(): Promise<NotificationsHealth> {
    return apiClient.get<NotificationsHealth>("comunicaciones/health");
  }

  async previewAudience(
    audience: string,
    maxPreview = 20,
  ): Promise<AudiencePreviewResponse> {
    return apiClient.post<AudiencePreviewResponse>(
      "comunicaciones/audiencia/preview",
      { audience, max_preview: maxPreview },
    );
  }

  async sendTest(to?: string): Promise<TestEmailResponse> {
    const path = to
      ? `comunicaciones/test?to=${encodeURIComponent(to)}`
      : "comunicaciones/test";
    return apiClient.post<TestEmailResponse>(path);
  }

  async getRoles(): Promise<ComunicacionesRoleItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: ComunicacionesRoleItem[];
    }>("comunicaciones/roles");
    return res?.data || [];
  }

  async getCentrosGestores(): Promise<string[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: string[];
    }>("comunicaciones/centros-gestores");
    return res?.data || [];
  }

  async getHistorial(limit = 50): Promise<ComunicacionesLogEntry[]> {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      data: ComunicacionesLogEntry[];
    }>(`comunicaciones/historial?limit=${limit}`);
    return res?.data || [];
  }

  /**
   * Envío de broadcast (multipart). Usa fetch directo para preservar el
   * body binario de los adjuntos.
   */
  async broadcast(payload: BroadcastPayload): Promise<BroadcastResponse> {
    const fd = new FormData();
    fd.append("subject", payload.subject);
    fd.append("message_html", payload.message_html);
    fd.append("audience", payload.audience);
    fd.append("priority", payload.priority || "info");
    if (payload.cta_url) fd.append("cta_url", payload.cta_url);
    if (payload.cta_label) fd.append("cta_label", payload.cta_label);
    if (payload.extra_emails) fd.append("extra_emails", payload.extra_emails);
    (payload.attachments || []).forEach((file) => {
      fd.append("attachments", file, file.name);
    });

    const headers = await authHeaders();
    // No establecer Content-Type — el browser añade el boundary multipart.
    delete headers["Content-Type"];

    const response = await fetch(`${PROXY_BASE}/comunicaciones/broadcast`, {
      method: "POST",
      headers,
      body: fd,
    });

    const rawText = await response.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = { detail: rawText };
    }

    if (!response.ok) {
      const detail = data?.detail || data?.error || data?.message || rawText;
      throw new Error(
        typeof detail === "string"
          ? detail
          : "No se pudo enviar el anuncio masivo",
      );
    }
    return data as BroadcastResponse;
  }
}

const comunicacionesService = new ComunicacionesService();
export default comunicacionesService;

// Tipos para el módulo unificado de Gestionar Empréstito
// Interfaces para calidad de datos, solicitudes de cambio y análisis

export interface EmprestitoQualitySummary {
  global_quality_score: number;
  error_rate: number;
  total_records_validated: number;
  records_with_issues: number;
  total_issues_found: number;
  severity_distribution: Record<string, number>;
  dimension_distribution: Record<string, number>;
  system_status?: string;
  requires_immediate_action?: boolean;
  report_id?: string;
  report_timestamp?: string;
  comparison_with_previous?: any;
  overall_trend?: "improving" | "stable" | "worsening";
  trends_summary?: Record<string, any>;
  trends_count?: { improving: number; stable: number; worsening: number };
  has_comparison_data?: boolean;
  top_quality_centros?: Array<{
    nombre: string;
    score: number;
    issues: number;
  }>;
}

export interface EmprestitoQualityRecord {
  id: string;
  referencia: string;
  tipo_entidad: "contrato" | "proceso" | "rpc" | "pago" | "convenio";
  nombre_centro_gestor: string;
  banco?: string;
  total_issues: number;
  max_severity: string;
  priority: string;
  issues: Array<{
    field: string;
    severity: string;
    dimension: string;
    message: string;
    rule_id?: string;
  }>;
  affected_fields: string[];
}

export interface EmprestitoChangelog {
  id: string;
  timestamp: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field?: string;
  old_value?: any;
  new_value?: any;
  changed_by?: string;
  old_report_id?: string;
  new_report_id?: string;
  upid?: string;
}

export interface SolicitudCambioContratoPayload {
  referencia_contrato: string;
  campos_modificados: Record<string, { anterior: any; nuevo: any }>;
  justificacion: string;
  solicitado_por: string;
  nombre_centro_gestor: string;
}

export interface SolicitudCambioProcesoPayload {
  referencia_proceso: string;
  campos_modificados: Record<string, { anterior: any; nuevo: any }>;
  justificacion: string;
  solicitado_por: string;
  nombre_centro_gestor: string;
}

export interface SolicitudCambioRPCPayload {
  numero_rpc: string;
  referencia_contrato: string;
  campos_modificados: Record<string, { anterior: any; nuevo: any }>;
  justificacion: string;
  solicitado_por: string;
  nombre_centro_gestor: string;
}

export interface SolicitudCambioPagoPayload {
  numero_rpc: string;
  campos_modificados: Record<string, { anterior: any; nuevo: any }>;
  justificacion: string;
  solicitado_por: string;
  nombre_centro_gestor: string;
}

export interface SolicitudCambioEmprestito {
  id: string;
  tipo: "contrato" | "proceso" | "rpc" | "pago" | "convenio" | "orden_compra";
  referencia: string;
  campos_modificados: Record<string, { anterior: any; nuevo: any }>;
  justificacion: string;
  solicitado_por: string;
  nombre_centro_gestor: string;
  estado_decision: "pendiente" | "aprobada" | "rechazada" | null;
  decidido_por?: string | null;
  fecha_decision?: string | null;
  created_at: string;
  registro_actual?: Record<string, any>;
}

export interface AvanceEmprestitoContrato {
  id: string;
  referencia_contrato: string;
  avance_fisico: number;
  avance_financiero: number;
  fecha_reporte: string;
  observaciones: string;
  nombre_centro_gestor: string;
  estado_reporte?: string;
  alertas?: {
    descripcion: string;
    es_alerta: boolean;
    tipos: string[];
  };
  archivos_evidencia?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
}

export interface CentroGestorEmprestitoResumen {
  nombre_centro_gestor: string;
  total_contratos: number;
  total_procesos: number;
  total_rpcs: number;
  total_pagos: number;
  total_convenios: number;
  valor_total_contratos: number;
  valor_total_pagos: number;
  avance_promedio: number;
  alertas_activas: number;
  quality_score?: number;
  issues_count?: number;
}

export interface EmprestitoRegistroUnificado {
  id: string;
  tipo: "contrato" | "proceso" | "rpc" | "pago" | "convenio";
  referencia: string;
  descripcion: string;
  valor: number;
  estado: string;
  nombre_centro_gestor: string;
  banco?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  [key: string]: any;
}

export interface EmprestitoCalidadDatosResponse {
  summary: EmprestitoQualitySummary;
  records: EmprestitoQualityRecord[];
  changelog: EmprestitoChangelog[];
  by_centro_gestor: CentroGestorEmprestitoResumen[];
  stats: Record<string, any>;
}

export type EmprestitoTabId =
  | "resumen"
  | "registros"
  | "historial-cambios"
  | "por-centro-gestor"
  | "estadisticas"
  | "gestionar-registros"
  | "avances"
  | "analisis"
  | "solicitudes-pendientes"
  | "historial-solicitudes";

export const EMPRESTITO_TAB_LABELS: Record<EmprestitoTabId, string> = {
  resumen: "Resumen Calidad",
  registros: "Registros Calidad",
  "historial-cambios": "Historial Cambios",
  "por-centro-gestor": "Por Centro Gestor",
  estadisticas: "Estadísticas",
  "gestionar-registros": "Gestionar Registros",
  avances: "Avances Contratos",
  analisis: "Análisis General",
  "solicitudes-pendientes": "Solicitudes Pendientes",
  "historial-solicitudes": "Historial Solicitudes",
};

export const EMPRESTITO_ENTITY_TYPES = [
  "contrato",
  "proceso",
  "rpc",
  "pago",
  "convenio",
  "orden_compra",
] as const;

export type EmprestitoEntityType = (typeof EMPRESTITO_ENTITY_TYPES)[number];

export const EMPRESTITO_ENTITY_LABELS: Record<EmprestitoEntityType, string> = {
  contrato: "Contratos",
  proceso: "Procesos",
  rpc: "RPCs",
  pago: "Pagos",
  convenio: "Convenios",
  orden_compra: "Órdenes de Compra",
};

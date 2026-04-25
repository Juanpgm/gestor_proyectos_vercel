// Tipos para el módulo de reportes/avances de contratos de empréstito
// Usa endpoints reales del backend: POST/GET /reportes_contratos/

export interface ArchivoEvidencia {
  url: string
  drive_id: string
  name: string
  type: string
  size: number
  status: string
  download_url: string
}

export interface AlertaReporte {
  descripcion: string
  es_alerta: boolean
  tipos: string[]
}

export interface ReporteContrato {
  id: string
  referencia_contrato: string
  avance_fisico: number
  avance_financiero: number
  fecha_reporte: string
  observaciones: string
  nombre_centro_gestor: string
  nombre_centro_gestor_source?: string
  estado_reporte?: string
  alertas: AlertaReporte
  archivos_evidencia?: ArchivoEvidencia[]
  url_carpeta_drive?: string
}

export interface ReporteContratoFormData {
  referencia_contrato: string
  observaciones: string
  avance_fisico: number
  avance_financiero: number
  alertas_descripcion: string
  alertas_es_alerta: boolean
  alertas_tipo_alerta: string // tipos separados por coma
  archivos_evidencia: File[]
}

export interface ResumenReportesContrato {
  total_reportes: number
  ultimo_avance_fisico: number
  ultimo_avance_financiero: number
  ultima_fecha_reporte: string | null
  tiene_alertas_activas: boolean
  tendencia_fisica: 'subiendo' | 'bajando' | 'estable' | 'sin_datos'
  tendencia_financiera: 'subiendo' | 'bajando' | 'estable' | 'sin_datos'
}

export const TIPOS_ALERTA = [
  'Retraso en cronograma',
  'Sobrecosto',
  'Problemas de calidad',
  'Problemas logísticos',
  'Temas legales',
  'Falta de recursos',
  'Problemas ambientales',
  'Riesgo social',
  'Otro'
] as const

export const ARCHIVOS_PERMITIDOS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif'
]

export const MAX_FILE_SIZE_MB = 10

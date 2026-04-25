/**
 * Tipos para la gestión de avances de Unidades de Proyecto
 */

// Soporte (imagen o documento) adjunto a un avance — nuevo schema API
export interface SoporteUP {
  indice: number;
  tipo: 'imagen' | 'documento';
  nombre_original: string;
  extension: string;
  content_type: string;
  s3_key?: string;         // S3 object key (used to generate SigV4 presigned URLs)
  url: string;
  url_directa?: string;    // Raw S3 URL without auth params
  url_presigned?: string;  // S3 presigned URL from backend (SigV2 — may be invalid)
  presigned_url?: string;  // alias alternativo del backend
  uploaded_at: string;
}

// Reporte de avance individual
export interface AvanceUP {
  id: string;
  upid: string;
  fecha_reporte: string; // ISO string
  avance_fisico: number; // 0-100
  avance_financiero: number; // 0-100
  valor_ejecutado: number; // Valor en COP
  observaciones: string;
  estado_reporte: 'borrador' | 'enviado' | 'aprobado' | 'rechazado';
  reportado_por: string;
  archivos: ArchivoAvance[]; // backward compat
  soportes: SoporteUP[]; // nuevo schema: array tipado de soportes
  imagenes_urls: string[]; // URLs de imágenes listas para <img>
  documentos_urls: string[]; // URLs de documentos para descarga/visualización
  created_at: string;
  updated_at: string;
}

// Archivo adjunto a un avance (legacy / compat)
export interface ArchivoAvance {
  id: string;
  nombre: string;
  tipo: string; // mime type
  tamaño: number; // bytes
  url?: string;
}

// Formulario para crear/editar un avance
export interface AvanceUPFormData {
  fecha_reporte: string;
  avance_fisico: number;
  avance_financiero: number;
  valor_ejecutado: number;
  observaciones: string;
  archivos: File[];
}

// Datos editables de la Unidad de Proyecto
export interface EditInfoUPFormData {
  estado: string;
  avance_obra: number;
  observaciones_generales: string;
  frente_activo: string;
  fecha_inicio: string;
  fecha_fin: string;
}

// Resumen de avances por UP
export interface ResumenAvancesUP {
  upid: string;
  total_reportes: number;
  ultimo_avance_fisico: number;
  ultimo_avance_financiero: number;
  fecha_ultimo_reporte: string | null;
  tendencia: 'subiendo' | 'estable' | 'bajando';
}

// Estado del hook de avances
export interface AvancesUPState {
  avances: AvanceUP[];
  loading: boolean;
  error: string | null;
  resumen: ResumenAvancesUP | null;
}

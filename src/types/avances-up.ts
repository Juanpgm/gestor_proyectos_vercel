/**
 * Tipos para la gestión de avances de Unidades de Proyecto
 * Fase inicial: datos mockeados con localStorage
 */

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
  archivos: ArchivoAvance[];
  created_at: string;
  updated_at: string;
}

// Archivo adjunto a un avance
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

/**
 * Catálogo canónico de Centros Gestores (frontend).
 *
 * Espejo de `back/auth_system/centros_catalog.py`. Única fuente de verdad de los
 * nombres oficiales en el cliente: picklist de registro, validación y
 * canonicalización para comparar pertenencia de centro.
 *
 * Mantener sincronizado con el backend y con
 * `front/public/data/ejecucion_presupuestal/centro_gestor.json`.
 */

export const CENTROS_GESTORES: string[] = [
  // Núcleo con datos de ejecución (centro_gestor.json).
  "Secretaría de Gobierno",
  "Departamento Administrativo de Gestión Jurídica Pública",
  "Departamento Administrativo de Control Interno",
  "Departamento Administrativo de Control Disciplinario Interno",
  "Departamento Administrativo de Hacienda",
  "Departamento Administrativo de Planeación Municipal",
  "Departamento Administrativo de Gestión del Medio Ambiente - DAGMA",
  "Secretaría de Salud Pública",
  "Secretaría de Cultura",
  "Secretaría de Seguridad y Justicia",
  "Secretaría de Bienestar Social",
  "Departamento Administrativo de Desarrollo e Innovación Institucional",
  "Secretaría de Desarrollo Económico",
  "Unidad Administrativa Especial de Servicios Públicos",
  "Secretaría del Deporte y la Recreación",
  "Secretaría de Infraestructura",
  "Secretaría de Desarrollo Territorial y Participación Ciudadana",
  "Secretaría de Educación",
  "Secretaría de Gestión del Riesgo de Emergencias y Desastres",
  // Centros adicionales válidos ofrecidos en el registro (unión, para no
  // rechazar usuarios legítimos). Debe coincidir con el backend.
  "Departamento Administrativo de Tecnologías de la Información y las Comunicaciones",
  "Departamento Administrativo de Contratación Pública",
  "Secretaría de Vivienda Social y Hábitat",
  "Secretaría de Movilidad",
  "Secretaría de Paz y Cultura Ciudadana",
  "Secretaría de Turismo",
  "Unidad Administrativa Especial de Gestión de Bienes y Servicios",
];

// Centros INTERNOS especiales: NO seleccionables en el registro (no van en el
// picklist), pero válidos y con VISIBILIDAD GLOBAL (equipo administrador).
export const INTERNAL_GLOBAL_CENTROS: string[] = ["Calitrack"];

/** Forma normalizada para comparar: sin tildes, minúsculas, espacios colapsados. */
export const normalizeCentro = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const CANON_BY_NORMALIZED = new Map<string, string>(
  [...CENTROS_GESTORES, ...INTERNAL_GLOBAL_CENTROS].map((name) => [
    normalizeCentro(name),
    name,
  ]),
);

const INTERNAL_GLOBAL_NORMALIZED = new Set(
  INTERNAL_GLOBAL_CENTROS.map(normalizeCentro),
);

/** True si el centro es interno y otorga visibilidad global (p.ej. Calitrack). */
export const isGlobalViewCentro = (value: unknown): boolean =>
  INTERNAL_GLOBAL_NORMALIZED.has(normalizeCentro(value));

// Alias conocidos (variante -> canónico). Replicar con el backend.
const ALIASES_RAW: Record<string, string> = {
  "departamento administrativo de planeacion":
    "Departamento Administrativo de Planeación Municipal",
  "departamento administrativo de planeacion municipal":
    "Departamento Administrativo de Planeación Municipal",
  "departamento administrativo de gestion del medio ambiente":
    "Departamento Administrativo de Gestión del Medio Ambiente - DAGMA",
  dagma: "Departamento Administrativo de Gestión del Medio Ambiente - DAGMA",
  "departamento administrativo de control disciplinario interno de instruccion":
    "Departamento Administrativo de Control Disciplinario Interno",
  dagrd: "Secretaría de Gestión del Riesgo de Emergencias y Desastres",
  "dagrd - departamento administrativo de gestion del riesgo":
    "Secretaría de Gestión del Riesgo de Emergencias y Desastres",
  "departamento administrativo de gestion del riesgo":
    "Secretaría de Gestión del Riesgo de Emergencias y Desastres",
  datic:
    "Departamento Administrativo de Tecnologías de la Información y las Comunicaciones",
  // Formas cortas legacy detectadas en flujo_caja.json (Excel exportado).
  deportes: "Secretaría del Deporte y la Recreación",
  deporte: "Secretaría del Deporte y la Recreación",
  "secretaria de deporte y recreacion": "Secretaría del Deporte y la Recreación",
  "bienestar social": "Secretaría de Bienestar Social",
  cultura: "Secretaría de Cultura",
  "desarrollo economico": "Secretaría de Desarrollo Económico",
  "desarrollo territorial":
    "Secretaría de Desarrollo Territorial y Participación Ciudadana",
  "desarrollo terriotiral":
    "Secretaría de Desarrollo Territorial y Participación Ciudadana",
  educacion: "Secretaría de Educación",
  infraestructura: "Secretaría de Infraestructura",
  riesgos: "Secretaría de Gestión del Riesgo de Emergencias y Desastres",
  salud: "Secretaría de Salud Pública",
  vivienda: "Secretaría de Vivienda Social y Hábitat",
  bienes: "Unidad Administrativa Especial de Gestión de Bienes y Servicios",
};

const ALIASES = new Map<string, string>(
  Object.entries(ALIASES_RAW).map(([k, v]) => [normalizeCentro(k), v]),
);

/** Devuelve el nombre canónico del centro, o `null` si no se reconoce. */
export const canonicalizeCentro = (value: unknown): string | null => {
  const key = normalizeCentro(value);
  if (!key) return null;
  return CANON_BY_NORMALIZED.get(key) ?? ALIASES.get(key) ?? null;
};

/** True si el valor puede mapearse a un centro del catálogo. */
export const isValidCentro = (value: unknown): boolean =>
  canonicalizeCentro(value) !== null;

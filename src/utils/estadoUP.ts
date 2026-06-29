// ── Reglas de negocio: derivación del estado de una Unidad de Proyecto ──────
// `estado` es un campo EFÍMERO: se deriva de `avance_obra` (el dato persistido,
// cache del último reporte de `avances_unidades_proyecto`). El estado guardado
// solo se respeta cuando es un valor MANUAL explícito imputado por el usuario
// (`Suspendido`, `Inaugurado`). Cualquier otro estado almacenado se ignora y se
// re-deriva a partir de `avance_obra`.
//
// Este contrato (whitelist) debe coincidir con el backend `_calcular_estado`
// (back/api/scripts/unidades_proyecto.py). Mantener una única fuente en el
// frontend evita que las copias dupliquen y diverjan.

/** Avance (%) por debajo del cual la intervención se considera "En alistamiento". */
export const AVANCE_MIN_EN_EJECUCION = 0.5;
/** Avance (%) en o por encima del cual la intervención se considera "Terminado". */
export const AVANCE_MAX_EN_EJECUCION = 99.5;

/** Estados manuales (imputados por el usuario) que se respetan tal cual, normalizados. */
export const SPECIAL_ESTADOS_NORM = new Set(["suspendido", "inaugurado"]);

/** Normaliza un texto: sin acentos, sin espacios extremos y en minúsculas. */
export const normalizeEstado = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/**
 * Deriva el estado de una intervención/UP a partir de `avance_obra`.
 *
 * - Si `rawEstado` es un estado manual explícito (`Suspendido`, `Inaugurado`),
 *   se respeta tal cual.
 * - En cualquier otro caso el estado se calcula desde `avance_obra`:
 *   `< 0.5` → "En alistamiento", `>= 99.5` → "Terminado", resto → "En ejecución".
 */
export const deriveEstadoUP = (
  avanceObra: number | string | null | undefined,
  rawEstado?: string | null,
): string => {
  const raw = String(rawEstado ?? "").trim();
  // Respetar SOLO los estados manuales explícitos (whitelist).
  if (raw && SPECIAL_ESTADOS_NORM.has(normalizeEstado(raw))) {
    return raw;
  }
  const avance =
    typeof avanceObra === "number"
      ? avanceObra
      : parseFloat(String(avanceObra ?? "0"));
  // Umbrales consistentes con la visualización (ProgressBar muestra toFixed(0)).
  if (isNaN(avance) || avance < AVANCE_MIN_EN_EJECUCION) return "En alistamiento";
  if (avance >= AVANCE_MAX_EN_EJECUCION) return "Terminado";
  return "En ejecución";
};

/**
 * Normaliza el campo `estado` de un registro de UP/intervención derivándolo de
 * `avance_obra`. Es el punto de ingesta único: aplicar al cruzar la frontera de
 * datos (servicios/hooks) garantiza que `.estado` sea canónico aguas abajo, sin
 * que cada consumidor tenga que recordar derivar. No muta el registro original.
 */
export const withDerivedEstado = <
  T extends { avance_obra?: number | string | null; estado?: string | null },
>(
  record: T,
): T & { estado: string } => ({
  ...record,
  estado: deriveEstadoUP(record.avance_obra, record.estado),
});

/** Color por defecto (gris) para estados desconocidos o agregados. */
const ESTADO_UP_COLOR_DEFAULT = "#6B7280";

/** Mapa canónico estado → color, indexado por etiqueta normalizada. */
const ESTADO_UP_COLORS: Record<string, string> = {
  "en alistamiento": "#F59E0B",
  "en ejecucion": "#3B82F6",
  terminado: "#10B981",
  suspendido: "#EF4444",
  inaugurado: "#8B5CF6",
};

/**
 * Color canónico para un estado de UP/intervención. Normaliza la etiqueta y la
 * busca en el mapa; etiquetas agregadas ("Varios estados"/"Sin estado") o
 * desconocidas caen al gris por defecto. Reemplaza el matching difuso por
 * substring que divergía entre vistas.
 */
export const getEstadoUPColor = (estado: string | null | undefined): string =>
  ESTADO_UP_COLORS[normalizeEstado(String(estado ?? ""))] ??
  ESTADO_UP_COLOR_DEFAULT;

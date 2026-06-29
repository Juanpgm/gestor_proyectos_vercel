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
  avanceObra: number | null | undefined,
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

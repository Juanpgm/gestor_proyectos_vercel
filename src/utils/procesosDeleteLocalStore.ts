const DELETED_PROCESOS_STORAGE_KEY = 'gestor_procesos_deleted_refs_v1'

const readDeletedRefs = (): Set<string> => {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const raw = window.localStorage.getItem(DELETED_PROCESOS_STORAGE_KEY)
    if (!raw) return new Set<string>()

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<string>()

    return new Set(parsed.map((value) => String(value || '').trim()).filter(Boolean))
  } catch {
    return new Set<string>()
  }
}

const writeDeletedRefs = (refs: Set<string>) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(DELETED_PROCESOS_STORAGE_KEY, JSON.stringify(Array.from(refs)))
  } catch {
    // noop
  }
}

export const markProcesoRefAsDeletedLocally = (referencia: string) => {
  const normalized = String(referencia || '').trim()
  if (!normalized) return

  const refs = readDeletedRefs()
  refs.add(normalized)
  writeDeletedRefs(refs)
}

export const isProcesoRefDeletedLocally = (referencia: string): boolean => {
  const normalized = String(referencia || '').trim()
  if (!normalized) return false

  return readDeletedRefs().has(normalized)
}

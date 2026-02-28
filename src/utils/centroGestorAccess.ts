export interface CentroGestorAccess {
  userCentroGestor: string | null
  canViewAll: boolean
  isRestricted: boolean
}

const OPEN_ACCESS_CENTROS = new Set(['calitrack', 'otro'])

const normalizeValue = (value: unknown): string => String(value || '').trim().toLowerCase()

const extractUserCentroGestor = (sessionPayload: any): string | null => {
  const value =
    sessionPayload?.user?.nombre_centro_gestor ||
    sessionPayload?.user?.centro_gestor_assigned ||
    sessionPayload?.nombre_centro_gestor ||
    sessionPayload?.centro_gestor_assigned ||
    null

  if (!value || typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export const isOpenCentroGestor = (centroGestor: string | null | undefined): boolean => {
  if (!centroGestor) return false
  return OPEN_ACCESS_CENTROS.has(normalizeValue(centroGestor))
}

export const getCentroGestorAccessFromSession = (): CentroGestorAccess => {
  if (typeof window === 'undefined') {
    return {
      userCentroGestor: null,
      canViewAll: true,
      isRestricted: false
    }
  }

  try {
    const rawSession =
      localStorage.getItem('auth_session') ||
      sessionStorage.getItem('auth_session')

    if (!rawSession) {
      return {
        userCentroGestor: null,
        canViewAll: true,
        isRestricted: false
      }
    }

    const parsedSession = JSON.parse(rawSession)
    const userCentroGestor = extractUserCentroGestor(parsedSession)

    if (!userCentroGestor || isOpenCentroGestor(userCentroGestor)) {
      return {
        userCentroGestor,
        canViewAll: true,
        isRestricted: false
      }
    }

    return {
      userCentroGestor,
      canViewAll: false,
      isRestricted: true
    }
  } catch (error) {
    console.warn('⚠️ Error reading auth session for centro gestor filtering:', error)
    return {
      userCentroGestor: null,
      canViewAll: true,
      isRestricted: false
    }
  }
}

export const itemMatchesCentroGestor = (
  item: Record<string, any>,
  access: CentroGestorAccess,
  candidateKeys: string[] = ['nombre_centro_gestor', 'centro_gestor', 'responsible']
): boolean => {
  if (access.canViewAll || !access.userCentroGestor) return true

  const normalizedUserCentro = normalizeValue(access.userCentroGestor)

  for (const key of candidateKeys) {
    const value = item?.[key]

    if (Array.isArray(value)) {
      const hasMatchInArray = value.some((entry) => normalizeValue(entry) === normalizedUserCentro)
      if (hasMatchInArray) return true
      continue
    }

    if (normalizeValue(value) === normalizedUserCentro) {
      return true
    }
  }

  return false
}

export const filterByCentroGestor = <T extends Record<string, any>>(
  data: T[],
  access: CentroGestorAccess,
  candidateKeys?: string[]
): T[] => {
  if (!Array.isArray(data) || data.length === 0 || access.canViewAll) return data
  return data.filter((item) => itemMatchesCentroGestor(item, access, candidateKeys))
}

export const toBpinKey = (bpin: string | number | null | undefined): string | null => {
  if (bpin === null || bpin === undefined) return null
  const normalized = String(bpin).trim()
  return normalized.length > 0 ? normalized : null
}

export const buildAllowedBpinsSet = <T extends Record<string, any>>(
  projects: T[],
  access: CentroGestorAccess,
  centroKeys: string[] = ['nombre_centro_gestor', 'centro_gestor', 'responsible'],
  bpinKey: string = 'bpin'
): Set<string> | null => {
  if (access.canViewAll) return null

  const filteredProjects = filterByCentroGestor(projects, access, centroKeys)
  const bpins = filteredProjects
    .map((project) => toBpinKey(project?.[bpinKey]))
    .filter((value): value is string => Boolean(value))

  return new Set(bpins)
}

export const filterByAllowedBpins = <T extends Record<string, any>>(
  data: T[],
  allowedBpins: Set<string> | null,
  bpinKey: string = 'bpin'
): T[] => {
  if (!Array.isArray(data) || data.length === 0 || !allowedBpins) return data

  return data.filter((item) => {
    const bpin = toBpinKey(item?.[bpinKey])
    return bpin ? allowedBpins.has(bpin) : false
  })
}

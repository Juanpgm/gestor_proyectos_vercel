/**
 * Tests para la lógica de filtrado por centro gestor en GestionRegistrosTab.
 *
 * Cubre el bug reportado: usuario con "Secretaría de Vivienda Social y Hábitat"
 * no ve UPs recién creadas porque:
 *   - nombre_centro_gestor vive en la intervención, NO en la UP.
 *   - Una UP recién creada no tiene intervenciones → todos los candidatos son vacíos
 *     → matchesCentro retorna false → la UP queda filtrada.
 */

import { describe, expect, it } from 'vitest'

// ── Replica exacta de normalizeCentro en GestionRegistrosTab ──────────────────
const normalizeCentro = (value: unknown): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

// ── Replica de matchesCentro (dado un userCentroGestor ya normalizado) ─────────
const makeMatchesCentro = (userCentroGestor: string) =>
  (candidate: unknown): boolean => {
    const normalizedCandidate = normalizeCentro(candidate)
    if (!normalizedCandidate || !userCentroGestor) return false
    return (
      normalizedCandidate === userCentroGestor ||
      normalizedCandidate.includes(userCentroGestor) ||
      userCentroGestor.includes(normalizedCandidate)
    )
  }

// ── Replica del filtro de loadUPs con el fix aplicado ────────────────────────
const filterUPs = (
  items: Array<{ up: Record<string, any>; intervenciones: any[] }>,
  userCentroGestor: string,
): Array<Record<string, any>> => {
  const matchesCentro = makeMatchesCentro(userCentroGestor)

  return items
    .filter(({ up, intervenciones }) => {
      const topLevelCandidates = [
        up.nombre_centro_gestor,
        up.centro_gestor,
        up.responsible,
      ]

      const intervencionCandidates = intervenciones.flatMap((interv: any) => [
        interv?.nombre_centro_gestor,
        interv?.centro_gestor,
        interv?.responsible,
      ])

      const allCandidates = [...topLevelCandidates, ...intervencionCandidates]

      // FIX: UP sin intervenciones y sin centro gestor en la UP misma →
      // fue recién creada; mostrarla siempre mientras no tenga dueño asignado.
      const hasAnyCentroData = allCandidates.some(
        (c) => normalizeCentro(c).length > 0,
      )
      if (!hasAnyCentroData) return true

      return allCandidates.some(matchesCentro)
    })
    .map(({ up }) => up)
}

// ─────────────────────────────────────────────────────────────────────────────

const SECRETARIA_RAW = 'Secretaría de Vivienda Social y Hábitat'
const SECRETARIA_NORM = normalizeCentro(SECRETARIA_RAW)

describe('normalizeCentro', () => {
  it('elimina tildes y pasa a minúsculas', () => {
    expect(SECRETARIA_NORM).toBe('secretaria de vivienda social y habitat')
  })

  it('produce el mismo resultado independientemente de si el input tiene tilde o no', () => {
    expect(normalizeCentro('Secretaria de Vivienda Social y Habitat')).toBe(SECRETARIA_NORM)
    expect(normalizeCentro('SECRETARÍA DE VIVIENDA SOCIAL Y HÁBITAT')).toBe(SECRETARIA_NORM)
  })

  it('normaliza espacios múltiples', () => {
    expect(normalizeCentro('Secretaría  de  Vivienda')).toBe('secretaria de vivienda')
  })

  it('retorna string vacío para valores nulos o undefined', () => {
    expect(normalizeCentro(null)).toBe('')
    expect(normalizeCentro(undefined)).toBe('')
    expect(normalizeCentro('')).toBe('')
  })
})

describe('matchesCentro – Secretaría de Vivienda Social y Hábitat', () => {
  const matchesCentro = makeMatchesCentro(SECRETARIA_NORM)

  it('coincide cuando el candidato tiene tildes', () => {
    expect(matchesCentro('Secretaría de Vivienda Social y Hábitat')).toBe(true)
  })

  it('coincide cuando el candidato NO tiene tildes', () => {
    expect(matchesCentro('Secretaria de Vivienda Social y Habitat')).toBe(true)
  })

  it('coincide cuando el candidato está en mayúsculas', () => {
    expect(matchesCentro('SECRETARÍA DE VIVIENDA SOCIAL Y HÁBITAT')).toBe(true)
  })

  it('NO coincide con otro centro gestor', () => {
    expect(matchesCentro('Secretaría de Infraestructura')).toBe(false)
  })

  it('NO coincide con string vacío', () => {
    expect(matchesCentro('')).toBe(false)
    expect(matchesCentro(null)).toBe(false)
    expect(matchesCentro(undefined)).toBe(false)
  })
})

describe('filterUPs – bug: UP recién creada sin intervenciones no aparece', () => {
  const upSinIntervenciones = { upid: 'UP-NEW', nombre_up: 'Nueva UP', nombre_centro_gestor: '' }
  const upConIntervencionCorrecta = { upid: 'UP-A', nombre_up: 'UP con interv correcta', nombre_centro_gestor: '' }
  const upConIntervencionOtraCG = { upid: 'UP-B', nombre_up: 'UP de otra secretaría', nombre_centro_gestor: '' }

  it('muestra una UP recién creada sin intervenciones (bug principal)', () => {
    const items = [{ up: upSinIntervenciones, intervenciones: [] }]
    const result = filterUPs(items, SECRETARIA_NORM)
    expect(result).toHaveLength(1)
    expect(result[0].upid).toBe('UP-NEW')
  })

  it('muestra una UP cuya intervención tiene el centro gestor correcto (con tilde)', () => {
    const items = [
      {
        up: upConIntervencionCorrecta,
        intervenciones: [{ nombre_centro_gestor: 'Secretaría de Vivienda Social y Hábitat' }],
      },
    ]
    const result = filterUPs(items, SECRETARIA_NORM)
    expect(result).toHaveLength(1)
  })

  it('muestra una UP cuya intervención tiene el centro gestor correcto (sin tilde)', () => {
    const items = [
      {
        up: upConIntervencionCorrecta,
        intervenciones: [{ nombre_centro_gestor: 'Secretaria de Vivienda Social y Habitat' }],
      },
    ]
    const result = filterUPs(items, SECRETARIA_NORM)
    expect(result).toHaveLength(1)
  })

  it('oculta una UP cuya intervención pertenece a otra secretaría', () => {
    const items = [
      {
        up: upConIntervencionOtraCG,
        intervenciones: [{ nombre_centro_gestor: 'Secretaría de Infraestructura' }],
      },
    ]
    const result = filterUPs(items, SECRETARIA_NORM)
    expect(result).toHaveLength(0)
  })

  it('maneja una mezcla de UPs correctamente', () => {
    const items = [
      // UP recién creada → debe aparecer
      { up: upSinIntervenciones, intervenciones: [] },
      // UP con intervención correcta → debe aparecer
      {
        up: upConIntervencionCorrecta,
        intervenciones: [{ nombre_centro_gestor: SECRETARIA_RAW }],
      },
      // UP de otra secretaría → NO debe aparecer
      {
        up: upConIntervencionOtraCG,
        intervenciones: [{ nombre_centro_gestor: 'Secretaría de Infraestructura' }],
      },
    ]
    const result = filterUPs(items, SECRETARIA_NORM)
    expect(result).toHaveLength(2)
    expect(result.map((u) => u.upid)).toEqual(['UP-NEW', 'UP-A'])
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createJsonResponse = (data: unknown, status = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

const baseIntervencionesResponse = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: {
        upid: 'UP-1',
        intervenciones: [
          {
            intervencion_id: 'INT-1',
            upid: 'UP-1',
            avance_obra: 20,
            estado: 'En ejecución',
            tipo_intervencion: 'Vías',
            presupuesto_base: 1000,
            frente_activo: 'Frente activo'
          },
          {
            intervencion_id: 'INT-2',
            upid: 'UP-1',
            avance_obra: 35,
            estado: 'En ejecución',
            tipo_intervencion: 'Parques',
            presupuesto_base: 2000,
            frente_activo: 'Frente activo'
          }
        ],
        n_intervenciones: 2
      }
    }
  ],
  properties: {
    total_unidades: 1,
    total_intervenciones: 2
  }
}

describe('intervenciones.service - prioridad avance_obra', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.test')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('usa el avance más reciente de /avances_unidades_proyecto por intervencion_id', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/intervenciones?')) {
        return createJsonResponse(baseIntervencionesResponse)
      }

      if (url.includes('/avances_unidades_proyecto?')) {
        if (url.includes('intervencion_id=INT-1')) {
          return createJsonResponse([
            {
              intervencion_id: 'INT-1',
              avance_obra: 45,
              updated_at: '2025-01-15T10:00:00.000Z'
            },
            {
              intervencion_id: 'INT-1',
              avance_obra: 70,
              updated_at: '2025-02-01T10:00:00.000Z'
            }
          ])
        }

        if (url.includes('intervencion_id=INT-2')) {
          return createJsonResponse([
            {
              intervencion_id: 'INT-2',
              avance_obra: null,
              updated_at: '2025-02-01T10:00:00.000Z'
            }
          ])
        }
      }

      return createJsonResponse({ error: 'not found' }, 404)
    })

    vi.stubGlobal('fetch', fetchMock)

    const { fetchIntervenciones } = await import('./intervenciones.service')
    const result = await fetchIntervenciones()

    const intervenciones = result.features[0].properties.intervenciones
    const int1 = intervenciones.find((item) => item.intervencion_id === 'INT-1')
    const int2 = intervenciones.find((item) => item.intervencion_id === 'INT-2')

    expect(int1?.avance_obra).toBe(70)
    expect(int2?.avance_obra).toBe(35)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('intervencion_id=INT-1'), expect.any(Object))
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('intervencion_id=INT-2'), expect.any(Object))
  })

  it('hace fallback al avance de /intervenciones cuando /avances_unidades_proyecto falla', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/intervenciones?')) {
        return createJsonResponse(baseIntervencionesResponse)
      }

      if (url.includes('/avances_unidades_proyecto?')) {
        return createJsonResponse({ detail: 'error interno' }, 500)
      }

      return createJsonResponse({ error: 'not found' }, 404)
    })

    vi.stubGlobal('fetch', fetchMock)

    const { fetchIntervenciones } = await import('./intervenciones.service')
    const result = await fetchIntervenciones()

    const intervenciones = result.features[0].properties.intervenciones
    const int1 = intervenciones.find((item) => item.intervencion_id === 'INT-1')
    const int2 = intervenciones.find((item) => item.intervencion_id === 'INT-2')

    expect(int1?.avance_obra).toBe(20)
    expect(int2?.avance_obra).toBe(35)
  })

  it('usa /api/proxy/avances_unidades_proyecto cuando la URL directa falla', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/intervenciones?')) {
        return createJsonResponse(baseIntervencionesResponse)
      }

      if (url.startsWith('https://api.test/avances_unidades_proyecto')) {
        return createJsonResponse({ detail: 'no disponible' }, 404)
      }

      if (url.startsWith('/api/proxy/avances_unidades_proyecto')) {
        if (url.includes('intervencion_id=INT-1')) {
          return createJsonResponse([
            {
              intervencion_id: 'INT-1',
              avance_obra: 88,
              updated_at: '2025-03-01T10:00:00.000Z'
            }
          ])
        }

        return createJsonResponse([])
      }

      return createJsonResponse({ error: 'not found' }, 404)
    })

    vi.stubGlobal('fetch', fetchMock)

    const { fetchIntervenciones } = await import('./intervenciones.service')
    const result = await fetchIntervenciones()

    const intervenciones = result.features[0].properties.intervenciones
    const int1 = intervenciones.find((item) => item.intervencion_id === 'INT-1')
    const int2 = intervenciones.find((item) => item.intervencion_id === 'INT-2')

    expect(int1?.avance_obra).toBe(88)
    expect(int2?.avance_obra).toBe(35)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/proxy/avances_unidades_proyecto?intervencion_id=INT-1'), expect.any(Object))
  })
})

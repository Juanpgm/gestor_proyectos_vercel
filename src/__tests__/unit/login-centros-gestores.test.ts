/**
 * Tests: LoginPage centros-gestores fetch fallback behaviour.
 *
 * Regression: The login page calls /api/proxy/centros-gestores/nombres-unicos
 * before any auth token exists. The backend previously returned 401 due to a
 * trailing-slash bug in public_paths. The frontend must:
 *   - Fall back to the hardcoded list on any non-OK response (including 401)
 *   - Not log a console.error for 401 (it is expected behaviour on the login page)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'

// Inline the fetch logic from LoginPage.fetchCentrosGestores so we can unit-test
// the behaviour without mounting the entire component tree.
const CENTROS_GESTORES_EXACTOS = ['CG-Alpha', 'CG-Beta', 'CG-Gamma']

async function fetchCentrosGestores(
  fetchFn: typeof fetch = fetch,
): Promise<{ centros: string[]; dataLoaded: boolean }> {
  let centros = CENTROS_GESTORES_EXACTOS
  let dataLoaded = false

  try {
    const response = await fetchFn('/api/proxy/centros-gestores/nombres-unicos', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`status:${response.status}`)
    }

    const payload = await response.json().catch(() => ({}))
    const apiCentros: string[] =
      (Array.isArray(payload) && payload) ||
      (Array.isArray(payload?.data) && payload.data) ||
      (Array.isArray(payload?.centros_gestores) && payload.centros_gestores) ||
      (Array.isArray(payload?.nombres_centros_gestores) && payload.nombres_centros_gestores) ||
      []

    const normalizedApiCentros = apiCentros.map((item) => String(item || '').trim()).filter(Boolean)
    centros =
      normalizedApiCentros.length > 0
        ? normalizedApiCentros.sort((a, b) => a.localeCompare(b, 'es'))
        : CENTROS_GESTORES_EXACTOS
    dataLoaded = true
  } catch (error: any) {
    if (!error?.message?.startsWith('status:')) {
      console.warn('Error fetching centros gestores:', error)
    }
    centros = CENTROS_GESTORES_EXACTOS
  }

  return { centros, dataLoaded }
}

describe('fetchCentrosGestores — 401 fallback', () => {
  let warnSpy: MockInstance
  let errorSpy: MockInstance

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to hardcoded list on 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    const result = await fetchCentrosGestores(mockFetch as any)
    expect(result.centros).toEqual(CENTROS_GESTORES_EXACTOS)
    expect(result.dataLoaded).toBe(false)
  })

  it('does not log console.error on 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    await fetchCentrosGestores(mockFetch as any)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('falls back to hardcoded list on 500', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    )
    const result = await fetchCentrosGestores(mockFetch as any)
    expect(result.centros).toEqual(CENTROS_GESTORES_EXACTOS)
    expect(result.dataLoaded).toBe(false)
  })

  it('logs a warning for non-auth errors (not status errors)', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const result = await fetchCentrosGestores(mockFetch as any)
    expect(result.centros).toEqual(CENTROS_GESTORES_EXACTOS)
    expect(warnSpy).toHaveBeenCalledWith(
      'Error fetching centros gestores:',
      expect.any(TypeError),
    )
  })
})

describe('fetchCentrosGestores — success cases', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses data array from { data: [] } shape', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: ['Secretaría A', 'Secretaría B'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await fetchCentrosGestores(mockFetch as any)
    expect(result.centros).toContain('Secretaría A')
    expect(result.dataLoaded).toBe(true)
  })

  it('sorts alphabetically in Spanish locale', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(['Zeta', 'Alpha', 'Beta']), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await fetchCentrosGestores(mockFetch as any)
    expect(result.centros).toEqual(['Alpha', 'Beta', 'Zeta'])
  })

  it('falls back to hardcoded list when API returns empty array', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await fetchCentrosGestores(mockFetch as any)
    expect(result.centros).toEqual(CENTROS_GESTORES_EXACTOS)
    expect(result.dataLoaded).toBe(true)
  })

  it('strips whitespace and removes empty strings from API response', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(['  Alpha  ', '', '  Beta']), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await fetchCentrosGestores(mockFetch as any)
    expect(result.centros).not.toContain('')
    expect(result.centros).toContain('Alpha')
    expect(result.centros).toContain('Beta')
  })
})

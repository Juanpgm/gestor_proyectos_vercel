import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWithErrorHandling } from './errorHandler'

describe('fetchWithErrorHandling - DELETE responses', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna objeto vacío cuando DELETE responde 204 sin body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))

    const result = await fetchWithErrorHandling<Record<string, unknown>>('/api/proxy/test-delete', {
      method: 'DELETE'
    })

    expect(result).toEqual({})
  })

  it('retorna objeto vacío cuando la respuesta exitosa no tiene contenido', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })))

    const result = await fetchWithErrorHandling<Record<string, unknown>>('/api/proxy/test-empty')

    expect(result).toEqual({})
  })
})

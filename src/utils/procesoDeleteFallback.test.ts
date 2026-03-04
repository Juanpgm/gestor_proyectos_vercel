import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteProcesoWithFallback } from './procesoDeleteFallback'

describe('deleteProcesoWithFallback', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('usa endpoint principal cuando está disponible', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await deleteProcesoWithFallback({ referencia_proceso: 'REF-001' }, 'REF-001')

    expect(result.endpoint).toBe('/api/proxy/emprestito/proceso/REF-001')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('usa fallback de orden de compra si endpoint principal está no implementado temporalmente', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/proxy/emprestito/proceso/')) {
        return new Response(JSON.stringify({ detail: { success: false, error: 'Función no implementada temporalmente' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (url.includes('/api/proxy/emprestito/eliminar-orden-compra/OC-7788')) {
        return new Response(JSON.stringify({ success: true, message: 'Orden eliminada' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ detail: 'Not Found' }), { status: 404 })
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await deleteProcesoWithFallback(
      { referencia_proceso: 'REF-7788', numero_orden: 'OC-7788', plataforma: 'TVEC' },
      'REF-7788'
    )

    expect(result.endpoint).toBe('/api/proxy/emprestito/eliminar-orden-compra/OC-7788')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('cae a modo local cuando el endpoint principal no está implementado y no hay fallback remoto exitoso', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/proxy/emprestito/proceso/')) {
        return new Response(JSON.stringify({ detail: { success: false, error: 'Función no implementada temporalmente' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ detail: 'Not Found' }), { status: 404 })
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await deleteProcesoWithFallback(
      { referencia_proceso: 'REF-LOCAL', plataforma: 'SECOP II' },
      'REF-LOCAL'
    )

    expect(result.mode).toBe('local')
    expect(result.endpoint).toBe('local-fallback')
    expect(result.message.toLowerCase()).toContain('ocultó localmente')
    expect(window.localStorage.getItem('gestor_procesos_deleted_refs_v1')).toContain('REF-LOCAL')
  })
})

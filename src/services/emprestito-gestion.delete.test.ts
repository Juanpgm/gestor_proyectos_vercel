import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { getIdToken: vi.fn().mockResolvedValue('test-token') } },
  getCurrentIdToken: vi.fn().mockResolvedValue('test-token'),
}))

import {
  eliminarContratoEmprestito,
  eliminarProcesoEmprestito,
  eliminarOrdenCompraEmprestito,
  eliminarConvenioEmprestito,
} from './emprestito-gestion.service'

const okResponse = (body: object = { success: true }) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

const errorResponse = (status: number, detail: string) =>
  new Response(JSON.stringify({ detail }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('eliminarContratoEmprestito', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls DELETE /api/proxy/contratos_emprestito/{referencia}', async () => {
    fetchMock.mockResolvedValue(okResponse())
    await eliminarContratoEmprestito('REF-001')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('contratos_emprestito/REF-001'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('encodes special characters in referencia', async () => {
    fetchMock.mockResolvedValue(okResponse())
    await eliminarContratoEmprestito('REF 2024/01')
    const calledUrl: string = fetchMock.mock.calls[0][0]
    expect(calledUrl).toContain('REF%202024%2F01')
  })

  it('throws with backend detail message on failure', async () => {
    fetchMock.mockResolvedValue(errorResponse(404, 'Contrato no encontrado'))
    await expect(eliminarContratoEmprestito('MISSING')).rejects.toThrow('Contrato no encontrado')
  })

  it('throws generic error when backend returns no detail', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))
    await expect(eliminarContratoEmprestito('REF-X')).rejects.toThrow('Error 500')
  })
})

describe('eliminarProcesoEmprestito', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls DELETE /api/proxy/emprestito/proceso/{referencia}', async () => {
    fetchMock.mockResolvedValue(okResponse())
    await eliminarProcesoEmprestito('PROC-42')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('emprestito/proceso/PROC-42'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})

describe('eliminarOrdenCompraEmprestito', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls DELETE /api/proxy/ordenes_compra_emprestito/{numero}', async () => {
    fetchMock.mockResolvedValue(okResponse())
    await eliminarOrdenCompraEmprestito('OC-99')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('ordenes_compra_emprestito/OC-99'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})

describe('eliminarConvenioEmprestito', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls DELETE /api/proxy/convenios_emprestito/{referencia}', async () => {
    fetchMock.mockResolvedValue(okResponse())
    await eliminarConvenioEmprestito('CONV-10')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('convenios_emprestito/CONV-10'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})

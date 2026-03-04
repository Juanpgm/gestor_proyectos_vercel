import { markProcesoRefAsDeletedLocally } from './procesosDeleteLocalStore'

interface DeleteAttemptResult {
  ok: boolean
  status: number
  data: any
  errorMessage: string
  endpoint: string
}

const parseResponsePayload = async (response: Response): Promise<any> => {
  const rawText = await response.text().catch(() => '')
  const trimmed = rawText?.trim?.() || ''

  if (!trimmed) return null

  try {
    return JSON.parse(trimmed)
  } catch {
    return trimmed
  }
}

const extractErrorMessage = (payload: any, status: number, statusText: string): string => {
  if (typeof payload === 'string' && payload.trim()) return payload

  if (payload && typeof payload === 'object') {
    const detail = payload.detail

    if (typeof detail === 'string' && detail.trim()) return detail

    if (detail && typeof detail === 'object') {
      const nested = (detail as any).error || (detail as any).message
      if (typeof nested === 'string' && nested.trim()) return nested
      return JSON.stringify(detail)
    }

    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message
  }

  return `Error ${status}: ${statusText}`
}

const isTemporarilyNotImplemented = (payload: any, status: number): boolean => {
  if (status !== 500 || !payload || typeof payload !== 'object') return false

  const detail = payload.detail
  const detailText =
    typeof detail === 'string'
      ? detail
      : typeof detail?.error === 'string'
        ? detail.error
        : typeof payload.error === 'string'
          ? payload.error
          : ''

  return detailText.toLowerCase().includes('no implementada')
}

const buildFallbackEndpoints = (proceso: Record<string, any>, referencia: string): string[] => {
  const candidates: string[] = []

  const pushUnique = (value: unknown, endpointBuilder: (normalized: string) => string) => {
    const normalized = String(value || '').trim()
    if (!normalized) return

    const endpoint = endpointBuilder(encodeURIComponent(normalized))
    if (!candidates.includes(endpoint)) {
      candidates.push(endpoint)
    }
  }

  pushUnique(proceso.numero_orden, (id) => `/api/proxy/emprestito/eliminar-orden-compra/${id}`)
  pushUnique((proceso as any).numeroOrden, (id) => `/api/proxy/emprestito/eliminar-orden-compra/${id}`)
  pushUnique((proceso as any).referencia_contrato, (id) => `/api/proxy/emprestito/eliminar-convenio-transferencia/${id}`)
  pushUnique((proceso as any).referenciaContrato, (id) => `/api/proxy/emprestito/eliminar-convenio-transferencia/${id}`)

  const plataforma = String((proceso as any).plataforma || '').toLowerCase()
  if (plataforma.includes('tvec')) {
    pushUnique(referencia, (id) => `/api/proxy/emprestito/eliminar-orden-compra/${id}`)
  }

  return candidates
}

const attemptDelete = async (endpoint: string): Promise<DeleteAttemptResult> => {
  const response = await fetch(endpoint, { method: 'DELETE' })
  const data = await parseResponsePayload(response)

  if (response.ok) {
    return {
      ok: true,
      status: response.status,
      data,
      errorMessage: '',
      endpoint
    }
  }

  return {
    ok: false,
    status: response.status,
    data,
    errorMessage: extractErrorMessage(data, response.status, response.statusText),
    endpoint
  }
}

export async function deleteProcesoWithFallback(
  proceso: Record<string, any>,
  referencia: string
): Promise<{ endpoint: string; data: any; mode: 'remote' | 'local'; message: string }> {
  const primaryEndpoint = `/api/proxy/emprestito/proceso/${encodeURIComponent(referencia)}`
  const primaryResult = await attemptDelete(primaryEndpoint)

  if (primaryResult.ok) {
    return {
      endpoint: primaryResult.endpoint,
      data: primaryResult.data,
      mode: 'remote',
      message: 'Proceso eliminado correctamente en servidor.'
    }
  }

  if (!isTemporarilyNotImplemented(primaryResult.data, primaryResult.status)) {
    throw new Error(primaryResult.errorMessage)
  }

  const fallbackEndpoints = buildFallbackEndpoints(proceso, referencia)

  if (fallbackEndpoints.length === 0) {
    markProcesoRefAsDeletedLocally(referencia)
    return {
      endpoint: 'local-fallback',
      data: { referencia_proceso: referencia },
      mode: 'local',
      message: 'El servicio de eliminación del backend está temporalmente no disponible. El proceso se ocultó localmente y quedará pendiente de sincronización.'
    }
  }

  const fallbackErrors: string[] = []

  for (const endpoint of fallbackEndpoints) {
    const result = await attemptDelete(endpoint)

    if (result.ok) {
      return {
        endpoint: result.endpoint,
        data: result.data,
        mode: 'remote',
        message: 'Proceso eliminado correctamente en servidor.'
      }
    }

    fallbackErrors.push(`${endpoint}: ${result.errorMessage}`)
  }

  markProcesoRefAsDeletedLocally(referencia)
  return {
    endpoint: 'local-fallback',
    data: {
      referencia_proceso: referencia,
      fallback_errors: fallbackErrors,
    },
    mode: 'local',
    message: 'El backend no permitió la eliminación en este momento. El proceso se ocultó localmente y quedará pendiente de sincronización.'
  }
}

/**
 * Servicio para la gestión unificada de Empréstito
 * CRUD, solicitudes de cambio, calidad de datos y exportación
 * Sigue el patrón de unidades-proyecto.service.ts
 */

import type {
  SolicitudCambioContratoPayload,
  SolicitudCambioProcesoPayload,
  SolicitudCambioRPCPayload,
  SolicitudCambioPagoPayload,
  SolicitudCambioEmprestito,
  EmprestitoCalidadDatosResponse,
} from '@/types/gestion-emprestito'

// ── Config ───────────────────────────────────────────────────────

const PROXY_BASE = '/api/proxy'

export interface MutationResponse {
  success?: boolean
  message?: string
  detail?: string
  error?: string
  [key: string]: any
}

// ── Helpers internos ─────────────────────────────────────────────

async function proxyGet<T = any>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : ''
  const res = await fetch(`${PROXY_BASE}/${path}${qs}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`)
  return json as T
}

async function proxyPost<T = MutationResponse>(
  path: string,
  body: Record<string, any>,
): Promise<T> {
  const res = await fetch(`${PROXY_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`)
  return json as T
}

async function proxyPut<T = MutationResponse>(
  path: string,
  body: Record<string, any>,
): Promise<T> {
  const res = await fetch(`${PROXY_BASE}/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`)
  return json as T
}

async function proxyDelete<T = MutationResponse>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${PROXY_BASE}/${path}?${qs}`, {
    method: 'DELETE',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`)
  return json as T
}

// ── Quality Control (real endpoints: /emprestito/quality-control/*) ──

/** GET /emprestito/quality-control/summary */
export const fetchEmprestitoQualitySummary = (
  params?: Record<string, string>,
) => proxyGet<any>('emprestito/quality-control/summary', params)

/** GET /emprestito/quality-control/records */
export const fetchEmprestitoQualityRecords = (
  params?: Record<string, string>,
) => proxyGet<any>('emprestito/quality-control/records', params)

/** GET /emprestito/quality-control/changelog */
export const fetchEmprestitoQualityChangelog = (
  params?: Record<string, string>,
) => proxyGet<any>('emprestito/quality-control/changelog', params)

/** GET /emprestito/quality-control/by-centro-gestor */
export const fetchEmprestitoQualityByCentroGestor = (
  params?: Record<string, string>,
) => proxyGet<any>('emprestito/quality-control/by-centro-gestor', params)

/** GET /emprestito/quality-control/stats */
export const fetchEmprestitoQualityStats = (
  params?: Record<string, string>,
) => proxyGet<any>('emprestito/quality-control/stats', params)

/** POST /emprestito/quality-control/analyze — Generar análisis de calidad */
export const analyzeEmprestitoQuality = (
  params?: Record<string, string>,
) => proxyPost<any>('emprestito/quality-control/analyze', params || {})

// ── Lectura de datos ─────────────────────────────────────────────

/** GET /contratos_emprestito_all — Todos los contratos (3 colecciones combinadas) */
export const fetchContratosEmprestito = async (
  params?: Record<string, string>,
): Promise<any[]> => {
  const res = await proxyGet<any>('contratos_emprestito_all', params)
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

/** GET /procesos_emprestito_all — Procesos existentes */
export const fetchProcesosEmprestito = async (
  params?: Record<string, string>,
): Promise<any[]> => {
  const res = await proxyGet<any>('procesos_emprestito_all', params)
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

/** GET /rpc_all — RPCs existentes */
export const fetchRPCsEmprestito = async (
  params?: Record<string, string>,
): Promise<any[]> => {
  const res = await proxyGet<any>('rpc_all', params)
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

/** GET /pagos_emprestito_all — Pagos existentes */
export const fetchPagosEmprestitoAll = async (
  params?: Record<string, string>,
): Promise<any[]> => {
  const res = await proxyGet<any>('pagos_emprestito_all', params)
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

/** GET /convenios_transferencias_all — Convenios existentes */
export const fetchConveniosEmprestito = async (
  params?: Record<string, string>,
): Promise<any[]> => {
  const res = await proxyGet<any>('convenios_transferencias_all', params)
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

/** GET /emprestito/ordenes-compra — Órdenes de compra */
export const fetchOrdenesCompraEmprestito = async (
  params?: Record<string, string>,
): Promise<any[]> => {
  const res = await proxyGet<any>('emprestito/ordenes-compra', params)
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

/** GET /reportes_contratos/ — Todos los reportes/avances de contratos */
export const fetchAllReportesContratos = async (
  params?: Record<string, string>,
): Promise<any[]> => {
  const res = await proxyGet<any>('reportes_contratos/', params)
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

/** GET /reportes_emprestito/resumen-centro-gestor — Resumen por centro gestor */
export const fetchResumenCentroGestor = (
  params?: Record<string, string>,
) => proxyGet<any>('reportes_emprestito/resumen-centro-gestor', params)

/** GET /emprestito/historial-cambios — Historial de cambios en valores */
export const fetchHistorialCambios = (
  params?: Record<string, string>,
) => proxyGet<any>('emprestito/historial-cambios', params)

// ── Solicitudes de Cambio ────────────────────────────────────────

/** POST /solicitudes_cambios_emprestito — Crear solicitud unificada */
const crearSolicitudCambioEmprestito = (data: {
  tipo_registro: string
  referencia_id: string
  campos_modificados: Record<string, { anterior: any; nuevo: any }>
  motivo?: string
}) => proxyPost('solicitudes_cambios_emprestito', data)

/** Wrappers manteniendo la interfaz existente que usan los componentes */
export const crearSolicitudCambioContrato = (data: SolicitudCambioContratoPayload) =>
  crearSolicitudCambioEmprestito({
    tipo_registro: 'contrato',
    referencia_id: data.referencia_contrato,
    campos_modificados: data.campos_modificados,
    motivo: data.justificacion,
  })

export const crearSolicitudCambioProceso = (data: SolicitudCambioProcesoPayload) =>
  crearSolicitudCambioEmprestito({
    tipo_registro: 'proceso',
    referencia_id: data.referencia_proceso,
    campos_modificados: data.campos_modificados,
    motivo: data.justificacion,
  })

export const crearSolicitudCambioRPC = (data: SolicitudCambioRPCPayload) =>
  crearSolicitudCambioEmprestito({
    tipo_registro: 'rpc',
    referencia_id: data.numero_rpc,
    campos_modificados: data.campos_modificados,
    motivo: data.justificacion,
  })

export const crearSolicitudCambioPago = (data: SolicitudCambioPagoPayload) =>
  crearSolicitudCambioEmprestito({
    tipo_registro: 'pago',
    referencia_id: data.numero_rpc,
    campos_modificados: data.campos_modificados,
    motivo: data.justificacion,
  })

/** GET /solicitudes_cambios_emprestito — Lista todas las solicitudes */
export const fetchSolicitudesCambiosEmprestito = async (
  params?: Record<string, string>,
): Promise<SolicitudCambioEmprestito[]> => {
  const res = await proxyGet<any>('solicitudes_cambios_emprestito', { limit: '500', ...params })
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

// ── CRUD (procesos, RPCs, pagos, convenios, órdenes) ─────────────

/** POST /emprestito/cargar-proceso */
export const crearProcesoEmprestito = (data: Record<string, any>) =>
  proxyPost('emprestito/cargar-proceso', data)

/** POST /emprestito/cargar-orden-compra */
export const crearOrdenCompraEmprestito = (data: Record<string, any>) =>
  proxyPost('emprestito/cargar-orden-compra', data)

/** POST /emprestito/cargar-rpc */
export const crearRPCEmprestito = (data: Record<string, any>) =>
  proxyPost('emprestito/cargar-rpc', data)

/** POST /emprestito/cargar-pago */
export const crearPagoEmprestito = (data: Record<string, any>) =>
  proxyPost('emprestito/cargar-pago', data)

/** POST /emprestito/cargar-convenio-transferencia */
export const crearConvenioEmprestito = (data: Record<string, any>) =>
  proxyPost('emprestito/cargar-convenio-transferencia', data)

// ── Modificar registros ──────────────────────────────────────────

/** PUT /emprestito/modificar-proceso (query param: referencia_proceso) */
export const modificarProcesoEmprestito = (refProceso: string, data: Record<string, any>) =>
  proxyPut('emprestito/modificar-proceso', { referencia_proceso: refProceso, ...data })

/** PUT /emprestito/modificar-contrato (query param: referencia_contrato) */
export const modificarContratoEmprestito = (refContrato: string, data: Record<string, any>) =>
  proxyPut('emprestito/modificar-contrato', { referencia_contrato: refContrato, ...data })

/** PUT /emprestito/modificar-orden-compra (query param: numero_orden) */
export const modificarOrdenCompraEmprestito = (numOrden: string, data: Record<string, any>) =>
  proxyPut('emprestito/modificar-orden-compra', { numero_orden: numOrden, ...data })

/** PUT /emprestito/modificar-convenio-transferencia (body: doc_id + campos) */
export const modificarConvenioEmprestito = (docId: string, data: Record<string, any>) =>
  proxyPut('emprestito/modificar-convenio-transferencia', { doc_id: docId, ...data })

/** PUT /emprestito/modificar-rpc (form: numero_rpc + datos_actualizacion JSON) */
export const modificarRPCEmprestito = (numRpc: string, data: Record<string, any>) =>
  proxyPut('emprestito/modificar-rpc', { numero_rpc: numRpc, datos_actualizacion: JSON.stringify(data) })

// ── Eliminar registros ───────────────────────────────────────────

/** DELETE /emprestito/proceso/{referencia_proceso} */
export const eliminarProcesoEmprestito = (refProceso: string) =>
  proxyDelete(`emprestito/proceso/${encodeURIComponent(refProceso)}`, {})

/** DELETE /contratos_emprestito/{referencia} */
export const eliminarContratoEmprestito = (referencia: string) =>
  proxyDelete(`contratos_emprestito/${encodeURIComponent(referencia)}`, {})

/** DELETE /ordenes_compra_emprestito/{numero_orden} */
export const eliminarOrdenCompraEmprestito = (numOrden: string) =>
  proxyDelete(`ordenes_compra_emprestito/${encodeURIComponent(numOrden)}`, {})

/** DELETE /convenios_emprestito/{referencia} */
export const eliminarConvenioEmprestito = (referencia: string) =>
  proxyDelete(`convenios_emprestito/${encodeURIComponent(referencia)}`, {})

// ── Aprobación / Rechazo de solicitudes ──────────────────────────

/** PUT /solicitudes_cambios_emprestito/{solicitud_id}/aprobar */
export const aprobarSolicitudEmprestito = async (
  solicitudId: string,
  _tipo: string,
  _cambios: Record<string, any>,
): Promise<MutationResponse> => {
  return proxyPut(`solicitudes_cambios_emprestito/${encodeURIComponent(solicitudId)}/aprobar`, {})
}

/** PUT /solicitudes_cambios_emprestito/{solicitud_id}/rechazar */
export const rechazarSolicitudEmprestito = async (
  solicitudId: string,
  motivoRechazo: string,
): Promise<MutationResponse> => {
  return proxyPut(`solicitudes_cambios_emprestito/${encodeURIComponent(solicitudId)}/rechazar`, {
    motivo_rechazo: motivoRechazo,
  })
}

// ── Export XLSX ──────────────────────────────────────────────────

/** Genera XLSX desde datos en cliente (no existe endpoint backend) */
export const exportarEmprestitoXLSX = async (
  filters?: Record<string, string>,
): Promise<Blob> => {
  // Fetch all data and build XLSX client-side
  const [contratos, procesos, rpcs, pagos, convenios] = await Promise.all([
    fetchContratosEmprestito(filters),
    fetchProcesosEmprestito(filters),
    fetchRPCsEmprestito(filters),
    fetchPagosEmprestitoAll(filters),
    fetchConveniosEmprestito(filters),
  ])
  const allData = [
    ...contratos.map((c: any) => ({ ...c, _tipo: 'contrato' })),
    ...procesos.map((p: any) => ({ ...p, _tipo: 'proceso' })),
    ...rpcs.map((r: any) => ({ ...r, _tipo: 'rpc' })),
    ...pagos.map((p: any) => ({ ...p, _tipo: 'pago' })),
    ...convenios.map((c: any) => ({ ...c, _tipo: 'convenio' })),
  ]
  // Return as JSON blob (actual XLSX generation happens in caller using ExcelJS)
  return new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
}

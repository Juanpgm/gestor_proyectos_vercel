// Servicio para gestión de pagos de empréstito

export interface PagoEmprestito {
  id: string
  numero_rpc: string
  valor_pago: number
  fecha_transaccion: string
  referencia_contrato: string
  nombre_centro_gestor: string
  fecha_registro: string
  fecha_creacion: string
  fecha_actualizacion: string
  estado: string
  tipo: string
}

export interface PagosResponse {
  success: boolean
  data: PagoEmprestito[]
  count: number
  collection: string
  timestamp: string
  message: string
}

/**
 * Obtiene todos los pagos de empréstito registrados
 */
export const fetchPagosEmprestito = async (): Promise<PagosResponse> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
    
    if (!apiUrl) {
      throw new Error('URL de API no configurada')
    }

    const response = await fetch(`${apiUrl}/contratos_pagos_all`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Error al obtener pagos: ${response.status} ${response.statusText}`)
    }

    const data: PagosResponse = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Error al obtener los pagos')
    }

    return data
  } catch (error) {
    console.error('Error en fetchPagosEmprestito:', error)
    throw error
  }
}

/**
 * Formatea un valor monetario en formato colombiano
 */
export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return 'N/A'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value)
}

/**
 * Formatea una fecha en formato colombiano
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return dateString
  }
}

/**
 * Formatea una fecha y hora en formato colombiano
 */
export const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

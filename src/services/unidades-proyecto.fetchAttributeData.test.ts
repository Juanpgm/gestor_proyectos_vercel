// Tests de integración ligera para fetchAttributeData:
//  - P0.3: avance promedio cuando el presupuesto total es 0 (fallback aritmético)
//  - P0.2: los registros que fallan validación se cuentan y exponen (no silencio)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Neutralizar Firebase: fetchWithRetry intenta importar @/lib/firebase para
// adjuntar token; con auth=null toma el camino "sin token" sin tocar la red real.
vi.mock('@/lib/firebase', () => ({ auth: null }))

import {
  fetchAttributeData,
  lastAttributeValidationStats,
} from './unidades-proyecto.service'

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('fetchAttributeData — cálculo de avance y validación', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('usa promedio aritmético simple cuando el presupuesto total es 0 (P0.3)', async () => {
    const data = [
      {
        upid: 'UP-ZERO',
        nombre_up: 'Unidad sin presupuesto',
        intervenciones: [
          { presupuesto_base: 0, avance_obra: 40, estado: 'En ejecución', tipo_intervencion: 'Obra' },
          { presupuesto_base: 0, avance_obra: 60, estado: 'En ejecución', tipo_intervencion: 'Obra' },
        ],
      },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: true, data, count: data.length })),
    )

    // Pasar un filtro fuerza hasFilters=true y evita el cache en memoria.
    const result = await fetchAttributeData({ estado: 'En ejecución' })

    expect(result).toHaveLength(1)
    // (40 + 60) / 2 = 50, no 0 (que es lo que devolvía el bug)
    expect(result[0].avance_obra).toBeCloseTo(50, 5)
  })

  it('mantiene el promedio ponderado cuando hay presupuesto (sin regresión)', async () => {
    const data = [
      {
        upid: 'UP-W',
        nombre_up: 'Unidad ponderada',
        intervenciones: [
          { presupuesto_base: 100, avance_obra: 100, estado: 'En ejecución', tipo_intervencion: 'Obra' },
          { presupuesto_base: 300, avance_obra: 20, estado: 'En ejecución', tipo_intervencion: 'Obra' },
        ],
      },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: true, data, count: data.length })),
    )

    const result = await fetchAttributeData({ estado: 'ponderado' })

    // (100*100 + 20*300) / 400 = (10000 + 6000)/400 = 40
    expect(result[0].avance_obra).toBeCloseTo(40, 5)
  })

  it('cuenta y expone los registros descartados por validación (P0.2)', async () => {
    const data = [
      {
        upid: 'UP-OK',
        nombre_up: 'Valida',
        intervenciones: [
          { presupuesto_base: 100, avance_obra: 50, estado: 'En ejecución', tipo_intervencion: 'Obra' },
        ],
      },
      {
        upid: 'UP-BAD',
        nombre_up: 'Invalida',
        // cantidad como objeto rompe el union(string|number) del esquema
        cantidad: { malformado: true },
        intervenciones: [
          { presupuesto_base: 100, avance_obra: 10, estado: 'En ejecución', tipo_intervencion: 'Obra' },
        ],
      },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: true, data, count: data.length })),
    )

    const result = await fetchAttributeData({ estado: 'mixto' })

    // Solo el registro válido sale; el inválido NO desaparece en silencio
    expect(result).toHaveLength(1)
    expect(result[0].upid).toBe('UP-OK')
    expect(lastAttributeValidationStats.received).toBe(2)
    expect(lastAttributeValidationStats.valid).toBe(1)
    expect(lastAttributeValidationStats.failed).toBe(1)
    expect(lastAttributeValidationStats.failedUpids).toContain('UP-BAD')
  })
})

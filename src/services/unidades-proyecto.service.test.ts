import { describe, expect, it } from 'vitest'
import { consolidateAttributeData, filterAttributeData } from './unidades-proyecto.service'

// Tipo mínimo necesario para los tests (coincide con AttributeData del servicio)
type TestItem = {
  upid: string
  nombre_up: string
  estado: string
  tipo_intervencion: string
  nombre_centro_gestor?: string
  frente_activo?: string
  avance_obra: number
  presupuesto_base: number
  comuna_corregimiento: string
  barrio_vereda: string
  fecha_inicio: string
  fecha_fin: string
  n_intervenciones?: number
  [key: string]: unknown
}

const makeItem = (overrides: Partial<TestItem> = {}): TestItem => ({
  upid: 'UP-001',
  nombre_up: 'Test UP',
  estado: 'En ejecución',
  tipo_intervencion: 'Vías',
  frente_activo: 'No aplica',
  avance_obra: 50,
  presupuesto_base: 200000000, // $200M — above 150M threshold for frente activo
  comuna_corregimiento: 'Comuna 1',
  barrio_vereda: 'Barrio A',
  fecha_inicio: '2024-01-01',
  fecha_fin: '2024-12-31',
  n_intervenciones: 1,
  ...overrides
})

// ─────────────────────────────────────────────────────────────
// consolidateAttributeData — preservación de frente_activo
// ─────────────────────────────────────────────────────────────

describe('consolidateAttributeData — frente_activo derivado de estado + avance', () => {
  it('NO es frente activo cuando estados son Terminado y En alistamiento (sin En ejecución activa)', () => {
    // Aunque la API marcó como 'Frente activo', el consolidado recalcula basándose en estado + avance
    // Estado se deriva: avance=100→Terminado, avance=0→En alistamiento
    const data = [
      makeItem({ upid: 'UP-001', frente_activo: 'Frente activo', estado: 'En ejecución', avance_obra: 100 }),
      makeItem({ upid: 'UP-001', frente_activo: 'Frente activo', estado: 'En ejecución', avance_obra: 0 })
    ]
    const result = consolidateAttributeData(data)
    expect(result).toHaveLength(1)
    expect(result[0].frente_activo).toBe('No aplica')
  })

  it('sí es Frente activo cuando estado es En ejecución con avance entre 0 y 100', () => {
    const data = [
      makeItem({ upid: 'UP-002', frente_activo: 'No aplica', estado: 'En ejecución', avance_obra: 50 }),
      makeItem({ upid: 'UP-002', frente_activo: 'No aplica', estado: 'En ejecución', avance_obra: 30 })
    ]
    const result = consolidateAttributeData(data)
    expect(result).toHaveLength(1)
    expect(result[0].frente_activo).toBe('Frente activo')
  })

  it('un solo item del grupo En ejecución (avance < 100) basta para marcar como Frente activo', () => {
    const data = [
      makeItem({ upid: 'UP-003', frente_activo: 'No aplica', estado: 'Terminado', avance_obra: 100 }),
      makeItem({ upid: 'UP-003', frente_activo: 'Frente activo', estado: 'En ejecución', avance_obra: 50 }),
      makeItem({ upid: 'UP-003', frente_activo: 'No aplica', estado: 'En alistamiento', avance_obra: 0 })
    ]
    const result = consolidateAttributeData(data)
    expect(result[0].frente_activo).toBe('Frente activo')
  })

  it('intervención al 100% con estado En ejecución NO es frente activo (debe ser Terminado)', () => {
    // Issue 2: una intervención al 100% no debe contar como frente activo
    // Estado se deriva: avance=100 → Terminado (aunque backend dice En ejecución)
    const data = [
      makeItem({ upid: 'UP-004', frente_activo: 'Frente activo', estado: 'En ejecución', avance_obra: 100 })
    ]
    const result = consolidateAttributeData(data)
    expect(result[0].frente_activo).toBe('No aplica')
    expect(result[0].estado).toBe('Terminado') // estado derivado correctamente
  })
})

// ─────────────────────────────────────────────────────────────
// filterAttributeData — filtro por frente_activo
// ─────────────────────────────────────────────────────────────

describe('filterAttributeData — filtro frente_activo', () => {
  const dataset: TestItem[] = [
    makeItem({ upid: 'UP-A', frente_activo: 'Frente activo', nombre_up: 'Alpha', estado: 'En ejecución', avance_obra: 50 }),
    makeItem({ upid: 'UP-B', frente_activo: 'No aplica', nombre_up: 'Beta', estado: 'Terminado', avance_obra: 100 }),
    makeItem({ upid: 'UP-C', frente_activo: 'Frente activo', nombre_up: 'Gamma', estado: 'En ejecución', avance_obra: 30 })
  ]

  it('filtra correctamente por Frente activo', () => {
    const result = filterAttributeData(dataset as any, { frente_activo_multiple: ['Frente activo'] } as any)
    expect(result.every(r => r.frente_activo === 'Frente activo')).toBe(true)
    expect(result.length).toBe(2)
  })

  it('filtra correctamente por No aplica', () => {
    const result = filterAttributeData(dataset as any, { frente_activo_multiple: ['No aplica'] } as any)
    expect(result.every(r => r.frente_activo === 'No aplica')).toBe(true)
    expect(result.length).toBe(1)
  })

  it('sin filtro retorna todos los registros', () => {
    const result = filterAttributeData(dataset as any, {} as any)
    expect(result.length).toBe(dataset.length)
  })
})

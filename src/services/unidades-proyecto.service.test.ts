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
  presupuesto_base: 1000000,
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

describe('consolidateAttributeData — frente_activo de la API', () => {
  it('preserva Frente activo aunque el estado consolidado sea distinto', () => {
    // La API marca ambas intervenciones como 'Frente activo' aunque una esté Terminada
    const data = [
      makeItem({ upid: 'UP-001', frente_activo: 'Frente activo', estado: 'Terminado' }),
      makeItem({ upid: 'UP-001', frente_activo: 'Frente activo', estado: 'En alistamiento' })
    ]
    const result = consolidateAttributeData(data)
    expect(result).toHaveLength(1)
    expect(result[0].frente_activo).toBe('Frente activo')
  })

  it('retorna No aplica cuando ningún item del grupo es Frente activo', () => {
    const data = [
      makeItem({ upid: 'UP-002', frente_activo: 'No aplica', estado: 'En ejecución' }),
      makeItem({ upid: 'UP-002', frente_activo: 'No aplica', estado: 'En ejecución' })
    ]
    const result = consolidateAttributeData(data)
    expect(result).toHaveLength(1)
    expect(result[0].frente_activo).toBe('No aplica')
  })

  it('un solo item del grupo como Frente activo basta para marcar el grupo', () => {
    const data = [
      makeItem({ upid: 'UP-003', frente_activo: 'No aplica', estado: 'Terminado' }),
      makeItem({ upid: 'UP-003', frente_activo: 'Frente activo', estado: 'En ejecución' }),
      makeItem({ upid: 'UP-003', frente_activo: 'No aplica', estado: 'En alistamiento' })
    ]
    const result = consolidateAttributeData(data)
    expect(result[0].frente_activo).toBe('Frente activo')
  })

  it('NO recalcula frente_activo desde estado: un item con estado En ejecución pero frente_activo=No aplica debe conservar No aplica', () => {
    // La API decidió que no es frente activo (por exclusiones de tipo/centro gestor), el frontend debe respetar eso
    const data = [
      makeItem({ upid: 'UP-004', frente_activo: 'No aplica', estado: 'En ejecución' })
    ]
    const result = consolidateAttributeData(data)
    expect(result[0].frente_activo).toBe('No aplica')
  })
})

// ─────────────────────────────────────────────────────────────
// filterAttributeData — filtro por frente_activo
// ─────────────────────────────────────────────────────────────

describe('filterAttributeData — filtro frente_activo', () => {
  const dataset: TestItem[] = [
    makeItem({ upid: 'UP-A', frente_activo: 'Frente activo', nombre_up: 'Alpha' }),
    makeItem({ upid: 'UP-B', frente_activo: 'No aplica', nombre_up: 'Beta' }),
    makeItem({ upid: 'UP-C', frente_activo: 'Frente activo', nombre_up: 'Gamma' })
  ]

  it('filtra correctamente por Frente activo', () => {
    const result = filterAttributeData(dataset as any, { frente_activo_multiple: ['Frente activo'] } as any)
    expect(result.every(r => r.frente_activo === 'Frente activo')).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('filtra correctamente por No aplica', () => {
    const result = filterAttributeData(dataset as any, { frente_activo_multiple: ['No aplica'] } as any)
    expect(result.every(r => r.frente_activo === 'No aplica')).toBe(true)
  })

  it('sin filtro retorna todos los registros', () => {
    const result = filterAttributeData(dataset as any, {} as any)
    expect(result.length).toBe(dataset.length)
  })
})

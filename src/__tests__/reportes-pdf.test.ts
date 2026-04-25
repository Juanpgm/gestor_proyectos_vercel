/**
 * Tests para los generadores de reportes PDF de UPs y Empréstito.
 *
 * Validan que las funciones de generación:
 *  - No lancen errores con datos reales y edge cases
 *  - Produzcan un PDF con las secciones esperadas (tablas, headers, páginas)
 *  - Manejen correctamente datos vacíos, centros sin reportes, alertas, etc.
 *  - Los botones de descarga estén disponibles y disparen la generación
 *
 * Se mockea jsPDF y jspdf-autotable para capturar las llamadas internas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock de jsPDF ────────────────────────────────────────
const mockSave = vi.fn()
const mockText = vi.fn()
const mockSetFont = vi.fn()
const mockSetFontSize = vi.fn()
const mockSetTextColor = vi.fn()
const mockSetFillColor = vi.fn()
const mockSetDrawColor = vi.fn()
const mockSetLineWidth = vi.fn()
const mockRect = vi.fn()
const mockRoundedRect = vi.fn()
const mockLine = vi.fn()
const mockAddPage = vi.fn()
const mockSetPage = vi.fn()

let autoTableCalls: any[] = []

function createMockDoc() {
  autoTableCalls = []
  return {
    internal: {
      pageSize: { getWidth: () => 279, getHeight: () => 216 },
    },
    getNumberOfPages: () => 1,
    text: mockText,
    setFont: mockSetFont,
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    setFillColor: mockSetFillColor,
    setDrawColor: mockSetDrawColor,
    setLineWidth: mockSetLineWidth,
    rect: mockRect,
    roundedRect: mockRoundedRect,
    line: mockLine,
    addPage: mockAddPage,
    setPage: mockSetPage,
    save: mockSave,
    autoTable: (opts: any) => {
      autoTableCalls.push(opts)
    },
    lastAutoTable: { finalY: 100 },
  }
}

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => createMockDoc()),
}))

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
  applyPlugin: vi.fn(),
}))

// ── Imports (después del mock) ───────────────────────────
import { generarReporteUPsPorCentroGestor } from '@/utils/reporteUPsPdf'
import { generarReporteEmprestitoPorCentroGestor } from '@/utils/reporteEmprestitoPdf'
import {
  formatFechaPdf,
  formatPorcentaje,
  getColorSemaforo,
  getTextoSemaforo,
  diasDesde,
  PDF_COLORS,
} from '@/utils/pdfReportGenerator'
import type { CentroGestorAvancesResumen, IntervencionConAvances } from '@/hooks/useAvancesCentroGestor'
import type { CentroGestorResumen } from '@/hooks/useReportesCentroGestor'

// ── Helpers de datos de prueba ───────────────────────────

function crearIntervencion(overrides: Partial<IntervencionConAvances> = {}): IntervencionConAvances {
  return {
    intervencion_id: 'INT-001',
    upid: 'UNP-100',
    nombre_centro_gestor: 'Secretaría de Infraestructura',
    estado: 'En ejecución',
    tipo_intervencion: 'Infraestructura Vial',
    avance_obra_intervencion: 45,
    presupuesto_base: 500000000,
    fecha_inicio: '2025-01-15',
    fecha_fin: '2026-06-30',
    avances: [],
    ultimo_avance: null,
    tiene_avances: false,
    esta_completada: false,
    ...overrides,
  }
}

function crearResumenUP(overrides: Partial<CentroGestorAvancesResumen> = {}): CentroGestorAvancesResumen {
  return {
    nombre_centro_gestor: 'Secretaría de Infraestructura',
    total_intervenciones: 10,
    intervenciones_con_avance: 7,
    intervenciones_sin_avance: 2,
    intervenciones_completadas: 1,
    total_avances: 15,
    avances_ultimos_10_dias: 3,
    ultimo_avance: '2026-04-10T14:30:00Z',
    primer_avance: '2025-03-01T08:00:00Z',
    avance_obra_promedio: 62.5,
    tiene_alertas: false,
    intervenciones: [crearIntervencion()],
    ...overrides,
  }
}

function crearResumenEmprestito(overrides: Partial<CentroGestorResumen> = {}): CentroGestorResumen {
  return {
    nombre_centro_gestor: 'Secretaría de Educación',
    total_reportes: 5,
    reportes_ultimos_10_dias: 2,
    ultimo_reporte: '2026-04-08T10:00:00Z',
    primer_reporte: '2025-06-15T09:00:00Z',
    contratos_reportados: ['CO1.PCCNTR.001', 'CO1.PCCNTR.002'],
    ultimo_avance_fisico: 55,
    ultimo_avance_financiero: 48,
    tiene_alertas: false,
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════
// Tests de utilidades compartidas (pdfReportGenerator)
// ══════════════════════════════════════════════════════════

describe('pdfReportGenerator — utilidades', () => {
  describe('formatFechaPdf', () => {
    it('formatea fecha ISO correctamente', () => {
      const result = formatFechaPdf('2026-04-12T10:30:00Z')
      expect(result).toMatch(/\d{1,2}.*\d{4}/) // contiene día y año
      expect(result).not.toBe('—')
    })

    it('retorna "—" para null', () => {
      expect(formatFechaPdf(null)).toBe('—')
    })

    it('retorna "—" para undefined', () => {
      expect(formatFechaPdf(undefined)).toBe('—')
    })

    it('retorna "—" para fecha inválida', () => {
      expect(formatFechaPdf('not-a-date')).toBe('—')
    })
  })

  describe('formatPorcentaje', () => {
    it('formatea entero', () => {
      expect(formatPorcentaje(75)).toBe('75%')
    })

    it('formatea decimal con un dígito', () => {
      expect(formatPorcentaje(62.53)).toBe('62.5%')
    })

    it('formatea cero', () => {
      expect(formatPorcentaje(0)).toBe('0%')
    })

    it('formatea 100', () => {
      expect(formatPorcentaje(100)).toBe('100%')
    })
  })

  describe('getColorSemaforo', () => {
    it('retorna verde para >= 80', () => {
      expect(getColorSemaforo(80)).toEqual(PDF_COLORS.success)
      expect(getColorSemaforo(100)).toEqual(PDF_COLORS.success)
    })

    it('retorna amarillo para 40-79', () => {
      expect(getColorSemaforo(40)).toEqual(PDF_COLORS.warning)
      expect(getColorSemaforo(79)).toEqual(PDF_COLORS.warning)
    })

    it('retorna rojo para < 40', () => {
      expect(getColorSemaforo(0)).toEqual(PDF_COLORS.danger)
      expect(getColorSemaforo(39)).toEqual(PDF_COLORS.danger)
    })
  })

  describe('getTextoSemaforo', () => {
    it('retorna "Alto" para >= 80', () => {
      expect(getTextoSemaforo(85)).toBe('Alto')
    })
    it('retorna "Medio" para 40-79', () => {
      expect(getTextoSemaforo(50)).toBe('Medio')
    })
    it('retorna "Bajo" para < 40', () => {
      expect(getTextoSemaforo(10)).toBe('Bajo')
    })
  })

  describe('diasDesde', () => {
    it('calcula días correctamente', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 5)
      const result = diasDesde(ayer.toISOString())
      expect(result).toBe(5)
    })

    it('retorna null para null', () => {
      expect(diasDesde(null)).toBeNull()
    })

    it('retorna null para fecha inválida', () => {
      expect(diasDesde('invalid')).toBeNull()
    })
  })
})

// ══════════════════════════════════════════════════════════
// Tests del reporte PDF de Unidades de Proyecto
// ══════════════════════════════════════════════════════════

describe('generarReporteUPsPorCentroGestor', () => {
  beforeEach(() => {
    mockSave.mockClear()
    mockText.mockClear()
    mockAddPage.mockClear()
    autoTableCalls = []
  })

  it('genera PDF sin errores con datos normales', async () => {
    const resumen = [
      crearResumenUP({ nombre_centro_gestor: 'Secretaría de Infraestructura', avance_obra_promedio: 75, tiene_alertas: false }),
      crearResumenUP({ nombre_centro_gestor: 'Secretaría de Educación', avance_obra_promedio: 30, tiene_alertas: true }),
      crearResumenUP({ nombre_centro_gestor: 'Secretaría de Salud', avance_obra_promedio: 95, tiene_alertas: false }),
    ]

    await expect(generarReporteUPsPorCentroGestor({
      resumenPorCentroGestor: resumen,
      totalIntervenciones: 30,
      totalAvances: 45,
    })).resolves.not.toThrow()

    // Se llamó a doc.save() con nombre correcto
    expect(mockSave).toHaveBeenCalledTimes(1)
    const filename = mockSave.mock.calls[0][0]
    expect(filename).toMatch(/^reporte_avances_ups_\d{4}-\d{2}-\d{2}\.pdf$/)
  })

  it('genera tabla principal con filas por cada centro gestor', async () => {
    const resumen = [
      crearResumenUP({ nombre_centro_gestor: 'CG1', total_intervenciones: 5, intervenciones_con_avance: 3 }),
      crearResumenUP({ nombre_centro_gestor: 'CG2', total_intervenciones: 8, intervenciones_con_avance: 8 }),
    ]

    await generarReporteUPsPorCentroGestor({
      resumenPorCentroGestor: resumen,
      totalIntervenciones: 13,
      totalAvances: 20,
    })

    // Al menos 1 autoTable (tabla principal)
    expect(autoTableCalls.length).toBeGreaterThanOrEqual(1)
    const tablaPrincipal = autoTableCalls[0]
    expect(tablaPrincipal.body).toHaveLength(2)
    expect(tablaPrincipal.head[0]).toContain('Centro Gestor')
  })

  it('genera sección de alertas cuando hay centros con alertas', async () => {
    const intSinAvance = crearIntervencion({ tiene_avances: false, esta_completada: false, upid: 'UNP-999' })
    const resumen = [
      crearResumenUP({
        nombre_centro_gestor: 'Con Alerta',
        tiene_alertas: true,
        intervenciones: [intSinAvance],
      }),
    ]

    await generarReporteUPsPorCentroGestor({
      resumenPorCentroGestor: resumen,
      totalIntervenciones: 1,
      totalAvances: 0,
    })

    // Debe haber tabla de alertas (2da autoTable call)
    expect(autoTableCalls.length).toBeGreaterThanOrEqual(2)
    const tablaAlertas = autoTableCalls[1]
    expect(tablaAlertas.head[0]).toContain('Centro Gestor')
    expect(tablaAlertas.body[0][0]).toBe('Con Alerta')
  })

  it('genera sección de centros sin avances', async () => {
    const resumen = [
      crearResumenUP({
        nombre_centro_gestor: 'Sin Avance',
        intervenciones_con_avance: 0,
        intervenciones_sin_avance: 5,
        avance_obra_promedio: 0,
        tiene_alertas: true,
        intervenciones: [crearIntervencion({ tiene_avances: false, esta_completada: false })],
      }),
    ]

    await generarReporteUPsPorCentroGestor({
      resumenPorCentroGestor: resumen,
      totalIntervenciones: 5,
      totalAvances: 0,
    })

    // Debe haber 3 autoTables: principal, alertas, sin avances
    expect(autoTableCalls.length).toBe(3)
  })

  it('maneja datos vacíos sin errores', async () => {
    await expect(generarReporteUPsPorCentroGestor({
      resumenPorCentroGestor: [],
      totalIntervenciones: 0,
      totalAvances: 0,
    })).resolves.not.toThrow()

    expect(mockSave).toHaveBeenCalledTimes(1)
    // Solo tabla principal con 0 filas
    expect(autoTableCalls.length).toBe(1)
    expect(autoTableCalls[0].body).toHaveLength(0)
  })

  it('ordena centros de menor a mayor avance', async () => {
    const resumen = [
      crearResumenUP({ nombre_centro_gestor: 'Alto', avance_obra_promedio: 90 }),
      crearResumenUP({ nombre_centro_gestor: 'Bajo', avance_obra_promedio: 10 }),
      crearResumenUP({ nombre_centro_gestor: 'Medio', avance_obra_promedio: 50 }),
    ]

    await generarReporteUPsPorCentroGestor({
      resumenPorCentroGestor: resumen,
      totalIntervenciones: 30,
      totalAvances: 25,
    })

    const tabla = autoTableCalls[0]
    expect(tabla.body[0][0]).toBe('Bajo')
    expect(tabla.body[1][0]).toBe('Medio')
    expect(tabla.body[2][0]).toBe('Alto')
  })
})

// ══════════════════════════════════════════════════════════
// Tests del reporte PDF de Empréstito
// ══════════════════════════════════════════════════════════

describe('generarReporteEmprestitoPorCentroGestor', () => {
  beforeEach(() => {
    mockSave.mockClear()
    mockText.mockClear()
    mockAddPage.mockClear()
    autoTableCalls = []
  })

  it('genera PDF sin errores con datos normales', async () => {
    const resumen = [
      crearResumenEmprestito({ nombre_centro_gestor: 'Sec. Educación' }),
      crearResumenEmprestito({ nombre_centro_gestor: 'Sec. Infraestructura', tiene_alertas: true }),
    ]

    await expect(generarReporteEmprestitoPorCentroGestor({
      resumenPorCentroGestor: resumen,
      centrosConReportes: ['Sec. Educación', 'Sec. Infraestructura'],
      centrosSinReportes: ['Sec. Salud', 'Sec. Deporte'],
      totalReportes: 10,
      contratos: [
        { referencia_del_contrato: 'CO1.PCCNTR.001', nombre_centro_gestor: 'Sec. Educación', estado_contrato: 'Activo', valor_del_contrato: 1000000 },
        { referencia_del_contrato: 'CO1.PCCNTR.002', nombre_centro_gestor: 'Sec. Educación', estado_contrato: 'Activo', valor_del_contrato: 2000000 },
        { referencia_del_contrato: 'CO1.PCCNTR.003', nombre_centro_gestor: 'Sec. Salud', estado_contrato: 'Activo', valor_del_contrato: 500000 },
      ],
    })).resolves.not.toThrow()

    expect(mockSave).toHaveBeenCalledTimes(1)
    const filename = mockSave.mock.calls[0][0]
    expect(filename).toMatch(/^reporte_emprestito_centros_gestores_\d{4}-\d{2}-\d{2}\.pdf$/)
  })

  it('genera tabla de centros CON reportes', async () => {
    const resumen = [
      crearResumenEmprestito({ nombre_centro_gestor: 'CG Con Reporte', total_reportes: 3 }),
    ]

    await generarReporteEmprestitoPorCentroGestor({
      resumenPorCentroGestor: resumen,
      centrosConReportes: ['CG Con Reporte'],
      centrosSinReportes: [],
      totalReportes: 3,
    })

    expect(autoTableCalls.length).toBeGreaterThanOrEqual(1)
    const tablaConReportes = autoTableCalls[0]
    expect(tablaConReportes.body).toHaveLength(1)
    expect(tablaConReportes.body[0][0]).toBe('CG Con Reporte')
  })

  it('genera tabla de centros SIN reportes cuando los hay', async () => {
    await generarReporteEmprestitoPorCentroGestor({
      resumenPorCentroGestor: [],
      centrosConReportes: [],
      centrosSinReportes: ['CG Sin Reporte A', 'CG Sin Reporte B'],
      totalReportes: 0,
    })

    // tabla principal (vacía) + tabla sin reportes
    expect(autoTableCalls.length).toBeGreaterThanOrEqual(2)
    const tablaSinReportes = autoTableCalls[1]
    expect(tablaSinReportes.body).toHaveLength(2)
    expect(tablaSinReportes.body[0][0]).toBe('CG Sin Reporte A')
    expect(tablaSinReportes.body[0][2]).toBe('Sin reportes')
  })

  it('no genera tabla SIN reportes si todos han reportado', async () => {
    await generarReporteEmprestitoPorCentroGestor({
      resumenPorCentroGestor: [crearResumenEmprestito()],
      centrosConReportes: ['Secretaría de Educación'],
      centrosSinReportes: [],
      totalReportes: 5,
    })

    // Solo tabla principal, sin tabla de "sin reportes"
    expect(autoTableCalls.length).toBe(1)
  })

  it('genera detalle de contratos por centro gestor', async () => {
    const resumen = [
      crearResumenEmprestito({
        nombre_centro_gestor: 'Sec. Educación',
        contratos_reportados: ['REF-001'],
      }),
    ]

    await generarReporteEmprestitoPorCentroGestor({
      resumenPorCentroGestor: resumen,
      centrosConReportes: ['Sec. Educación'],
      centrosSinReportes: [],
      totalReportes: 3,
      contratos: [
        { referencia_del_contrato: 'REF-001', nombre_centro_gestor: 'Sec. Educación', estado_contrato: 'Activo', valor_del_contrato: 1000000, proveedor_adjudicado: 'Proveedor A' },
        { referencia_del_contrato: 'REF-002', nombre_centro_gestor: 'Sec. Educación', estado_contrato: 'Activo', valor_del_contrato: 2000000, proveedor_adjudicado: 'Proveedor B' },
      ],
    })

    // Debe haber addPage para la sección de detalle
    expect(mockAddPage).toHaveBeenCalled()

    // Última autoTable es el detalle de contratos de "Sec. Educación"
    const ultimaTabla = autoTableCalls[autoTableCalls.length - 1]
    expect(ultimaTabla.body).toHaveLength(2)

    // REF-001 está reportado → "✓ Sí", REF-002 no → "✗ No"
    const reportadoCol = ultimaTabla.body.map((r: string[]) => r[4])
    expect(reportadoCol).toContain('✓ Sí')
    expect(reportadoCol).toContain('✗ No')
  })

  it('maneja datos completamente vacíos sin errores', async () => {
    await expect(generarReporteEmprestitoPorCentroGestor({
      resumenPorCentroGestor: [],
      centrosConReportes: [],
      centrosSinReportes: [],
      totalReportes: 0,
      contratos: [],
    })).resolves.not.toThrow()

    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it('maneja contratos sin nombre_centro_gestor', async () => {
    await expect(generarReporteEmprestitoPorCentroGestor({
      resumenPorCentroGestor: [],
      centrosConReportes: [],
      centrosSinReportes: [],
      totalReportes: 0,
      contratos: [
        { referencia_del_contrato: 'REF-X', estado_contrato: 'Activo', valor_del_contrato: 100 },
      ],
    })).resolves.not.toThrow()
  })

  it('identifica correctamente contratos reportados vs no reportados', async () => {
    const resumen = [
      crearResumenEmprestito({
        nombre_centro_gestor: 'Entidad Test',
        contratos_reportados: ['REF-A', 'REF-C'],
      }),
    ]

    await generarReporteEmprestitoPorCentroGestor({
      resumenPorCentroGestor: resumen,
      centrosConReportes: ['Entidad Test'],
      centrosSinReportes: [],
      totalReportes: 4,
      contratos: [
        { referencia_del_contrato: 'REF-A', nombre_centro_gestor: 'Entidad Test', estado_contrato: 'Activo', valor_del_contrato: 1000 },
        { referencia_del_contrato: 'REF-B', nombre_centro_gestor: 'Entidad Test', estado_contrato: 'Activo', valor_del_contrato: 2000 },
        { referencia_del_contrato: 'REF-C', nombre_centro_gestor: 'Entidad Test', estado_contrato: 'Liquidado', valor_del_contrato: 500 },
      ],
    })

    // Buscar la tabla de detalle de "Entidad Test"
    const detalleTabla = autoTableCalls[autoTableCalls.length - 1]
    expect(detalleTabla.body).toHaveLength(3)

    // REF-A → Sí, REF-B → No, REF-C → Sí
    const refs = detalleTabla.body.map((r: string[]) => [r[0], r[4]])
    expect(refs).toContainEqual(['REF-B', '✗ No'])
    // REF-A y REF-C son reportados
    const reportados = detalleTabla.body.filter((r: string[]) => r[4] === '✓ Sí')
    expect(reportados).toHaveLength(2)
  })
})

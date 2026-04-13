/**
 * Tests de integración para los botones de descarga PDF en:
 *  - AvancesUPCentroGestor (Gestionar Unidades de Proyecto → Avances)
 *  - AvancesEmprestitoTab  (Gestionar Empréstito → Avances)
 *
 * Verifica:
 *  1. Botón "Reporte PDF" se renderiza para usuarios con canViewAll
 *  2. Botón NO se renderiza para usuarios restringidos
 *  3. Al hacer click se invoca la función de generación del reporte
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ── Mock: jsPDF (para que los generadores no fallen) ─────
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 279, getHeight: () => 216 } },
    getNumberOfPages: () => 1,
    text: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    line: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    save: vi.fn(),
    autoTable: vi.fn(),
    lastAutoTable: { finalY: 100 },
  })),
}))
vi.mock('jspdf-autotable', () => ({}))

// ── Mock: framer-motion (evitar errores de animación en jsdom) ───
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => {
      return React.forwardRef((props: any, ref: any) => {
        const { initial, animate, exit, variants, whileHover, whileTap, transition, layout, ...rest } = props
        return React.createElement(String(prop), { ...rest, ref })
      })
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}))

// ── Mock: AuthContext ────────────────────────────────────
const mockAuthState = {
  user: { email: 'admin@test.com', uid: 'test-uid', roles: ['super_admin'] },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  firebaseUser: null,
}
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    state: mockAuthState,
    dispatch: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

// ── Mock: centroGestorAccess — controlable por test ──────
let mockCanViewAll = true
let mockUserCentroGestor = ''
vi.mock('@/utils/centroGestorAccess', () => ({
  getCentroGestorAccessFromSession: () => ({
    canViewAll: mockCanViewAll,
    userCentroGestor: mockUserCentroGestor,
    isRestricted: !mockCanViewAll,
  }),
}))

// ── Mock: hook useAvancesCentroGestor (para AvancesUPCentroGestor) ──
const mockRefetch = vi.fn()
vi.mock('@/hooks/useAvancesCentroGestor', () => ({
  useAvancesCentroGestor: () => ({
    avances: [],
    intervenciones: [],
    resumenPorCentroGestor: [
      {
        nombre_centro_gestor: 'Sec. Infraestructura',
        total_intervenciones: 5,
        intervenciones_con_avance: 3,
        intervenciones_sin_avance: 1,
        intervenciones_completadas: 1,
        total_avances: 10,
        avances_ultimos_10_dias: 2,
        ultimo_avance: '2026-04-10T14:30:00Z',
        primer_avance: '2025-03-01T08:00:00Z',
        avance_obra_promedio: 62.5,
        tiene_alertas: false,
        intervenciones: [],
      },
    ],
    centrosConAvances: ['Sec. Infraestructura'],
    centrosSinAvances: [],
    totalAvances: 10,
    totalIntervenciones: 5,
    loading: false,
    error: null,
    refetch: mockRefetch,
  }),
  CentroGestorAvancesResumen: {},
  IntervencionConAvances: {},
  AvanceUPRaw: {},
}))

// ── Mock: hook useReportesCentroGestor (para AvancesEmprestitoTab) ──
vi.mock('@/hooks/useReportesCentroGestor', () => ({
  useReportesCentroGestorDashboard: () => ({
    reportes: [],
    resumenPorCentroGestor: [
      {
        nombre_centro_gestor: 'Sec. Educación',
        total_reportes: 5,
        reportes_ultimos_10_dias: 2,
        ultimo_reporte: '2026-04-08T10:00:00Z',
        primer_reporte: '2025-06-15T09:00:00Z',
        contratos_reportados: ['CO1.PCCNTR.001'],
        ultimo_avance_fisico: 55,
        ultimo_avance_financiero: 48,
        tiene_alertas: false,
      },
    ],
    centrosConReportes: ['Sec. Educación'],
    centrosSinReportes: ['Sec. Salud'],
    totalReportes: 5,
    loading: false,
    error: null,
  }),
  CentroGestorResumen: {},
}))

// ── Mock: generadores PDF (espiar que se llamen) ─────────
const mockGenerarUPsPdf = vi.fn().mockResolvedValue(undefined)
vi.mock('@/utils/reporteUPsPdf', () => ({
  generarReporteUPsPorCentroGestor: (...args: any[]) => mockGenerarUPsPdf(...args),
}))

const mockGenerarEmprestitoPdf = vi.fn().mockResolvedValue(undefined)
vi.mock('@/utils/reporteEmprestitoPdf', () => ({
  generarReporteEmprestitoPorCentroGestor: (...args: any[]) => mockGenerarEmprestitoPdf(...args),
}))

// ── Mock: fetch (para AvancesEmprestitoTab que carga contratos JSON) ─
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ── Imports (después de mocks) ───────────────────────────
import AvancesUPCentroGestor from '@/components/AvancesUPCentroGestor'
import AvancesEmprestitoTab from '@/components/AvancesEmprestitoTab'

// ══════════════════════════════════════════════════════════
// AvancesUPCentroGestor — Botón PDF
// ══════════════════════════════════════════════════════════
describe('AvancesUPCentroGestor — botón Reporte PDF', () => {
  beforeEach(() => {
    mockCanViewAll = true
    mockUserCentroGestor = ''
    mockGenerarUPsPdf.mockClear()
  })

  it('renderiza botón "Reporte PDF" para super_admin', () => {
    render(<AvancesUPCentroGestor />)
    const btn = screen.getByTitle('Descargar reporte PDF por centro gestor')
    expect(btn).toBeDefined()
    expect(btn.textContent).toContain('Reporte PDF')
  })

  it('NO renderiza botón para usuario restringido', () => {
    mockCanViewAll = false
    mockUserCentroGestor = 'Sec. Infraestructura'
    render(<AvancesUPCentroGestor />)
    const btn = screen.queryByTitle('Descargar reporte PDF por centro gestor')
    expect(btn).toBeNull()
  })

  it('al hacer click genera el reporte PDF de UPs', async () => {
    render(<AvancesUPCentroGestor />)
    const btn = screen.getByTitle('Descargar reporte PDF por centro gestor')

    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockGenerarUPsPdf).toHaveBeenCalledTimes(1)
    })

    // Verificar que se pasa nombre_centro_gestor en los datos
    const args = mockGenerarUPsPdf.mock.calls[0][0]
    expect(args.resumenPorCentroGestor).toBeDefined()
    expect(args.resumenPorCentroGestor[0].nombre_centro_gestor).toBe('Sec. Infraestructura')
    expect(args.totalIntervenciones).toBe(5)
    expect(args.totalAvances).toBe(10)
  })
})

// ══════════════════════════════════════════════════════════
// AvancesEmprestitoTab — Botón PDF
// ══════════════════════════════════════════════════════════
describe('AvancesEmprestitoTab — botón Reporte PDF', () => {
  beforeEach(() => {
    mockCanViewAll = true
    mockUserCentroGestor = ''
    mockGenerarEmprestitoPdf.mockClear()
    mockFetch.mockReset()
    // Simular fetch de contratos JSON → devuelve contratos con nombre_centro_gestor
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ([
        { referencia_del_contrato: 'REF-001', nombre_entidad: 'Sec. Educación', estado_contrato: 'Activo', valor_del_contrato: 1000000 },
        { referencia_del_contrato: 'REF-002', nombre_entidad: 'Sec. Salud', estado_contrato: 'Activo', valor_del_contrato: 2000000 },
      ]),
    })
  })

  it('renderiza botón "Reporte PDF" para super_admin', () => {
    render(<AvancesEmprestitoTab />)
    const btn = screen.getByTitle('Descargar reporte PDF por centro gestor')
    expect(btn).toBeDefined()
    expect(btn.textContent).toContain('Reporte PDF')
  })

  it('NO renderiza botón para usuario restringido', () => {
    mockCanViewAll = false
    mockUserCentroGestor = 'Sec. Educación'
    render(<AvancesEmprestitoTab />)
    const btn = screen.queryByTitle('Descargar reporte PDF por centro gestor')
    expect(btn).toBeNull()
  })

  it('al hacer click genera el reporte PDF de Empréstito', async () => {
    render(<AvancesEmprestitoTab />)
    const btn = screen.getByTitle('Descargar reporte PDF por centro gestor')

    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockGenerarEmprestitoPdf).toHaveBeenCalledTimes(1)
    })

    const args = mockGenerarEmprestitoPdf.mock.calls[0][0]
    expect(args.resumenPorCentroGestor).toBeDefined()
    expect(args.resumenPorCentroGestor[0].nombre_centro_gestor).toBe('Sec. Educación')
    expect(args.centrosConReportes).toContain('Sec. Educación')
    expect(args.centrosSinReportes).toContain('Sec. Salud')
    expect(args.totalReportes).toBe(5)
  })

  it('los contratos cargados del JSON se normalizan a nombre_centro_gestor', async () => {
    render(<AvancesEmprestitoTab />)
    const btn = screen.getByTitle('Descargar reporte PDF por centro gestor')

    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockGenerarEmprestitoPdf).toHaveBeenCalledTimes(1)
    })

    const args = mockGenerarEmprestitoPdf.mock.calls[0][0]
    // Los contratos se mapean de nombre_entidad → nombre_centro_gestor
    expect(args.contratos).toBeDefined()
    expect(args.contratos.length).toBe(2)
    for (const contrato of args.contratos) {
      expect(contrato.nombre_centro_gestor).toBeDefined()
      expect(typeof contrato.nombre_centro_gestor).toBe('string')
      expect(contrato.nombre_centro_gestor.length).toBeGreaterThan(0)
    }
  })
})

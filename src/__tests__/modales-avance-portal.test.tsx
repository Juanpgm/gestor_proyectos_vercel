/**
 * Regression test: los modales de Avance/Historial de Unidades de Proyecto
 * deben renderizarse en un portal a document.body.
 *
 * Bug original: el overlay usa position:fixed y se montaba dentro de un
 * contenedor animado con Framer Motion (que aplica `transform`). Un ancestro
 * con transform crea un "containing block", así que el modal `fixed` quedaba
 * anclado a la caja del contenedor (a menudo fuera de la vista) en lugar del
 * viewport — el usuario hacía click en "Avance"/"Historial" y "no pasaba nada".
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('@/hooks/useAvancesUP', () => ({
  useAvancesUP: () => ({
    addAvance: vi.fn(),
    error: null,
    clearError: vi.fn(),
    avances: [],
    loading: false,
    resumen: null,
    deleteAvance: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/context/DataContext', () => ({
  useDataContext: () => ({
    projects: [],
    filteredProjects: [],
    loading: false,
    error: null,
    seguimientoPa: [],
    ejecucionPresupuestal: [],
    productosPa: [],
    actividadesPa: [],
    equipamientos: [],
    infraestructuraVial: [],
    unidadesProyecto: [],
    intervenciones: [],
  }),
}))

vi.mock('@/utils/pdfExporter', () => ({
  exportProjectToPDF: vi.fn(),
}))

vi.mock('@/services/pagos.service', () => ({
  fetchPagosEmprestito: vi.fn().mockResolvedValue({ data: [] }),
  formatCurrency: (v: number) => String(v),
  formatDate: (v: string) => v,
}))

vi.mock('@/utils/errorHandler', () => ({
  proxyFetch: vi.fn().mockResolvedValue({ ok: false }),
}))

vi.mock('@/components/ContractMetricsRings', () => ({
  default: () => null,
}))

vi.mock('@/components/ContractGantt', () => ({
  default: () => null,
}))

vi.mock('@/components/ContractFinancialVisuals', () => ({
  default: () => null,
}))

vi.mock('@/components/ContractTimeSeries', () => ({
  default: () => null,
}))

vi.mock('@/components/GaugeChart', () => ({
  ActivityProgressGauge: () => null,
  ProductProgressGauge: () => null,
  BudgetExecutionGauge: () => null,
}))

vi.mock('@/components/PDFLoadingIndicator', () => ({
  default: () => null,
}))

import RegistrarAvanceUPModal from '@/components/RegistrarAvanceUPModal'
import HistorialAvancesUP from '@/components/HistorialAvancesUP'
import ProjectModal from '@/components/ProjectModal'
import ContratosModal from '@/components/ContratosModal'
import HistorialReportesContrato from '@/components/HistorialReportesContrato'

const TransformedWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  // Reproduce el ancestro con transform que aplica Framer Motion en las tablas.
  <div data-testid="transformed-ancestor" style={{ transform: 'translateY(20px)' }}>
    {children}
  </div>
)

const MOCK_PROJECT = {
  id: 'PRJ-001',
  bpin: '2024-BP-001',
  name: 'Proyecto de prueba',
  status: 'En Ejecución' as const,
  budget: 5000000,
  executed: 2500000,
  pagado: 1000000,
  beneficiaries: 100,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  responsible: 'Centro Gestor Test',
  progress: 50,
}

describe('Modales de avance UP — portal a document.body', () => {
  beforeEach(() => cleanup())

  it('RegistrarAvanceUPModal se monta fuera del ancestro transformado', () => {
    render(
      <TransformedWrapper>
        <RegistrarAvanceUPModal
          upid="UNP-1001"
          intervencionId="INT-1"
          nombreUP="Unidad de prueba"
          avanceActual={50}
          presupuesto={1000000}
          onClose={vi.fn()}
        />
      </TransformedWrapper>,
    )

    const dialog = screen.getByRole('dialog')
    const wrapper = screen.getByTestId('transformed-ancestor')

    // El modal abre (no "no pasa nada") y NO está atrapado dentro del ancestro
    // con transform: vive en document.body gracias al portal.
    expect(document.body.contains(dialog)).toBe(true)
    expect(wrapper.contains(dialog)).toBe(false)
  })

  it('HistorialAvancesUP se monta fuera del ancestro transformado', () => {
    render(
      <TransformedWrapper>
        <HistorialAvancesUP
          upid="UNP-1001"
          intervencionId="INT-1"
          nombreUP="Unidad de prueba"
          presupuesto={1000000}
          onClose={vi.fn()}
          onRegistrarAvance={vi.fn()}
        />
      </TransformedWrapper>,
    )

    const dialogs = screen.getAllByRole('dialog')
    const wrapper = screen.getByTestId('transformed-ancestor')

    expect(dialogs.length).toBeGreaterThan(0)
    for (const d of dialogs) {
      expect(document.body.contains(d)).toBe(true)
      expect(wrapper.contains(d)).toBe(false)
    }
  })
})

describe('Modales ported — portal a document.body (regression: fixed/transform bug)', () => {
  beforeEach(() => cleanup())

  it('ProjectModal se monta fuera del ancestro transformado', () => {
    render(
      <TransformedWrapper>
        <ProjectModal
          isOpen
          project={MOCK_PROJECT}
          onClose={vi.fn()}
        />
      </TransformedWrapper>,
    )

    const dialog = screen.getByRole('dialog')
    const wrapper = screen.getByTestId('transformed-ancestor')

    expect(document.body.contains(dialog)).toBe(true)
    expect(wrapper.contains(dialog)).toBe(false)
  })

  it('ContratosModal se monta fuera del ancestro transformado', () => {
    render(
      <TransformedWrapper>
        <ContratosModal
          isOpen
          onClose={vi.fn()}
          referenciaContrato="REF-001"
          contratoData={{
            referencia_contrato: 'REF-001',
            objeto_del_contrato: 'Contrato de prueba',
            estado_contrato: 'Vigente',
          }}
        />
      </TransformedWrapper>,
    )

    const dialog = screen.getByRole('dialog')
    const wrapper = screen.getByTestId('transformed-ancestor')

    expect(document.body.contains(dialog)).toBe(true)
    expect(wrapper.contains(dialog)).toBe(false)
  })

  it('HistorialReportesContrato se monta fuera del ancestro transformado', () => {
    const mockResumen = {
      total_reportes: 0,
      ultimo_avance_fisico: 0,
      ultimo_avance_financiero: 0,
      ultima_fecha_reporte: null,
      tiene_alertas_activas: false,
      tendencia_fisica: 'sin_datos' as const,
      tendencia_financiera: 'sin_datos' as const,
    }

    render(
      <TransformedWrapper>
        <HistorialReportesContrato
          isOpen
          onClose={vi.fn()}
          referenciaContrato="REF-001"
          reportes={[]}
          resumen={mockResumen}
        />
      </TransformedWrapper>,
    )

    // HistorialReportesContrato wraps in motion.div (no explicit role="dialog")
    // so we verify the overlay div exists in body and NOT in the wrapper.
    const wrapper = screen.getByTestId('transformed-ancestor')
    // The overlay has a fixed inset-0 div rendered via portal — it should appear
    // directly under document.body, not under the transformed wrapper.
    expect(wrapper.querySelector('.fixed')).toBeNull()
    // At least some content was rendered into body (the overlay div)
    expect(document.body.querySelector('.fixed')).not.toBeNull()
  })
})

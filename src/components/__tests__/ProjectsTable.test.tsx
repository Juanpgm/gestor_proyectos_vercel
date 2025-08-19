import React from 'react'
import { render, screen } from '@testing-library/react'
import ProjectsTable, { Project } from '../ProjectsTable'

const sampleProjects: Project[] = [
  {
    id: '1',
    bpin: 'BPIN-001',
    name: 'Proyecto Prueba',
    status: 'En Ejecución',
    comuna: 'Comuna 1',
    barrio: 'Barrio A',
    budget: 1000000,
    executed: 250000,
    beneficiaries: 100,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    responsible: 'Entidad X',
    progress: 12.3
  }
]

describe('ProjectsTable', () => {
  it('renders project row with formatted budget and detail button aria-label', () => {
    render(<ProjectsTable projects={sampleProjects} filteredProjects={sampleProjects} />)

    // Check budget formatted with $ and COP
    const budgetText = screen.getByText(/\$1,000,000 COP/)
    expect(budgetText).toBeInTheDocument()

    // Detail button aria-label
    const detailButton = screen.getByLabelText(/Ver detalle del proyecto Proyecto Prueba/)
    expect(detailButton).toBeInTheDocument()

    // Progressbar aria attributes
    const physicalProgress = screen.getByLabelText(/Progreso físico de Proyecto Prueba/)
    expect(physicalProgress).toHaveAttribute('role', 'progressbar')
    expect(Number(physicalProgress.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(0)
  })
})

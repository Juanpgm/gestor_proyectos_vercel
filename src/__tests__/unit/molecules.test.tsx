/**
 * Unit tests: Design System Molecules
 *
 * Verifica StatCard y SearchBar con sus comportamientos funcionales.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

import { StatCard }  from '@/components/molecules/StatCard'
import { SearchBar } from '@/components/molecules/SearchBar'

// ─────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────

describe('StatCard', () => {
  it('renders label', () => {
    render(<StatCard label="Proyectos activos" value={42} />)
    expect(screen.getByText('Proyectos activos')).toBeInTheDocument()
  })

  it('renders numeric value formatted with toLocaleString es-CO', () => {
    render(<StatCard label="Total" value={1500} />)
    // es-CO: 1.500
    expect(screen.getByText(/1.500|1,500/)).toBeInTheDocument()
  })

  it('renders string value directly', () => {
    render(<StatCard label="Estado" value="Activo" />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('renders "—" when value is null', () => {
    render(<StatCard label="Sin dato" value={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders Spinner when loading=true', () => {
    render(<StatCard label="Cargando" value={0} loading />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not render Spinner when not loading', () => {
    render(<StatCard label="Listo" value={5} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders positive trend with ↑ and trendLabel', () => {
    render(<StatCard label="X" value={10} trend={5} trendLabel="este mes" />)
    expect(screen.getByText(/↑/)).toBeInTheDocument()
    expect(screen.getByText(/5/)).toBeInTheDocument()
    expect(screen.getByText('este mes')).toBeInTheDocument()
  })

  it('renders negative trend with ↓', () => {
    render(<StatCard label="X" value={10} trend={-3} />)
    expect(screen.getByText(/↓/)).toBeInTheDocument()
  })

  it('does not render trend when undefined', () => {
    const { container } = render(<StatCard label="X" value={10} />)
    expect(container.querySelector('.text-emerald-600')).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    const icon = React.createElement('span', { 'data-testid': 'stat-icon' })
    render(<StatCard label="X" value={1} icon={icon} />)
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument()
  })

  it('is clickable when onClick provided', () => {
    let called = false
    render(<StatCard label="Click" value={1} onClick={() => { called = true }} />)
    fireEvent.click(screen.getByText('Click'))
    expect(called).toBe(true)
  })

  it('has role="button" when onClick is provided', () => {
    render(<StatCard label="Btn" value={1} onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has no role when not clickable', () => {
    render(<StatCard label="NBtn" value={1} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────
// SearchBar
// ─────────────────────────────────────────────

describe('SearchBar', () => {
  it('renders input with correct placeholder', () => {
    render(<SearchBar placeholder="Buscar proyecto..." />)
    expect(screen.getByPlaceholderText('Buscar proyecto...')).toBeInTheDocument()
  })

  it('has aria-label matching placeholder by default', () => {
    render(<SearchBar placeholder="Texto buscable" />)
    expect(screen.getByRole('searchbox', { name: 'Texto buscable' })).toBeInTheDocument()
  })

  it('renders clear button when value is present', () => {
    render(<SearchBar value="hola" onChange={() => {}} onSearch={() => {}} />)
    expect(screen.getByRole('button', { name: 'Limpiar búsqueda' })).toBeInTheDocument()
  })

  it('does not render clear button when value is empty', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Limpiar búsqueda' })).not.toBeInTheDocument()
  })

  it('calls onChange on input change', () => {
    let val = ''
    render(<SearchBar onChange={(v) => { val = v }} debounce={0} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'cali' } })
    expect(val).toBe('cali')
  })

  it('calls onSearch immediately when debounce=0', () => {
    let searched = ''
    render(<SearchBar onSearch={(v) => { searched = v }} debounce={0} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'test' } })
    expect(searched).toBe('test')
  })

  it('calls onSearch with empty string when clear is clicked', () => {
    let searched = 'init'
    render(
      <SearchBar
        value="cali"
        onChange={() => {}}
        onSearch={(v) => { searched = v }}
        debounce={0}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
    expect(searched).toBe('')
  })

  it('is disabled when disabled=true', () => {
    render(<SearchBar disabled placeholder="No buscar" />)
    expect(screen.getByRole('searchbox')).toBeDisabled()
  })

  it('applies sm size class', () => {
    render(<SearchBar size="sm" />)
    expect(screen.getByRole('searchbox').className).toContain('h-8')
  })

  it('applies lg size class', () => {
    render(<SearchBar size="lg" />)
    expect(screen.getByRole('searchbox').className).toContain('h-11')
  })
})

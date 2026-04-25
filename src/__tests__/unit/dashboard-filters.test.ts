/**
 * Unit tests: dashboard filter utilities.
 * Tests the pure functions used by DashboardContext.
 */

import { describe, it, expect } from 'vitest';

// Pure utility: count active filters (objects where value is not null/undefined/empty)
function countActiveFilters(filters: Record<string, unknown>): number {
  return Object.values(filters).filter(
    (v) => v !== null && v !== undefined && v !== '' && 
    !(Array.isArray(v) && v.length === 0)
  ).length;
}

// Pure utility: filter projects by centro_gestor
function filterByCentroGestor<T extends { nombre_centro_gestor?: string }>(
  items: T[],
  centroGestor: string | null
): T[] {
  if (!centroGestor) return items;
  return items.filter(
    (item) => item.nombre_centro_gestor?.toLowerCase() === centroGestor.toLowerCase()
  );
}

// Pure utility: filter projects by status
function filterByEstado<T extends { estado?: string }>(
  items: T[],
  estado: string | null
): T[] {
  if (!estado) return items;
  return items.filter((item) => item.estado === estado);
}

describe('countActiveFilters', () => {
  it('returns 0 for empty filters', () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it('counts non-null, non-empty values', () => {
    expect(countActiveFilters({ a: 'value', b: null, c: undefined, d: '' })).toBe(1);
  });

  it('counts multiple active filters', () => {
    expect(countActiveFilters({ centro: 'DATIC', estado: 'activo', bpin: '' })).toBe(2);
  });

  it('does not count empty arrays', () => {
    expect(countActiveFilters({ bpins: [] })).toBe(0);
  });

  it('counts non-empty arrays', () => {
    expect(countActiveFilters({ bpins: ['123'] })).toBe(1);
  });
});

describe('filterByCentroGestor', () => {
  const projects = [
    { id: '1', nombre_centro_gestor: 'DATIC' },
    { id: '2', nombre_centro_gestor: 'DAGRD' },
    { id: '3', nombre_centro_gestor: 'datic' }, // case variation
  ];

  it('returns all items when filter is null', () => {
    expect(filterByCentroGestor(projects, null)).toHaveLength(3);
  });

  it('filters case-insensitively', () => {
    const result = filterByCentroGestor(projects, 'DATIC');
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no match', () => {
    const result = filterByCentroGestor(projects, 'INEXISTENTE');
    expect(result).toHaveLength(0);
  });
});

describe('filterByEstado', () => {
  const items = [
    { id: '1', estado: 'activo' },
    { id: '2', estado: 'inactivo' },
    { id: '3', estado: 'activo' },
  ];

  it('returns all when estado is null', () => {
    expect(filterByEstado(items, null)).toHaveLength(3);
  });

  it('filters by exact estado match', () => {
    expect(filterByEstado(items, 'activo')).toHaveLength(2);
  });

  it('returns empty for non-existent estado', () => {
    expect(filterByEstado(items, 'borrador')).toHaveLength(0);
  });
});

'use client'

/**
 * Vistas de Calidad para el módulo de Empréstito
 * Reutiliza los mismos patrones de QualityControlViews.tsx
 * Exporta: EmprestitoSummaryView, EmprestitoRecordsView, EmprestitoStatsView
 */

import React from 'react'
import { SummaryView, RecordsView, StatsView } from '@/components/QualityControlViews'

// Re-exportar las vistas genéricas con alias para empréstito
// Los componentes aceptan la misma estructura de datos del endpoint /calidad-datos

export const EmprestitoSummaryView: React.FC<{ data: any }> = ({ data }) => {
  return <SummaryView data={data} />
}

export const EmprestitoRecordsView: React.FC<{ records: any[] }> = ({ records }) => {
  return <RecordsView records={records} />
}

export const EmprestitoStatsView: React.FC<{ data: any }> = ({ data }) => {
  return <StatsView data={data} />
}

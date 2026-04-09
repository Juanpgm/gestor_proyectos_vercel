'use client'

/**
 * Vistas extendidas de Calidad para el módulo de Empréstito
 * Reutiliza los mismos patrones de QualityControlViewsExtended.tsx
 * Exporta: EmprestitoChangelogView, EmprestitoByCentroGestorView
 */

import React from 'react'
import { ChangelogView, ByCentroGestorView } from '@/components/QualityControlViewsExtended'

export const EmprestitoChangelogView: React.FC<{ changes: any[] }> = ({ changes }) => {
  return <ChangelogView changes={changes} />
}

export const EmprestitoByCentroGestorView: React.FC<{ centros: any[] }> = ({ centros }) => {
  return <ByCentroGestorView centros={centros} />
}

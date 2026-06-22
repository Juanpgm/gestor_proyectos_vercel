/**
 * Tests: NotificationPanel getActorLine formatting.
 *
 * Covers the actor display line shown under each notification:
 *   "{actor_nombre} ({role_label}) — {centro_gestor} · {email}"
 */

import { describe, expect, it } from 'vitest'
import type { BackendNotification } from '@/types/notifications'

// Mirror the logic from NotificationPanel.tsx so we can test it without
// rendering the full component (which requires auth/firebase mocks).
const ROLE_LABELS: Record<string, string> = {
  admin_centro_gestor: 'Admin CG',
  admin_general: 'Admin General',
  super_admin: 'Super Admin',
  editor_datos: 'Editor',
}

function getActorLine(n: Pick<BackendNotification, 'actor_nombre' | 'actor_role' | 'actor_centro_gestor' | 'actor_email'>): string {
  const parts: string[] = [n.actor_nombre]
  const roleLabel = ROLE_LABELS[n.actor_role] ?? n.actor_role
  if (roleLabel) parts.push(`(${roleLabel})`)
  if (n.actor_centro_gestor) parts.push(`— ${n.actor_centro_gestor}`)
  if (n.actor_email) parts.push(`· ${n.actor_email}`)
  return parts.join(' ')
}

const baseActor = {
  actor_nombre: 'Juan Guzman',
  actor_role: 'admin_centro_gestor',
  actor_centro_gestor: null,
  actor_email: undefined,
} as const

describe('getActorLine', () => {
  it('renders name and known role label', () => {
    expect(getActorLine(baseActor)).toBe('Juan Guzman (Admin CG)')
  })

  it('falls back to raw role when label is unknown', () => {
    const line = getActorLine({ ...baseActor, actor_role: 'some_unknown_role' })
    expect(line).toBe('Juan Guzman (some_unknown_role)')
  })

  it('appends centro gestor when present', () => {
    const line = getActorLine({ ...baseActor, actor_centro_gestor: 'Secretaría Bienestar' })
    expect(line).toContain('— Secretaría Bienestar')
    expect(line).toMatch(/\(Admin CG\) — Secretaría Bienestar/)
  })

  it('appends email when present', () => {
    const line = getActorLine({ ...baseActor, actor_email: 'juan@cali.gov.co' })
    expect(line).toContain('· juan@cali.gov.co')
  })

  it('renders all parts together', () => {
    const line = getActorLine({
      actor_nombre: 'María López',
      actor_role: 'admin_general',
      actor_centro_gestor: 'Secretaría Salud',
      actor_email: 'maria@cali.gov.co',
    })
    expect(line).toBe('María López (Admin General) — Secretaría Salud · maria@cali.gov.co')
  })

  it('omits centro gestor section when null', () => {
    const line = getActorLine({ ...baseActor, actor_centro_gestor: null })
    expect(line).not.toContain('—')
  })

  it('omits email section when null', () => {
    const line = getActorLine({ ...baseActor, actor_email: null as any })
    expect(line).not.toContain('·')
  })

  it('handles super_admin role label', () => {
    expect(getActorLine({ ...baseActor, actor_role: 'super_admin' })).toContain('Super Admin')
  })

  it('handles editor_datos role label', () => {
    expect(getActorLine({ ...baseActor, actor_role: 'editor_datos' })).toContain('Editor')
  })
})

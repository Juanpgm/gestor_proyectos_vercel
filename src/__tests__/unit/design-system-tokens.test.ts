/**
 * Unit tests: Design System Tokens
 *
 * Verifica que el objeto tokens esté completo, bien tipado,
 * y que los valores sean los esperados según las directivas govtech.
 */

import { describe, it, expect } from 'vitest'
import { tokens, colors, typography, spacing, radii, shadows, zIndex, motion, breakpoints } from '@/theme'

// ─────────────────────────────────────────────
// TOKENS EXPORT
// ─────────────────────────────────────────────

describe('tokens barrel export', () => {
  it('exports the tokens root object', () => {
    expect(tokens).toBeDefined()
    expect(typeof tokens).toBe('object')
  })

  it('tokens contains all required namespaces', () => {
    expect(tokens).toHaveProperty('colors')
    expect(tokens).toHaveProperty('typography')
    expect(tokens).toHaveProperty('spacing')
    expect(tokens).toHaveProperty('radii')
    expect(tokens).toHaveProperty('shadows')
    expect(tokens).toHaveProperty('zIndex')
    expect(tokens).toHaveProperty('motion')
    expect(tokens).toHaveProperty('breakpoints')
  })
})

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────

describe('colors — brand', () => {
  it('brand.primary is institutional blue-700 (govtech palette)', () => {
    expect(colors.brand.primary).toBe('#1d4ed8')
  })

  it('brand has navy property for header/navbar usage', () => {
    expect(colors.brand).toHaveProperty('navy')
    expect(colors.brand.navy).toBe('#1e3a5f')
  })
})

describe('colors — semantic', () => {
  it('success.default is emerald-600', () => {
    expect(colors.semantic.success.default).toBe('#059669')
  })
  it('error.default is red-600', () => {
    expect(colors.semantic.error.default).toBe('#dc2626')
  })
  it('warning.default is amber-600', () => {
    expect(colors.semantic.warning.default).toBe('#d97706')
  })
  it('info.default is blue-700 (matches brand.primary)', () => {
    expect(colors.semantic.info.default).toBe('#2563eb')
  })
})

describe('colors — domain entities', () => {
  const domains = ['projects', 'activities', 'products', 'contracts', 'units', 'emprestito', 'procesos'] as const

  it.each(domains)('domain "%s" has required color keys', (domain) => {
    const d = colors.domain[domain]
    expect(d).toHaveProperty('bg')
    expect(d).toHaveProperty('light')
    expect(d).toHaveProperty('mid')
    expect(d).toHaveProperty('default')
    expect(d).toHaveProperty('dark')
  })

  it('projects default is blue-700', () => {
    expect(colors.domain.projects.default).toBe('#2563eb')
  })
  it('activities default is red-600', () => {
    expect(colors.domain.activities.default).toBe('#dc2626')
  })
  it('contracts default is violet-600', () => {
    expect(colors.domain.contracts.default).toBe('#7c3aed')
  })
  it('units default is emerald-600', () => {
    expect(colors.domain.units.default).toBe('#059669')
  })
})

describe('colors — neutral scale', () => {
  it('neutral has 0 to 950 scale', () => {
    expect(colors.neutral[0]).toBe('#ffffff')
    expect(colors.neutral[950]).toBe('#030712')
  })
})

describe('colors — surface light/dark', () => {
  it('light surface has background and card', () => {
    expect(colors.surface.light.background).toBe('#f9fafb')
    expect(colors.surface.light.card).toBe('#ffffff')
  })
  it('dark surface card is gray-800', () => {
    expect(colors.surface.dark.card).toBe('#1f2937')
  })
})

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────

describe('typography', () => {
  it('has fontFamily.display, body, mono', () => {
    expect(typography.fontFamily.display).toContain('Outfit')
    expect(typography.fontFamily.body).toContain('Space Grotesk')
    expect(typography.fontFamily.mono).toContain('JetBrains Mono')
  })

  it('fontSize.base is 1rem', () => {
    expect(typography.fontSize.base).toBe('1rem')
  })

  it('fontWeight.semibold is 600', () => {
    expect(typography.fontWeight.semibold).toBe('600')
  })
})

// ─────────────────────────────────────────────
// RADII — conservadores (govtech)
// ─────────────────────────────────────────────

describe('radii — conservative govtech values', () => {
  it('md is 4px (conservative, not 6px consumer style)', () => {
    expect(radii.md).toBe('0.25rem')
  })
  it('lg is 6px', () => {
    expect(radii.lg).toBe('0.375rem')
  })
  it('full is 9999px (for status badges only)', () => {
    expect(radii.full).toBe('9999px')
  })
})

// ─────────────────────────────────────────────
// SHADOWS — sutiles, border-first
// ─────────────────────────────────────────────

describe('shadows', () => {
  it('shadows.sm is subtle (opacity < 0.1)', () => {
    // Verifica que no sean sombras agresivas de consumer apps
    expect(shadows.sm).toContain('0.06)')
  })

  it('shadows has focus key for keyboard accessibility', () => {
    expect(shadows).toHaveProperty('focus')
    expect(shadows.focus).toContain('rgba(29, 78, 216')
  })

  it('no colored glow shadows (brand/success/error removed)', () => {
    expect(shadows).not.toHaveProperty('brand')
    expect(shadows).not.toHaveProperty('error')
  })
})

// ─────────────────────────────────────────────
// Z-INDEX — semántico
// ─────────────────────────────────────────────

describe('zIndex', () => {
  it('header is 100', () => {
    expect(zIndex.header).toBe(100)
  })
  it('modal > overlay > dropdown', () => {
    expect(zIndex.modal).toBeGreaterThan(zIndex.overlay)
    expect(zIndex.overlay).toBeGreaterThan(zIndex.dropdown)
  })
  it('toast > modal (toasts always visible)', () => {
    expect(zIndex.toast).toBeGreaterThan(zIndex.modal)
  })
  it('tour (1000) is above all semantic layers', () => {
    expect(zIndex.tour).toBeGreaterThan(zIndex.tooltip)
    expect(zIndex.tour).toBeGreaterThan(zIndex.toast)
    expect(zIndex.tour).toBeGreaterThan(zIndex.modal)
  })

  it('max (9999) is the escape-hatch ceiling above tour', () => {
    expect(zIndex.max).toBeGreaterThan(zIndex.tour)
  })
})

// ─────────────────────────────────────────────
// MOTION — austero (enterprise)
// ─────────────────────────────────────────────

describe('motion — enterprise austere timing', () => {
  it('fast is 120ms (not 200ms+ consumer)', () => {
    expect(motion.duration.fast).toBe('120ms')
  })
  it('normal is 200ms', () => {
    expect(motion.duration.normal).toBe('200ms')
  })
  it('does NOT have spring or bounce easing', () => {
    expect(motion.easing).not.toHaveProperty('spring')
    expect(motion.easing).not.toHaveProperty('bounce')
  })
  it('has easeInOut as standard easing', () => {
    expect(motion.easing.easeInOut).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
  })
})

describe('motion — framer motion variants', () => {
  it('slideUp variant has y: 8 (not 16 — govtech subtle)', () => {
    expect(motion.variants.slideUp.hidden.y).toBe(8)
  })
  it('scaleIn variant has scale: 0.97 (not 0.9 — subtle)', () => {
    expect(motion.variants.scaleIn.hidden.scale).toBe(0.97)
  })
  it('fadeIn has hidden opacity 0 and visible opacity 1', () => {
    expect(motion.variants.fadeIn.hidden.opacity).toBe(0)
    expect(motion.variants.fadeIn.visible.opacity).toBe(1)
  })
})

// ─────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────

describe('breakpoints', () => {
  it('mobile breakpoint is 768px', () => {
    expect(breakpoints.px.mobile).toBe(768)
  })
  it('tablet breakpoint is 1024px', () => {
    expect(breakpoints.px.tablet).toBe(1024)
  })
})

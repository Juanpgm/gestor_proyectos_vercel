/**
 * Mobile LITE Layout — CaliTrack /m/
 *
 * Layout govtech shell para teléfonos.
 * El middleware redirige automáticamente a esta ruta si detecta un teléfono.
 */
import type { Metadata, Viewport } from 'next'
import { LayoutDashboard, FolderKanban, Activity, FileText, ExternalLink, type LucideIcon } from 'lucide-react'
import { DataProvider } from '@/context/DataContext'

export const metadata: Metadata = {
  title: 'CaliTrack · Gestión',
  description: 'Plataforma analítica de gestión de proyectos — Alcaldía de Cali',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const NAV_ITEMS = [
  { href: '/m',             label: 'Panel',       Icon: LayoutDashboard },
  { href: '/m/proyectos',   label: 'Proyectos',   Icon: FolderKanban    },
  { href: '/m/actividades', label: 'Actividades', Icon: Activity         },
  { href: '/m/contratos',   label: 'Contratos',   Icon: FileText         },
] as const

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6f9] dark:bg-[#0d1117]">
      {/* ── Header institucional ─────────────────── */}
      <header
        className="sticky top-0 flex items-center justify-between px-4 bg-[#1e3a5f] dark:bg-[#0d1f36] border-b border-white/10"
        style={{ zIndex: 100, height: '52px' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-sm bg-sky-400/20 border border-sky-400/40 flex items-center justify-center shrink-0">
            <span className="text-sky-300 text-[10px] font-bold leading-none select-none">CT</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[13px] font-semibold leading-tight tracking-tight">CaliTrack</span>
            <span className="text-white/40 text-[9px] font-medium uppercase tracking-widest leading-tight">Gestión · Cali</span>
          </div>
        </div>

        <a
          href="/"
          className="flex items-center gap-1 text-white/50 text-[11px] font-medium hover:text-white/80 transition-colors"
          aria-label="Ir a versión de escritorio"
        >
          <ExternalLink size={11} />
          <span>Escritorio</span>
        </a>
      </header>

      {/* ── Contenido principal ──────────────────── */}
      <main className="flex-1 overflow-y-auto pb-20 px-3.5 pt-5">
        <DataProvider>
          {children}
        </DataProvider>
      </main>

      {/* ── Navegación inferior ──────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#161b22] border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-1"
        style={{ zIndex: 900 }}
        aria-label="Navegación principal móvil"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <NavTab key={href} href={href} label={label} Icon={Icon} />
        ))}
      </nav>
    </div>
  )
}

interface NavTabProps {
  href:  string
  label: string
  Icon:  LucideIcon
}

function NavTab({ href, label, Icon }: NavTabProps) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-1 min-w-[60px] py-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-700 dark:hover:text-sky-400 transition-colors"
      style={{ minHeight: 44 }}
      aria-label={label}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-[10px] font-medium uppercase tracking-wide leading-none">{label}</span>
    </a>
  )
}

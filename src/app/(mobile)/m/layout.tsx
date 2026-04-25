/**
 * Mobile LITE Layout — CaliTrack /m/
 *
 * Layout shell para la versión móvil ligera de CaliTrack.
 * Accesible en http://localhost:3000/m
 * El middleware redirige automáticamente a esta ruta si detecta un teléfono.
 */
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CaliTrack Mobile',
  description: 'Vista móvil del gestor de proyectos CaliTrack',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,    // evitar zoom accidental en inputs
    userScalable: false,
  },
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header compacto */}
      <header
        className="sticky top-0 z-[var(--z-header)] flex items-center justify-between px-4 h-14 bg-blue-600 dark:bg-blue-700 shadow-md"
        style={{ zIndex: 'var(--z-header)' as never }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-white font-semibold text-base tracking-tight">CaliTrack</span>
        </div>
        <a
          href="/"
          className="text-white/80 text-xs underline underline-offset-2"
          aria-label="Ir a versión de escritorio"
        >
          Vista completa
        </a>
      </header>

      {/* Contenido principal — pad bottom para la nav */}
      <main className="flex-1 overflow-y-auto pb-20 px-3 pt-4">
        {children}
      </main>

      {/* Barra de navegación inferior */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-2"
        style={{ zIndex: 900 }}
        aria-label="Navegación móvil"
      >
        <NavTab href="/m" label="Inicio" icon="🏠" />
        <NavTab href="/m/proyectos" label="Proyectos" icon="📋" />
        <NavTab href="/m/actividades" label="Actividades" icon="⚡" />
        <NavTab href="/m/contratos" label="Contratos" icon="📄" />
      </nav>
    </div>
  )
}

interface NavTabProps {
  href: string
  label: string
  icon: string
}

function NavTab({ href, label, icon }: NavTabProps) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      style={{ minHeight: 44 }}
      aria-label={label}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </a>
  )
}

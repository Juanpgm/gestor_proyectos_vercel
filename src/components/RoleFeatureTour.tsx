'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Info, X } from 'lucide-react'
import { createPortal } from 'react-dom'

type ActiveTab = 'projects' | 'project_units' | 'contracts' | 'activities' | 'products' | 'emprestito' | 'procesos'

type TourStep = {
  selector: string
  title: string
  description: string
}

interface RoleFeatureTourProps {
  highestRole: string | null
  userId?: string | null
}

const ROLE_ALIASES: Record<string, string> = {
  admin: 'admin_general',
  gestor_master: 'admin_centro_gestor',
  gestor: 'editor_datos',
  consultor_master: 'analista',
  consultor: 'visualizador'
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Acceso total a todos los módulos y acciones avanzadas.',
  admin_general: 'Gestión integral de información y administración operativa.',
  admin_centro_gestor: 'Gestión completa del centro gestor asignado.',
  editor_datos: 'Edición y actualización de datos de operación.',
  gestor_contratos: 'Gestión principal de contratos y su seguimiento.',
  analista: 'Consulta analítica y explotación de datos para seguimiento.',
  visualizador: 'Consulta de información y seguimiento general.',
  publico: 'Acceso limitado a consulta básica pública.'
}

const TAB_STEPS: Record<ActiveTab, TourStep> = {
  projects: {
    selector: '[data-tour-id="nav-projects"]',
    title: 'Proyectos',
    description: 'Aquí puedes consultar el estado global de proyectos, métricas y tabla principal.'
  },
  project_units: {
    selector: '[data-tour-id="nav-project_units"]',
    title: 'Unidades de Proyecto',
    description: 'Permite analizar UP e intervenciones, filtros territoriales y progreso por intervención.'
  },
  activities: {
    selector: '[data-tour-id="nav-activities"]',
    title: 'Actividades',
    description: 'Visualiza y controla el avance de actividades asociadas a cada proyecto.'
  },
  products: {
    selector: '[data-tour-id="nav-products"]',
    title: 'Productos',
    description: 'Revisa productos esperados, entregas y cumplimiento por BPIN y proyecto.'
  },
  emprestito: {
    selector: '[data-tour-id="nav-emprestito"]',
    title: 'Empréstito',
    description: 'Consulta reportes, contratos y seguimiento financiero del componente de empréstito.'
  },
  procesos: {
    selector: '[data-tour-id="nav-procesos"]',
    title: 'Procesos',
    description: 'Centraliza información de procesos contractuales y su estado de avance.'
  },
  contracts: {
    selector: '[data-tour-id="nav-contracts"]',
    title: 'Contratos',
    description: 'Monitorea contratos, valores, ejecución, pagos y trazabilidad contractual.'
  }
}

const getRoleTabs = (role: string): ActiveTab[] => {
  switch (role) {
    case 'super_admin':
    case 'admin_general':
    case 'admin_centro_gestor':
    case 'editor_datos':
    case 'analista':
      return ['projects', 'project_units', 'activities', 'products', 'emprestito', 'procesos', 'contracts']
    case 'gestor_contratos':
      return ['projects', 'contracts', 'emprestito', 'procesos']
    case 'visualizador':
      return ['projects', 'project_units', 'activities', 'products', 'contracts']
    case 'publico':
      return ['projects', 'project_units']
    default:
      return ['projects', 'project_units', 'contracts']
  }
}

const normalizeRole = (role: string | null): string => {
  if (!role) return 'publico'
  return ROLE_ALIASES[role] || role
}

const TOUR_Z_INDEX = {
  backdrop: 2147483643,
  target: 2147483644,
  tooltip: 2147483645
} as const

const RoleFeatureTour: React.FC<RoleFeatureTourProps> = ({ highestRole, userId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 80, left: 24 })

  const normalizedRole = useMemo(() => normalizeRole(highestRole), [highestRole])
  const tourStorageKey = useMemo(() => {
    const identity = userId?.trim() || 'anonymous'
    return `feature-tour-seen:${identity}:${normalizedRole}`
  }, [normalizedRole, userId])

  const steps = useMemo<TourStep[]>(() => {
    const base: TourStep[] = [
      {
        selector: '[data-tour-id="header-theme"]',
        title: 'Cambio de tema',
        description: 'Desde aquí alternas modo claro/oscuro para mejorar la lectura según tu entorno.'
      },
      {
        selector: '[data-tour-id="header-notifications"]',
        title: 'Notificaciones',
        description: 'Muestra alertas recientes y novedades importantes para tu operación.'
      }
    ]

    const roleTabs = getRoleTabs(normalizedRole)
    const tabSteps = roleTabs.map((tab) => TAB_STEPS[tab])

    const tail: TourStep[] = [
      {
        selector: '[data-tour-id="header-profile"]',
        title: 'Perfil y sesión',
        description: 'En esta sección verificas tu identidad activa y puedes cerrar sesión.'
      }
    ]

    return [...base, ...tabSteps, ...tail]
  }, [normalizedRole])

  const activeStep = steps[currentStep]

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const alreadySeen = window.localStorage.getItem(tourStorageKey)
      if (alreadySeen === '1') return

      setCurrentStep(0)
      setIsOpen(true)
    } catch {
      // Sin acceso a storage, se mantiene el comportamiento manual.
    }
  }, [tourStorageKey])

  useEffect(() => {
    if (!isOpen || !activeStep) return

    const target = document.querySelector(activeStep.selector) as HTMLElement | null
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })

    const originalOutline = target.style.outline
    const originalOutlineOffset = target.style.outlineOffset
    const originalZIndex = target.style.zIndex
    const originalPosition = target.style.position

    target.style.outline = '3px solid #2563eb'
    target.style.outlineOffset = '3px'
    target.style.position = target.style.position || 'relative'
    target.style.zIndex = String(TOUR_Z_INDEX.target)

    const updatePosition = () => {
      const rect = target.getBoundingClientRect()
      const tooltipWidth = 360
      const viewportWidth = window.innerWidth

      const preferredLeft = rect.left + rect.width / 2 - tooltipWidth / 2
      const left = Math.max(12, Math.min(preferredLeft, viewportWidth - tooltipWidth - 12))

      const hasSpaceBelow = rect.bottom + 220 < window.innerHeight
      const top = hasSpaceBelow ? rect.bottom + 12 : Math.max(12, rect.top - 180)

      setTooltipPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      target.style.outline = originalOutline
      target.style.outlineOffset = originalOutlineOffset
      target.style.zIndex = originalZIndex
      target.style.position = originalPosition

      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, activeStep])

  const openTour = () => {
    setCurrentStep(0)
    setIsOpen(true)
  }

  const closeTour = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(tourStorageKey, '1')
      } catch {
        // Ignorar errores de storage
      }
    }
    setIsOpen(false)
  }

  const goNext = () => {
    if (currentStep >= steps.length - 1) {
      closeTour()
      return
    }
    setCurrentStep((prev) => prev + 1)
  }

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  return (
    <>
      <button
        onClick={openTour}
        className="p-2 tablet:p-3 rounded-lg tablet:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-blue-600 dark:text-blue-400"
        title="Recorrido guiado"
        data-tour-id="header-tour"
      >
        <Info className="w-4 h-4 tablet:w-6 tablet:h-6 md:w-5 md:h-5" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 bg-black/45" style={{ zIndex: TOUR_Z_INDEX.backdrop }} onClick={closeTour} />

          <div
            className="fixed w-[calc(100vw-24px)] max-w-[360px] bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 shadow-2xl p-4"
            style={{
              zIndex: TOUR_Z_INDEX.tooltip,
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(37, 99, 235, 0.25)'
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Rol: {normalizedRole}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activeStep?.title}
                </h3>
              </div>
              <button
                onClick={closeTour}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                title="Cerrar recorrido"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              {activeStep?.description}
            </p>

            <div className="mb-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                {ROLE_DESCRIPTIONS[normalizedRole] || 'Este recorrido resume las funcionalidades habilitadas para tu perfil.'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Paso {Math.min(currentStep + 1, steps.length)} de {steps.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={goNext}
                  className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  {currentStep >= steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

export default RoleFeatureTour

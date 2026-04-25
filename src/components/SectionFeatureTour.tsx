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

interface SectionFeatureTourProps {
  activeTab: ActiveTab
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

const SECTION_LABELS: Record<ActiveTab, string> = {
  projects: 'Proyectos',
  project_units: 'Unidades de Proyecto',
  contracts: 'Contratos',
  activities: 'Actividades',
  products: 'Productos',
  emprestito: 'Empréstito',
  procesos: 'Procesos'
}

const ROLE_ACTIONS: Record<string, string> = {
  super_admin: 'Puedes consultar, editar, administrar y auditar integralmente todos los módulos.',
  admin_general: 'Puedes operar y administrar información transversal en la mayoría de módulos.',
  admin_centro_gestor: 'Puedes gestionar datos y seguimiento de tu centro gestor asignado.',
  editor_datos: 'Puedes actualizar registros y mantener consistencia operativa en datos clave.',
  gestor_contratos: 'Tu foco operativo es contratos, procesos y trazabilidad contractual.',
  analista: 'Tu foco es análisis, comparación de tendencias y exportación de resultados.',
  visualizador: 'Tu foco es consulta guiada, entendimiento y monitoreo de avance general.',
  publico: 'Tienes acceso básico de consulta y lectura de información general.'
}

const SECTION_STEPS: Record<ActiveTab, TourStep[]> = {
  projects: [
    {
      selector: '[data-tour-id="section-projects-stats"]',
      title: 'Indicadores de Proyectos',
      description: 'Aquí encuentras una vista ejecutiva de volumen, estado general y comportamiento agregado de los proyectos. Es el punto de entrada para identificar rápidamente dónde están las mayores cargas de trabajo y qué tan saludable está el portafolio.'
    },
    {
      selector: '[data-tour-id="section-projects-table"]',
      title: 'Tabla de Proyectos',
      description: 'En esta tabla puedes explorar detalle por proyecto, aplicar filtros y revisar información territorial, financiera y de gestión. Interacción recomendada: usa búsqueda para acotar por palabras clave, combina filtros por estado/territorio y ordena columnas para priorizar casos. Lectura de datos: compara registros con mayor valor, menor avance o mayor rezago para focalizar seguimiento.'
    }
  ],
  project_units: [
    {
      selector: '[data-tour-id="section-project-units-main"]',
      title: 'Módulo de Unidades de Proyecto',
      description: 'Esta sección integra mapa, filtros y visualización de Unidades de Proyecto con sus intervenciones. Interacción recomendada: usa filtros territoriales y de estado para reducir el universo, luego selecciona una UP para profundizar. Interpretación: cruza ubicación + estado + avance para detectar concentración de rezagos o zonas con mejor desempeño.'
    },
    {
      selector: '[data-tour-id="nav-project_units"]',
      title: 'Navegación y enfoque por UP',
      description: 'Desde la navegación y los controles internos puedes cambiar de vistas, enfocar una UP específica, abrir detalles y revisar componentes asociados. Interacción: combina enfoque en mapa con tabla/listado para validar consistencia. En visualizaciones de color o simbología, interpreta intensidades/leyendas para entender rápidamente niveles de avance o criticidad.'
    }
  ],
  contracts: [
    {
      selector: '[data-tour-id="section-contracts-stats"]',
      title: 'Métricas Contractuales',
      description: 'Este bloque resume cantidades, montos, estados de pago y salud contractual general. Te permite detectar rápidamente concentración de valor, rezagos y oportunidades de seguimiento prioritario.'
    },
    {
      selector: '[data-tour-id="section-contracts-charts"]',
      title: 'Análisis Visual de Contratos',
      description: 'Aquí verás gráficos comparativos por estado, modalidad y evolución. Cómo interpretarlos: barras más altas indican mayor concentración; proporciones en pastel muestran peso relativo; series temporales permiten ver aceleración o desaceleración. Úsalos para identificar patrones operativos y comportamientos atípicos en la gestión contractual.'
    },
    {
      selector: '[data-tour-id="section-contracts-table"]',
      title: 'Detalle de Contratos',
      description: 'En la tabla puedes validar trazabilidad por contrato, revisar referencia, proveedor, valores y filtros de búsqueda fina. Interacción recomendada: aplica filtros por estado/modalidad, busca por referencia y ordena por valor o fecha para priorizar revisión. Es el componente clave para control operativo y verificación puntual de datos.'
    }
  ],
  activities: [
    {
      selector: '[data-tour-id="section-activities-stats"]',
      title: 'Estado de Actividades',
      description: 'Muestra avance global, actividades en curso, completadas y no iniciadas. Te ayuda a evaluar capacidad de ejecución y ritmo de cumplimiento en el frente operativo.'
    },
    {
      selector: '[data-tour-id="section-activities-charts"]',
      title: 'Comportamiento y Tendencias',
      description: 'Visualiza distribución y evolución de actividades para identificar cuellos de botella, frentes activos y desviaciones. Interpretación: categorías dominantes señalan concentración operativa; cambios bruscos en tendencia evidencian riesgos o mejoras. Compara periodos y segmentos para detectar dónde intervenir primero.'
    },
    {
      selector: '[data-tour-id="section-activities-table"]',
      title: 'Exploración Detallada',
      description: 'Permite revisar cada actividad con contexto de proyecto, estado y avance. Interacción: usa filtros de texto/estado para quedarte con pendientes críticos y ordena por avance o fechas para priorizar. Es ideal para seguimiento puntual y monitoreo diario de ejecución.'
    }
  ],
  products: [
    {
      selector: '[data-tour-id="section-products-stats"]',
      title: 'Resumen de Productos',
      description: 'Presenta cumplimiento, pendientes y progreso agregado de productos esperados. Facilita la lectura de resultados entregables y su alineación con metas operativas.'
    },
    {
      selector: '[data-tour-id="section-products-charts"]',
      title: 'Distribución de Entregables',
      description: 'Los gráficos permiten entender volumen, variación y comportamiento por tipo de producto. Cómo interpretarlos: revisa participación relativa por tipo, compara cumplimiento esperado vs real y observa tendencias para anticipar retrasos. Útil para medir equilibrio entre planificación y resultados reales.'
    },
    {
      selector: '[data-tour-id="section-products-table"]',
      title: 'Detalle de Productos',
      description: 'Desde esta tabla puedes inspeccionar registro por registro y profundizar en trazabilidad de cumplimiento. Interacción: filtra por tipo/estado, busca por BPIN y ordena por avance para ubicar brechas de entrega. Es la base para control técnico y cierre de pendientes.'
    }
  ],
  emprestito: [
    {
      selector: '[data-tour-id="section-emprestito-main"]',
      title: 'Gestión de Empréstito',
      description: 'Esta sección concentra reportes financieros, seguimiento de contratos y comportamiento del componente de empréstito. Interacción recomendada: filtra por contrato/centro gestor/periodo para aislar casos y luego valida consistencia entre montos, avances y reportes. Así conectas ejecución, flujo de recursos y estado operativo en una sola vista integrada.'
    },
    {
      selector: '[data-tour-id="nav-emprestito"]',
      title: 'Pestañas y Flujo de Análisis',
      description: 'Dentro del módulo puedes recorrer vistas específicas para seguimiento financiero, validación de reportes y análisis de contratos. Para interpretar gráficas financieras, observa tendencia, picos y brechas entre proyectado vs ejecutado; para controles, combina filtros y búsqueda para auditar trazabilidad de cada contrato.'
    }
  ],
  procesos: [
    {
      selector: '[data-tour-id="section-procesos-stats"]',
      title: 'Panel de Procesos',
      description: 'Resume cantidad, valor y estado de procesos, incluyendo métricas operativas de interés. Interpretación sugerida: compara proporciones adjudicado/pendiente, contrasta valor total vs número de procesos y detecta señales de concentración o rezago. Así defines dónde enfocar esfuerzos de seguimiento.'
    },
    {
      selector: '[data-tour-id="section-procesos-table"]',
      title: 'Detalle de Procesos',
      description: 'Aquí puedes consultar información puntual de cada proceso y su trazabilidad. Interacción: utiliza filtros de estado y modalidad, aplica búsqueda por términos clave y ordena por variables críticas para priorizar revisión. Es la vista recomendada para auditoría operativa y validación documental.'
    }
  ]
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

const SectionFeatureTour: React.FC<SectionFeatureTourProps> = ({ activeTab, highestRole, userId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 96, left: 24 })

  const normalizedRole = useMemo(() => normalizeRole(highestRole), [highestRole])
  const sectionTitle = SECTION_LABELS[activeTab]
  const steps = SECTION_STEPS[activeTab] || []
  const activeStep = steps[currentStep]

  const storageKey = useMemo(() => {
    const identity = userId?.trim() || 'anonymous'
    return `section-tour-seen:${identity}:${normalizedRole}:${activeTab}`
  }, [activeTab, normalizedRole, userId])

  const openTour = () => {
    setCurrentStep(0)
    setIsOpen(true)
  }

  const closeTour = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, '1')
      } catch {
        // Ignore storage failures
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

  useEffect(() => {
    if (typeof window === 'undefined' || steps.length === 0) return

    try {
      const seen = window.localStorage.getItem(storageKey)
      if (seen === '1') return

      setCurrentStep(0)
      setIsOpen(true)
    } catch {
      // Ignore storage failures
    }
  }, [storageKey, steps.length])

  useEffect(() => {
    if (!isOpen || !activeStep) return

    const target = document.querySelector(activeStep.selector) as HTMLElement | null
    if (!target) {
      setTooltipPosition({ top: 110, left: 24 })
      return
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })

    const originalOutline = target.style.outline
    const originalOutlineOffset = target.style.outlineOffset
    const originalZIndex = target.style.zIndex
    const originalPosition = target.style.position

    target.style.outline = '3px solid #2563eb'
    target.style.outlineOffset = '3px'
    if (!target.style.position) {
      target.style.position = 'relative'
    }
    target.style.zIndex = String(TOUR_Z_INDEX.target)

    const updatePosition = () => {
      const rect = target.getBoundingClientRect()
      const width = 400
      const preferredLeft = rect.left + rect.width / 2 - width / 2
      const left = Math.max(12, Math.min(preferredLeft, window.innerWidth - width - 12))
      const top = rect.bottom + 230 < window.innerHeight ? rect.bottom + 12 : Math.max(12, rect.top - 210)

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
  }, [activeStep, isOpen])

  return (
    <>
      <button
        onClick={openTour}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/35 transition-colors"
        title={`Guía de ${sectionTitle}`}
      >
        <Info className="w-4 h-4" />
        <span className="text-sm font-medium">Guía de sección</span>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 bg-black/45" style={{ zIndex: TOUR_Z_INDEX.backdrop }} onClick={closeTour} />

          <div
            className="fixed w-[calc(100vw-24px)] max-w-[400px] bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 shadow-2xl p-4"
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
                  {sectionTitle} · Rol {normalizedRole}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activeStep?.title}
                </h3>
              </div>
              <button
                onClick={closeTour}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                title="Cerrar guía"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              {activeStep?.description}
            </p>

            <div className="mb-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                {ROLE_ACTIONS[normalizedRole] || 'Puedes explorar y comprender esta sección según tus permisos actuales.'}
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

export default SectionFeatureTour

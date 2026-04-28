"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Info, X } from "lucide-react";
import { createPortal } from "react-dom";

type ManagementModule =
  | "procesos"
  | "contratos"
  | "pagos"
  | "unidades"
  | "usuarios";

type TourStep = {
  selector: string;
  title: string;
  description: string;
};

interface ManagementFeatureTourProps {
  moduleKey: ManagementModule;
  highestRole?: string | null;
  userId?: string | null;
}

const MODULE_LABELS: Record<ManagementModule, string> = {
  procesos: "Gestión de Procesos",
  contratos: "Gestión de Contratos",
  pagos: "Gestión de Pagos",
  unidades: "Gestión de Unidades de Proyecto",
  usuarios: "Gestión de Usuarios",
};

const MODULE_STEPS: Record<ManagementModule, TourStep[]> = {
  procesos: [
    {
      selector: '[data-tour-id="mgmt-procesos-header"]',
      title: "Encabezado del módulo",
      description:
        "Aquí confirmas el contexto del módulo y tienes acceso rápido para volver al dashboard principal.",
    },
    {
      selector: '[data-tour-id="mgmt-procesos-tabs"]',
      title: "Pestañas de origen",
      description:
        "Cambia entre SECOP, Tienda Virtual y Convenios para analizar el origen de los procesos.",
    },
    {
      selector: '[data-tour-id="mgmt-procesos-stats"]',
      title: "Indicadores clave",
      description:
        "Este bloque resume volumen, valores y cobertura para priorizar seguimiento de forma inmediata.",
    },
    {
      selector: '[data-tour-id="mgmt-procesos-filters"]',
      title: "Filtros y acciones",
      description:
        "Desde aquí aplicas búsqueda, controlas columnas y ejecutas acciones operativas como actualizar o crear procesos.",
    },
    {
      selector: '[data-tour-id="mgmt-procesos-table"]',
      title: "Tabla de procesos",
      description:
        "Es la vista de detalle para auditoría y trazabilidad de cada proceso contractual.",
    },
  ],
  contratos: [
    {
      selector: '[data-tour-id="mgmt-contratos-header"]',
      title: "Encabezado del módulo",
      description:
        "Muestra el alcance de gestión contractual y el acceso rápido para regresar al panel principal.",
    },
    {
      selector: '[data-tour-id="mgmt-contratos-stats"]',
      title: "KPIs de contratos",
      description:
        "Resume cantidad, ejecución financiera y distribución para detectar focos de gestión.",
    },
    {
      selector: '[data-tour-id="mgmt-contratos-filters"]',
      title: "Búsqueda y filtros",
      description:
        "Permite filtrar, ordenar y preparar la vista para revisión operativa o validación documental.",
    },
    {
      selector: '[data-tour-id="mgmt-contratos-table"]',
      title: "Detalle contractual",
      description:
        "Consulta registro por registro con trazabilidad y herramientas de control sobre los contratos.",
    },
  ],
  pagos: [
    {
      selector: '[data-tour-id="mgmt-pagos-header"]',
      title: "Encabezado de pagos",
      description:
        "Aquí validas el alcance del módulo y accedes de vuelta al dashboard general.",
    },
    {
      selector: '[data-tour-id="mgmt-pagos-tabs"]',
      title: "Vista por tipo",
      description:
        "Alterna entre RPCs y pagos para navegar entre origen de obligación y ejecución.",
    },
    {
      selector: '[data-tour-id="mgmt-pagos-stats"]',
      title: "Indicadores financieros",
      description:
        "Monitorea montos, saldos y volumen para identificar estado global de pago.",
    },
    {
      selector: '[data-tour-id="mgmt-pagos-filters"]',
      title: "Búsqueda y control",
      description:
        "Usa filtros y actualización de datos para auditar rápidamente la información de pagos.",
    },
    {
      selector: '[data-tour-id="mgmt-pagos-table"]',
      title: "Tabla operativa",
      description:
        "Revisa los registros para análisis transaccional y validación de soporte.",
    },
  ],
  unidades: [
    {
      selector: '[data-tour-id="mgmt-unidades-header"]',
      title: "Cabecera de control de calidad",
      description:
        "Identifica el módulo de calidad de datos y sus acciones rápidas.",
    },
    {
      selector: '[data-tour-id="mgmt-unidades-filters"]',
      title: "Panel de filtros",
      description:
        "Permite acotar por centro gestor, severidad, prioridad y búsqueda de texto.",
    },
    {
      selector: '[data-tour-id="mgmt-unidades-tabs"]',
      title: "Secciones analíticas",
      description:
        "Navega entre resumen, registros, historial y estadísticas sin salir del módulo.",
    },
    {
      selector: '[data-tour-id="mgmt-unidades-content"]',
      title: "Área de resultados",
      description:
        "Visualiza resultados y detalle operativo según la pestaña activa.",
    },
  ],
  usuarios: [
    {
      selector: '[data-tour-id="mgmt-usuarios-header"]',
      title: "Gobernanza de usuarios",
      description:
        "Presenta el contexto de administración de usuarios y controles principales del módulo.",
    },
    {
      selector: '[data-tour-id="mgmt-usuarios-stats"]',
      title: "Métricas de usuarios y roles",
      description:
        "Este bloque resume volumen y distribución de roles para seguimiento de gobernanza.",
    },
    {
      selector: '[data-tour-id="mgmt-usuarios-filters"]',
      title: "Filtros de consulta",
      description:
        "Filtra por texto, rol, centro gestor y estado para encontrar casos rápidamente.",
    },
    {
      selector: '[data-tour-id="mgmt-usuarios-table"]',
      title: "Listado de usuarios",
      description:
        "Desde esta tabla gestionas acciones sobre usuarios según tus permisos.",
    },
  ],
};

const TOUR_Z_INDEX = {
  backdrop: 2147483643,
  target: 2147483644,
  tooltip: 2147483645,
} as const;

const ManagementFeatureTour: React.FC<ManagementFeatureTourProps> = ({
  moduleKey,
  highestRole,
  userId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 96, left: 24 });

  const steps = MODULE_STEPS[moduleKey] || [];
  const activeStep = steps[currentStep];
  const moduleTitle = MODULE_LABELS[moduleKey];

  const storageKey = useMemo(() => {
    const identity = userId?.trim() || "anonymous";
    const role = highestRole?.trim() || "publico";
    return `management-tour-seen:${identity}:${role}:${moduleKey}`;
  }, [moduleKey, highestRole, userId]);

  const openTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const closeTour = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, "1");
      } catch {
        // Ignore storage failures
      }
    }
    setIsOpen(false);
  };

  const goNext = () => {
    if (currentStep >= steps.length - 1) {
      closeTour();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (typeof window === "undefined" || steps.length === 0) return;

    try {
      const seen = window.localStorage.getItem(storageKey);
      if (seen === "1") return;

      setCurrentStep(0);
      setIsOpen(true);
    } catch {
      // Ignore storage failures
    }
  }, [storageKey, steps.length]);

  useEffect(() => {
    if (!isOpen || !activeStep) return;

    const target = document.querySelector(
      activeStep.selector,
    ) as HTMLElement | null;
    if (!target) {
      setTooltipPosition({ top: 110, left: 24 });
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    const originalOutline = target.style.outline;
    const originalOutlineOffset = target.style.outlineOffset;
    const originalZIndex = target.style.zIndex;
    const originalPosition = target.style.position;

    target.style.outline = "3px solid #2563eb";
    target.style.outlineOffset = "3px";
    if (!target.style.position) {
      target.style.position = "relative";
    }
    target.style.zIndex = String(TOUR_Z_INDEX.target);

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      const width = 400;
      const preferredLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.max(
        12,
        Math.min(preferredLeft, window.innerWidth - width - 12),
      );
      const top =
        rect.bottom + 230 < window.innerHeight
          ? rect.bottom + 12
          : Math.max(12, rect.top - 210);

      setTooltipPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      target.style.outline = originalOutline;
      target.style.outlineOffset = originalOutlineOffset;
      target.style.zIndex = originalZIndex;
      target.style.position = originalPosition;

      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activeStep, isOpen]);

  return (
    <>
      <button
        onClick={openTour}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/35 transition-colors"
        title={`Guía de ${moduleTitle}`}
      >
        <Info className="w-4 h-4" />
        <span className="text-sm font-medium">Guía del módulo</span>
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/45"
              style={{ zIndex: TOUR_Z_INDEX.backdrop }}
              onClick={closeTour}
            />

            <div
              className="fixed w-[calc(100vw-24px)] max-w-[400px] bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 shadow-2xl p-4"
              style={{
                zIndex: TOUR_Z_INDEX.tooltip,
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                boxShadow:
                  "0 24px 64px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(37, 99, 235, 0.25)",
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {moduleTitle}
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

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Paso {Math.min(currentStep + 1, steps.length)} de{" "}
                  {steps.length}
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
                    {currentStep >= steps.length - 1
                      ? "Finalizar"
                      : "Siguiente"}
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
};

export default ManagementFeatureTour;

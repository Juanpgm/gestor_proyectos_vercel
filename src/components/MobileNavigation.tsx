"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu } from "lucide-react";
import {
  CATEGORIES,
  ANIMATIONS,
  TYPOGRAPHY,
  CSS_UTILS,
} from "@/lib/design-system";
import { cn } from "@/lib/cn";

type ActiveTab =
  | "projects"
  | "project_units"
  | "contracts"
  | "activities"
  | "products"
  | "emprestito"
  | "procesos";

interface TabConfig {
  id: ActiveTab;
  label: string;
  icon: any;
  category: ActiveTab;
  shortLabel: string;
  disabled?: boolean;
}

interface MobileNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const tabs: TabConfig[] = [
    {
      id: "projects" as const,
      label: CATEGORIES.projects.name,
      icon: CATEGORIES.projects.icon,
      category: "projects" as const,
      shortLabel: "Proyectos",
    },
    {
      id: "project_units" as const,
      label: CATEGORIES["unidades-proyecto"].name,
      icon: CATEGORIES["unidades-proyecto"].icon,
      category: "project_units" as const,
      shortLabel: "Unidades",
    },
    {
      id: "activities" as const,
      label: CATEGORIES.activities.name,
      icon: CATEGORIES.activities.icon,
      category: "activities" as const,
      shortLabel: "Actividades",
    },
    {
      id: "products" as const,
      label: CATEGORIES.products.name,
      icon: CATEGORIES.products.icon,
      category: "products" as const,
      shortLabel: "Productos",
    },
    {
      id: "emprestito" as const,
      label: CATEGORIES.emprestito.name,
      icon: CATEGORIES.emprestito.icon,
      category: "emprestito" as const,
      shortLabel: "Empréstito",
    },
    {
      id: "procesos" as const,
      label: CATEGORIES.procesos.name,
      icon: CATEGORIES.procesos.icon,
      category: "procesos" as const,
      shortLabel: "Procesos",
    },
    {
      id: "contracts" as const,
      label: CATEGORIES.contracts.name,
      icon: CATEGORIES.contracts.icon,
      category: "contracts" as const,
      shortLabel: "Contratos",
    },
  ];

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab);
  const categoryConfig = activeTabConfig
    ? activeTabConfig.category === "project_units"
      ? CATEGORIES["unidades-proyecto"]
      : CATEGORIES[activeTabConfig.category as keyof typeof CATEGORIES]
    : CATEGORIES.projects;

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile, visible on tablet+ */}
      <div className="hidden tablet:block">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          className={`mb-6 ${className}`}
        >
          {/* Tab bar: minimal border, no shadow, conservative radius */}
          <div className="flex flex-wrap items-center gap-0.5 bg-white dark:bg-gray-900 rounded-md p-1 border border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isDisabled = tab.disabled || false;
              const tabCategoryConfig =
                tab.category === "project_units"
                  ? CATEGORIES["unidades-proyecto"]
                  : CATEGORIES[tab.category as keyof typeof CATEGORIES];

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && onTabChange(tab.id)}
                  disabled={isDisabled}
                  data-tour-id={`nav-${tab.id}`}
                  className={cn(
                    // Base
                    "inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium",
                    "transition-colors duration-[120ms] select-none whitespace-nowrap min-h-[36px]",
                    // States
                    isDisabled
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-60"
                      : activeTab === tab.id
                        ? `${tabCategoryConfig.className.accent} ${tabCategoryConfig.className.text} ring-1 ring-inset ring-current/20`
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                  title={isDisabled ? "Disponible próximamente" : tab.label}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  <Icon size={15} strokeWidth={1.5} className="shrink-0" />
                  <span>{tab.label}</span>
                  {isDisabled && (
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wide hidden lg:inline">
                      Próx.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Mobile Navigation - Hidden on tablet+ */}
      <div className="tablet:hidden">
        {/* Mobile Header Bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          className={`mb-4 ${className}`}
        >
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
            {/* Current Tab Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn("p-1.5 rounded", categoryConfig.className.accent)}
              >
                {activeTabConfig && (
                  <activeTabConfig.icon
                    size={16}
                    strokeWidth={1.5}
                    className={categoryConfig.className.text}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                  {activeTabConfig?.shortLabel || "Dashboard"}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                  CaliTrack · Municipal
                </p>
              </div>
            </div>

            {/* Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-[120ms]"
              aria-label="Abrir navegación"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X size={16} strokeWidth={1.5} />
              ) : (
                <Menu size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </motion.div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              onClick={() => setIsOpen(false)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

              {/* Menu Content */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg w-full max-w-sm relative overflow-hidden"
                style={{ zIndex: 10000 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Secciones
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-[120ms]"
                    aria-label="Cerrar menú"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Navigation Options */}
                <div className="p-2 space-y-0.5">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isDisabled = tab.disabled || false;
                    const tabCategoryConfig =
                      tab.category === "project_units"
                        ? CATEGORIES["unidades-proyecto"]
                        : CATEGORIES[tab.category as keyof typeof CATEGORIES];
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (!isDisabled) {
                            onTabChange(tab.id);
                            setIsOpen(false);
                          }
                        }}
                        disabled={isDisabled}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors duration-[120ms] min-h-[44px]",
                          isDisabled
                            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-60"
                            : isActive
                              ? `${tabCategoryConfig.className.accent} ${tabCategoryConfig.className.text}`
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span
                          className={cn(
                            "w-7 h-7 flex items-center justify-center rounded shrink-0",
                            isActive
                              ? tabCategoryConfig.className.accent
                              : "bg-gray-100 dark:bg-gray-800",
                          )}
                        >
                          <Icon
                            size={15}
                            strokeWidth={1.5}
                            className={
                              isActive
                                ? tabCategoryConfig.className.text
                                : "text-gray-400 dark:text-gray-500"
                            }
                          />
                        </span>

                        <span className="flex-1 text-left text-sm font-medium">
                          {tab.label}
                        </span>

                        {isActive && (
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              tabCategoryConfig.className.text.replace(
                                "text-",
                                "bg-",
                              ),
                            )}
                          />
                        )}
                        {isDisabled && (
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            Próx.
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default MobileNavigation;

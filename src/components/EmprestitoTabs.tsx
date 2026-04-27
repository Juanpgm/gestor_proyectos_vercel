"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  ChevronLeft,
  FileText,
  Building2,
} from "lucide-react";
import EmprestitoTimeSeries from "@/components/EmprestitoTimeSeries";
import EmprestitoAdvancedDashboard from "@/components/EmprestitoAdvancedDashboard";
import EmprestitoFlujoCajaDashboard from "@/components/EmprestitoFlujoCajaDashboard";
import EmprestitoAnalisisProyectosBP from "@/components/EmprestitoAnalisisProyectosBP";
import EmprestitoReportesCentroGestor from "@/components/EmprestitoReportesCentroGestor";

// Tipos para las props
interface EmprestitoTabsProps {
  flujoCajaData?: any[];
  flujoCajaLoading?: boolean;
  onFilteredBpinsChange?: (bpins: number[] | undefined) => void;
  className?: string;
  onNavigateHome?: () => void;
}

// Configuracion de tabs con programacion funcional
const TAB_CONFIG = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description:
      "Dashboard avanzado con analisis por Banco y Centro Gestor usando datos reales de la API",
    component: "EmprestitoAdvancedDashboard",
  },
  {
    id: "flujo-caja",
    label: "Flujo de caja - Emprestito",
    icon: TrendingUp,
    description: "Serie de tiempo de flujo de caja mensual por banco",
    component: "EmprestitoTimeSeries",
  },
  {
    id: "analisis-bp",
    label: "Analisis detallado por Proyecto de Inversion (BP)",
    icon: FileText,
    description: "Analisis detallado de proyectos de inversion por BPIN",
    component: "EmprestitoAnalisisProyectosBP",
  },
  {
    id: "reportes-centro-gestor",
    label: "Reportes por Centro Gestor",
    icon: Building2,
    description:
      "Registro completo de reportes por Centro Gestor: cuales han reportado, cuales no, historial y filtros por fecha",
    component: "EmprestitoReportesCentroGestor",
  },
] as const;

// Componente de renderizado condicional para tabs
const TabContent: React.FC<{ activeTab: string; props: EmprestitoTabsProps }> =
  React.memo(({ activeTab, props }) => {
    switch (activeTab) {
      case "dashboard":
        return <EmprestitoAdvancedDashboard />;
      case "flujo-caja":
        return <EmprestitoTimeSeries />;
      case "analisis-bp":
        return <EmprestitoAnalisisProyectosBP />;
      case "reportes-centro-gestor":
        return <EmprestitoReportesCentroGestor />;
      default:
        return null;
    }
  });

// Componente principal optimizado con programacion funcional
const EmprestitoTabs: React.FC<EmprestitoTabsProps> = React.memo(
  ({
    flujoCajaData,
    flujoCajaLoading,
    onFilteredBpinsChange,
    className = "",
    onNavigateHome,
  }) => {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Tabs - Immediately after header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-md shadow-none border border-gray-200 dark:border-gray-700"
        >
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {TAB_CONFIG.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/10"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <TabContent
              activeTab={activeTab}
              props={{
                flujoCajaData,
                flujoCajaLoading,
                onFilteredBpinsChange,
                className,
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  },
);

// Optimizacion de memoria: nombres de display
TabContent.displayName = "TabContent";
EmprestitoTabs.displayName = "EmprestitoTabs";

export default EmprestitoTabs;

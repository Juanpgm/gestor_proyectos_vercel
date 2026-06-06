"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Building2,
  FileText,
  Target,
  Activity,
  Filter,
  Download,
  Briefcase,
  MapPin,
  Search,
  Calendar,
  LineChart,
  Eye,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  ComposedChart,
  LabelList,
} from "recharts";
import { CATEGORIES, formatNumber, CHART_COLORS } from "@/lib/design-system";
import ContratosModal from "./ContratosModal";
import { fetchWithErrorHandling, proxyFetch } from "@/utils/errorHandler";
import { fetchPagosEmprestito, PagoEmprestito } from "@/services/pagos.service";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  getCentroGestorAccessFromSession,
  filterByCentroGestor,
} from "@/utils/centroGestorAccess";
import dynamic from "next/dynamic";
import {
  useReportesContrato,
  useResumenReportes,
} from "@/hooks/useReportesContrato";
import {
  ClipboardEdit,
  History,
  Pencil,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { editarNombreResumidoProceso } from "@/services/emprestito-gestion.service";
import { useAuth } from "@/context/AuthContext";

const RegistrarReporteContratoModal = dynamic(
  () => import("./RegistrarReporteContratoModal"),
  { ssr: false },
);
const HistorialReportesContrato = dynamic(
  () => import("./HistorialReportesContrato"),
  { ssr: false },
);

// Tipos para los reportes de contratos (usar la estructura existente)
interface ReporteContratoTS extends ReporteEmprestito {
  // Extendemos ReporteEmprestito con campos adicionales que necesitamos
}

// Tipo para los datos de series de tiempo
interface TimeSeriesData {
  fecha: string;
  valor_pagado: number;
  valor_contrato: number;
  contratos_count: number;
  avance_fisico_promedio: number;
  avance_financiero_promedio: number;
  total_avance_fisico: number;
  total_avance_financiero: number;
}

// Hook para procesar datos de series de tiempo
const useTimeSeriesData = (
  reportes: ReporteEmprestito[],
  contratos: ContratoEmprestito[],
) => {
  return useMemo(() => {
    // Crear un mapa de contratos para obtener información adicional
    const contratoMap = new Map<string, ContratoEmprestito>();
    contratos.forEach((contrato) => {
      if (contrato.referencia_contrato) {
        contratoMap.set(contrato.referencia_contrato, contrato);
      }
    });

    // Agrupar por fecha
    const dateMap = new Map<string, TimeSeriesData>();

    reportes.forEach((reporte) => {
      if (!reporte.fecha_reporte) return;

      const fecha = reporte.fecha_reporte.split("T")[0]; // Obtener solo la fecha
      const contrato = contratoMap.get(reporte.referencia_contrato);

      if (!dateMap.has(fecha)) {
        dateMap.set(fecha, {
          fecha,
          valor_pagado: 0,
          valor_contrato: 0,
          contratos_count: 0,
          avance_fisico_promedio: 0,
          avance_financiero_promedio: 0,
          total_avance_fisico: 0,
          total_avance_financiero: 0,
        });
      }

      const data = dateMap.get(fecha)!;
      // Usar avance financiero como proxy del valor pagado
      const valorContrato = Number(contrato?.valor_contrato) || 0;
      data.valor_pagado +=
        valorContrato * (reporte.avance_financiero / 100) || 0;
      data.valor_contrato += valorContrato;
      data.contratos_count += 1;

      // Acumular avances PONDERADOS para calcular promedios
      data.total_avance_fisico += (reporte.avance_fisico || 0) * valorContrato;
      data.total_avance_financiero +=
        (reporte.avance_financiero || 0) * valorContrato;
    });

    // Calcular promedios PONDERADOS y convertir a array
    const result = Array.from(dateMap.values()).map((data) => ({
      ...data,
      avance_fisico_promedio:
        data.valor_contrato > 0
          ? data.total_avance_fisico / data.valor_contrato
          : 0,
      avance_financiero_promedio:
        data.valor_contrato > 0
          ? data.total_avance_financiero / data.valor_contrato
          : 0,
    }));

    return result.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );
  }, [reportes, contratos]);
};

// Componente de Series de Tiempo
const TimeSeriesChart: React.FC<{
  reportes: ReporteEmprestito[];
  contratos: ContratoEmprestito[];
}> = ({ reportes, contratos }) => {
  const [viewType, setViewType] = useState<
    "banco" | "centro_gestor" | "contrato"
  >("banco");
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Mostrar indicador de carga si no hay datos aún
  const isLoading = reportes.length === 0 && contratos.length === 0;

  const timeSeriesData = useTimeSeriesData(reportes, contratos);

  // Obtener opciones únicas para filtros basándose en los reportes y contratos
  const filterOptions = useMemo(() => {
    const options = new Set<string>();

    switch (viewType) {
      case "banco":
        // Para bancos, usar los contratos
        contratos.forEach((contrato) => {
          if (contrato.banco) options.add(contrato.banco);
        });
        break;
      case "centro_gestor":
        // Para centros gestores, usar los reportes directamente
        reportes.forEach((reporte) => {
          if (reporte.nombre_centro_gestor)
            options.add(reporte.nombre_centro_gestor);
        });
        break;
      case "contrato":
        // Para contratos, usar los reportes
        reportes.forEach((reporte) => {
          if (reporte.referencia_contrato)
            options.add(reporte.referencia_contrato);
        });
        break;
    }

    return Array.from(options).sort();
  }, [contratos, reportes, viewType]);

  // Filtrar opciones por búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return filterOptions;
    return filterOptions.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [filterOptions, searchTerm]);

  // Datos filtrados por selección
  const filteredTimeSeriesData = useMemo(() => {
    if (!selectedFilter) return timeSeriesData;

    // Filtrar reportes según el tipo de vista
    const reportesFiltrados = reportes.filter((reporte) => {
      switch (viewType) {
        case "banco":
          // Para banco, necesitamos encontrar el contrato correspondiente
          const contrato = contratos.find(
            (c) => c.referencia_contrato === reporte.referencia_contrato,
          );
          return contrato?.banco === selectedFilter;
        case "centro_gestor":
          return reporte.nombre_centro_gestor === selectedFilter;
        case "contrato":
          return reporte.referencia_contrato === selectedFilter;
        default:
          return true;
      }
    });

    // Crear un mapa de contratos para obtener información adicional
    const contratoMap = new Map<string, ContratoEmprestito>();
    contratos.forEach((contrato) => {
      if (contrato.referencia_contrato) {
        contratoMap.set(contrato.referencia_contrato, contrato);
      }
    });

    // Agrupar reportes filtrados por fecha
    const dateMap = new Map<string, TimeSeriesData>();

    reportesFiltrados.forEach((reporte) => {
      if (!reporte.fecha_reporte) return;

      const fecha = reporte.fecha_reporte.split("T")[0];
      const contrato = contratoMap.get(reporte.referencia_contrato);

      if (!dateMap.has(fecha)) {
        dateMap.set(fecha, {
          fecha,
          valor_pagado: 0,
          valor_contrato: 0,
          contratos_count: 0,
          avance_fisico_promedio: 0,
          avance_financiero_promedio: 0,
          total_avance_fisico: 0,
          total_avance_financiero: 0,
        });
      }

      const data = dateMap.get(fecha)!;
      const valorContrato = Number(contrato?.valor_contrato) || 0;
      data.valor_pagado +=
        valorContrato * (reporte.avance_financiero / 100) || 0;
      data.valor_contrato += valorContrato;
      data.contratos_count += 1;

      // Acumular avances PONDERADOS para calcular promedios
      data.total_avance_fisico += (reporte.avance_fisico || 0) * valorContrato;
      data.total_avance_financiero +=
        (reporte.avance_financiero || 0) * valorContrato;
    });

    // Calcular promedios PONDERADOS y devolver ordenado
    const filteredResult = Array.from(dateMap.values()).map((data) => ({
      ...data,
      avance_fisico_promedio:
        data.valor_contrato > 0
          ? data.total_avance_fisico / data.valor_contrato
          : 0,
      avance_financiero_promedio:
        data.valor_contrato > 0
          ? data.total_avance_financiero / data.valor_contrato
          : 0,
    }));

    return filteredResult.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );
  }, [reportes, contratos, viewType, selectedFilter, timeSeriesData]);

  // Calcular valores máximos para escalas basado en los totales
  const maxValue = useMemo(() => {
    return Math.max(
      100, // Mínimo 100 para que se vea bien
      ...filteredTimeSeriesData.map((d) =>
        Math.max(d.total_avance_fisico, d.total_avance_financiero),
      ),
    );
  }, [filteredTimeSeriesData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <LineChart className="w-6 h-6 text-teal-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Series de Tiempo - Avance de Contratos (%)
        </h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
            Cargando datos...
          </div>
        )}
      </div>

      {/* Controles de filtrado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Selector de tipo de vista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ver por:
          </label>
          <select
            value={viewType}
            onChange={(e) => {
              setViewType(
                e.target.value as "banco" | "centro_gestor" | "contrato",
              );
              setSelectedFilter("");
              setSearchTerm("");
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="banco">Banco</option>
            <option value="centro_gestor">Centro Gestor</option>
            <option value="contrato">Contrato Específico</option>
          </select>
        </div>

        {/* Barra de búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Buscar{" "}
            {viewType === "centro_gestor"
              ? "Centro Gestor"
              : viewType === "banco"
                ? "Banco"
                : "Contrato"}
            :
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar ${viewType === "centro_gestor" ? "centro gestor" : viewType}...`}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Selector específico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar:
          </label>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos</option>
            {filteredOptions.slice(0, 50).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gráfico de líneas */}
      <div className="h-80 relative">
        {filteredTimeSeriesData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                No hay datos disponibles
              </h4>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {selectedFilter
                  ? `No se encontraron reportes para ${selectedFilter}`
                  : "No hay reportes de contratos para mostrar"}
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <svg className="w-full h-full">
              {/* Líneas de referencia */}
              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                <g key={fraction}>
                  <line
                    x1="80"
                    y1={320 - fraction * 240}
                    x2="100%"
                    y2={320 - fraction * 240}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="text-gray-200 dark:text-gray-600"
                  />
                  <text
                    x="10"
                    y={325 - fraction * 240}
                    className="text-xs fill-current text-gray-500 dark:text-gray-400"
                    textAnchor="start"
                  >
                    {(maxValue * fraction).toFixed(0)}%
                  </text>
                </g>
              ))}

              {/* Líneas de datos */}
              {filteredTimeSeriesData.length > 1 && (
                <>
                  {/* Línea de avance financiero total */}
                  <path
                    d={filteredTimeSeriesData
                      .map((point, index) => {
                        const x =
                          80 +
                          (index / (filteredTimeSeriesData.length - 1)) *
                            (100 - 80);
                        const y =
                          320 -
                          (point.total_avance_financiero / maxValue) * 240;
                        return `${index === 0 ? "M" : "L"} ${x}% ${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />

                  {/* Línea de avance físico total */}
                  <path
                    d={filteredTimeSeriesData
                      .map((point, index) => {
                        const x =
                          80 +
                          (index / (filteredTimeSeriesData.length - 1)) *
                            (100 - 80);
                        const y =
                          320 - (point.total_avance_fisico / maxValue) * 240;
                        return `${index === 0 ? "M" : "L"} ${x}% ${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />

                  {/* Puntos de datos */}
                  {filteredTimeSeriesData.map((point, index) => {
                    const x =
                      80 +
                      (index / (filteredTimeSeriesData.length - 1)) *
                        (100 - 80);
                    const yFinanciero =
                      320 - (point.total_avance_financiero / maxValue) * 240;
                    const yFisico =
                      320 - (point.total_avance_fisico / maxValue) * 240;

                    return (
                      <g key={point.fecha}>
                        <circle
                          cx={`${x}%`}
                          cy={yFinanciero}
                          r="4"
                          fill="#3b82f6"
                          className="hover:r-6 cursor-pointer"
                        >
                          <title>{`Total Avance Financiero: ${point.total_avance_financiero.toFixed(1)}%`}</title>
                        </circle>
                        <circle
                          cx={`${x}%`}
                          cy={yFisico}
                          r="4"
                          fill="#10b981"
                          className="hover:r-6 cursor-pointer"
                        >
                          <title>{`Total Avance Físico: ${point.total_avance_fisico.toFixed(1)}%`}</title>
                        </circle>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>
        )}

        {/* Etiquetas de fechas */}
        {filteredTimeSeriesData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-20">
            {filteredTimeSeriesData.slice(0, 10).map((point, index) => (
              <div
                key={point.fecha}
                className="text-xs text-gray-500 dark:text-gray-400 transform -rotate-45"
              >
                {new Date(point.fecha).toLocaleDateString("es-CO", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Avance Financiero
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Avance Físico
          </span>
        </div>
      </div>

      {/* Resumen de datos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Puntos de Datos
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredTimeSeriesData.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Avance Financiero
          </p>
          <p className="text-lg font-semibold text-blue-600">
            {filteredTimeSeriesData
              .reduce((sum, d) => sum + d.total_avance_financiero, 0)
              .toFixed(1)}
            %
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Avance Físico
          </p>
          <p className="text-lg font-semibold text-green-600">
            {filteredTimeSeriesData
              .reduce((sum, d) => sum + d.total_avance_fisico, 0)
              .toFixed(1)}
            %
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Contratos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredTimeSeriesData.reduce(
              (sum, d) => sum + d.contratos_count,
              0,
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Helper para obtener el número de semana ISO
const getISOWeek = (date: Date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// Helper para obtener la fecha de un día específico de una semana ISO
const getDateFromWeek = (year: number, week: number, day: number = 7) => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  ISOweekStart.setDate(ISOweekStart.getDate() + day - 1);
  return ISOweekStart;
};

// Componente para mostrar variación entre semanas
const WeeklyVariationPanel: React.FC<{
  reportes: ReporteEmprestito[];
  contratos: ContratoEmprestito[];
}> = ({ reportes, contratos }) => {
  const variationData = useMemo(() => {
    if (
      !reportes ||
      reportes.length === 0 ||
      !contratos ||
      contratos.length === 0
    )
      return [];

    const contratoMap = new Map(
      contratos.map((c) => [
        c.referencia_contrato,
        Number(c.valor_contrato) || 0,
      ]),
    );

    const weeksSet = new Set<string>();
    reportes.forEach((reporte) => {
      if (!reporte.fecha_reporte) return;
      const fecha = new Date(reporte.fecha_reporte);
      if (isNaN(fecha.getTime())) return;

      const week = getISOWeek(fecha);
      const year = fecha.getFullYear();
      const weekKey = `${year}-W${String(week).padStart(2, "0")}`;
      weeksSet.add(weekKey);
    });

    const sortedWeeks = Array.from(weeksSet).sort((a, b) => {
      const [yearA, weekA] = a.split("-W").map(Number);
      const [yearB, weekB] = b.split("-W").map(Number);
      if (yearA !== yearB) return yearA - yearB;
      return weekA - weekB;
    });

    const timeSeriesData = sortedWeeks.map((weekKey) => {
      const [year, week] = weekKey.split("-W").map(Number);

      // Calcular la fecha de fin de esta semana
      const weekEndDate = getDateFromWeek(year, week, 7); // Domingo de esa semana

      const lastReportByContract: { [contrato: string]: ReporteEmprestito } =
        {};
      let reportesCount = 0;

      // Contar todos los registros (contratos, órdenes, convenios) que ya estaban guardados hasta esta semana
      let contratosActivosCount = 0;
      contratos.forEach((contrato) => {
        // Buscar fecha en múltiples campos: fecha_guardado (SECOP), fecha_creacion (TVEC/Convenios), fecha_inicio_contrato
        const fechaGuardado =
          (contrato as any).fecha_guardado ||
          (contrato as any).fecha_creacion ||
          (contrato as any).fecha_inicio_contrato;
        if (fechaGuardado) {
          const fechaGuardadoDate = new Date(fechaGuardado);
          if (
            !isNaN(fechaGuardadoDate.getTime()) &&
            fechaGuardadoDate <= weekEndDate
          ) {
            contratosActivosCount++;
          }
        }
      });

      reportes.forEach((reporte) => {
        if (!reporte.fecha_reporte) return;
        const fecha = new Date(reporte.fecha_reporte);
        if (isNaN(fecha.getTime())) return;

        const reportWeek = getISOWeek(fecha);
        const reportYear = fecha.getFullYear();

        if (reportYear === year && reportWeek === week) {
          reportesCount++;
          const contratoKey = reporte.referencia_contrato;

          if (!lastReportByContract[contratoKey]) {
            lastReportByContract[contratoKey] = reporte;
          } else {
            const existingDate = new Date(
              lastReportByContract[contratoKey].fecha_reporte,
            );
            if (fecha > existingDate) {
              lastReportByContract[contratoKey] = reporte;
            }
          }
        }
      });

      let totalFisicoPonderado = 0;
      let totalValorContratos = 0;

      Object.entries(lastReportByContract).forEach(([contratoKey, reporte]) => {
        const avanceFisico = reporte.avance_fisico || 0;
        const valorContrato = contratoMap.get(contratoKey) || 0;

        if (valorContrato > 0) {
          totalFisicoPonderado += avanceFisico * valorContrato;
          totalValorContratos += valorContrato;
        }
      });

      const avanceFisicoPromedio =
        totalValorContratos > 0
          ? totalFisicoPonderado / totalValorContratos
          : 0;

      return {
        periodo: weekKey,
        "Avance Físico": avanceFisicoPromedio,
        reportesCount,
        contratosCount: contratosActivosCount, // Contratos activos acumulados hasta esta semana
      };
    });

    // Calcular variaciones
    return timeSeriesData
      .slice(1)
      .map((item, index) => {
        const anterior = timeSeriesData[index]["Avance Físico"];
        const actual = item["Avance Físico"];
        const variacion = actual - anterior;

        // Calcular rendimiento: [(Valor final - Valor inicial) / Valor inicial] x 100%
        const rendimiento =
          anterior !== 0 ? ((actual - anterior) / anterior) * 100 : 0;

        return {
          periodo: item.periodo,
          variacion,
          rendimiento,
          valorInicial: anterior,
          valorFinal: actual,
          isPositivo: variacion >= 0,
          reportesCount: item.reportesCount,
          contratosCount: item.contratosCount,
        };
      })
      .reverse(); // Invertir para mostrar la mas reciente primero
  }, [reportes, contratos]);

  return (
    <div className="lg:col-span-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 flex flex-col"
        style={{ height: "500px" }}
      >
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Variacion Semanal
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Puntos porcentuales
        </p>

        <div className="overflow-y-auto space-y-1.5 flex-1">
          {variationData.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
              Sin datos de variacion
            </div>
          ) : (
            variationData.map((item) => (
              <div
                key={item.periodo}
                className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 dark:text-gray-300 text-xs mb-0.5">
                      {item.periodo}
                    </div>
                    <div className="flex gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>{item.reportesCount} rep.</span>
                      <span>•</span>
                      <span>{item.contratosCount} contr.</span>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-sm ${item.isPositivo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {item.isPositivo ? "↑" : "↓"}{" "}
                    {Math.abs(item.variacion).toFixed(1)}pp
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.valorInicial.toFixed(1)}% →{" "}
                    {item.valorFinal.toFixed(1)}%
                  </span>
                  <span
                    className={`font-medium ${item.isPositivo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    Rend: {item.isPositivo ? "+" : ""}
                    {item.rendimiento.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Componente para grafica de evolucion temporal
const WeeklyProgressChart: React.FC<{
  data: ReporteEmprestito[];
  contratos: ContratoEmprestito[];
  maxAvance: number;
}> = ({ data, contratos, maxAvance }) => {
  // Para cada semana, calcular el promedio ponderado por valor de contrato
  const timeSeriesData = useMemo(() => {
    console.log("ðŸ“Š WeeklyProgressChart - Datos recibidos:", {
      reportes: data?.length || 0,
      contratos: contratos?.length || 0,
      muestraReportes: data?.slice(0, 2),
    });

    if (!data || data.length === 0 || !contratos || contratos.length === 0) {
      console.log(
        "âš ï¸ WeeklyProgressChart - Sin datos suficientes para mostrar",
      );
      return [];
    }

    // Crear mapa de contratos para acceso rapido
    const contratoMap = new Map(
      contratos.map((c) => [
        c.referencia_contrato,
        Number(c.valor_contrato) || 0,
      ]),
    );

    // Obtener todas las semanas unicas y ordenarlas
    const weeksSet = new Set<string>();
    data.forEach((reporte) => {
      if (!reporte.fecha_reporte) return;
      const fecha = new Date(reporte.fecha_reporte);
      if (isNaN(fecha.getTime())) return;

      const week = getISOWeek(fecha);
      const year = fecha.getFullYear();
      const weekKey = `${year}-W${String(week).padStart(2, "0")}`;
      weeksSet.add(weekKey);
    });

    const sortedWeeks = Array.from(weeksSet).sort((a, b) => {
      const [yearA, weekA] = a.split("-W").map(Number);
      const [yearB, weekB] = b.split("-W").map(Number);
      if (yearA !== yearB) return yearA - yearB;
      return weekA - weekB;
    });

    // Para cada semana, calcular el promedio PONDERADO del ultimo reporte DE ESA SEMANA de cada contrato
    return sortedWeeks.map((weekKey, weekIndex) => {
      const [year, week] = weekKey.split("-W").map(Number);
      const isLastWeek = weekIndex === sortedWeeks.length - 1;

      // Calcular la fecha de fin de esta semana
      const weekEndDate = getDateFromWeek(year, week, 7); // Domingo de esa semana

      // Contar todos los registros (contratos, ordenes, convenios) que ya estaban guardados hasta esta semana
      let contratosActivosCount = 0;
      contratos.forEach((contrato) => {
        // Buscar fecha en multiples campos: fecha_guardado (SECOP), fecha_creacion (TVEC/Convenios), fecha_inicio_contrato
        const fechaGuardado =
          (contrato as any).fecha_guardado ||
          (contrato as any).fecha_creacion ||
          (contrato as any).fecha_inicio_contrato;
        if (fechaGuardado) {
          const fechaGuardadoDate = new Date(fechaGuardado);
          if (
            !isNaN(fechaGuardadoDate.getTime()) &&
            fechaGuardadoDate <= weekEndDate
          ) {
            contratosActivosCount++;
          }
        }
      });

      // Obtener el ultimo reporte de cada contrato EN esta semana especifica
      // EXCEPTO en la ultima semana, donde usamos el ultimo reporte absoluto de cada contrato
      const lastReportByContract: { [contrato: string]: ReporteEmprestito } =
        {};
      let reportesCount = 0; // Contador de reportes en esta semana

      data.forEach((reporte) => {
        if (!reporte.fecha_reporte) return;
        const fecha = new Date(reporte.fecha_reporte);
        if (isNaN(fecha.getTime())) return;

        const reportWeek = getISOWeek(fecha);
        const reportYear = fecha.getFullYear();

        const contratoKey = reporte.referencia_contrato;

        if (isLastWeek) {
          // En la ultima semana, incluir el ultimo reporte de cada contrato, sin importar la semana
          if (!lastReportByContract[contratoKey]) {
            lastReportByContract[contratoKey] = reporte;
            reportesCount++;
          } else {
            const existingDate = new Date(
              lastReportByContract[contratoKey].fecha_reporte,
            );
            if (fecha > existingDate) {
              lastReportByContract[contratoKey] = reporte;
            }
          }
        } else {
          // En semanas anteriores, solo considerar reportes DE esa semana especifica
          if (reportYear === year && reportWeek === week) {
            reportesCount++; // Contar todos los reportes de esta semana
            if (!lastReportByContract[contratoKey]) {
              lastReportByContract[contratoKey] = reporte;
            } else {
              const existingDate = new Date(
                lastReportByContract[contratoKey].fecha_reporte,
              );
              if (fecha > existingDate) {
                lastReportByContract[contratoKey] = reporte;
              }
            }
          }
        }
      });

      // Calcular promedio PONDERADO del ultimo reporte de cada contrato en esta semana
      let totalFisicoPonderado = 0;
      let totalFinancieroPonderado = 0;
      let totalValorContratos = 0;

      Object.entries(lastReportByContract).forEach(([contratoKey, reporte]) => {
        const avanceFisico = reporte.avance_fisico || 0;
        const avanceFinanciero = reporte.avance_financiero || 0;
        const valorContrato = contratoMap.get(contratoKey) || 0;

        if (valorContrato > 0) {
          totalFisicoPonderado += avanceFisico * valorContrato;
          totalFinancieroPonderado += avanceFinanciero * valorContrato;
          totalValorContratos += valorContrato;
        }
      });

      const avanceFisicoPromedio =
        totalValorContratos > 0
          ? totalFisicoPonderado / totalValorContratos
          : 0;
      const avanceFinancieroPromedio =
        totalValorContratos > 0
          ? totalFinancieroPonderado / totalValorContratos
          : 0;

      return {
        periodo: weekKey,
        "Avance Fisico": avanceFisicoPromedio,
        "Avance Financiero": avanceFinancieroPromedio,
        reportesCount: reportesCount, // Contador de reportes
        contratosCount: contratosActivosCount, // Contratos activos acumulados hasta esta semana
      };
    });
  }, [data, contratos]);

  const formatYAxis = (value: number) => `${value.toFixed(0)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col"
      style={{ height: "500px" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Evolucion Temporal
        </h4>
      </div>

      <div className="overflow-x-auto flex-1">
        <div style={{ height: "100%", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeSeriesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="periodo"
                tick={{ fontSize: 10 }}
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#6b7280"
                tickFormatter={formatYAxis}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}%`,
                  name,
                ]}
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const reportes = payload[0]?.payload?.reportesCount || 0;
                    const contratos = payload[0]?.payload?.contratosCount || 0;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          {label}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Reportes:{" "}
                          <span className="font-bold text-blue-600">
                            {reportes}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Contratos:{" "}
                          <span className="font-bold text-purple-600">
                            {contratos}
                          </span>
                        </p>
                        {payload.map((entry: any, index: number) => (
                          <p
                            key={index}
                            className="text-xs"
                            style={{ color: entry.color }}
                          >
                            {entry.name}:{" "}
                            <span className="font-bold">
                              {entry.value.toFixed(2)}%
                            </span>
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
                labelStyle={{ fontSize: "11px" }}
                contentStyle={{
                  fontSize: "11px",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />

              <Line
                type="monotone"
                dataKey="Avance Fisico"
                stroke="#10b981"
                strokeWidth={3}
                strokeDasharray="0"
                dot={{ r: 4, fill: "#10b981" }}
                name="Avance Fisico"
              />
              <Line
                type="monotone"
                dataKey="Avance Financiero"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{
                  r: 3,
                  fill: "#3b82f6",
                  stroke: "#ffffff",
                  strokeWidth: 1,
                }}
                name="Avance Financiero"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

// Componente Fusionado: Torta + Tabla de Organismos
const OrganismosWithPieChart: React.FC<{ data: AnalysisByCentroGestor[] }> = ({
  data,
}) => {
  const COLORS = [
    "#6B7280",
    "#EF4444",
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#F97316",
  ];

  // Calcular el total con TODOS los datos
  const totalGeneral = data.reduce(
    (sum, item) => sum + item.valorAdjudicado,
    0,
  );

  // Preparar datos con colores y porcentajes
  const tableData = data
    .filter((item) => item.valorAdjudicado > 0)
    .map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length],
      percent: (item.valorAdjudicado / totalGeneral) * 100,
    }));

  // Datos para la torta (solo top 5)
  const chartData = tableData.slice(0, 5);

  if (tableData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center justify-center"
        style={{ minHeight: "350px" }}
      >
        <p className="text-gray-500 dark:text-gray-400">
          No hay datos disponibles
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-teal-600" />
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Total Adjudicado por Organismo
        </h4>
      </div>

      {/* Layout horizontal: torta a la izquierda, tabla a la derecha */}
      <div className="flex items-start gap-6">
        {/* Gráfica de torta - con porcentajes internos */}
        <div style={{ height: "400px", width: "400px", flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <defs>
                {chartData.map((entry, index) => (
                  <linearGradient
                    key={`gradient-${index}`}
                    id={`gradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={entry.color}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor={entry.color}
                      stopOpacity={0.7}
                    />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={150}
                paddingAngle={3}
                dataKey="valorAdjudicado"
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  payload,
                }: any) => {
                  const RADIAN = Math.PI / 180;
                  const radius =
                    innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="13"
                      fontWeight="700"
                    >
                      {`${payload.percent.toFixed(1)}%`}
                    </text>
                  );
                }}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${index})`}
                    stroke={entry.color}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-none border-2 border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          {data.centroGestor}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Porcentaje:</span>{" "}
                            <span className="font-bold text-gray-900 dark:text-white">
                              {data.percent.toFixed(1)}%
                            </span>
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Valor:</span>{" "}
                            <span className="font-bold text-gray-900 dark:text-white">
                              {formatNumber(data.valorAdjudicado, "currency")}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla con todos los datos */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  Organismo
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Contratos
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                  %
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                  Adjudicado
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-green-700 dark:text-green-300">
                  Pagos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tableData.map((item, index) => (
                <motion.tr
                  key={item.centroGestor}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-3 py-2 text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{index + 1}.</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white text-xs">
                    {item.centroGestor}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900 dark:text-white">
                    {item.totalContratos}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">
                    {item.percent.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white text-xs">
                    {formatNumber(item.valorAdjudicado, "currency")}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400 text-xs">
                    {formatNumber(item.valorPagado, "currency")}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// Componente GaugeChart
const GaugeChart: React.FC<{
  title: string;
  description?: string;
  percentage: number;
  value?: number;
  total?: number;
  color: string;
  icon: React.ReactNode;
  showMonetaryValues?: boolean;
}> = ({
  title,
  description,
  percentage,
  value = 0,
  total = 0,
  color,
  icon,
  showMonetaryValues = true,
}) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h4>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 mb-3">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={color}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ strokeDasharray }}
            />
          </svg>

          {/* Percentage in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {percentage.toFixed(1)}%
            </motion.span>
          </div>
        </div>

        {/* Descriptive legend */}
        {description && (
          <div className="text-center mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
        )}

        {showMonetaryValues && (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {formatNumber(value, "currency")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              de {formatNumber(total, "currency")}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Componente de Resumen Ejecutivo
const ResumenEjecutivo: React.FC<{
  analysisByBank: AnalysisByBank[];
  analysisByCentroGestor: AnalysisByCentroGestor[];
  totalContratos: number;
  valorTotalAsignado: number;
  valorTotalAsignadoBanco: number;
  yearlySummary: YearlySummary;
}> = ({
  analysisByBank,
  analysisByCentroGestor,
  totalContratos,
  valorTotalAsignado,
  valorTotalAsignadoBanco,
  yearlySummary,
}) => {
  const topBanco = analysisByBank[0];
  const topCentroGestor = analysisByCentroGestor[0];

  const [selectedYear, setSelectedYear] = useState<string>("Consolidado");

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value);
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Resumen Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Resumen Ejecutivo
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="Consolidado">Consolidado</option>
            {Object.keys(yearlySummary)
              .sort((a, b) => parseInt(b) - parseInt(a))
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Contratos Totales
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatNumber(totalContratos)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              Valor Total
            </p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatNumber(valorTotalAsignado, "currency")}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Bancos Activos
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {analysisByBank.length}
            </p>
          </div>
          <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <p className="text-sm text-teal-600 dark:text-teal-400">
              Centros Gestores
            </p>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
              {analysisByCentroGestor.length}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Distribución por Bancos y Centros Gestores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Distribución por Bancos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Distribución por Banco
          </h4>
          <div className="space-y-3">
            {analysisByBank.slice(0, 5).map((bank, index) => (
              <div
                key={bank.banco}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-gray-900 dark:text-white truncate"
                    title={bank.banco}
                  >
                    {bank.banco}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(bank.totalContratos)} contratos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatNumber(bank.valorAdjudicado, "currency")}
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${(bank.valorAdjudicado / Math.max(...analysisByBank.map((b) => b.valorAdjudicado))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por Centro Gestor */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600" />
            Distribución por Centro Gestor
          </h4>
          <div className="space-y-3">
            {analysisByCentroGestor.slice(0, 5).map((centro, index) => (
              <div
                key={centro.centroGestor}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-gray-900 dark:text-white break-words leading-tight"
                    title={centro.centroGestor}
                  >
                    {centro.centroGestor}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(centro.totalContratos)} contratos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    {formatNumber(centro.valorAdjudicado, "currency")}
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-cyan-600 h-2 rounded-full"
                      style={{
                        width: `${(centro.valorAdjudicado / Math.max(...analysisByCentroGestor.map((c) => c.valorAdjudicado))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Interfaces para tipado
interface ContratoEmprestito {
  id: string;
  referencia_contrato: string;
  nombre_resumido_proceso: string;
  descripcion_proceso: string;
  nombre_centro_gestor: string;
  entidad_contratante: string;
  banco: string;
  estado_contrato: string;
  valor_contrato: number;
  valor_del_contrato?: number;
  valor_pagado: string;
  fecha_inicio_contrato?: string;
  fecha_fin_contrato?: string;
  fecha_firma_contrato?: string;
  sector: string;
  tipo_contrato: string;
  objeto_contrato: string;
  proceso_contractual: string;
  bpin?: number;
  bp?: string;
  representante_legal?: string;
  ordenador_gasto?: string;
  supervisor?: string;
  modalidad_contratacion?: string;
  nombre_contratista?: string;
  nit_entidad?: string;
  nit_contratista?: string;
  urlproceso?: {
    url: string;
  };
}

interface ReporteEmprestito {
  id: string;
  referencia_contrato: string;
  avance_fisico: number;
  avance_financiero: number;
  fecha_reporte: string;
  observaciones: string;
  nombre_centro_gestor: string;
  nombre_centro_gestor_source: string;
  estado_reporte: string;
  alertas: {
    descripcion: string;
    es_alerta: boolean;
    tipos: string[];
  };
  archivos_evidencia?: Array<{
    url: string;
    drive_id: string;
    name: string;
    type: string;
    size: number;
    status: string;
    download_url: string;
  }>;
  url_carpeta_drive?: string;
}

interface BancoEmprestito {
  nombre_banco: string;
  nombre_centro_gestor?: string;
  valor_asignado_banco?: number;
  id: string;
}

interface AnalysisByBank {
  banco: string;
  totalContratos: number;
  valorAsignadoBanco: number; // Desde /asignaciones-emprestito-banco-centro-gestor (suma de monto_programado_banco por banco)
  valorPagosProyectados: number; // Desde /asignaciones-emprestito-banco-centro-gestor (suma de monto_programado_pago por banco)
  valorAsignadoProyecciones: number; // Valor de proyecciones (actualmente no usado, mantener para compatibilidad)
  valorAdjudicado: number; // Del endpoint contratos_emprestito_all (valor_contrato)
  valorEjecutado: number; // Calculado desde reportes (avance_financiero * valor_contrato)
  valorPagado: number; // Calculado desde pagos (suma de pagos por contrato)
  porcentajeEjecucion: number;
  promedioAvance: number;
}

interface AnalysisByCentroGestor {
  centroGestor: string;
  totalContratos: number;
  valorAsignadoBanco: number; // Desde /asignaciones-emprestito-banco-centro-gestor (suma de monto_programado_banco)
  valorPagosProyectados: number; // Desde /asignaciones-emprestito-banco-centro-gestor (suma de monto_programado_pago)
  valorAsignadoProyecciones: number; // Desde /api/emprestito/leer-tabla-proyecciones (suma de valor_proyectado)
  valorAdjudicado: number; // Del endpoint contratos_emprestito_all
  valorEjecutado: number; // Calculado desde reportes (avance_financiero * valor_contrato)
  valorPagado: number; // Calculado desde pagos (suma de pagos por contrato)
  sectores: string[];
  estadosContratos: Record<string, number>;
  bancos: Array<{
    // Detalle de bancos para este centro gestor
    nombre: string;
    valorAsignado: number; // Suma de valores adjudicados de contratos por banco
    valorAdjudicado: number;
    valorEjecutado: number;
    valorPagado: number; // Suma de pagos por banco
    contratos: number;
  }>;
}

interface AnalysisByCentroGestorV2 {
  centroGestor: string;
  valorProgramadoPago: number;
  valorProgramadoAdjudicacion: number;
  totalAsignado: number;
  bancos: Array<{ nombre: string; valor: number }>;
}

interface AnalysisByYear {
  year: number;
  valorProgramadoPago: number;
  valorProgramadoAdjudicacion: number;
  valorPagado: number;
  totalAsignado: number;
  centrosGestores: Array<{
    nombre: string;
    valorProgramadoPago: number;
    valorProgramadoAdjudicacion: number;
    valorPagado: number;
    totalAsignado: number;
  }>;
  bancos: Array<{
    nombre: string;
    valorProgramadoPago: number;
    valorProgramadoAdjudicacion: number;
    valorPagado: number;
    totalAsignado: number;
  }>;
}

interface YearlySummary {
  [year: string]: {
    totalContratos: number;
    valorTotalAsignado: number;
    valorTotalAsignadoBanco: number;
    valorTotalPagosProyectados: number;
    valorTotalEjecutado: number;
    valorTotalPagado: number;
    valorTotalFisico: number;
    porcentajeFisicoPromedio: number;
    porcentajeFinancieroPromedio: number;
  };
}

// Hook para datos de seguimiento
const useSeguimientoData = () => {
  const [seguimiento, setSeguimiento] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loadingSeguimiento, setLoadingSeguimiento] = useState(false);

  useEffect(() => {
    const fetchSeguimiento = async () => {
      setLoadingSeguimiento(true);
      try {
        // Endpoint para reportes de contratos - usar el endpoint directo
        const reportesData = await fetchWithErrorHandling<any>(
          "/api/proxy/reportes_contratos/",
          {},
          120000, // 2 minutos de timeout
        );
        const centroGestorAccess = getCentroGestorAccessFromSession();
        const seguimientoFiltrado = filterByCentroGestor(
          reportesData.data || [],
          centroGestorAccess,
          ["nombre_centro_gestor", "centro_gestor", "responsable"],
        );
        setSeguimiento(seguimientoFiltrado);
        setLastUpdate(new Date().toISOString());
      } catch (error: any) {
        console.warn("âš ï¸ Error fetching seguimiento data:", error);
        console.warn("âš ï¸ Detalles del error:", {
          message: error?.message,
          type: error?.type,
          code: error?.code,
        });
        setSeguimiento([]); // Set empty array on error
      } finally {
        setLoadingSeguimiento(false);
      }
    };

    fetchSeguimiento();
  }, []);

  return { seguimiento, lastUpdate, loadingSeguimiento };
};

// Hook avanzado para obtener y procesar datos reales de la API
const useEmprestitoRealData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contratos, setContratos] = useState<ContratoEmprestito[]>([]);
  const [reportes, setReportes] = useState<ReporteEmprestito[]>([]);
  const [bancosEmprestito, setBancosEmprestito] = useState<BancoEmprestito[]>(
    [],
  );
  const [emprestitoBancos, setEmprestitoBancos] = useState<any[]>([]); // Para /emprestito_bancos_all
  const [pagos, setPagos] = useState<PagoEmprestito[]>([]);
  const [proyecciones, setProyecciones] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]); // Para /asignaciones-emprestito-banco-centro-gestor
  const [filteredData, setFilteredData] = useState<ContratoEmprestito[]>([]);
  const [yearlySummary, setYearlySummary] = useState<YearlySummary>({});

  // Estados para el modal de contratos
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<any>(null);

  // Estado para filtros
  const [filters, setFilters] = useState({
    banco: "",
    centroGestor: "",
    estado: "",
    sector: "",
    ano: "",
    bp: "",
    fechaInicio: "",
    fechaFin: "",
  });

  // Función para calcular el resumen anual
  const calculateYearlySummary = useCallback(
    (
      allContratos: ContratoEmprestito[],
      allReportes: ReporteEmprestito[],
      allBancosEmprestito: BancoEmprestito[],
      allAsignaciones?: any[],
    ) => {
      const yearlyData: YearlySummary = {};

      allContratos.forEach((contrato) => {
        const year = contrato.fecha_inicio_contrato
          ? new Date(contrato.fecha_inicio_contrato).getFullYear().toString()
          : "Sin Año";

        if (!yearlyData[year]) {
          yearlyData[year] = {
            totalContratos: 0,
            valorTotalAsignado: 0,
            valorTotalAsignadoBanco: 0,
            valorTotalPagosProyectados: 0,
            valorTotalEjecutado: 0,
            valorTotalPagado: 0,
            valorTotalFisico: 0,
            porcentajeFisicoPromedio: 0,
            porcentajeFinancieroPromedio: 0,
          };
        }

        const yearSummary = yearlyData[year];
        const valorContrato = Number(contrato.valor_contrato) || 0;

        yearSummary.totalContratos += 1;
        yearSummary.valorTotalAsignado += valorContrato;

        // Buscar el reporte más reciente para este contrato
        const reporteContrato = allReportes
          .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
          .sort(
            (a, b) =>
              new Date(b.fecha_reporte).getTime() -
              new Date(a.fecha_reporte).getTime(),
          )[0];

        if (reporteContrato) {
          const avanceFinanciero = reporteContrato.avance_financiero || 0;
          const avanceFisico = reporteContrato.avance_fisico || 0;

          yearSummary.valorTotalEjecutado +=
            (valorContrato * avanceFinanciero) / 100;
          yearSummary.valorTotalFisico += (valorContrato * avanceFisico) / 100;
        }
      });

      // Calcular valorTotalAsignadoBanco y valorTotalPagosProyectados por año desde asignaciones
      if (allAsignaciones && Array.isArray(allAsignaciones)) {
        allAsignaciones.forEach((asignacion) => {
          const year = asignacion.anio?.toString() || "Sin Año";

          if (!yearlyData[year]) {
            yearlyData[year] = {
              totalContratos: 0,
              valorTotalAsignado: 0,
              valorTotalAsignadoBanco: 0,
              valorTotalPagosProyectados: 0,
              valorTotalEjecutado: 0,
              valorTotalPagado: 0,
              valorTotalFisico: 0,
              porcentajeFisicoPromedio: 0,
              porcentajeFinancieroPromedio: 0,
            };
          }

          const montoBanco = Number(asignacion.monto_programado_banco) || 0;
          const montoPago = Number(asignacion.monto_programado_pago) || 0;

          yearlyData[year].valorTotalAsignadoBanco += montoBanco;
          yearlyData[year].valorTotalPagosProyectados += montoPago;
        });
      }

      // Recalcular promedios ponderados por año
      Object.keys(yearlyData).forEach((year) => {
        const yearSummary = yearlyData[year];
        let totalPonderadoFisico = 0;
        let totalPonderadoFinanciero = 0;
        let totalPeso = 0;

        allContratos
          .filter(
            (c) =>
              (c.fecha_inicio_contrato
                ? new Date(c.fecha_inicio_contrato).getFullYear().toString()
                : "Sin Año") === year,
          )
          .forEach((contrato) => {
            const valorContrato = Number(contrato.valor_contrato) || 0;
            totalPeso += valorContrato;

            const reporteContrato = allReportes
              .filter(
                (r) => r.referencia_contrato === contrato.referencia_contrato,
              )
              .sort(
                (a, b) =>
                  new Date(b.fecha_reporte).getTime() -
                  new Date(a.fecha_reporte).getTime(),
              )[0];

            if (reporteContrato) {
              const avanceFisico = reporteContrato.avance_fisico || 0;
              const avanceFinanciero = reporteContrato.avance_financiero || 0;

              totalPonderadoFisico += avanceFisico * valorContrato;
              totalPonderadoFinanciero += avanceFinanciero * valorContrato;
            }
          });

        yearSummary.porcentajeFisicoPromedio =
          totalPeso > 0 ? totalPonderadoFisico / totalPeso : 0;
        yearSummary.porcentajeFinancieroPromedio =
          totalPeso > 0 ? totalPonderadoFinanciero / totalPeso : 0;
      });

      return yearlyData;
    },
    [],
  );

  // Obtener datos de la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("ðŸ”„ Iniciando carga PARALELA de datos de Empréstito...");
        const startTime = performance.now();

        // OPTIMIZACIÃ“N: Cargar todos los datos EN PARALELO con Promise.allSettled
        const [
          contratosResult,
          reportesResult,
          bancosResult,
          pagosResult,
          proyeccionesResult,
        ] = await Promise.allSettled([
          // 1. Contratos (timeout reducido a 30s)
          fetchWithErrorHandling<any>(
            "/api/proxy/contratos_emprestito_all",
            {},
            30000, // 30 segundos
          ),
          // 2. Reportes
          fetchWithErrorHandling<any>(
            "/api/proxy/reportes_contratos/",
            {},
            30000, // 30 segundos
          ),
          // 3. Bancos (desde asignaciones)
          fetchWithErrorHandling<any>(
            "/api/proxy/asignaciones-emprestito-banco-centro-gestor",
            {},
            30000, // 30 segundos
          ),
          // 4. Pagos
          fetchPagosEmprestito(),
          // 5. Proyecciones
          (async () => {
            const baseUrl =
              typeof window !== "undefined" ? window.location.origin : "";
            const timestamp = new Date().getTime();
            const response = await proxyFetch(
              `${baseUrl}/api/proxy/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=${timestamp}`,
              {
                cache: "no-store",
                headers: {
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  Pragma: "no-cache",
                  Expires: "0",
                },
                signal: AbortSignal.timeout(30000), // 30 segundos
              },
            );
            if (!response.ok) throw new Error("Error fetching proyecciones");
            return response.json();
          })(),
        ]);

        // Extraer datos de los resultados
        const contratosData =
          contratosResult.status === "fulfilled"
            ? contratosResult.value
            : { data: [] };
        const reportesData =
          reportesResult.status === "fulfilled"
            ? reportesResult.value
            : { data: [] };
        const bancosData =
          bancosResult.status === "fulfilled"
            ? bancosResult.value
            : { data: [] };
        const pagosData =
          pagosResult.status === "fulfilled"
            ? pagosResult.value
            : {
                success: true,
                data: [],
                count: 0,
                collection: "",
                timestamp: "",
                message: "",
              };
        const proyeccionesData =
          proyeccionesResult.status === "fulfilled"
            ? proyeccionesResult.value
            : { success: false, data: [] };

        // Log de errores si los hay
        if (contratosResult.status === "rejected")
          console.warn("âš ï¸ Error en contratos:", contratosResult.reason);
        if (reportesResult.status === "rejected")
          console.warn("âš ï¸ Error en reportes:", reportesResult.reason);
        if (bancosResult.status === "rejected")
          console.warn("âš ï¸ Error en bancos:", bancosResult.reason);
        if (pagosResult.status === "rejected")
          console.warn("âš ï¸ Error en pagos:", pagosResult.reason);
        if (proyeccionesResult.status === "rejected")
          console.warn(
            "âš ï¸ Error en proyecciones:",
            proyeccionesResult.reason,
          );

        // Obtener asignaciones banco-centro gestor
        console.log(
          "ðŸ“¡ Solicitando asignaciones-emprestito-banco-centro-gestor...",
        );
        let asignacionesData: any;
        try {
          asignacionesData = await fetchWithErrorHandling<any>(
            "/api/proxy/asignaciones-emprestito-banco-centro-gestor",
            {},
            120000, // 2 minutos de timeout
          );
          console.log(
            "âœ… Asignaciones - Respuesta completa:",
            JSON.stringify(asignacionesData, null, 2).substring(0, 500),
          );
          console.log(
            "âœ… Asignaciones - Tipo de respuesta:",
            typeof asignacionesData,
          );
          console.log(
            "âœ… Asignaciones - Es objeto:",
            asignacionesData && typeof asignacionesData === "object",
          );
          console.log("âœ… Asignaciones - success:", asignacionesData?.success);
          console.log("âœ… Asignaciones - count:", asignacionesData?.count);
          console.log(
            "âœ… Asignaciones - data es array:",
            Array.isArray(asignacionesData?.data),
          );
          console.log(
            "âœ… Asignaciones - data length:",
            asignacionesData?.data?.length,
          );
        } catch (err: any) {
          console.error(
            "âŒ Error capturado en asignaciones-emprestito-banco-centro-gestor:",
            err,
          );
          console.error("âŒ Error tipo:", err?.type);
          console.error("âŒ Error mensaje:", err?.message);
          asignacionesData = { success: false, data: [], error: err?.message };
        }

        // Extraer arrays de datos con validación
        const contratosArray = (contratosData.data ||
          []) as ContratoEmprestito[];
        const reportesArray = (reportesData.data || []) as ReporteEmprestito[];
        const bancosArray = (bancosData.data || []) as BancoEmprestito[];
        const pagosArray = (pagosData.data || []) as PagoEmprestito[];

        // Validar y extraer asignaciones con múltiples checks
        let asignacionesArray: any[] = [];
        if (asignacionesData) {
          console.log("ðŸ” Validando estructura de asignacionesData...");
          console.log("ðŸ” Claves del objeto:", Object.keys(asignacionesData));

          if (Array.isArray(asignacionesData.data)) {
            asignacionesArray = asignacionesData.data;
            console.log("âœ… asignacionesData.data es un array válido");
          } else if (Array.isArray(asignacionesData)) {
            // Por si el endpoint devuelve directamente el array
            asignacionesArray = asignacionesData;
            console.log("âœ… asignacionesData es directamente un array");
          } else {
            console.warn("âš ï¸ asignacionesData no tiene formato esperado:", {
              tieneData: "data" in asignacionesData,
              tipoDeLaData: typeof asignacionesData.data,
              esArray: Array.isArray(asignacionesData.data),
            });
          }
        } else {
          console.error("âŒ asignacionesData es null o undefined");
        }

        const proyeccionesArray =
          proyeccionesData.success && proyeccionesData.data
            ? proyeccionesData.data
            : [];

        const centroGestorAccess = getCentroGestorAccessFromSession();
        const normalizeCentro = (value: unknown): string =>
          String(value || "")
            .trim()
            .toLowerCase();
        const userCentro = normalizeCentro(centroGestorAccess.userCentroGestor);

        const contratosFiltrados = filterByCentroGestor(
          contratosArray,
          centroGestorAccess,
          [
            "nombre_centro_gestor",
            "centro_gestor",
            "nombre_entidad",
            "organismo",
          ],
        ) as ContratoEmprestito[];

        const referenciasPermitidas = new Set(
          contratosFiltrados
            .map((contrato: any) =>
              String(contrato?.referencia_contrato || "")
                .trim()
                .toLowerCase(),
            )
            .filter((value: string) => value.length > 0),
        );

        const reportesFiltrados = (
          centroGestorAccess.canViewAll
            ? reportesArray
            : (reportesArray || []).filter((reporte: any) => {
                const centroReporte = normalizeCentro(
                  reporte?.nombre_centro_gestor ||
                    reporte?.centro_gestor ||
                    reporte?.responsable,
                );
                const referencia = String(reporte?.referencia_contrato || "")
                  .trim()
                  .toLowerCase();
                return (
                  centroReporte === userCentro ||
                  referenciasPermitidas.has(referencia)
                );
              })
        ) as ReporteEmprestito[];

        const pagosFiltrados = (
          centroGestorAccess.canViewAll
            ? pagosArray
            : (pagosArray || []).filter((pago: any) => {
                const centroPago = normalizeCentro(
                  pago?.nombre_centro_gestor ||
                    pago?.centro_gestor ||
                    pago?.responsable,
                );
                const referencia = String(pago?.referencia_contrato || "")
                  .trim()
                  .toLowerCase();
                return (
                  centroPago === userCentro ||
                  referenciasPermitidas.has(referencia)
                );
              })
        ) as PagoEmprestito[];

        const bancosFiltrados = filterByCentroGestor(
          bancosArray,
          centroGestorAccess,
          ["nombre_centro_gestor", "centro_gestor", "organismo", "responsable"],
        ) as BancoEmprestito[];

        const asignacionesFiltradas = filterByCentroGestor(
          asignacionesArray,
          centroGestorAccess,
          ["nombre_centro_gestor", "centro_gestor", "organismo", "responsable"],
        );

        const proyeccionesFiltradas = centroGestorAccess.canViewAll
          ? proyeccionesArray
          : (proyeccionesArray || []).filter((proyeccion: any) => {
              const centroProyeccion = normalizeCentro(
                proyeccion?.nombre_centro_gestor ||
                  proyeccion?.nombre_organismo_reducido ||
                  proyeccion?.organismo ||
                  proyeccion?.centro_gestor,
              );
              return centroProyeccion === userCentro;
            });

        console.log("ðŸ“‹ Arrays extraídos - Resumen:", {
          contratos: contratosArray.length,
          reportes: reportesArray.length,
          bancos: bancosArray.length,
          pagos: pagosArray.length,
          asignaciones: asignacionesArray.length,
          proyecciones: proyeccionesArray.length,
        });

        console.log("ðŸ“‹ Asignaciones extraídas:", {
          esArray: Array.isArray(asignacionesArray),
          longitud: asignacionesArray.length,
          primerosElementos: asignacionesArray.slice(0, 2),
          camposDelPrimero:
            asignacionesArray.length > 0
              ? Object.keys(asignacionesArray[0])
              : [],
        });

        const endTime = performance.now();
        const loadTime = ((endTime - startTime) / 1000).toFixed(2);

        console.log("ðŸ’¾ Guardando datos en estado...");
        setContratos(contratosFiltrados);
        setReportes(reportesFiltrados);
        setBancosEmprestito(bancosFiltrados);
        setEmprestitoBancos(bancosFiltrados);
        setPagos(pagosFiltrados);
        setProyecciones(proyeccionesFiltradas);
        console.log("ðŸ’¾ Antes de setAsignaciones:", {
          esArray: Array.isArray(asignacionesArray),
          longitud: asignacionesArray.length,
          muestra: asignacionesArray.slice(0, 1),
        });
        setAsignaciones(asignacionesFiltradas);
        console.log("âœ… Estado de asignaciones actualizado");
        setFilteredData(contratosFiltrados);
        setYearlySummary(
          calculateYearlySummary(
            contratosFiltrados,
            reportesFiltrados,
            bancosFiltrados,
            asignacionesFiltradas,
          ),
        );

        console.log(`âœ… Datos cargados en ${loadTime}s (carga paralela):`, {
          contratos: contratosArray.length,
          reportes: reportesArray.length,
          bancos: bancosArray.length,
          pagos: pagosArray.length,
          proyecciones: proyeccionesArray.length,
          asignaciones: asignacionesArray.length,
          bancosConValores: bancosArray.filter(
            (b: any) => b.valor_asignado_banco,
          ).length,
          tiempoCarga: `${loadTime}s`,
        });

        console.log(
          "ðŸ’° Muestra de asignaciones (todos los campos):",
          asignacionesArray.slice(0, 3),
        );
        console.log(
          "ðŸ’° Muestra de asignaciones (campos específicos):",
          asignacionesArray.slice(0, 3).map((a: any) => ({
            id: a.id,
            banco: a.banco,
            centro: a.nombre_centro_gestor,
            bp: a.bp,
            monto_programado_banco: a.monto_programado_banco,
            monto_programado_adjudicacion: a.monto_programado_adjudicacion,
            monto_programado_pago: a.monto_programado_pago,
            anio: a.anio,
            created_at: a.created_at,
            todosCampos: Object.keys(a),
          })),
        );

        // Calcular totales por banco desde asignaciones para debug
        const totalesPorBancoAdj = new Map<string, number>();
        const totalesPorBancoPago = new Map<string, number>();
        const totalesPorBancoBanco = new Map<string, number>();
        asignacionesArray.forEach((asig: any) => {
          const banco = asig.banco || "Sin definir";
          const montoAdj = Number(asig.monto_programado_adjudicacion) || 0;
          const montoPago = Number(asig.monto_programado_pago) || 0;
          const montoBanco = Number(asig.monto_programado_banco) || 0;
          totalesPorBancoAdj.set(
            banco,
            (totalesPorBancoAdj.get(banco) || 0) + montoAdj,
          );
          totalesPorBancoPago.set(
            banco,
            (totalesPorBancoPago.get(banco) || 0) + montoPago,
          );
          totalesPorBancoBanco.set(
            banco,
            (totalesPorBancoBanco.get(banco) || 0) + montoBanco,
          );
        });
        console.log(
          "ðŸ’µ Totales adjudicación por banco desde asignaciones:",
          Array.from(totalesPorBancoAdj.entries()).map(([banco, total]) => ({
            banco,
            total: total.toLocaleString("es-CO"),
            totalNumerico: total,
          })),
        );
        console.log(
          "ðŸ’µ Totales BANCO (monto_programado_banco) por banco desde asignaciones:",
          Array.from(totalesPorBancoBanco.entries()).map(([banco, total]) => ({
            banco,
            total: total.toLocaleString("es-CO"),
            totalNumerico: total,
          })),
        );
        console.log(
          "ðŸ’µ Totales pagos proyectados por banco desde asignaciones:",
          Array.from(totalesPorBancoPago.entries()).map(([banco, total]) => ({
            banco,
            total: total.toLocaleString("es-CO"),
            totalNumerico: total,
          })),
        );
        console.log(
          "ðŸ’µ TOTAL GENERAL adjudicación desde asignaciones:",
          asignacionesArray
            .reduce(
              (sum: number, a: any) =>
                sum + (Number(a.monto_programado_adjudicacion) || 0),
              0,
            )
            .toLocaleString("es-CO"),
        );
        console.log(
          "ðŸ’µ TOTAL GENERAL BANCO (monto_programado_banco) desde asignaciones:",
          asignacionesArray
            .reduce(
              (sum: number, a: any) =>
                sum + (Number(a.monto_programado_banco) || 0),
              0,
            )
            .toLocaleString("es-CO"),
        );
        console.log(
          "ðŸ’µ TOTAL GENERAL pagos proyectados desde asignaciones:",
          asignacionesArray
            .reduce(
              (sum: number, a: any) =>
                sum + (Number(a.monto_programado_pago) || 0),
              0,
            )
            .toLocaleString("es-CO"),
        );

        console.log(
          "ðŸ” VERIFICAR PROYECCIONES - Muestra:",
          proyeccionesArray.slice(0, 2).map((p: any) => ({
            organismo: p.nombre_organismo_reducido,
            valor: p.valor_proyectado,
          })),
        );

        // Debug: Mostrar algunos datos de asignaciones banco-centro-gestor
        console.log(
          "ðŸ“Š Muestra de datos de asignaciones banco-centro-gestor:",
          bancosArray.slice(0, 3),
        );
        console.log(
          "ðŸ’° Bancos únicos desde asignaciones:",
          Array.from(
            new Set(bancosArray.map((asig: any) => asig.banco).filter(Boolean)),
          ),
        );

        // Debug: Calcular suma total de monto_programado_banco
        const totalValorAsignadoBanco = bancosArray.reduce(
          (sum: number, asig: any) => sum + (asig.monto_programado_banco || 0),
          0,
        );
        console.log(
          "ðŸ’µ Total Monto Programado Banco calculado para card:",
          totalValorAsignadoBanco.toLocaleString(),
        );
      } catch (err: any) {
        const errorMessage =
          err?.message || err?.type || "Error al cargar datos de Empréstito";
        setError(errorMessage);
        console.error("âŒ Error cargando datos:", err);
        console.error("âŒ Detalles del error:", {
          message: err?.message,
          type: err?.type,
          code: err?.code,
          context: err?.context,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [calculateYearlySummary]);

  // Debug: Monitorear cambios en proyecciones
  useEffect(() => {
    console.log("ðŸ” Estado proyecciones actualizado:", {
      total: proyecciones.length,
      muestra: proyecciones.slice(0, 2).map((p: any) => ({
        organismo: p.nombre_organismo_reducido,
        valor: p.valor_proyectado,
      })),
    });
  }, [proyecciones]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...contratos];

    if (filters.banco) {
      filtered = filtered.filter((c) =>
        c.banco?.toLowerCase().includes(filters.banco.toLowerCase()),
      );
    }
    if (filters.centroGestor) {
      filtered = filtered.filter((c) =>
        c.nombre_centro_gestor
          ?.toLowerCase()
          .includes(filters.centroGestor.toLowerCase()),
      );
    }
    if (filters.estado) {
      filtered = filtered.filter((c) =>
        c.estado_contrato?.toLowerCase().includes(filters.estado.toLowerCase()),
      );
    }
    if (filters.sector) {
      filtered = filtered.filter((c) =>
        c.sector?.toLowerCase().includes(filters.sector.toLowerCase()),
      );
    }
    if (filters.bp) {
      filtered = filtered.filter((c) =>
        c.bp?.toLowerCase().includes(filters.bp.toLowerCase()),
      );
    }
    if (filters.ano) {
      filtered = filtered.filter((c) => {
        const fechaInicio = c.fecha_inicio_contrato
          ? new Date(c.fecha_inicio_contrato).getFullYear().toString()
          : null;
        return fechaInicio === filters.ano;
      });
    }

    setFilteredData(filtered);
  }, [filters, contratos]);

  // Filtrar asignaciones según los filtros aplicados
  const filteredAsignaciones = useMemo(() => {
    console.log("ðŸ”„ Calculando filteredAsignaciones...", {
      asignacionesDisponibles: !!asignaciones,
      esArray: Array.isArray(asignaciones),
      longitud: asignaciones?.length || 0,
      filtros: filters,
    });

    if (!asignaciones || !Array.isArray(asignaciones)) {
      console.warn("âš ï¸ Asignaciones no es un array válido:", asignaciones);
      return [];
    }

    if (asignaciones.length === 0) {
      console.warn("âš ï¸ Asignaciones está vacío");
      return [];
    }

    let filtered = [...asignaciones];

    // Filtrar por banco
    if (filters.banco) {
      filtered = filtered.filter((a) =>
        a.banco?.toLowerCase().includes(filters.banco.toLowerCase()),
      );
      console.log(
        `ðŸ” Filtro banco "${filters.banco}" aplicado: ${filtered.length} resultados`,
      );
    }

    // Filtrar por centro gestor
    if (filters.centroGestor) {
      filtered = filtered.filter((a) =>
        a.nombre_centro_gestor
          ?.toLowerCase()
          .includes(filters.centroGestor.toLowerCase()),
      );
      console.log(
        `ðŸ” Filtro centro gestor "${filters.centroGestor}" aplicado: ${filtered.length} resultados`,
      );
    }

    // Filtrar por BP
    if (filters.bp) {
      filtered = filtered.filter((a) =>
        a.bp?.toLowerCase().includes(filters.bp.toLowerCase()),
      );
      console.log(
        `ðŸ” Filtro BP "${filters.bp}" aplicado: ${filtered.length} resultados`,
      );
    }

    // Filtrar por año
    if (filters.ano) {
      filtered = filtered.filter((a) => a.anio?.toString() === filters.ano);
      console.log(
        `ðŸ” Filtro año "${filters.ano}" aplicado: ${filtered.length} resultados`,
      );
    }

    console.log("ðŸ” Asignaciones filtradas:", {
      total: asignaciones.length,
      filtradas: filtered.length,
      filtros: filters,
      muestra: filtered.slice(0, 3).map((a) => ({
        banco: a.banco,
        centro: a.nombre_centro_gestor,
        monto_programado_banco: a.monto_programado_banco,
        monto_programado_adjudicacion: a.monto_programado_adjudicacion,
        monto_programado_pago: a.monto_programado_pago,
        anio: a.anio,
      })),
    });

    return filtered;
  }, [asignaciones, filters]);

  // Función para abrir el modal con los datos del contrato
  const handleOpenModal = (contrato: ContratoEmprestito) => {
    // Buscar todos los reportes para este contrato (para la gráfica de evolución)
    const reportesContrato = reportes
      .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
      .sort(
        (a, b) =>
          new Date(b.fecha_reporte).getTime() -
          new Date(a.fecha_reporte).getTime(),
      );

    // Tomar el reporte más reciente para los datos principales
    const reporteContrato = reportesContrato[0];

    // Combinar datos del contrato con datos del reporte
    const contratoCompleto = {
      ...contrato,
      ...reporteContrato,
      // Incluir todos los reportes para la gráfica de evolución
      reportes: reportesContrato,
      // Asegurar que el título sea nombre_resumido_proceso
      descripcion_proceso:
        contrato.nombre_resumido_proceso || contrato.descripcion_proceso,
      // Asegurar que los campos de ejecución estén disponibles desde reportes-contratos
      ejecucion_fisica: reporteContrato?.avance_fisico || null,
      ejecucion_financiera: reporteContrato?.avance_financiero || null,
      avance_fisico: reporteContrato?.avance_fisico || null,
      avance_financiero: reporteContrato?.avance_financiero || null,
      pagos: contrato.valor_pagado || null,
      // Campos adicionales del endpoint reportes-contratos disponibles
      alertas: reporteContrato?.alertas || null,
      observaciones: reporteContrato?.observaciones || null,
      // Asegurar fechas y estados
      fecha_reporte: reporteContrato?.fecha_reporte || null,
      estado_reporte: reporteContrato?.estado_reporte || null,
    };

    setSelectedContrato(contratoCompleto);
    setModalOpen(true);
  };

  // Análisis por banco
  const analysisByBank = useMemo((): AnalysisByBank[] => {
    console.log("ðŸ“Š Calculando analysisByBank...");

    // Validar que asignaciones filtradas existan
    if (!filteredAsignaciones || !Array.isArray(filteredAsignaciones)) {
      console.warn(
        "âš ï¸ Asignaciones filtradas no disponibles aún para analysisByBank",
      );
      return [];
    }

    console.log("âœ… Procesando asignaciones filtradas:", {
      cantidad: filteredAsignaciones.length,
      muestra: filteredAsignaciones.slice(0, 2),
    });

    // Mapeo de nombres de bancos en asignaciones a nombres estándar
    const mapeoBancosAsignaciones: Record<string, string> = {
      "Banco Occidente": "Banco de Occidente",
      // Agregar otros mapeos si es necesario
    };

    // PASO 1: Calcular valores asignados por banco desde asignaciones filtradas (monto_programado_banco y monto_programado_pago)
    const valoresAsignadosPorBanco = new Map<string, number>();
    const valoresPagosProyectadosPorBanco = new Map<string, number>();
    filteredAsignaciones.forEach((asignacion: any) => {
      let banco = asignacion.banco || "Sin definir";
      // Normalizar nombre del banco
      if (mapeoBancosAsignaciones[banco]) {
        banco = mapeoBancosAsignaciones[banco];
      }
      const montoBanco = Number(asignacion.monto_programado_banco) || 0;
      const montoPago = Number(asignacion.monto_programado_pago) || 0;
      const valorActualBanco = valoresAsignadosPorBanco.get(banco) || 0;
      const valorActualPago = valoresPagosProyectadosPorBanco.get(banco) || 0;
      valoresAsignadosPorBanco.set(banco, valorActualBanco + montoBanco);
      valoresPagosProyectadosPorBanco.set(banco, valorActualPago + montoPago);
    });

    console.log(
      "ðŸ’° Valores asignados por banco (desde asignaciones - monto_programado_banco):",
      Array.from(valoresAsignadosPorBanco.entries()),
    );
    console.log(
      "ðŸ’° Valores pagos proyectados por banco (desde asignaciones - monto_programado_pago):",
      Array.from(valoresPagosProyectadosPorBanco.entries()),
    );

    // DEBUG: Log detallado de asignaciones procesadas
    console.log(
      "ðŸ” DEBUG: Asignaciones filtradas procesadas:",
      filteredAsignaciones
        .map((a: any) => ({
          banco: a.banco,
          monto_programado_banco: a.monto_programado_banco,
          monto_programado_pago: a.monto_programado_pago,
          anio: a.anio,
        }))
        .slice(0, 5),
    );

    const bankMap = new Map<string, AnalysisByBank>();

    // PASO 2: Inicializar TODOS los bancos desde asignaciones
    valoresAsignadosPorBanco.forEach((valorAsignado, nombreBanco) => {
      bankMap.set(nombreBanco, {
        banco: nombreBanco,
        totalContratos: 0,
        valorAsignadoBanco: valorAsignado, // Desde asignaciones (monto_programado_banco)
        valorPagosProyectados:
          valoresPagosProyectadosPorBanco.get(nombreBanco) || 0, // Desde asignaciones (monto_programado_pago)
        valorAsignadoProyecciones: 0, // No usado actualmente
        valorAdjudicado: 0, // Del endpoint contratos_emprestito_all
        valorEjecutado: 0, // Calculado desde reportes
        valorPagado: 0, // Calculado desde pagos
        porcentajeEjecucion: 0,
        promedioAvance: 0,
      });
    });

    // PASO 3: Agregar datos de contratos
    filteredData.forEach((contrato) => {
      const banco = contrato.banco || "Sin definir";
      const valorContrato = Number(contrato.valor_contrato) || 0;

      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
        .sort(
          (a, b) =>
            new Date(b.fecha_reporte).getTime() -
            new Date(a.fecha_reporte).getTime(),
        )[0];

      const avanceFinanciero = reporteContrato?.avance_financiero || 0;
      const valorEjecutado = (valorContrato * avanceFinanciero) / 100;

      // Calcular pagos para este contrato
      const valorPagadoContrato = pagos
        .filter((p) => p.referencia_contrato === contrato.referencia_contrato)
        .reduce((sum, pago) => sum + (Number(pago.valor_pago) || 0), 0);

      // Inicializar el banco si no existe (por si hay contratos de bancos que no están en asignaciones)
      if (!bankMap.has(banco)) {
        bankMap.set(banco, {
          banco,
          totalContratos: 0,
          valorAsignadoBanco: valoresAsignadosPorBanco.get(banco) || 0, // Desde asignaciones (monto_programado_banco)
          valorPagosProyectados:
            valoresPagosProyectadosPorBanco.get(banco) || 0, // Desde asignaciones (monto_programado_pago)
          valorAsignadoProyecciones: 0, // No usado
          valorAdjudicado: 0, // Del endpoint contratos_emprestito_all
          valorEjecutado: 0, // Calculado desde reportes
          valorPagado: 0, // Calculado desde pagos
          porcentajeEjecucion: 0,
          promedioAvance: 0,
        });
      }

      const analysis = bankMap.get(banco)!;
      analysis.totalContratos += 1;
      analysis.valorAdjudicado += valorContrato;
      analysis.valorEjecutado += valorEjecutado;
      analysis.valorPagado += valorPagadoContrato;

      // Solo sumar al promedio ponderado si hay reporte
      if (reporteContrato) {
        analysis.promedioAvance += avanceFinanciero * valorContrato;
      }
    });

    // Calcular porcentajes y promedios
    bankMap.forEach((analysis) => {
      analysis.porcentajeEjecucion =
        analysis.valorAdjudicado > 0
          ? (analysis.valorEjecutado / analysis.valorAdjudicado) * 100
          : 0;
      // Promedio PONDERADO: dividir suma ponderada entre valor total
      analysis.promedioAvance =
        analysis.valorAdjudicado > 0
          ? analysis.promedioAvance / analysis.valorAdjudicado
          : 0;
    });

    const result = Array.from(bankMap.values()).sort(
      (a, b) => b.valorAdjudicado - a.valorAdjudicado,
    );
    console.log(
      "ðŸ¦ Análisis por Banco COMPLETO:",
      result.map((r) => ({
        banco: r.banco,
        valorAsignadoBanco: r.valorAsignadoBanco,
        valorPagosProyectados: r.valorPagosProyectados,
        valorAsignadoProyecciones: r.valorAsignadoProyecciones,
        valorAdjudicado: r.valorAdjudicado,
        valorEjecutado: r.valorEjecutado,
        valorPagado: r.valorPagado,
      })),
    );
    return result;
  }, [filteredData, reportes, pagos, proyecciones, filteredAsignaciones]);

  // Análisis por centro gestor
  const analysisByCentroGestor = useMemo((): AnalysisByCentroGestor[] => {
    // Validar que asignaciones filtradas existan
    if (!filteredAsignaciones || !Array.isArray(filteredAsignaciones)) {
      console.warn(
        "âš ï¸ Asignaciones filtradas no disponibles aún en centro gestor",
      );
      return [];
    }

    // PASO 1: Calcular valores asignados por centro gestor desde asignaciones filtradas
    const valoresAsignadosPorCentro = new Map<string, number>();
    const valoresPagosProyectadosPorCentro = new Map<string, number>();
    filteredAsignaciones.forEach((asignacion: any) => {
      const centro = asignacion.nombre_centro_gestor || "Sin definir";
      const montoPago = Number(asignacion.monto_programado_pago) || 0;
      const montoBanco = Number(asignacion.monto_programado_banco) || 0;

      const valorActualBanco = valoresAsignadosPorCentro.get(centro) || 0;
      const valorActualPago = valoresPagosProyectadosPorCentro.get(centro) || 0;
      valoresAsignadosPorCentro.set(centro, valorActualBanco + montoBanco);
      valoresPagosProyectadosPorCentro.set(centro, valorActualPago + montoPago);
    });

    console.log(
      "ðŸ’° Valores asignados por centro gestor (desde asignaciones - monto_programado_banco):",
      Array.from(valoresAsignadosPorCentro.entries()),
    );
    console.log(
      "ðŸ’° Valores pagos proyectados por centro gestor (desde asignaciones - monto_programado_pago):",
      Array.from(valoresPagosProyectadosPorCentro.entries()),
    );

    const centroMap = new Map<string, AnalysisByCentroGestor>();

    // PASO 2: Inicializar todos los centros gestores que tienen asignaciones
    valoresAsignadosPorCentro.forEach((valorAsignado, nombreCentro) => {
      centroMap.set(nombreCentro, {
        centroGestor: nombreCentro,
        totalContratos: 0,
        valorAsignadoBanco: valorAsignado, // Desde asignaciones (monto_programado_banco)
        valorPagosProyectados:
          valoresPagosProyectadosPorCentro.get(nombreCentro) || 0, // Desde asignaciones (monto_programado_pago)
        valorAsignadoProyecciones: 0, // Se calculará desde proyecciones más adelante
        valorAdjudicado: 0, // Del endpoint contratos_emprestito_all
        valorEjecutado: 0, // Calculado desde reportes
        valorPagado: 0, // Calculado desde pagos
        sectores: [],
        estadosContratos: {},
        bancos: [], // Array para almacenar detalle de bancos
      });
    });

    // PASO 3: Agregar datos de contratos
    filteredData.forEach((contrato) => {
      const centro = contrato.nombre_centro_gestor || "Sin definir";
      const banco = contrato.banco || "Sin definir";
      const valorContrato = Number(contrato.valor_contrato) || 0;

      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
        .sort(
          (a, b) =>
            new Date(b.fecha_reporte).getTime() -
            new Date(a.fecha_reporte).getTime(),
        )[0];

      const avanceFinanciero = reporteContrato?.avance_financiero || 0;
      const valorEjecutado = (valorContrato * avanceFinanciero) / 100;

      // Calcular pagos para este contrato
      const valorPagadoContrato = pagos
        .filter((p) => p.referencia_contrato === contrato.referencia_contrato)
        .reduce((sum, pago) => sum + (Number(pago.valor_pago) || 0), 0);

      // Inicializar el centro si no existe (por si hay contratos de centros que no están en asignaciones)
      if (!centroMap.has(centro)) {
        centroMap.set(centro, {
          centroGestor: centro,
          totalContratos: 0,
          valorAsignadoBanco: valoresAsignadosPorCentro.get(centro) || 0, // Desde asignaciones (monto_programado_adjudicacion)
          valorPagosProyectados:
            valoresPagosProyectadosPorCentro.get(centro) || 0, // Desde asignaciones (monto_programado_pago)
          valorAsignadoProyecciones: 0, // Se calculará desde proyecciones
          valorAdjudicado: 0, // Del endpoint contratos_emprestito_all
          valorEjecutado: 0, // Calculado desde reportes
          valorPagado: 0, // Calculado desde pagos
          sectores: [],
          estadosContratos: {},
          bancos: [], // Array para almacenar detalle de bancos
        });
      }

      const analysis = centroMap.get(centro)!;
      analysis.totalContratos += 1;
      analysis.valorAdjudicado += valorContrato;
      analysis.valorEjecutado += valorEjecutado;
      analysis.valorPagado += valorPagadoContrato;

      // Agregar sector
      if (contrato.sector && !analysis.sectores.includes(contrato.sector)) {
        analysis.sectores.push(contrato.sector);
      }

      // Contar estados
      const estado = contrato.estado_contrato || "Sin definir";
      analysis.estadosContratos[estado] =
        (analysis.estadosContratos[estado] || 0) + 1;
    });

    // Después de procesar todos los contratos, agregar información detallada de bancos
    centroMap.forEach((analysis) => {
      const bancosMap = new Map<
        string,
        {
          nombre: string;
          valorAsignado: number;
          valorAdjudicado: number;
          valorEjecutado: number;
          valorPagado: number;
          contratos: number;
        }
      >();

      // Obtener todos los bancos únicos para este centro gestor desde los contratos
      filteredData
        .filter(
          (contrato) =>
            (contrato.nombre_centro_gestor || "Sin definir") ===
            analysis.centroGestor,
        )
        .forEach((contrato) => {
          const banco = contrato.banco || "Sin definir";
          const valorContrato = Number(contrato.valor_contrato) || 0;

          // Buscar el reporte más reciente para este contrato
          const reporteContrato = reportes
            .filter(
              (r) => r.referencia_contrato === contrato.referencia_contrato,
            )
            .sort(
              (a, b) =>
                new Date(b.fecha_reporte).getTime() -
                new Date(a.fecha_reporte).getTime(),
            )[0];

          const avanceFinanciero = reporteContrato?.avance_financiero || 0;
          const valorEjecutado = (valorContrato * avanceFinanciero) / 100;

          // Calcular pagos para este contrato
          const valorPagadoContrato = pagos
            .filter(
              (p) => p.referencia_contrato === contrato.referencia_contrato,
            )
            .reduce((sum, pago) => sum + (Number(pago.valor_pago) || 0), 0);

          if (!bancosMap.has(banco)) {
            bancosMap.set(banco, {
              nombre: banco,
              valorAsignado: 0, // Se calculará como suma de valorAdjudicado
              valorAdjudicado: 0,
              valorEjecutado: 0,
              valorPagado: 0,
              contratos: 0,
            });
          }

          const bancoInfo = bancosMap.get(banco)!;
          bancoInfo.valorAdjudicado += valorContrato;
          bancoInfo.valorAsignado += valorContrato; // Asignado = suma de adjudicados
          bancoInfo.valorEjecutado += valorEjecutado;
          bancoInfo.valorPagado += valorPagadoContrato;
          bancoInfo.contratos += 1;
        });

      // Actualizar el array de bancos
      analysis.bancos = Array.from(bancosMap.values()).filter(
        (banco) => banco.valorAdjudicado > 0,
      );
    });

    // Calcular valorAsignadoProyecciones por centro gestor desde proyecciones
    // Agrupar proyecciones por centro gestor (nombre_organismo_reducido)

    // Mapeo de nombres abreviados en proyecciones a nombres oficiales de centros gestores
    const mapeoNombresOrganismos: Record<string, string> = {
      Bienes: "Unidad Administrativa Especial de Gestión de Bienes y Servicios",
      "Bienestar Social": "Secretaría de Bienestar Social",
      DATIC:
        "Departamento Administrativo de Tecnologías de la Información y las Comunicaciones",
      Deportes: "Secretaría del Deporte y la Recreación",
      "Desarrollo Económico": "Secretaría de Desarrollo Económico",
      Educación: "Secretaría de Educación",
      Infraestructura: "Secretaría de Infraestructura",
      MOVILIDAD: "Secretaría de Movilidad",
      Movilidad: "Secretaría de Movilidad",
      PLANEACION: "Departamento Administrativo de Planeación Municipal",
      Planeacion: "Departamento Administrativo de Planeación Municipal",
      Planeación: "Departamento Administrativo de Planeación Municipal",
      Participación:
        "Secretaría de Desarrollo Territorial y Participación Ciudadana",
      Riesgos: "Secretaría de Gestión del Riesgo de Emergencias y Desastres",
      Salud: "Secretaría de Salud Pública",
      Seguridad: "Secretaría de Seguridad y Justicia",
      Vivienda: "Secretaría de Vivienda Social y Hábitat",
      cultura: "Secretaría de Cultura",
      Cultura: "Secretaría de Cultura",
    };

    const proyeccionesPorCentro = new Map<string, number>();

    console.log(
      "ðŸ” DEBUG: Total proyecciones recibidas:",
      proyecciones.length,
    );
    console.log(
      "ðŸ” DEBUG: Muestra de proyecciones:",
      proyecciones.slice(0, 3),
    );

    proyecciones.forEach((proyeccion: any) => {
      // El centro gestor está en nombre_organismo_reducido
      let centroProyeccion =
        proyeccion.nombre_organismo_reducido || "Sin definir";
      const valorProyectado = Number(proyeccion.valor_proyectado) || 0;

      // Aplicar mapeo si existe
      if (mapeoNombresOrganismos[centroProyeccion]) {
        centroProyeccion = mapeoNombresOrganismos[centroProyeccion];
        console.log(
          `ðŸ”„ Mapeo aplicado: "${proyeccion.nombre_organismo_reducido}" â†’ "${centroProyeccion}"`,
        );
      }

      if (valorProyectado > 0) {
        const valorActual = proyeccionesPorCentro.get(centroProyeccion) || 0;
        proyeccionesPorCentro.set(
          centroProyeccion,
          valorActual + valorProyectado,
        );
      }
    });

    console.log(
      "ðŸ” DEBUG: Proyecciones agrupadas por organismo (después del mapeo):",
      Array.from(proyeccionesPorCentro.entries()).slice(0, 5),
    );
    console.log(
      "ðŸ” DEBUG: Centros gestores en contratos:",
      Array.from(centroMap.keys()).slice(0, 5),
    );

    // Asignar valores de proyecciones a cada centro gestor
    centroMap.forEach((analysis) => {
      // Buscar coincidencia exacta (ahora con nombres mapeados)
      const valorProyecciones =
        proyeccionesPorCentro.get(analysis.centroGestor) || 0;
      analysis.valorAsignadoProyecciones = valorProyecciones;

      if (valorProyecciones > 0) {
        console.log(
          `âœ… Valor asignado a "${analysis.centroGestor}": $${valorProyecciones.toLocaleString()}`,
        );
      }
    });

    // Debug: Mostrar valores de proyecciones calculados
    console.log(
      "ðŸ“Š Valores Asignados desde Proyecciones por Centro Gestor:",
      Array.from(centroMap.values()).map((c) => ({
        centro: c.centroGestor,
        valorAsignadoBanco: c.valorAsignadoBanco,
        valorProyecciones: c.valorAsignadoProyecciones,
        valorAdjudicado: c.valorAdjudicado,
      })),
    );

    return Array.from(centroMap.values())
      .filter(
        (c) =>
          c.valorAsignadoBanco > 0 ||
          c.valorAdjudicado > 0 ||
          c.valorEjecutado > 0 ||
          c.valorPagado > 0,
      )
      .sort((a, b) => b.valorAdjudicado - a.valorAdjudicado);
  }, [filteredData, reportes, pagos, proyecciones, filteredAsignaciones]);

  // Análisis por banco para el gráfico (solo bancos con contratos asignados)
  const analysisByBankForChart = useMemo((): AnalysisByBank[] => {
    // Validar que asignaciones filtradas existan
    if (!filteredAsignaciones || !Array.isArray(filteredAsignaciones)) {
      console.warn(
        "âš ï¸ Asignaciones filtradas no disponibles aún para gráfico",
      );
      return [];
    }

    // Mapeo de nombres de bancos en asignaciones a nombres estándar
    const mapeoBancosAsignaciones: Record<string, string> = {
      "Banco Occidente": "Banco de Occidente",
      // Agregar otros mapeos si es necesario
    };

    // PASO 1: Calcular valores asignados por banco desde asignaciones filtradas
    const valoresAsignadosPorBanco = new Map<string, number>();
    const valoresPagosProyectadosPorBanco = new Map<string, number>();
    filteredAsignaciones.forEach((asignacion: any) => {
      let banco = asignacion.nombre_banco || asignacion.banco || "Sin definir";
      // Normalizar nombre del banco
      if (mapeoBancosAsignaciones[banco]) {
        banco = mapeoBancosAsignaciones[banco];
      }

      const montoPago = Number(asignacion.monto_programado_pago) || 0;
      const montoBanco = Number(asignacion.monto_programado_banco) || 0; // âœ… Cambio principal: usar monto_programado_banco

      const valorActualAdj = valoresAsignadosPorBanco.get(banco) || 0;
      const valorActualPago = valoresPagosProyectadosPorBanco.get(banco) || 0;
      valoresAsignadosPorBanco.set(banco, valorActualAdj + montoBanco); // âœ… Usar montoBanco
      valoresPagosProyectadosPorBanco.set(banco, valorActualPago + montoPago);
    });

    console.log(
      "ðŸ“Š DEBUG: Valores asignados por banco (gráfico - monto_programado_banco):",
      Array.from(valoresAsignadosPorBanco.entries()),
    );
    console.log(
      "ðŸ“Š DEBUG: Valores pagos proyectados por banco (gráfico - monto_programado_pago):",
      Array.from(valoresPagosProyectadosPorBanco.entries()),
    );

    const bankMap = new Map<string, AnalysisByBank>();

    // PASO 2: Inicializar TODOS los bancos desde asignaciones
    valoresAsignadosPorBanco.forEach((valorAsignado, nombreBanco) => {
      bankMap.set(nombreBanco, {
        banco: nombreBanco,
        totalContratos: 0,
        valorAsignadoBanco: valorAsignado, // Desde asignaciones (monto_programado_adjudicacion)
        valorPagosProyectados:
          valoresPagosProyectadosPorBanco.get(nombreBanco) || 0, // Desde asignaciones (monto_programado_pago)
        valorAsignadoProyecciones: 0, // No usado
        valorAdjudicado: 0, // Se calculará desde contratos
        valorEjecutado: 0, // Se calculará desde reportes
        valorPagado: 0, // Inicialmente 0
        porcentajeEjecucion: 0,
        promedioAvance: 0,
      });
    });

    // Debug: Log de bancos inicializados
    console.log("ðŸ¦ Bancos inicializados en analysisByBankForChart:", {
      totalBancosConValor: bankMap.size,
      bancos: Array.from(bankMap.entries()).map(([nombre, data]) => ({
        nombre,
        valorAsignadoBanco: data.valorAsignadoBanco,
        valorAsignadoProyecciones: data.valorAsignadoProyecciones,
      })),
    });

    // PASO 4: Agregar datos de contratos a los bancos que los tienen
    filteredData.forEach((contrato) => {
      const banco = contrato.banco || "Sin definir";
      const valorContrato = Number(contrato.valor_contrato) || 0;

      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
        .sort(
          (a, b) =>
            new Date(b.fecha_reporte).getTime() -
            new Date(a.fecha_reporte).getTime(),
        )[0];

      const avanceFinanciero = reporteContrato?.avance_financiero || 0;
      const valorEjecutado = (valorContrato * avanceFinanciero) / 100;

      // Calcular pagos para este contrato
      const valorPagadoContrato = pagos
        .filter((p) => p.referencia_contrato === contrato.referencia_contrato)
        .reduce((sum, pago) => sum + (Number(pago.valor_pago) || 0), 0);

      // Agregar datos si el banco ya existe en el mapa
      if (bankMap.has(banco)) {
        const analysis = bankMap.get(banco)!;
        analysis.totalContratos += 1;
        analysis.valorAdjudicado += valorContrato;
        analysis.valorEjecutado += valorEjecutado;
        analysis.valorPagado += valorPagadoContrato;

        // Solo sumar al promedio ponderado si hay reporte
        if (reporteContrato) {
          analysis.promedioAvance += avanceFinanciero * valorContrato;
        }
      }
    });

    // Calcular porcentajes y promedios
    bankMap.forEach((analysis) => {
      analysis.porcentajeEjecucion =
        analysis.valorAdjudicado > 0
          ? (analysis.valorEjecutado / analysis.valorAdjudicado) * 100
          : 0;
      // Promedio PONDERADO: dividir suma ponderada entre valor total
      analysis.promedioAvance =
        analysis.valorAdjudicado > 0
          ? analysis.promedioAvance / analysis.valorAdjudicado
          : 0;
    });

    // Filtrar para mostrar bancos con datos relevantes (asignados o con contratos), luego ordenar por valorAsignadoBanco
    const result = Array.from(bankMap.values())
      .filter(
        (banco) => banco.valorAsignadoBanco > 0 || banco.totalContratos > 0,
      ) // âœ… Mostrar si tiene asignado O contratos
      .sort((a, b) => b.valorAsignadoBanco - a.valorAsignadoBanco);

    console.log("ðŸ“Š analysisByBankForChart - Resultado final para gráfico:", {
      totalBancos: result.length,
      bancos: result.map((b) => ({
        banco: b.banco,
        valorAsignadoBanco: b.valorAsignadoBanco,
        valorAdjudicado: b.valorAdjudicado,
        valorEjecutado: b.valorEjecutado,
        valorPagado: b.valorPagado,
      })),
    });

    return result;
  }, [filteredData, reportes, pagos, proyecciones, filteredAsignaciones]);

  // Análisis por Centro Gestor V2 (Datos de asignaciones)
  const analysisByCentroGestorV2 = useMemo((): AnalysisByCentroGestorV2[] => {
    if (!filteredAsignaciones || !Array.isArray(filteredAsignaciones))
      return [];

    const map = new Map<string, AnalysisByCentroGestorV2>();

    filteredAsignaciones.forEach((asig: any) => {
      const centro = asig.nombre_centro_gestor || "Sin definir";
      const banco = asig.nombre_banco || asig.banco || "Sin definir";
      const pago = Number(asig.monto_programado_pago) || 0;
      const adj = Number(asig.monto_programado_adjudicacion) || 0;
      const total = pago + adj;

      if (!map.has(centro)) {
        map.set(centro, {
          centroGestor: centro,
          valorProgramadoPago: 0,
          valorProgramadoAdjudicacion: 0,
          totalAsignado: 0,
          bancos: [],
        });
      }

      const entry = map.get(centro)!;
      entry.valorProgramadoPago += pago;
      entry.valorProgramadoAdjudicacion += adj;
      entry.totalAsignado += total;

      // Agregar banco si no existe
      let bancoEntry = entry.bancos.find((b) => b.nombre === banco);
      if (!bancoEntry) {
        bancoEntry = { nombre: banco, valor: 0 };
        entry.bancos.push(bancoEntry);
      }
      bancoEntry.valor += total;
    });

    return Array.from(map.values()).sort(
      (a, b) => b.totalAsignado - a.totalAsignado,
    );
  }, [filteredAsignaciones]);

  // Análisis por Año (Datos de asignaciones)
  const analysisByYear = useMemo((): AnalysisByYear[] => {
    if (!filteredAsignaciones || !Array.isArray(filteredAsignaciones))
      return [];

    const map = new Map<number, AnalysisByYear>();

    // PASO 1: Procesar asignaciones
    filteredAsignaciones.forEach((asig: any) => {
      const anio = Number(asig.anio);
      if (!anio) return;

      const centro = asig.nombre_centro_gestor || "Sin definir";
      const banco = asig.nombre_banco || asig.banco || "Sin definir";
      const pago = Number(asig.monto_programado_pago) || 0;
      const montoBanco = Number(asig.monto_programado_banco) || 0;
      const total = pago + montoBanco;

      if (!map.has(anio)) {
        map.set(anio, {
          year: anio,
          valorProgramadoPago: 0,
          valorProgramadoAdjudicacion: 0,
          valorPagado: 0,
          totalAsignado: 0,
          centrosGestores: [],
          bancos: [],
        });
      }

      const entry = map.get(anio)!;
      entry.valorProgramadoPago += pago;
      entry.valorProgramadoAdjudicacion += montoBanco;
      entry.totalAsignado += total;

      // Agregar o actualizar centro gestor
      let centroEntry = entry.centrosGestores.find((c) => c.nombre === centro);
      if (!centroEntry) {
        centroEntry = {
          nombre: centro,
          valorProgramadoPago: 0,
          valorProgramadoAdjudicacion: 0,
          valorPagado: 0,
          totalAsignado: 0,
        };
        entry.centrosGestores.push(centroEntry);
      }
      centroEntry.valorProgramadoPago += pago;
      centroEntry.valorProgramadoAdjudicacion += montoBanco;
      centroEntry.totalAsignado += total;

      // Agregar o actualizar banco
      let bancoEntry = entry.bancos.find((b) => b.nombre === banco);
      if (!bancoEntry) {
        bancoEntry = {
          nombre: banco,
          valorProgramadoPago: 0,
          valorProgramadoAdjudicacion: 0,
          valorPagado: 0,
          totalAsignado: 0,
        };
        entry.bancos.push(bancoEntry);
      }
      bancoEntry.valorProgramadoPago += pago;
      bancoEntry.valorProgramadoAdjudicacion += montoBanco;
      bancoEntry.totalAsignado += total;
    });

    // PASO 2: Agregar pagos reales agrupados por año de pago
    pagos.forEach((pago) => {
      // Intentar parsear la fecha usando fecha_transaccion
      const fechaStr = pago.fecha_transaccion;

      let fechaPago: Date | null = null;
      if (fechaStr) {
        // Intentar formato ISO
        fechaPago = new Date(fechaStr);
        // Si es inválida, intentar otros formatos si es necesario (ej: DD/MM/YYYY)
        if (isNaN(fechaPago.getTime())) {
          // Intento simple para DD/MM/YYYY
          const parts = fechaStr.split("/");
          if (parts.length === 3) {
            fechaPago = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
      }

      // Si la fecha sigue siendo inválida, usar log para depurar (opcional)
      if (!fechaPago || isNaN(fechaPago.getTime())) return;

      const anioPago = fechaPago.getFullYear();
      if (!anioPago) return;

      // Encontrar el contrato asociado al pago
      const contrato = filteredData.find(
        (c) => c.referencia_contrato === pago.referencia_contrato,
      );
      // Permitir pagos incluso si el contrato no está en filteredData?
      // Si filteredData tiene todos los contratos, debería estar.
      // Si filteredData está filtrado por filtro global, entonces es correcto excluirlo.
      if (!contrato) return;

      const centro = contrato.nombre_centro_gestor || "Sin definir";
      const banco = contrato.banco || "Sin definir";
      const valorPago = Number(pago.valor_pago) || 0;

      // Crear año si no existe
      if (!map.has(anioPago)) {
        map.set(anioPago, {
          year: anioPago,
          valorProgramadoPago: 0,
          valorProgramadoAdjudicacion: 0,
          valorPagado: 0,
          totalAsignado: 0,
          centrosGestores: [],
          bancos: [],
        });
      }

      const entry = map.get(anioPago)!;
      entry.valorPagado += valorPago;

      // Actualizar o crear centro gestor
      let centroEntry = entry.centrosGestores.find((c) => c.nombre === centro);
      if (!centroEntry) {
        centroEntry = {
          nombre: centro,
          valorProgramadoPago: 0,
          valorProgramadoAdjudicacion: 0,
          valorPagado: 0,
          totalAsignado: 0,
        };
        entry.centrosGestores.push(centroEntry);
      }
      centroEntry.valorPagado += valorPago;

      // Actualizar o crear banco
      let bancoEntry = entry.bancos.find((b) => b.nombre === banco);
      if (!bancoEntry) {
        bancoEntry = {
          nombre: banco,
          valorProgramadoPago: 0,
          valorProgramadoAdjudicacion: 0,
          valorPagado: 0,
          totalAsignado: 0,
        };
        entry.bancos.push(bancoEntry);
      }
      bancoEntry.valorPagado += valorPago;
    });

    // Ordenar centros gestores y bancos por monto total en cada año
    map.forEach((entry) => {
      entry.centrosGestores.sort((a, b) => b.totalAsignado - a.totalAsignado);
      entry.bancos.sort((a, b) => b.totalAsignado - a.totalAsignado);
    });

    return Array.from(map.values()).sort((a, b) => a.year - b.year);
  }, [filteredAsignaciones, filteredData, pagos]);

  // Cálculo correcto del avance físico total basado en los contratos
  // Usa el último reporte de cada contrato (mismo que la gráfica semanal usa para la última semana)
  const valorTotalFisico = useMemo(() => {
    let totalAvanceFisico = 0;

    filteredData.forEach((contrato) => {
      // Buscar el último reporte de este contrato (más reciente por fecha)
      const reporteContrato = reportes
        .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
        .sort(
          (a, b) =>
            new Date(b.fecha_reporte).getTime() -
            new Date(a.fecha_reporte).getTime(),
        )[0];

      if (reporteContrato) {
        const valorContrato = Number(contrato.valor_contrato) || 0;
        const avanceFisico = reporteContrato.avance_fisico || 0;
        // Calcular el valor físico ejecutado (avance_fisico ya viene como porcentaje 0-100)
        totalAvanceFisico += (valorContrato * avanceFisico) / 100;
      }
    });

    return totalAvanceFisico;
  }, [filteredData, reportes]);

  // Cálculo correcto del valor ejecutado total basado en los contratos (igual lógica que físico)
  const valorTotalEjecutado = useMemo(() => {
    let totalEjecutado = 0;

    filteredData.forEach((contrato) => {
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
        .sort(
          (a, b) =>
            new Date(b.fecha_reporte).getTime() -
            new Date(a.fecha_reporte).getTime(),
        )[0];

      if (reporteContrato) {
        const valorContrato = Number(contrato.valor_contrato) || 0;
        const avanceFinanciero =
          (reporteContrato as any).avance_financiero || 0;
        // Calcular el valor financiero ejecutado (avance_financiero ya viene como porcentaje 0-100)
        totalEjecutado += (valorContrato * avanceFinanciero) / 100;
      }
    });

    return totalEjecutado;
  }, [filteredData, reportes]);

  // Cálculo correcto del valor pagado total basado en los pagos reales de la API
  const valorTotalPagado = useMemo(() => {
    let totalPagado = 0;

    // Obtener contratos filtrados para sumar solo pagos relevantes
    const contratosFiltradosSet = new Set(
      filteredData.map((c) => c.referencia_contrato),
    );

    pagos.forEach((pago) => {
      // Solo contar pagos de contratos que están en los datos filtrados
      if (contratosFiltradosSet.has(pago.referencia_contrato)) {
        totalPagado += Number(pago.valor_pago) || 0;
      }
    });

    return totalPagado;
  }, [filteredData, pagos]);

  // Cálculo del porcentaje físico promedio ponderado por valor_contrato
  // Incluye TODOS los contratos en el denominador (sin reporte = 0% avance)
  // para que el porcentaje sea consistente con valorTotalFisico / valorTotalAsignado
  const porcentajeFisicoPromedio = useMemo(() => {
    let totalPonderado = 0;
    let totalPeso = 0;

    filteredData.forEach((contrato) => {
      const valorContrato = Number(contrato.valor_contrato) || 0;
      totalPeso += valorContrato;

      const reporteContrato = reportes
        .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
        .sort(
          (a, b) =>
            new Date(b.fecha_reporte).getTime() -
            new Date(a.fecha_reporte).getTime(),
        )[0];

      if (reporteContrato) {
        const avanceFisico = reporteContrato.avance_fisico || 0;
        totalPonderado += avanceFisico * valorContrato;
      }
    });

    return totalPeso > 0 ? totalPonderado / totalPeso : 0;
  }, [filteredData, reportes]);

  // Cálculo del porcentaje financiero promedio ponderado por valor_contrato
  // Incluye TODOS los contratos en el denominador (sin reporte = 0% avance)
  // para que el porcentaje sea consistente con valorTotalEjecutado / valorTotalAsignado
  const porcentajeFinancieroPromedio = useMemo(() => {
    let totalPonderado = 0;
    let totalPeso = 0;

    filteredData.forEach((contrato) => {
      const valorContrato = Number(contrato.valor_contrato) || 0;
      totalPeso += valorContrato;

      const reporteContrato = reportes
        .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
        .sort(
          (a, b) =>
            new Date(b.fecha_reporte).getTime() -
            new Date(a.fecha_reporte).getTime(),
        )[0];

      if (reporteContrato) {
        const avanceFinanciero =
          (reporteContrato as any).avance_financiero || 0;
        totalPonderado += avanceFinanciero * valorContrato;
      }
    });

    return totalPeso > 0 ? totalPonderado / totalPeso : 0;
  }, [filteredData, reportes]);

  // Cálculo del porcentaje de pagos promedio basado en pagos reales
  const porcentajePagosPromedio = useMemo(() => {
    let totalPonderado = 0;
    let totalPeso = 0;

    filteredData.forEach((contrato) => {
      const valorContrato = Number(contrato.valor_contrato) || 0;

      // Calcular total pagado para este contrato
      const pagosPorContrato = pagos
        .filter((p) => p.referencia_contrato === contrato.referencia_contrato)
        .reduce((sum, pago) => sum + (Number(pago.valor_pago) || 0), 0);

      // Calcular porcentaje de pagos (pagosPorContrato / valorContrato * 100)
      const porcentajePagos =
        valorContrato > 0 ? (pagosPorContrato / valorContrato) * 100 : 0;

      totalPonderado += porcentajePagos * valorContrato;
      totalPeso += valorContrato;
    });

    return totalPeso > 0 ? totalPonderado / totalPeso : 0;
  }, [filteredData, pagos]);

  // Cálculo del valorTotalAsignadoBanco con log de depuración (desde monto_programado_banco)
  const valorTotalAsignadoBanco = useMemo(() => {
    console.log(
      "ðŸ’° Calculando valorTotalAsignadoBanco (desde monto_programado_banco):",
      {
        filteredAsignacionesLength: filteredAsignaciones.length,
        muestra: filteredAsignaciones.slice(0, 3).map((a) => ({
          banco: a.banco,
          monto_programado_banco: a.monto_programado_banco,
          monto_programado_adjudicacion: a.monto_programado_adjudicacion,
          monto_programado_pago: a.monto_programado_pago,
        })),
      },
    );

    const totalBanco = filteredAsignaciones.reduce((sum, asignacion) => {
      const monto = Number(asignacion.monto_programado_banco) || 0;
      return sum + monto;
    }, 0);

    console.log(
      "ðŸ’° valorTotalAsignadoBanco (monto_programado_banco):",
      totalBanco,
    );
    return totalBanco;
  }, [filteredAsignaciones]);

  return {
    loading,
    error,
    contratos: filteredData,
    reportes,
    pagos,
    bancosEmprestito,
    emprestitoBancos,
    filters,
    setFilters,
    analysisByBank,
    analysisByBankForChart,
    analysisByCentroGestor,
    analysisByCentroGestorV2,
    analysisByYear,
    totalContratos: filteredData.length,
    valorTotalAsignado: filteredData.reduce(
      (sum, c) => sum + (Number(c.valor_contrato) || 0),
      0,
    ),
    valorTotalAsignadoBanco, // Ahora usa el cálculo con logs
    valorTotalEjecutado, // Ahora usa el cálculo correcto basado en contratos filtrados
    valorTotalPagado, // Ahora usa el cálculo correcto basado en pagos reales
    valorTotalFisico,
    porcentajeFisicoPromedio,
    porcentajeFinancieroPromedio,
    porcentajePagosPromedio,
    yearlySummary,
  };
};

// Componente BankBarChart
const BankBarChart: React.FC<{
  data: AnalysisByBank[];
  title?: string;
  maxItems?: number;
}> = ({ data, title = "Análisis por Banco", maxItems = 8 }) => {
  const chartData = data.slice(0, maxItems);

  // DEBUG: Verificar que los datos tengan valorAsignadoBanco
  console.log(
    "ðŸ“Š BankBarChart - Datos recibidos:",
    chartData.map((b) => ({
      banco: b.banco,
      valorAsignadoBanco: b.valorAsignadoBanco,
      valorAdjudicado: b.valorAdjudicado,
      valorEjecutado: b.valorEjecutado,
      valorPagado: b.valorPagado,
    })),
  );

  const metrics = [
    { key: "valorAsignadoBanco", label: "Asignado Banco", color: "#F59E0B" },
    { key: "valorAdjudicado", label: "Valor Adjudicado", color: "#3B82F6" },
    { key: "valorEjecutado", label: "Ejecución Financiera", color: "#10B981" },
    { key: "valorPagado", label: "Pagos", color: "#8B5CF6" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex flex-col border border-gray-100 dark:border-gray-700 w-full max-w-full overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Leyenda simple */}
      <div className="flex flex-wrap gap-4 mb-2 text-sm">
        {metrics.map((metric) => (
          <div key={metric.key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: metric.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {metric.label}
            </span>
          </div>
        ))}
      </div>

      {/* Gráfico con scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden w-full">
        <div
          style={{
            minWidth: `${Math.max(800, chartData.length * 85)}px`,
            height: "550px",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 10, left: 10, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                opacity={0.5}
              />

              <XAxis
                dataKey="banco"
                tick={({ x, y, payload }) => {
                  const text = payload.value as string;
                  const words = text.split(" ");
                  const lines: string[] = [];
                  let currentLine = "";

                  // Dividir en líneas de máximo 15 caracteres
                  words.forEach((word) => {
                    if ((currentLine + " " + word).length <= 15) {
                      currentLine += (currentLine ? " " : "") + word;
                    } else {
                      if (currentLine) lines.push(currentLine);
                      currentLine = word;
                    }
                  });
                  if (currentLine) lines.push(currentLine);

                  // Limitar a 2 líneas
                  const displayLines = lines.slice(0, 2);
                  if (lines.length > 2) {
                    displayLines[1] = displayLines[1].substring(0, 13) + "...";
                  }

                  return (
                    <g transform={`translate(${x},${y})`}>
                      {displayLines.map((line, i) => (
                        <text
                          key={i}
                          x={0}
                          y={i * 11 + 5}
                          textAnchor="middle"
                          fill="#4B5563"
                          fontSize="9"
                          fontWeight="500"
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  );
                }}
                height={60}
                interval={0}
              />

              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000000000)
                    return `$${(value / 1000000000000).toFixed(1)} Bill`;
                  if (value >= 1000000000)
                    return `$${(value / 1000000000).toFixed(1)} Mil M`;
                  if (value >= 2000000)
                    return `$${(value / 1000000).toFixed(1)} Mill`;
                  if (value >= 1000000)
                    return `$${(value / 1000000).toFixed(1)} Millón`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)} Mil`;
                  return `$${value}`;
                }}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                width={90}
              />

              <Tooltip
                formatter={(value: any) => formatNumber(value, "currency")}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />

              {metrics.map((metric) => {
                // DEBUG: Verificar si el dataKey existe en chartData
                const dataKeyExists = chartData.some(
                  (item: any) => metric.key in item,
                );
                const firstValue =
                  chartData.length > 0
                    ? (chartData[0] as any)[metric.key]
                    : undefined;
                console.log(
                  `ðŸ“Š Barra "${metric.label}" (${metric.key}): existe=${dataKeyExists}, primer valor=${firstValue}`,
                );

                return (
                  <Bar
                    key={metric.key}
                    dataKey={metric.key}
                    fill={metric.color}
                    radius={[4, 4, 0, 0]}
                    label={({ x, y, width, value, index }: any) => {
                      if (!value || value === 0) return <g />;

                      // Formato correcto de pesos colombianos
                      let formattedValue = "";
                      if (value >= 1000000000000) {
                        // Billones
                        formattedValue = `$${(value / 1000000000000).toFixed(1)} Bill`;
                      } else if (value >= 1000000000) {
                        // Miles de millones
                        formattedValue = `$${(value / 1000000000).toFixed(1)} Mil M`;
                      } else if (value >= 2000000) {
                        // Millones (plural)
                        formattedValue = `$${(value / 1000000).toFixed(1)} Mill`;
                      } else if (value >= 1000000) {
                        // Millón (singular)
                        formattedValue = `$${(value / 1000000).toFixed(1)} Millón`;
                      } else if (value >= 1000) {
                        // Miles
                        formattedValue = `$${(value / 1000).toFixed(0)} Mil`;
                      } else {
                        formattedValue = `$${value}`;
                      }

                      return (
                        <g>
                          <rect
                            x={x + width / 2 - 35}
                            y={y - 32}
                            width="70"
                            height="24"
                            fill={metric.color}
                            opacity="0.95"
                            rx="5"
                          />
                          <text
                            x={x + width / 2}
                            y={y - 15}
                            fill="white"
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="700"
                          >
                            {formattedValue}
                          </text>
                        </g>
                      );
                    }}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.length > maxItems && (
        <div className="text-center mt-3 p-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded">
          Mostrando {maxItems} de {data.length} bancos â€¢ Desliza para ver más
        </div>
      )}
    </motion.div>
  );
};

// Componente CentroGestorBarChart
const CentroGestorBarChart: React.FC<{
  data: AnalysisByCentroGestor[];
  title?: string;
  maxItems?: number;
}> = ({ data, title = "Análisis por Centro Gestor", maxItems = 100 }) => {
  // Mostrar todos los centros gestores, ordenados por valor asignado descendente
  const chartData = useMemo(() => {
    return [...data].sort(
      (a, b) => b.valorAsignadoBanco - a.valorAsignadoBanco,
    );
  }, [data]);

  // Debug: Verificar datos recibidos
  console.log(
    "ðŸ“Š DEBUG CentroGestorBarChart - Datos recibidos:",
    chartData.map((d) => ({
      centro: d.centroGestor,
      valorAsignadoBanco: d.valorAsignadoBanco,
      valorAsignadoProyecciones: d.valorAsignadoProyecciones,
      valorAdjudicado: d.valorAdjudicado,
      valorEjecutado: d.valorEjecutado,
      valorPagado: d.valorPagado,
    })),
  );

  const metrics = [
    { key: "valorAsignadoBanco", label: "Asignado Banco", color: "#F59E0B" },
    { key: "valorAdjudicado", label: "Valor Adjudicado", color: "#3B82F6" },
    { key: "valorEjecutado", label: "Ejecución Financiera", color: "#10B981" },
    { key: "valorPagado", label: "Pagos", color: "#8B5CF6" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex flex-col border border-gray-100 dark:border-gray-700 w-full max-w-full overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Leyenda simple */}
      <div className="flex flex-wrap gap-4 mb-2 text-sm">
        {metrics.map((metric) => (
          <div key={metric.key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: metric.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {metric.label}
            </span>
          </div>
        ))}
      </div>

      {/* Gráfico con scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden w-full">
        <div
          style={{
            minWidth: `${Math.max(800, chartData.length * 120)}px`,
            height: "550px",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 40, right: 10, left: 10, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                opacity={0.5}
              />

              <XAxis
                dataKey="centroGestor"
                tick={({ x, y, payload }) => {
                  const text = payload.value as string;
                  const words = text.split(" ");
                  const lines: string[] = [];
                  let currentLine = "";

                  // Aumentar caracteres por línea para nombres horizontales
                  words.forEach((word) => {
                    if ((currentLine + " " + word).length <= 20) {
                      currentLine += (currentLine ? " " : "") + word;
                    } else {
                      if (currentLine) lines.push(currentLine);
                      currentLine = word;
                    }
                  });
                  if (currentLine) lines.push(currentLine);

                  return (
                    <g transform={`translate(${x},${y})`}>
                      {lines.map((line, i) => (
                        <text
                          key={i}
                          x={0}
                          y={i * 11 + 5}
                          textAnchor="middle"
                          fill="#4B5563"
                          fontSize="9"
                          fontWeight="500"
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  );
                }}
                height={90}
                interval={0}
              />

              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000000000)
                    return `$${(value / 1000000000000).toFixed(1)} Bill`;
                  if (value >= 1000000000)
                    return `$${(value / 1000000000).toFixed(1)} Mil M`;
                  if (value >= 2000000)
                    return `$${(value / 1000000).toFixed(1)} Mill`;
                  if (value >= 1000000)
                    return `$${(value / 1000000).toFixed(1)} Millón`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)} Mil`;
                  return `$${value}`;
                }}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                width={90}
              />

              <Tooltip
                formatter={(value: any) => formatNumber(value, "currency")}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "2px solid #E5E7EB",
                  borderRadius: "12px",
                  fontSize: "13px",
                  padding: "12px",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
                labelStyle={{
                  fontWeight: "bold",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#1F2937",
                }}
                itemStyle={{
                  padding: "4px 0",
                  fontSize: "13px",
                }}
              />

              {metrics.map((metric, metricIndex) => (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  fill={metric.color}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey={metric.key}
                    content={({ x, y, width, height, value, index }: any) => {
                      // Formato del valor - mostrar $0 si no hay valor
                      let formattedValue = "";
                      if (!value || value === 0) {
                        formattedValue = "$0";
                      } else if (value >= 1000000000000) {
                        formattedValue = `$${(value / 1000000000000).toFixed(1)}B`;
                      } else if (value >= 1000000000) {
                        formattedValue = `$${(value / 1000000000).toFixed(1)}MM`;
                      } else if (value >= 1000000) {
                        formattedValue = `$${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        formattedValue = `$${(value / 1000).toFixed(0)}K`;
                      } else {
                        formattedValue = `$${value}`;
                      }

                      // Determinar posición: dentro si hay espacio, fuera si no
                      const hasSpace = height >= 50;

                      if (hasSpace) {
                        // Etiqueta DENTRO de la barra
                        return (
                          <text
                            x={x + width / 2}
                            y={y + height / 2}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="10"
                            fontWeight="700"
                            transform={`rotate(-90 ${x + width / 2} ${y + height / 2})`}
                            style={{
                              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                              pointerEvents: "none",
                            }}
                          >
                            {formattedValue}
                          </text>
                        );
                      } else {
                        // Etiqueta ENCIMA de la barra (vertical)
                        // Offset muy pequeño, solo para separar del borde de la barra
                        const labelY = y - 8;

                        return (
                          <text
                            x={x + width / 2}
                            y={labelY}
                            fill={metric.color}
                            textAnchor="start"
                            dominantBaseline="middle"
                            fontSize="10"
                            fontWeight="700"
                            transform={`rotate(-90 ${x + width / 2} ${labelY})`}
                            style={{
                              pointerEvents: "none",
                            }}
                          >
                            {formattedValue}
                          </text>
                        );
                      }
                    }}
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {chartData.length > 6 && (
        <div className="text-center mt-3 p-2 text-sm text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 rounded">
          Mostrando {chartData.length} centros gestores â€¢ Desliza para ver más
        </div>
      )}
    </motion.div>
  );
};

// Componente AvanceFisicoChart
const AvanceFisicoChart: React.FC<{
  analysisByCentroGestor: AnalysisByCentroGestor[];
  contratos: any[];
  reportes: any[];
}> = ({ analysisByCentroGestor, contratos, reportes }) => {
  const chartData = useMemo(() => {
    return analysisByCentroGestor
      .map((centro) => {
        const contratosDelCentro = contratos.filter(
          (c) =>
            (c.nombre_centro_gestor || "Sin definir") === centro.centroGestor,
        );

        let totalAvanceFisicoPonderado = 0;
        let totalValorContratos = 0;

        contratosDelCentro.forEach((contrato) => {
          const reporteContrato = reportes
            .filter(
              (r) => r.referencia_contrato === contrato.referencia_contrato,
            )
            .sort(
              (a, b) =>
                new Date(b.fecha_reporte).getTime() -
                new Date(a.fecha_reporte).getTime(),
            )[0];

          if (reporteContrato) {
            const avanceFisico = reporteContrato.avance_fisico || 0;
            const valorContrato = Number(contrato.valor_contrato) || 0;

            totalAvanceFisicoPonderado += avanceFisico * valorContrato;
            totalValorContratos += valorContrato;
          }
        });

        const promedioAvanceFisico =
          totalValorContratos > 0
            ? totalAvanceFisicoPonderado / totalValorContratos
            : 0;

        return {
          name: centro.centroGestor,
          avanceFisico: promedioAvanceFisico,
          valorAdjudicado: centro.valorAdjudicado,
        };
      })
      .sort((a, b) => b.valorAdjudicado - a.valorAdjudicado);
  }, [analysisByCentroGestor, contratos, reportes]);

  return (
    <div className="min-w-0 mb-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 pb-2"
      >
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            Avance Físico por Organismo
          </h4>
        </div>

        <div className="overflow-x-auto w-full">
          <div
            style={{
              minWidth: `${Math.max(1000, chartData.length * 150)}px`,
              height: "500px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 30, right: 20, left: 20, bottom: 100 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  opacity={0.5}
                />

                <XAxis
                  dataKey="name"
                  tick={({ x, y, payload }) => {
                    const text = payload.value as string;
                    const words = text.split(" ");
                    const lines: string[] = [];
                    let currentLine = "";

                    words.forEach((word) => {
                      const testLine = currentLine
                        ? `${currentLine} ${word}`
                        : word;
                      if (testLine.length <= 20) {
                        currentLine = testLine;
                      } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                      }
                    });
                    if (currentLine) lines.push(currentLine);

                    return (
                      <g transform={`translate(${x},${y})`}>
                        {lines.map((line, i) => (
                          <text
                            key={i}
                            x={0}
                            y={5 + i * 13}
                            textAnchor="middle"
                            fill="#374151"
                            fontSize="11"
                            fontWeight="500"
                          >
                            {line}
                          </text>
                        ))}
                      </g>
                    );
                  }}
                  height={90}
                  interval={0}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  tickFormatter={(value) => `${value}%`}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number) => [
                    `${value.toFixed(1)}%`,
                    "Avance Físico",
                  ]}
                  labelStyle={{ color: "#1F2937", fontWeight: "bold" }}
                />

                <Bar
                  dataKey="avanceFisico"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="avanceFisico"
                    position="top"
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    style={{
                      fontSize: "10px",
                      fill: "#1F2937",
                      fontWeight: "bold",
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {chartData.length > 6 && (
          <div className="text-center mt-3 p-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded">
            Mostrando {chartData.length} organismos â€¢ Desliza para ver más
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Componente unificado para análisis financiero con toggle
const FinancialAnalysisToggle: React.FC<{
  bankData: AnalysisByBank[];
  centroGestorData: AnalysisByCentroGestor[];
  centroGestorV2Data: AnalysisByCentroGestorV2[];
  yearData: AnalysisByYear[];
}> = ({ bankData, centroGestorData, centroGestorV2Data, yearData }) => {
  const [viewMode, setViewMode] = useState<"banco" | "centroGestor" | "year">(
    "banco",
  );
  const [selectedCentroGestor, setSelectedCentroGestor] =
    useState<string>("Todos");
  const [selectedBanco, setSelectedBanco] = useState<string>("Todos");
  const [showCentrosBreakdown, setShowCentrosBreakdown] = useState(false);
  const [showBancosBreakdown, setShowBancosBreakdown] = useState(false);

  // Obtener lista de centros gestores únicos desde yearData
  const centrosGestoresOptions = useMemo(() => {
    const centros = new Set<string>();
    yearData.forEach((year) => {
      year.centrosGestores.forEach((c) => centros.add(c.nombre));
    });
    return ["Todos", ...Array.from(centros).sort()];
  }, [yearData]);

  // Obtener lista de bancos únicos desde yearData
  const bancosOptions = useMemo(() => {
    const bancos = new Set<string>();
    yearData.forEach((year) => {
      year.bancos.forEach((b) => bancos.add(b.nombre));
    });
    return ["Todos", ...Array.from(bancos).sort()];
  }, [yearData]);

  // Filtrar datos por centro gestor y banco seleccionado
  const filteredYearData = useMemo(() => {
    if (selectedCentroGestor === "Todos" && selectedBanco === "Todos")
      return yearData;

    return yearData.map((year) => {
      let valorPago = 0;
      let valorAdj = 0;
      let valorReal = 0;

      year.centrosGestores.forEach((centro) => {
        if (
          selectedCentroGestor === "Todos" ||
          centro.nombre === selectedCentroGestor
        ) {
          // Si hay filtro de banco, buscar en asignaciones originales
          if (selectedBanco === "Todos") {
            valorPago += centro.valorProgramadoPago;
            valorAdj += centro.valorProgramadoAdjudicacion;
            valorReal += centro.valorPagado;
          } else {
            // Buscar en bancos del año que coincidan
            year.bancos.forEach((banco) => {
              if (banco.nombre === selectedBanco) {
                // Proporción del banco en el centro gestor (simplificación)
                const proporcion =
                  year.totalAsignado > 0
                    ? banco.totalAsignado / year.totalAsignado
                    : 0;
                valorPago += centro.valorProgramadoPago * proporcion;
                valorAdj += centro.valorProgramadoAdjudicacion * proporcion;
                valorReal += centro.valorPagado * proporcion;
              }
            });
          }
        }
      });

      return {
        year: year.year,
        valorProgramadoPago: valorPago,
        valorProgramadoAdjudicacion: valorAdj,
        valorPagado: valorReal,
        totalAsignado: valorPago + valorAdj,
        centrosGestores: year.centrosGestores,
        bancos: year.bancos,
      };
    });
  }, [yearData, selectedCentroGestor, selectedBanco]);

  const renderYearChart = () => {
    // Preparar datos para gráfico de breakdown si está activado
    const chartData = showCentrosBreakdown
      ? filteredYearData.flatMap((year) =>
          year.centrosGestores
            .filter(
              (c) =>
                selectedCentroGestor === "Todos" ||
                c.nombre === selectedCentroGestor,
            )
            .slice(0, 5) // Top 5 centros
            .map((centro) => ({
              name: `${year.year} - ${centro.nombre.substring(0, 20)}...`,
              year: year.year,
              valorProgramadoPago: centro.valorProgramadoPago,
              valorProgramadoAdjudicacion: centro.valorProgramadoAdjudicacion,
              valorPagado: centro.valorPagado,
              centro: centro.nombre,
            })),
        )
      : showBancosBreakdown
        ? filteredYearData.flatMap((year) =>
            year.bancos
              .filter(
                (b) => selectedBanco === "Todos" || b.nombre === selectedBanco,
              )
              .map((banco) => ({
                name: `${year.year} - ${banco.nombre}`,
                year: year.year,
                valorProgramadoPago: banco.valorProgramadoPago,
                valorProgramadoAdjudicacion: banco.valorProgramadoAdjudicacion,
                valorPagado: banco.valorPagado,
                banco: banco.nombre,
              })),
          )
        : filteredYearData.map((year) => ({
            name: year.year.toString(),
            year: year.year,
            valorProgramadoPago: year.valorProgramadoPago,
            valorProgramadoAdjudicacion: year.valorProgramadoAdjudicacion,
            valorPagado: year.valorPagado,
          }));

    // DEBUG: Log de los datos del gráfico
    console.log(
      "ðŸ“ˆ Datos para gráfico temporal (renderYearChart):",
      chartData.slice(0, 5),
    );

    return (
      <div
        style={{
          width: "100%",
          height: showCentrosBreakdown || showBancosBreakdown ? 600 : 400,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: showCentrosBreakdown || showBancosBreakdown ? 120 : 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="name"
              angle={showCentrosBreakdown || showBancosBreakdown ? -45 : 0}
              textAnchor={
                showCentrosBreakdown || showBancosBreakdown ? "end" : "middle"
              }
              height={showCentrosBreakdown || showBancosBreakdown ? 100 : 60}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              tickFormatter={(val: number) =>
                `$${(val / 1000000000).toFixed(0)}MM`
              }
              width={80}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: "black" }}
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: "8px",
                color: "black",
              }}
            />
            <Legend verticalAlign="top" />
            <Bar
              dataKey="valorProgramadoAdjudicacion"
              name="Asignado Banco"
              fill="#F59E0B"
              barSize={50}
            >
              <LabelList
                dataKey="valorProgramadoAdjudicacion"
                position="top"
                formatter={(val: number) =>
                  val > 0 ? `$${(val / 1000000).toFixed(0)}M` : ""
                }
                style={{
                  fontSize: "11px",
                  fill: "#D97706",
                  fontWeight: "bold",
                }}
              />
            </Bar>
            <Bar
              dataKey="valorPagado"
              name="Pagos Reales"
              fill="#8B5CF6"
              barSize={50}
            >
              <LabelList
                dataKey="valorPagado"
                position="top"
                formatter={(val: number) =>
                  val > 0 ? `$${(val / 1000000).toFixed(0)}M` : ""
                }
                style={{
                  fontSize: "11px",
                  fill: "#5B21B6",
                  fontWeight: "bold",
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 w-full max-w-full overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-teal-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Análisis Financiero
          </h3>
        </div>

        {/* Toggle para cambiar vista */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode("banco")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === "banco"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Por Banco
          </button>
          <button
            onClick={() => setViewMode("centroGestor")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === "centroGestor"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Por Centro Gestor
          </button>
          <button
            onClick={() => setViewMode("year")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === "year"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Temporal
          </button>
        </div>
      </div>

      {/* Contenido según la vista seleccionada */}
      <AnimatePresence mode="wait">
        {viewMode === "banco" && (
          <motion.div
            key="banco-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[600px] w-full overflow-hidden"
          >
            <BankBarChart data={bankData} title="" maxItems={8} />
          </motion.div>
        )}
        {viewMode === "centroGestor" && (
          <motion.div
            key="centro-gestor-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[600px] w-full overflow-hidden"
          >
            <CentroGestorBarChart data={centroGestorData} title="" />
          </motion.div>
        )}
        {viewMode === "year" && (
          <motion.div
            key="year-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full overflow-hidden"
          >
            <h4 className="text-lg font-bold text-center mb-4 text-gray-700 dark:text-gray-200">
              Flujo de Asignaciones por Año
            </h4>

            {/* Filtros y controles */}
            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Centro Gestor
                  </label>
                  <select
                    value={selectedCentroGestor}
                    onChange={(e) => setSelectedCentroGestor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {centrosGestoresOptions.map((centro) => (
                      <option key={centro} value={centro}>
                        {centro}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Banco
                  </label>
                  <select
                    value={selectedBanco}
                    onChange={(e) => setSelectedBanco(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {bancosOptions.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCentrosBreakdown(!showCentrosBreakdown);
                    if (!showCentrosBreakdown) setShowBancosBreakdown(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    showCentrosBreakdown
                      ? "bg-teal-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <Building2 className="w-3 h-3 inline mr-1" />
                  Desglose Centros Gestores
                </button>

                <button
                  onClick={() => {
                    setShowBancosBreakdown(!showBancosBreakdown);
                    if (!showBancosBreakdown) setShowCentrosBreakdown(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    showBancosBreakdown
                      ? "bg-teal-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <Briefcase className="w-3 h-3 inline mr-1" />
                  Desglose Bancos
                </button>

                {(selectedCentroGestor !== "Todos" ||
                  selectedBanco !== "Todos" ||
                  showCentrosBreakdown ||
                  showBancosBreakdown) && (
                  <button
                    onClick={() => {
                      setSelectedCentroGestor("Todos");
                      setSelectedBanco("Todos");
                      setShowCentrosBreakdown(false);
                      setShowBancosBreakdown(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    âœ• Limpiar Filtros
                  </button>
                )}
              </div>
            </div>

            {renderYearChart()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Componente fusionado: Torta + Tabla de Organismos */}
      {(viewMode === "centroGestor" || viewMode === "banco") && (
        <div className="mt-3">
          <OrganismosWithPieChart data={centroGestorData} />
        </div>
      )}
    </motion.div>
  );
};

// Componente de filtros avanzados
const AdvancedFilters: React.FC<{
  filters: any;
  setFilters: (filters: any) => void;
  bancos: string[];
  centrosGestores: string[];
  estados: string[];
  sectores: string[];
  bps: string[];
}> = ({
  filters,
  setFilters,
  bancos,
  centrosGestores,
  estados,
  sectores,
  bps,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <Filter className="w-5 h-5 text-teal-600" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Filtros de Análisis
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Filtro por Banco */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Briefcase className="w-4 h-4 inline mr-1" />
            Banco
          </label>
          <select
            value={filters.banco}
            onChange={(e) => setFilters({ ...filters, banco: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los bancos</option>
            {bancos.map((banco) => (
              <option key={banco} value={banco}>
                {banco}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Centro Gestor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Building2 className="w-4 h-4 inline mr-1" />
            Centro Gestor
          </label>
          <select
            value={filters.centroGestor}
            onChange={(e) =>
              setFilters({ ...filters, centroGestor: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los centros</option>
            {centrosGestores.map((centro) => (
              <option key={centro} value={centro}>
                {centro}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Activity className="w-4 h-4 inline mr-1" />
            Estado
          </label>
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los estados</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Sector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Sector
          </label>
          <select
            value={filters.sector}
            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los sectores</option>
            {sectores.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por BP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            BP (Proyecto)
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.bp}
              onChange={(e) => setFilters({ ...filters, bp: e.target.value })}
              placeholder="Buscar BP..."
              list="bp-list"
              className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <datalist id="bp-list">
              {bps.map((bp) => (
                <option key={bp} value={bp} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() =>
            setFilters({
              banco: "",
              centroGestor: "",
              estado: "",
              sector: "",
              bp: "",
              ano: "",
              fechaInicio: "",
              fechaFin: "",
            })
          }
          className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Limpiar filtros
        </button>
      </div>
    </motion.div>
  );
};

// Componente principal del dashboard avanzado
const EmprestitoAdvancedDashboard: React.FC = () => {
  const { canModifyOrDeleteRecords } = useAuth();
  const canManageRecordActions = canModifyOrDeleteRecords();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("Consolidado");

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Estados para el modal de contratos
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<any>(null);

  // Estados para reportar avances
  const [modalReporte, setModalReporte] = useState<{
    open: boolean;
    contrato: any | null;
  }>({ open: false, contrato: null });
  const [modalEditNombre, setModalEditNombre] = useState<{
    open: boolean;
    contrato: ContratoEmprestito | null;
  }>({ open: false, contrato: null });
  const [modalHistorial, setModalHistorial] = useState<{
    open: boolean;
    contrato: any | null;
  }>({ open: false, contrato: null });
  const activeRefReporte =
    modalReporte.contrato?.referencia_contrato ||
    modalHistorial.contrato?.referencia_contrato ||
    "";
  const {
    reportes: reportesContrato,
    loading: loadingReportes,
    submitting: submittingReporte,
    crearReporte,
    refetch: refetchReportes,
  } = useReportesContrato(activeRefReporte || undefined);
  const resumenReportes = useResumenReportes(reportesContrato);

  // Estado para selector de columnas
  const [columnSettings, setColumnSettings] = useState({
    proceso: true,
    banco: true,
    estado: true,
    valor: true,
    avance: true,
    observaciones: false,
    detalle: true,
    tipo: true,
    modalidad: false,
    sector: false,
    supervisor: false,
    categoria: false,
    fechaInicio: true,
    fechaFin: true,
    diasTranscurridos: false,
    diasRestantes: true,
    acciones: canManageRecordActions,
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "dias_restantes", direction: "asc" });

  useEffect(() => {
    if (!canManageRecordActions) {
      setColumnSettings((prev) => ({ ...prev, acciones: false }));
    }
  }, [canManageRecordActions]);

  const {
    loading,
    error,
    contratos,
    reportes,
    pagos,
    filters,
    setFilters,
    analysisByBank,
    analysisByBankForChart,
    analysisByCentroGestor,
    analysisByCentroGestorV2,
    analysisByYear,
    totalContratos,
    valorTotalAsignado,
    valorTotalAsignadoBanco,
    valorTotalEjecutado,
    valorTotalPagado,
    valorTotalFisico,
    porcentajeFisicoPromedio,
    porcentajeFinancieroPromedio,
    porcentajePagosPromedio,
    yearlySummary,
  } = useEmprestitoRealData();

  const { seguimiento, lastUpdate, loadingSeguimiento } = useSeguimientoData();

  // Debug - verificar valores calculados
  React.useEffect(() => {
    if (!loading && valorTotalAsignado > 0) {
      console.log("ðŸ’° Valores Dashboard:", {
        asignado: valorTotalAsignado.toLocaleString(),
        ejecutado: valorTotalEjecutado.toLocaleString(),
        pagado: valorTotalPagado.toLocaleString(),
        fisico: valorTotalFisico.toLocaleString(),
        porcentEjec:
          ((valorTotalEjecutado / valorTotalAsignado) * 100).toFixed(1) + "%",
        porcentFisico:
          ((valorTotalFisico / valorTotalAsignado) * 100).toFixed(1) + "%",
        porcentFisicoPromedio: porcentajeFisicoPromedio.toFixed(1) + "%",
        porcentFinancieroPromedio:
          porcentajeFinancieroPromedio.toFixed(1) + "%",
      });
    }
  }, [
    loading,
    valorTotalAsignado,
    valorTotalEjecutado,
    valorTotalPagado,
    valorTotalFisico,
    porcentajeFisicoPromedio,
    porcentajeFinancieroPromedio,
  ]);

  // Extraer valores únicos para filtros
  const bancos = useMemo(() => {
    const uniqueBancos = Array.from(
      new Set(contratos.map((c) => c.banco).filter(Boolean)),
    );
    return uniqueBancos.sort();
  }, [contratos]);

  const centrosGestores = useMemo(() => {
    const uniqueCentros = Array.from(
      new Set(contratos.map((c) => c.nombre_centro_gestor).filter(Boolean)),
    );
    return uniqueCentros.sort();
  }, [contratos]);

  const bps = useMemo(() => {
    const uniqueBPs = Array.from(
      new Set(contratos.map((c) => c.bp).filter(Boolean)),
    );
    return uniqueBPs.sort();
  }, [contratos]);

  // Función para manejar ordenamiento
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Contratos ordenados
  const sortedContratos = useMemo(() => {
    if (!sortConfig.key) return contratos;

    return [...contratos].sort((a: any, b: any) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Casos especiales para campos calculados
      if (sortConfig.key === "avance_financiero") {
        // Buscar el reporte más reciente para cada contrato
        const reporteA = reportes
          .filter((r) => r.referencia_contrato === a.referencia_contrato)
          .sort(
            (r1, r2) =>
              new Date(r2.fecha_reporte).getTime() -
              new Date(r1.fecha_reporte).getTime(),
          )[0];
        const reporteB = reportes
          .filter((r) => r.referencia_contrato === b.referencia_contrato)
          .sort(
            (r1, r2) =>
              new Date(r2.fecha_reporte).getTime() -
              new Date(r1.fecha_reporte).getTime(),
          )[0];

        // Obtener el avance financiero del reporte o calcularlo
        aValue =
          reporteA?.avance_financiero ||
          ((a.valor_pagado || 0) / (a.valor_contrato || 1)) * 100;
        bValue =
          reporteB?.avance_financiero ||
          ((b.valor_pagado || 0) / (b.valor_contrato || 1)) * 100;
      } else if (
        sortConfig.key === "dias_transcurridos" ||
        sortConfig.key === "dias_restantes"
      ) {
        const fechaInicioA = a.fecha_firma_contrato
          ? new Date(a.fecha_firma_contrato)
          : null;
        const fechaFinA = a.fecha_fin_contrato
          ? new Date(a.fecha_fin_contrato)
          : null;
        const fechaInicioB = b.fecha_firma_contrato
          ? new Date(b.fecha_firma_contrato)
          : null;
        const fechaFinB = b.fecha_fin_contrato
          ? new Date(b.fecha_fin_contrato)
          : null;
        const fechaActual = new Date();

        if (sortConfig.key === "dias_transcurridos") {
          aValue = fechaInicioA
            ? Math.floor(
                (fechaActual.getTime() - fechaInicioA.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null;
          bValue = fechaInicioB
            ? Math.floor(
                (fechaActual.getTime() - fechaInicioB.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null;
        } else {
          aValue = fechaFinA
            ? Math.floor(
                (fechaFinA.getTime() - fechaActual.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null;
          bValue = fechaFinB
            ? Math.floor(
                (fechaFinB.getTime() - fechaActual.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null;
        }
      }

      // Manejar valores nulos o indefinidos
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Comparación numérica
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // Comparación de strings
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [contratos, sortConfig, reportes]);

  // Cálculos de paginación
  const totalItems = sortedContratos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedContratos.slice(startIndex, endIndex);

  // Función para cambiar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para cambiar items por página
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset a primera página
  };

  // Función para abrir el modal con los datos del contrato
  const handleOpenModal = (contrato: ContratoEmprestito) => {
    // Buscar TODOS los reportes históricos para este contrato (para la gráfica de evolución)
    const reportesContrato = reportes
      .filter((r) => r.referencia_contrato === contrato.referencia_contrato)
      .sort(
        (a, b) =>
          new Date(b.fecha_reporte).getTime() -
          new Date(a.fecha_reporte).getTime(),
      );

    // Tomar el reporte más reciente para los datos principales
    const reporteContrato = reportesContrato[0];

    // Combinar datos del contrato con datos del reporte para el modal
    const contratoCompleto = {
      // Datos principales del contrato
      ...contrato,
      // Mapear campos del contrato al formato esperado por el modal
      referencia_del_contrato: contrato.referencia_contrato,
      nombre_entidad: contrato.nombre_centro_gestor,
      proveedor_adjudicado:
        contrato.nombre_contratista ||
        contrato.representante_legal ||
        "Sin asignar",
      valor_del_contrato: contrato.valor_contrato,
      descripcion_del_proceso: contrato.descripcion_proceso,
      tipo_de_contrato: contrato.tipo_contrato,
      modalidad_de_contratacion: contrato.modalidad_contratacion,
      fecha_de_firma: contrato.fecha_firma_contrato,
      fecha_de_fin_del_contrato: contrato.fecha_fin_contrato,
      fecha_inicio_ejecucion: contrato.fecha_inicio_contrato,
      nombre_supervisor: contrato.supervisor,
      // Datos del reporte si están disponibles
      ...(reporteContrato && {
        ejecucion_fisica: reporteContrato.avance_fisico,
        ejecucion_financiera: reporteContrato.avance_financiero,
        observaciones_reporte: reporteContrato.observaciones,
        fecha_ultimo_reporte: reporteContrato.fecha_reporte,
        alertas_reporte: reporteContrato.alertas,
      }),
      // Incluir TODOS los reportes históricos para la gráfica de evolución
      reportes: reportesContrato,
      // Campos calculados
      pagos: parseInt(contrato.valor_pagado) || 0,
      avance_financiero_calculado: reporteContrato?.avance_financiero || 0,
      avance_fisico_calculado: reporteContrato?.avance_fisico || 0,
    };

    setSelectedContrato(contratoCompleto);
    setModalOpen(true);
  };

  const estados = useMemo(() => {
    const uniqueEstados = Array.from(
      new Set(contratos.map((c) => c.estado_contrato).filter(Boolean)),
    );
    return uniqueEstados.sort();
  }, [contratos]);

  const sectores = useMemo(() => {
    const uniqueSectores = Array.from(
      new Set(contratos.map((c) => c.sector).filter(Boolean)),
    );
    return uniqueSectores.sort();
  }, [contratos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">
            Cargando dashboard avanzado...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 m-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-800/30 rounded-full flex items-center justify-center">
            <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Error de conexión con API
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex relative w-full max-w-full overflow-hidden">
      {/* Contenido principal */}
      <div
        className="flex-1 space-y-3 sm:space-y-4 p-4 sm:p-6 transition-all duration-300 min-w-0"
        style={{ marginRight: showFilters ? "320px" : "0" }}
      >
        {/* Título del Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        ></motion.div>

        {/* Resumen Ejecutivo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-full overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Resumen Ejecutivo
            </h3>
          </div>

          {/* Consolidado General - Siempre visible */}
          <div className="mb-4">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Consolidado General
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Contratos Totales
                </p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {formatNumber(totalContratos)}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Valor Total Contratos
                </p>
                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                  {formatNumber(valorTotalAsignado, "currency")}
                </p>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Asignado Banco
                </p>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                  {formatNumber(valorTotalAsignadoBanco, "currency")}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Bancos Activos
                </p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                  {analysisByBank.length}
                </p>
              </div>
              <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-2 border-teal-200 dark:border-teal-800">
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                  Centros Gestores
                </p>
                <p className="text-xl font-bold text-teal-700 dark:text-teal-300">
                  {analysisByCentroGestor.length}
                </p>
              </div>
            </div>
          </div>

          {/* Indicadores de Ejecución con Gráficos de Anillos y Línea Temporal */}
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Indicadores de Ejecución
            </h4>

            {/* Anillos en una sola fila */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
              {/* Ejecución Física */}
              <div className="min-w-0">
                <GaugeChart
                  title="Ejecución Física"
                  description="Aprox. (reportado por el organismo)"
                  percentage={porcentajeFisicoPromedio}
                  value={valorTotalFisico}
                  total={valorTotalAsignado}
                  color="text-cyan-500"
                  icon={<Activity className="w-5 h-5 text-cyan-600" />}
                  showMonetaryValues={true}
                />
              </div>

              {/* Ejecución Financiera */}
              <div className="min-w-0">
                <GaugeChart
                  title="Ejecución Financiera"
                  description="Aprox. (reportado por el organismo)"
                  percentage={porcentajeFinancieroPromedio}
                  value={valorTotalEjecutado}
                  total={valorTotalAsignado}
                  color="text-indigo-500"
                  icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
                  showMonetaryValues={true}
                />
              </div>

              {/* Pagos Realizados */}
              <div className="min-w-0">
                <GaugeChart
                  title="Pagos Realizados"
                  description="Gestión de RPC"
                  percentage={porcentajePagosPromedio}
                  value={valorTotalPagado}
                  total={valorTotalAsignado}
                  color="text-pink-500"
                  icon={<DollarSign className="w-5 h-5 text-pink-600" />}
                  showMonetaryValues={true}
                />
              </div>
            </div>

            {/* Gráfica de Avance Físico por Organismo */}
            <AvanceFisicoChart
              analysisByCentroGestor={analysisByCentroGestor}
              contratos={contratos}
              reportes={reportes}
            />

            {/* Gráfica de línea temporal + Variación */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {/* Gráfica de evolución temporal */}
              <div className="lg:col-span-3 min-w-0">
                <WeeklyProgressChart
                  data={reportes}
                  contratos={contratos}
                  maxAvance={porcentajeFisicoPromedio}
                />
              </div>

              {/* Variación entre semanas */}
              <WeeklyVariationPanel reportes={reportes} contratos={contratos} />
            </div>
          </div>
        </motion.div>

        {/* Análisis Financiero Unificado */}
        <FinancialAnalysisToggle
          bankData={analysisByBankForChart}
          centroGestorData={analysisByCentroGestor}
          centroGestorV2Data={analysisByCentroGestorV2}
          yearData={analysisByYear}
        />

        {/* Tabla de Contratos Detallada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Contratos Detallados ({formatNumber(contratos.length)})
                </h3>
                {lastUpdate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ãšltima actualización:{" "}
                    {new Date(lastUpdate).toLocaleString("es-CO")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loadingSeguimiento && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Actualizando...
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Columnas
                </button>

                {/* Dropdown de columnas */}
                {showColumnSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-10 p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {[
                        { key: "proceso", label: "Proceso / Centro Gestor" },
                        { key: "banco", label: "Banco" },
                        { key: "estado", label: "Estado" },
                        { key: "valor", label: "Valor Contrato" },
                        { key: "avance", label: "Avance Ejecución" },
                        {
                          key: "observaciones",
                          label: "Observaciones / Alertas",
                        },
                        { key: "tipo", label: "Tipo Contrato" },
                        { key: "modalidad", label: "Modalidad Contratación" },
                        { key: "sector", label: "Sector" },
                        { key: "categoria", label: "Código Categoría" },
                        { key: "supervisor", label: "Supervisor" },
                        { key: "fechaInicio", label: "Fecha Inicio" },
                        { key: "fechaFin", label: "Fecha Fin" },
                        {
                          key: "diasTranscurridos",
                          label: "Días Transcurridos",
                        },
                        { key: "diasRestantes", label: "Días Restantes" },
                        { key: "detalle", label: "Detalle" },
                        ...(canManageRecordActions
                          ? [{ key: "acciones", label: "Acciones Avance" }]
                          : []),
                      ].map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={
                              columnSettings[
                                col.key as keyof typeof columnSettings
                              ]
                            }
                            onChange={(e) =>
                              setColumnSettings({
                                ...columnSettings,
                                [col.key]: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {col.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Tabla Responsiva Mejorada */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: "auto" }}>
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {columnSettings.proceso && (
                    <th
                      className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "150px", width: "20%" }}
                    >
                      <div className="flex items-center gap-2">
                        <div>
                          <div>Proceso / Centro Gestor</div>
                          <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                            Nombre - Entidad - Referencia
                          </div>
                        </div>
                        <button
                          onClick={() => handleSort("nombre_resumido_proceso")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "nombre_resumido_proceso" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.banco && (
                    <th
                      className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "70px", width: "7%" }}
                    >
                      <div className="flex items-center gap-2">
                        <span>Banco</span>
                        <button
                          onClick={() => handleSort("banco")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "banco" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.estado && (
                    <th
                      className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "70px", width: "6%" }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>Estado</span>
                        <button
                          onClick={() => handleSort("estado")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "estado" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.valor && (
                    <th
                      className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "100px", width: "10%" }}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <span>Valor Contrato</span>
                        <button
                          onClick={() => handleSort("valor_contrato")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "valor_contrato" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.avance && (
                    <th
                      className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "100px", width: "9%" }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div>
                          <div>Avance Ejecución</div>
                          <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                            Financiero / Físico
                          </div>
                        </div>
                        <button
                          onClick={() => handleSort("avance_financiero")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "avance_financiero" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.observaciones && (
                    <th
                      className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "150px", width: "15%" }}
                    >
                      Observaciones / Alertas
                    </th>
                  )}
                  {columnSettings.tipo && (
                    <th
                      className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "70px", width: "6%" }}
                    >
                      <div className="flex items-center gap-2">
                        <span>Tipo Contrato</span>
                        <button
                          onClick={() => handleSort("tipo_contrato")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "tipo_contrato" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.modalidad && (
                    <th
                      className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "110px", width: "10%" }}
                    >
                      <div className="flex items-center gap-2">
                        <span>Modalidad</span>
                        <button
                          onClick={() => handleSort("modalidad_contratacion")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "modalidad_contratacion" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.sector && (
                    <th
                      className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "100px", width: "8%" }}
                    >
                      <div className="flex items-center gap-2">
                        <span>Sector</span>
                        <button
                          onClick={() => handleSort("sector")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "sector" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.categoria && (
                    <th
                      className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "100px", width: "8%" }}
                    >
                      <div className="flex items-center gap-2">
                        <span>Categoría</span>
                        <button
                          onClick={() => handleSort("codigo_categoria")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "codigo_categoria" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.supervisor && (
                    <th
                      className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "110px", width: "10%" }}
                    >
                      <div className="flex items-center gap-2">
                        <span>Supervisor</span>
                        <button
                          onClick={() => handleSort("supervisor")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "supervisor" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.fechaInicio && (
                    <th
                      className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "80px", width: "8%" }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>Fecha Inicio</span>
                        <button
                          onClick={() => handleSort("fecha_firma_contrato")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "fecha_firma_contrato" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.fechaFin && (
                    <th
                      className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "80px", width: "8%" }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>Fecha Fin</span>
                        <button
                          onClick={() => handleSort("fecha_fin_contrato")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "fecha_fin_contrato" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.diasTranscurridos && (
                    <th
                      className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "90px", width: "8%" }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div>
                          <div>Días</div>
                          <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                            Transcurridos
                          </div>
                        </div>
                        <button
                          onClick={() => handleSort("dias_transcurridos")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "dias_transcurridos" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.diasRestantes && (
                    <th
                      className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "75px", width: "6%" }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div>
                          <div>Días</div>
                          <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                            Restantes
                          </div>
                        </div>
                        <button
                          onClick={() => handleSort("dias_restantes")}
                          className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded"
                        >
                          {sortConfig.key === "dias_restantes" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {columnSettings.detalle && (
                    <th
                      className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "60px", width: "5%" }}
                    >
                      Detalle
                    </th>
                  )}
                  {canManageRecordActions && columnSettings.acciones && (
                    <th
                      className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm"
                      style={{ minWidth: "100px", width: "8%" }}
                    >
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((contrato, index) => {
                  // Buscar datos de reporte más reciente para este contrato
                  const reporteContrato = reportes
                    .filter(
                      (r) =>
                        r.referencia_contrato === contrato.referencia_contrato,
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.fecha_reporte).getTime() -
                        new Date(a.fecha_reporte).getTime(),
                    )[0];

                  return (
                    <motion.tr
                      key={contrato.referencia_contrato}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {columnSettings.proceso && (
                        <td className="py-3 px-2 text-sm align-top">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 dark:text-white text-xs leading-tight break-words">
                              {contrato.nombre_resumido_proceso ||
                                "Sin proceso"}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight break-words">
                              {contrato.nombre_centro_gestor ||
                                "Sin centro gestor"}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-mono break-all">
                              {contrato.referencia_contrato || "Sin referencia"}
                            </div>
                          </div>
                        </td>
                      )}
                      {columnSettings.banco && (
                        <td className="py-3 px-2 text-sm text-left text-gray-700 dark:text-gray-300">
                          <div
                            className="truncate text-xs"
                            title={contrato.banco || "No especificado"}
                          >
                            {contrato.banco || "N/A"}
                          </div>
                        </td>
                      )}
                      {columnSettings.estado && (
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`px-2 py-1 text-xs rounded-full inline-block max-w-full truncate ${
                              contrato.estado_contrato === "En ejecución"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : contrato.estado_contrato === "Aprobado"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                            title={contrato.estado_contrato}
                          >
                            {contrato.estado_contrato?.substring(0, 12) ||
                              "N/A"}
                          </span>
                        </td>
                      )}
                      {columnSettings.valor && (
                        <td className="py-3 px-2 text-sm text-right font-medium text-gray-700 dark:text-gray-300">
                          <div
                            className="truncate text-xs"
                            title={formatNumber(
                              Number(
                                contrato.valor_contrato ||
                                  contrato.valor_del_contrato ||
                                  0,
                              ),
                              "currency",
                            )}
                          >
                            {formatNumber(
                              Number(
                                contrato.valor_contrato ||
                                  contrato.valor_del_contrato ||
                                  0,
                              ),
                              "currency",
                            )}
                          </div>
                        </td>
                      )}
                      {columnSettings.avance && (
                        <td className="py-3 px-2 text-center">
                          <div className="space-y-2">
                            {/* Progress bar para Avance Financiero - más compacto */}
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400 text-xs">
                                  Fin.
                                </span>
                                <span className="font-medium text-xs">
                                  {reporteContrato?.avance_financiero?.toFixed(
                                    1,
                                  ) || "0"}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(reporteContrato?.avance_financiero || 0, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            {/* Progress bar para Avance Físico - más compacto */}
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400 text-xs">
                                  Fís.
                                </span>
                                <span className="font-medium text-xs">
                                  {reporteContrato?.avance_fisico?.toFixed(1) ||
                                    "0"}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(reporteContrato?.avance_fisico || 0, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            {reporteContrato?.fecha_reporte && (
                              <div className="text-xs text-gray-400 text-center truncate">
                                {new Date(
                                  reporteContrato.fecha_reporte,
                                ).toLocaleDateString("es-CO", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {columnSettings.observaciones && (
                        <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                          <div
                            className="text-xs break-words overflow-hidden"
                            style={{ maxHeight: "4rem" }}
                          >
                            {(() => {
                              const observaciones = [];

                              // Revisar si hay retrasos basados en fechas del contrato
                              const fechaFin = contrato.fecha_fin_contrato
                                ? new Date(contrato.fecha_fin_contrato)
                                : null;
                              if (
                                fechaFin &&
                                fechaFin < new Date() &&
                                ![
                                  "Liquidado",
                                  "Terminado",
                                  "Finalizado",
                                ].includes(contrato.estado_contrato)
                              ) {
                                observaciones.push("âš ï¸ Contrato vencido");
                              }

                              // Revisar avance financiero vs físico si hay reportes
                              if (reporteContrato) {
                                const avanceFinanciero =
                                  reporteContrato.avance_financiero || 0;
                                const avanceFisico =
                                  reporteContrato.avance_fisico || 0;

                                if (avanceFinanciero > avanceFisico + 15) {
                                  observaciones.push(
                                    "ðŸ“ˆ Avance financiero elevado",
                                  );
                                } else if (
                                  avanceFisico >
                                  avanceFinanciero + 15
                                ) {
                                  observaciones.push(
                                    "ðŸ“‰ Avance financiero rezagado",
                                  );
                                }
                              }

                              // Revisar si está próximo a vencer
                              if (fechaFin) {
                                const diasRestantes = Math.ceil(
                                  (fechaFin.getTime() - new Date().getTime()) /
                                    (1000 * 60 * 60 * 24),
                                );
                                if (diasRestantes <= 30 && diasRestantes > 0) {
                                  observaciones.push("ðŸ”” Próximo a vencer");
                                }
                              }

                              // Revisar contratos sin supervisión
                              if (
                                !contrato.supervisor ||
                                contrato.supervisor === "No definido"
                              ) {
                                observaciones.push(
                                  "ðŸ‘¤ Sin supervisor asignado",
                                );
                              }

                              // Revisar contratos sin contratista
                              if (!contrato.nombre_contratista) {
                                observaciones.push(
                                  "ðŸ¢ Sin contratista asignado",
                                );
                              }

                              // Mostrar observaciones del reporte si las hay
                              if (reporteContrato?.observaciones) {
                                observaciones.push(
                                  `ðŸ’¬ ${reporteContrato.observaciones}`,
                                );
                              }

                              return observaciones.length > 0
                                ? observaciones.join(" â€¢ ")
                                : "Sin observaciones";
                            })()}
                          </div>
                          {reporteContrato?.alertas?.es_alerta && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                âš {" "}
                                {reporteContrato.alertas.descripcion ||
                                  "Alerta"}
                              </span>
                            </div>
                          )}
                        </td>
                      )}
                      {columnSettings.tipo && (
                        <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300">
                          <div
                            className="truncate"
                            title={
                              (contrato as any).tipo_contrato ||
                              (contrato as any).tipo_de_contrato ||
                              "N/A"
                            }
                          >
                            {(contrato as any).tipo_contrato ||
                              (contrato as any).tipo_de_contrato ||
                              "N/A"}
                          </div>
                        </td>
                      )}
                      {columnSettings.modalidad && (
                        <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300">
                          <div
                            className="truncate"
                            title={
                              (contrato as any).modalidad_contratacion ||
                              (contrato as any).modalidad_de_selecci_n ||
                              "N/A"
                            }
                          >
                            {(contrato as any).modalidad_contratacion ||
                              (contrato as any).modalidad_de_selecci_n ||
                              "N/A"}
                          </div>
                        </td>
                      )}
                      {columnSettings.sector && (
                        <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300">
                          <div
                            className="truncate"
                            title={contrato.sector || "N/A"}
                          >
                            {contrato.sector || "N/A"}
                          </div>
                        </td>
                      )}
                      {columnSettings.categoria && (
                        <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300">
                          <div
                            className="truncate font-mono"
                            title={
                              (contrato as any).codigo_categoria_principal ||
                              (contrato as any).codigo_secop ||
                              "N/A"
                            }
                          >
                            {(contrato as any).codigo_categoria_principal ||
                              (contrato as any).codigo_secop ||
                              "N/A"}
                          </div>
                        </td>
                      )}
                      {columnSettings.supervisor && (
                        <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300">
                          <div
                            className="truncate"
                            title={(contrato as any).nombre_supervisor || "N/A"}
                          >
                            {(contrato as any).nombre_supervisor || "N/A"}
                          </div>
                        </td>
                      )}
                      {columnSettings.fechaInicio && (
                        <td className="py-3 px-2 text-center text-xs text-gray-700 dark:text-gray-300">
                          {contrato.fecha_inicio_contrato
                            ? new Date(
                                contrato.fecha_inicio_contrato,
                              ).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </td>
                      )}
                      {columnSettings.fechaFin && (
                        <td className="py-3 px-2 text-center text-xs text-gray-700 dark:text-gray-300">
                          {contrato.fecha_fin_contrato
                            ? new Date(
                                contrato.fecha_fin_contrato,
                              ).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </td>
                      )}
                      {columnSettings.diasTranscurridos && (
                        <td className="py-3 px-2 text-center text-xs">
                          {(() => {
                            if (!contrato.fecha_inicio_contrato)
                              return <span className="text-gray-400">N/A</span>;
                            const inicio = new Date(
                              contrato.fecha_inicio_contrato,
                            );
                            const hoy = new Date();
                            const diasTranscurridos = Math.floor(
                              (hoy.getTime() - inicio.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                            return (
                              <span
                                className={`font-semibold ${diasTranscurridos < 0 ? "text-gray-400" : "text-blue-600 dark:text-blue-400"}`}
                              >
                                {diasTranscurridos < 0
                                  ? "No iniciado"
                                  : `${diasTranscurridos} días`}
                              </span>
                            );
                          })()}
                        </td>
                      )}
                      {columnSettings.diasRestantes && (
                        <td className="py-3 px-2 text-center text-xs">
                          {(() => {
                            if ((reporteContrato?.avance_fisico ?? 0) >= 100) {
                              return (
                                <span className="font-semibold text-gray-400 dark:text-gray-500">
                                  Finalizado
                                </span>
                              );
                            }
                            if (!contrato.fecha_fin_contrato)
                              return <span className="text-gray-400">N/A</span>;
                            const fin = new Date(contrato.fecha_fin_contrato);
                            const hoy = new Date();
                            const diasRestantes = Math.ceil(
                              (fin.getTime() - hoy.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                            return (
                              <span
                                className={`font-semibold ${
                                  diasRestantes < 0
                                    ? "text-red-600 dark:text-red-400"
                                    : diasRestantes <= 30
                                      ? "text-orange-600 dark:text-orange-400"
                                      : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {diasRestantes < 0
                                  ? `Vencido (${Math.abs(diasRestantes)} días)`
                                  : `${diasRestantes} días`}
                              </span>
                            );
                          })()}
                        </td>
                      )}
                      {columnSettings.detalle && (
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleOpenModal(contrato)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg w-8 h-8 flex items-center justify-center"
                            title="Ver detalles del contrato"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                      {canManageRecordActions && columnSettings.acciones && (
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                setModalReporte({ open: true, contrato })
                              }
                              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-2 rounded-lg w-8 h-8 flex items-center justify-center"
                              title="Reportar avance"
                            >
                              <ClipboardEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setModalHistorial({ open: true, contrato })
                              }
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20 p-2 rounded-lg w-8 h-8 flex items-center justify-center"
                              title="Ver historial de reportes"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setModalEditNombre({ open: true, contrato })
                              }
                              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20 p-2 rounded-lg w-8 h-8 flex items-center justify-center"
                              title="Editar nombre resumido proceso"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Información de paginación */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)}{" "}
                  de {formatNumber(totalItems)} contratos
                </div>

                {/* Selector de items por página */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrar:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(Number(e.target.value))
                    }
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Controles de navegación */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const showPages = 5;
                    let startPage = Math.max(
                      1,
                      currentPage - Math.floor(showPages / 2),
                    );
                    let endPage = Math.min(
                      totalPages,
                      startPage + showPages - 1,
                    );

                    if (endPage - startPage + 1 < showPages) {
                      startPage = Math.max(1, endPage - showPages + 1);
                    }

                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          1
                        </button>,
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span
                            key="ellipsis1"
                            className="px-2 text-gray-500 dark:text-gray-400"
                          >
                            ...
                          </span>,
                        );
                      }
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            i === currentPage
                              ? "text-white bg-teal-600 border border-teal-600"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          }`}
                        >
                          {i}
                        </button>,
                      );
                    }

                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span
                            key="ellipsis2"
                            className="px-2 text-gray-500 dark:text-gray-400"
                          >
                            ...
                          </span>,
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          {totalPages}
                        </button>,
                      );
                    }

                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Botón flotante fijo para filtros - siempre visible */}
      <motion.button
        onClick={() => setShowFilters(!showFilters)}
        className="fixed top-36 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-200 shadow-2xl transform hover:scale-110 active:scale-95"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <Filter className="w-5 h-5" />
        <span className="hidden md:inline font-medium">
          {showFilters ? "Cerrar" : "Filtros"}
        </span>
      </motion.button>

      {/* Panel lateral de filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto border-l border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-teal-600" />
                  Filtros de Análisis
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  âœ•
                </button>
              </div>

              <div className="space-y-4">
                {/* Filtro por Año */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Año
                  </label>
                  <select
                    value={filters.ano || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, ano: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los años</option>
                    {Object.keys(yearlySummary || {})
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Filtro por Banco */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Banco
                  </label>
                  <select
                    value={filters.banco}
                    onChange={(e) =>
                      setFilters({ ...filters, banco: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los bancos</option>
                    {bancos.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Centro Gestor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Centro Gestor
                  </label>
                  <select
                    value={filters.centroGestor}
                    onChange={(e) =>
                      setFilters({ ...filters, centroGestor: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los centros</option>
                    {centrosGestores.map((centro) => (
                      <option key={centro} value={centro}>
                        {centro}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Activity className="w-4 h-4 inline mr-2" />
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) =>
                      setFilters({ ...filters, estado: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los estados</option>
                    {estados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Sector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Sector
                  </label>
                  <select
                    value={filters.sector}
                    onChange={(e) =>
                      setFilters({ ...filters, sector: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los sectores</option>
                    {sectores.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por BP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    BP (Proyecto)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filters.bp}
                      onChange={(e) =>
                        setFilters({ ...filters, bp: e.target.value })
                      }
                      placeholder="Buscar BP..."
                      list="bp-list-sidebar"
                      className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <datalist id="bp-list-sidebar">
                      {bps.map((bp) => (
                        <option key={bp} value={bp} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Botón limpiar filtros */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() =>
                      setFilters({
                        banco: "",
                        centroGestor: "",
                        estado: "",
                        sector: "",
                        bp: "",
                        ano: "",
                        fechaInicio: "",
                        fechaFin: "",
                      })
                    }
                    className="w-full px-4 py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 font-medium rounded-lg transition-colors"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de detalles del contrato */}
      <ContratosModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedContrato(null);
        }}
        contratoData={selectedContrato}
        referenciaContrato={selectedContrato?.referencia_contrato}
        reportes={reportes}
        pagos={pagos}
      />

      {/* Modal para reportar avance de contrato */}
      <RegistrarReporteContratoModal
        isOpen={modalReporte.open}
        onClose={() => setModalReporte({ open: false, contrato: null })}
        referenciaContrato={modalReporte.contrato?.referencia_contrato || ""}
        nombreContrato={
          modalReporte.contrato?.nombre_resumido_proceso ||
          modalReporte.contrato?.objeto_contrato ||
          ""
        }
        onSubmit={async (formData) => {
          const success = await crearReporte(formData);
          if (success) setModalReporte({ open: false, contrato: null });
          return success;
        }}
        submitting={submittingReporte}
      />

      {/* Modal historial de reportes */}
      <HistorialReportesContrato
        isOpen={modalHistorial.open}
        onClose={() => setModalHistorial({ open: false, contrato: null })}
        referenciaContrato={modalHistorial.contrato?.referencia_contrato || ""}
        nombreContrato={
          modalHistorial.contrato?.nombre_resumido_proceso ||
          modalHistorial.contrato?.objeto_contrato ||
          ""
        }
        reportes={reportesContrato}
        resumen={resumenReportes}
        loading={loadingReportes}
        onRefresh={refetchReportes}
      />

      {/* Modal editar nombre resumido proceso */}
      <AnimatePresence>
        {modalEditNombre.open && modalEditNombre.contrato && (
          <EditNombreResumidoModal
            contrato={modalEditNombre.contrato}
            onClose={() => setModalEditNombre({ open: false, contrato: null })}
            onSuccess={() =>
              setModalEditNombre({ open: false, contrato: null })
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Modal Editar Nombre Resumido Proceso ─────────────────────────────────────
const EditNombreResumidoModal: React.FC<{
  contrato: ContratoEmprestito;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ contrato, onClose, onSuccess }) => {
  const refProceso =
    (contrato as any).referencia_proceso || contrato.referencia_contrato || "";
  const [value, setValue] = useState(contrato.nombre_resumido_proceso || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("El nombre resumido no puede estar vacío");
      return;
    }
    if (!refProceso) {
      setError("No se encontró referencia de proceso en este contrato");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await editarNombreResumidoProceso(refProceso, value.trim());
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al actualizar el nombre resumido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Editar Nombre Resumido Proceso
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Referencia:{" "}
              <span className="font-mono font-medium text-gray-700 dark:text-gray-200">
                {refProceso || "—"}
              </span>
            </p>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre resumido proceso <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Nombre resumido del proceso..."
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EmprestitoAdvancedDashboard;

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Building2, PieChart as PieChartIcon } from "lucide-react";
import { CATEGORIES, CHART_COLORS, formatNumber } from "@/lib/design-system";
import { EmprestitoData } from "@/hooks/useEmprestito";

interface EmprestitoChartsProps {
  data: EmprestitoData;
  loading?: boolean;
}

const EmprestitoCharts: React.FC<EmprestitoChartsProps> = ({
  data,
  loading = false,
}) => {
  // Datos para gráfico de barras - Valor por entidad (usando valor_contrato en lugar de valor_del_contrato)
  const valorPorEntidad = React.useMemo(() => {
    const entidadValues = data.contratos.reduce(
      (acc, contrato) => {
        // Usar valor_contrato si está disponible, sino valor_del_contrato como respaldo
        const valorContrato =
          (contrato as any).valor_contrato || contrato.valor_del_contrato || 0;
        acc[contrato.nombre_entidad] =
          (acc[contrato.nombre_entidad] || 0) + valorContrato;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(entidadValues)
      .map(([entidad, valor]) => ({
        entidad:
          entidad.length > 30 ? entidad.substring(0, 30) + "..." : entidad,
        entidadCompleta: entidad,
        valor,
        valorFormatted: formatNumber(valor, "currency"),
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10); // Mostrar solo top 10
  }, [data.contratos]);

  // Datos para gráfico circular - Contratos por estado
  const contratosPorEstado = React.useMemo(() => {
    const estadoCount = data.contratos.reduce(
      (acc, contrato) => {
        acc[contrato.estado_contrato] =
          (acc[contrato.estado_contrato] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(estadoCount)
      .map(([estado, count]) => ({
        estado: estado.length > 20 ? estado.substring(0, 20) + "..." : estado,
        estadoCompleto: estado,
        count,
        percentage: ((count / data.contratos.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data.contratos]);

  // Datos para gráfico circular - Contratos por tipo
  const contratosPorTipo = React.useMemo(() => {
    const tipoCount = data.contratos.reduce(
      (acc, contrato) => {
        acc[contrato.tipo_de_contrato] =
          (acc[contrato.tipo_de_contrato] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(tipoCount)
      .map(([tipo, count]) => ({
        tipo: tipo.length > 25 ? tipo.substring(0, 25) + "..." : tipo,
        tipoCompleto: tipo,
        count,
        percentage: ((count / data.contratos.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Mostrar solo top 8
  }, [data.contratos]);

  // Colores personalizados para el gráfico circular
  const getChartColor = (index: number) => {
    return CHART_COLORS[index % CHART_COLORS.length];
  };

  // Tooltip personalizado mejorado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-md p-4 shadow-none max-w-xs"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: payload[0].color }}
            />
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
              {data.entidadCompleta || data.estadoCompleto || data.tipoCompleto}
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {data.valor ? "Valor:" : "Contratos:"}
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                {data.valorFormatted || data.count}
              </span>
            </div>
            {data.percentage && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Porcentaje:
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                  {data.percentage}%
                </span>
              </div>
            )}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`loading-skeleton-${index}`}
            className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
          >
            <div className="animate-pulse">
              <p className="text-gray-500 dark:text-gray-400">
                Cargando gráficos...
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Gráfico de Barras - Valor por Entidad */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700 lg:col-span-2"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Valor Adjudicado por Entidad
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Top 10 entidades por valor adjudicado de contratos
            </p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={valorPorEntidad}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="entidad"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={11}
                stroke="#6b7280"
              />
              <YAxis
                fontSize={11}
                stroke="#6b7280"
                tickFormatter={(value) => formatNumber(value, "currency")}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="valor"
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
                stroke="#10b981"
                strokeWidth={1}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Gráfico Circular - Contratos por Estado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}
          >
            <PieChartIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contratos por Estado
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Distribución por estado del contrato
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={contratosPorEstado}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
              >
                {contratosPorEstado.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getChartColor(index)}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda personalizada */}
        <div className="mt-4 grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
          {contratosPorEstado.map((item, index) => (
            <div
              key={item.estadoCompleto || `estado-${index}`}
              className="flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getChartColor(index) }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                {item.estadoCompleto}
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {item.count}
              </span>
              <span className="text-xs text-gray-500">
                ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gráfico Circular - Contratos por Tipo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700 lg:col-span-2"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}
          >
            <PieChartIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contratos por Tipo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Distribución por tipo de contrato
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contratosPorTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={1}
                  dataKey="count"
                >
                  {contratosPorTipo.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getChartColor(index)}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda personalizada */}
          <div className="flex flex-col justify-center">
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
              {contratosPorTipo.map((item, index) => (
                <div
                  key={item.tipoCompleto || `tipo-${index}`}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getChartColor(index) }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.tipoCompleto}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.count} contratos ({item.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmprestitoCharts;

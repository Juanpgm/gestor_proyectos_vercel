/**
 * StatCard — Molécula de tarjeta estadística de CaliTrack Design System
 *
 * Combina: Card + número grande + label + ícono + variación opcional (trend).
 * Reutilizable en dashboards de escritorio y en Mobile LITE.
 *
 * Uso:
 *   import { StatCard } from '@/components/molecules'
 *   <StatCard label="Proyectos activos" value={42} icon={<Briefcase />} color="blue" />
 *   <StatCard label="Actividades" value={128} trend={+5} trendLabel="este mes" color="red" />
 */
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/atoms/Spinner";

type StatColor =
  | "blue"
  | "green"
  | "red"
  | "orange"
  | "violet"
  | "teal"
  | "amber"
  | "gray";

export interface StatCardProps {
  label: string;
  value: number | string | null;
  icon?: ReactNode;
  color?: StatColor;
  trend?: number; // positivo = sube, negativo = baja, undefined = sin tendencia
  trendLabel?: string;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const colorMap: Record<
  StatColor,
  { icon: string; value: string; trend: { up: string; down: string } }
> = {
  blue: {
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-300",
    trend: { up: "text-emerald-600", down: "text-red-500" },
  },
  green: {
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-300",
    trend: { up: "text-emerald-600", down: "text-red-500" },
  },
  red: {
    icon: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    value: "text-red-700 dark:text-red-300",
    trend: { up: "text-emerald-600", down: "text-red-500" },
  },
  orange: {
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
    value: "text-orange-700 dark:text-orange-300",
    trend: { up: "text-emerald-600", down: "text-red-500" },
  },
  violet: {
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    value: "text-violet-700 dark:text-violet-300",
    trend: { up: "text-emerald-600", down: "text-red-500" },
  },
  teal: {
    icon: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",
    value: "text-teal-700 dark:text-teal-300",
    trend: { up: "text-emerald-600", down: "text-red-500" },
  },
  amber: {
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-300",
    trend: { up: "text-emerald-600", down: "text-red-500" },
  },
  gray: {
    icon: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    value: "text-gray-700 dark:text-gray-300",
    trend: { up: "text-emerald-600", down: "text-red-500" },
  },
};

export function StatCard({
  label,
  value,
  icon,
  color = "blue",
  trend,
  trendLabel,
  loading = false,
  className,
  onClick,
}: StatCardProps) {
  const c = colorMap[color];
  const hasTrend = trend !== undefined && trend !== null;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      className={cn(
        "flex flex-col gap-3 p-4 rounded-md",
        "bg-white dark:bg-gray-800",
        "border border-gray-200 dark:border-gray-700",
        "shadow-none",
        onClick &&
          "cursor-pointer hover:shadow-sm transition-shadow duration-[var(--motion-normal,250ms)]",
        className,
      )}
    >
      {/* Fila superior: icono + label */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 leading-tight">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              "shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
              c.icon,
            )}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Valor */}
      {loading ? (
        <Spinner size="sm" color="gray" />
      ) : (
        <div
          className={cn(
            "text-3xl font-semibold tabular-nums tracking-tight leading-none",
            c.value,
          )}
        >
          {typeof value === "number"
            ? value.toLocaleString("es-CO")
            : (value ?? "—")}
        </div>
      )}

      {/* Tendencia */}
      {hasTrend && !loading && (
        <div className="flex items-center gap-1 text-xs">
          <span className={trend! >= 0 ? c.trend.up : c.trend.down}>
            {trend! >= 0 ? "↑" : "↓"} {Math.abs(trend!)}
          </span>
          {trendLabel && (
            <span className="text-gray-400 dark:text-gray-500">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

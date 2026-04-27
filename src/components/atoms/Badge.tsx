/**
 * Badge — Átomo de etiqueta/chip de CaliTrack Design System
 *
 * Variantes de color: default | blue | green | red | orange | violet | teal | amber
 * Tamaños: sm | md
 * Puntos de estado: opcional (con dot=true muestra un círculo de color)
 *
 * Uso:
 *   import { Badge } from '@/components/atoms'
 *   <Badge color="blue">Activo</Badge>
 *   <Badge color="red" dot>Vencido</Badge>
 */
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps {
  children: ReactNode;
  color?:
    | "default"
    | "blue"
    | "green"
    | "red"
    | "orange"
    | "violet"
    | "teal"
    | "amber"
    | "gray";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const colorClasses: Record<
  NonNullable<BadgeProps["color"]>,
  { badge: string; dot: string }
> = {
  default: {
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  gray: {
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  green: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  red: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    dot: "bg-red-500",
  },
  orange: {
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  violet: {
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  teal: {
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  amber: {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "text-[10px] px-1.5 py-0.5 rounded gap-1 uppercase tracking-wide",
  md: "text-[11px] px-2 py-0.5 rounded-md gap-1.5 uppercase tracking-wide",
};

export function Badge({
  children,
  color = "default",
  size = "md",
  dot = false,
  className,
}: BadgeProps) {
  const { badge, dot: dotColor } = colorClasses[color];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium whitespace-nowrap",
        badge,
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "shrink-0 rounded-full",
            dotColor,
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

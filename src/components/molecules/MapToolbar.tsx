/**
 * MapToolbar - Shared shell for map controls and lightweight status chips.
 */
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface MapToolbarProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function MapToolbar({
  title,
  subtitle,
  actions,
  className,
}: MapToolbarProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-none",
        "dark:border-gray-700 dark:bg-gray-800",
        className,
      )}
    >
      <div className="min-w-0">
        {title && (
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}

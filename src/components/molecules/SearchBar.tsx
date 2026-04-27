/**
 * SearchBar — Molécula de barra de búsqueda de CaliTrack Design System
 *
 * Combina Input + ícono de búsqueda + botón de limpiar (opcional).
 * Soporta debounce interno para no disparar onChange en cada keystroke.
 *
 * Uso:
 *   import { SearchBar } from '@/components/molecules'
 *   <SearchBar placeholder="Buscar proyecto..." onSearch={setQuery} />
 *   <SearchBar value={query} onChange={setQuery} debounce={400} />
 */
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  debounce?: number; // ms — 0 deshabilita el debounce
  size?: "sm" | "md" | "lg";
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

const sizeClasses = {
  sm: "h-8 text-xs rounded-md",
  md: "h-10 text-sm rounded-md",
  lg: "h-11 text-base rounded-md",
};

const iconSizeMap = { sm: 14, md: 16, lg: 18 };

export function SearchBar({
  placeholder = "Buscar…",
  value: externalValue,
  onSearch,
  onChange,
  debounce = 300,
  size = "md",
  className,
  autoFocus = false,
  disabled = false,
  "aria-label": ariaLabel,
}: SearchBarProps) {
  const isControlled = externalValue !== undefined;
  const [internalValue, setInternalValue] = useState(externalValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync con valor controlado externo
  useEffect(() => {
    if (isControlled) setInternalValue(externalValue!);
  }, [externalValue, isControlled]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    if (!isControlled) setInternalValue(next);

    onChange?.(next);

    if (onSearch) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (debounce === 0) {
        onSearch(next);
      } else {
        timerRef.current = setTimeout(() => onSearch(next), debounce);
      }
    }
  }

  function handleClear() {
    if (!isControlled) setInternalValue("");
    onChange?.("");
    onSearch?.("");
  }

  const displayValue = isControlled ? externalValue! : internalValue;
  const iconSize = iconSizeMap[size];

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      {/* Icono búsqueda */}
      <span className="absolute left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
        <Search size={iconSize} />
      </span>

      <input
        type="search"
        autoFocus={autoFocus}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
          "text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus:border-blue-700",
          "transition-colors duration-[var(--motion-fast,150ms)]",
          "pl-9",
          displayValue ? "pr-9" : "pr-3",
          sizeClasses[size],
          disabled && "opacity-50 cursor-not-allowed",
        )}
      />

      {/* Botón limpiar */}
      {displayValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={iconSize} />
        </button>
      )}
    </div>
  );
}

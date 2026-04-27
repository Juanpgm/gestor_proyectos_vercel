/**
 * Input — Átomo de campo de texto de CaliTrack Design System
 *
 * Soporta:
 *   - Icono izquierdo (leadingIcon)
 *   - Icono derecho (trailingIcon)
 *   - Estados: error, disabled
 *   - Etiqueta + mensaje de error/helper
 *
 * Uso:
 *   import { Input } from '@/components/atoms'
 *   <Input label="Buscar" placeholder="Nombre de proyecto..." leadingIcon={<Search size={14}/>} />
 */
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helper,
      leadingIcon,
      trailingIcon,
      className,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leadingIcon && (
            <span className="absolute left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helper
                  ? `${inputId}-helper`
                  : undefined
            }
            className={cn(
              "w-full h-10 rounded-md border bg-white dark:bg-gray-800",
              "text-sm text-gray-900 dark:text-gray-100",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "transition-colors duration-[var(--motion-fast,150ms)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-0 focus:border-blue-700",
              // Borde
              error
                ? "border-red-400 dark:border-red-600 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 dark:border-gray-600",
              // Padding dinámico
              leadingIcon ? "pl-9" : "pl-3",
              trailingIcon ? "pr-9" : "pr-3",
              // Estado
              disabled &&
                "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900",
              className,
            )}
            {...props}
          />

          {trailingIcon && (
            <span className="absolute right-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {trailingIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
        {!error && helper && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {helper}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

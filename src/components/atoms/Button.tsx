/**
 * Button — Átomo base de CaliTrack Design System
 *
 * Variantes: primary | secondary | ghost | danger | outline
 * Tamaños: sm | md | lg
 * Estados: disabled, loading
 *
 * Uso:
 *   import { Button } from '@/components/atoms'
 *   <Button variant="primary" size="md" onClick={...}>Guardar</Button>
 */
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 border border-blue-800",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:border-gray-600",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 border border-transparent",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-700",
  outline:
    "border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md min-h-[32px]",
  md: "h-10 px-4 text-sm gap-2 rounded-md min-h-[40px]",
  lg: "h-11 px-5 text-base gap-2 rounded-md min-h-[44px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          // Base
          "inline-flex items-center justify-center font-medium tracking-tight",
          "transition-colors duration-[var(--motion-fast,150ms)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2",
          "select-none",
          // Variante + tamaño
          variantClasses[variant],
          sizeClasses[size],
          // Estado
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && (
          <Loader2
            className="animate-spin shrink-0"
            size={size === "sm" ? 12 : size === "md" ? 14 : 16}
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

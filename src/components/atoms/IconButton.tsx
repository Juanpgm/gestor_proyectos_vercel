/**
 * IconButton - Compact icon-only button for toolbars and map controls.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: "neutral" | "primary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const variantClasses: Record<
  NonNullable<IconButtonProps["variant"]>,
  string
> = {
  neutral:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700",
  primary: "bg-blue-700 text-white border border-blue-800 hover:bg-blue-800",
  danger: "bg-red-600 text-white border border-red-700 hover:bg-red-700",
  ghost:
    "bg-transparent text-gray-700 border border-transparent hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
};

const sizeClasses: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon, label, variant = "neutral", size = "sm", className, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";

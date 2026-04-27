/**
 * Select - Minimal and consistent select field for dashboard filters.
 */
import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helper?: string;
  size?: "sm" | "md";
}

const sizeClasses: Record<NonNullable<SelectProps["size"]>, string> = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, options, error, helper, className, id, size = "md", ...props },
    ref,
  ) => {
    const selectId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1 block text-[11px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            className={cn(
              "w-full appearance-none rounded-md border border-gray-300 bg-white pr-8 pl-3",
              "text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus:border-blue-700",
              "transition-colors duration-[var(--motion-fast,150ms)]",
              sizeClasses[size],
              error &&
                "border-red-500 focus-visible:ring-red-600 focus:border-red-600",
              className,
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {!error && helper && (
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

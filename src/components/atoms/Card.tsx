/**
 * Card — Átomo de contenedor de CaliTrack Design System
 *
 * Superficie base con sombra, border-radius y soporte dark mode.
 * Composable con Card.Header, Card.Body, Card.Footer.
 *
 * Uso:
 *   import { Card } from '@/components/atoms'
 *   <Card>
 *     <Card.Header>Título</Card.Header>
 *     <Card.Body>Contenido...</Card.Body>
 *   </Card>
 */
import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  border?: boolean;
  hover?: boolean;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const shadowClasses = {
  none: "",
  sm: "shadow-none",
  md: "shadow-sm",
  lg: "shadow-md",
};

export function Card({
  children,
  padding = "md",
  shadow = "sm",
  border = true,
  hover = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-white dark:bg-gray-800",
        paddingClasses[padding],
        shadowClasses[shadow],
        border && "border border-gray-200 dark:border-gray-700",
        hover &&
          "transition-shadow duration-[var(--motion-normal,250ms)] hover:shadow-sm cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardHeader({ children, className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardBody({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ children, className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 gap-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

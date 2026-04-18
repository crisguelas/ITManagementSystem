/**
 * @file badge.tsx
 * @description Reusable Badge component for status indicators, labels, and tags.
 * Supports multiple variants mapped to asset statuses and conditions.
 */

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Available badge visual variants */
type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "outline";

/* Badge component props */
interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

/* ═══════════════════════════════════════════════════════════════ */
/* VARIANT STYLES                                                  */
/* ═══════════════════════════════════════════════════════════════ */

/* Maps variant names to their Tailwind class strings */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700 border-gray-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  secondary: "bg-primary-50 text-primary-700 border-primary-200",
  outline: "bg-transparent text-gray-600 border-gray-300",
};

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * Badge — Small label component for displaying statuses, categories, and tags.
 * Uses semantic color variants to convey meaning at a glance.
 */
const Badge = ({ variant = "default", className, children }: BadgeProps) => {
  return (
    <span
      className={cn(
        /* Base styles — inline flex, small text, rounded pill */
        "inline-flex items-center px-2.5 py-0.5",
        "text-xs font-medium",
        "border rounded-full",
        "transition-colors duration-200",
        /* Apply variant-specific styles */
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export { Badge };
export type { BadgeProps, BadgeVariant };

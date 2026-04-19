/**
 * @file button.tsx
 * @description Reusable Button component with multiple variants, sizes, and states.
 * Supports loading state, icons, and full Tailwind styling.
 */

import { forwardRef } from "react";

/* Third-party imports */
import { Loader2 } from "lucide-react";

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Available button visual variants */
type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

/* Available button sizes */
type ButtonSize = "sm" | "md" | "lg" | "icon";

/* Button component props extending native button attributes */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

/* ═══════════════════════════════════════════════════════════════ */
/* VARIANT STYLES — Tailwind class maps for each variant           */
/* ═══════════════════════════════════════════════════════════════ */

/* Maps variant names to their Tailwind class strings */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white border-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500",
  secondary:
    "bg-primary-50 text-primary-700 border-primary-100 hover:bg-primary-100 focus-visible:ring-primary-500",
  outline:
    "bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-500",
  ghost:
    "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 focus-visible:ring-gray-500",
  danger:
    "bg-danger text-white border-danger hover:bg-red-600 focus-visible:ring-red-500",
  success:
    "bg-success text-white border-success hover:bg-emerald-600 focus-visible:ring-emerald-500",
};

/* Maps size names to their Tailwind class strings */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-10 w-10 p-0",
};

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * Button — Primary interactive element for user actions.
 * Supports variants (primary, secondary, outline, ghost, danger, success),
 * sizes (sm, md, lg, icon), loading state, and left/right icons.
 * Uses forwardRef for compatibility with form libraries.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        /* Disable button when loading or explicitly disabled */
        disabled={disabled || isLoading}
        className={cn(
          /* Base styles — layout, typography, border, transitions */
          "inline-flex items-center justify-center font-medium border rounded-lg",
          "transition-all duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "active:scale-[0.98]",
          /* Apply variant and size specific styles */
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {/* Show loading spinner when isLoading is true */}
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          /* Icons must not steal pointer events (SVG hit targets in some browsers) */
          leftIcon && <span className="pointer-events-none inline-flex shrink-0">{leftIcon}</span>
        )}

        {/* Render children only if not icon-only size */}
        {size !== "icon" && children}

        {/* Show right icon if provided and not loading */}
        {!isLoading && rightIcon && (
          <span className="pointer-events-none inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

/* Display name for React DevTools */
Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };

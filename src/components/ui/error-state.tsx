/**
 * @file error-state.tsx
 * @description Standardized error message component with retry functionality.
 * Conforms to the rule: "Every component must have an error state with retry".
 */

"use client";

/* Third-party imports */
import { AlertCircle, RefreshCcw } from "lucide-react";

/* Local imports */
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * ErrorState — Visually clear error message with an optional retry button.
 * Used when data fetching fails or an unexpected error occurs in a component.
 */
export const ErrorState = ({
  title = "Something went wrong",
  message = "An error occurred while loading this data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        "bg-red-50/50 rounded-xl border border-red-100",
        "animate-fade-in-up",
        className
      )}
    >
      {/* Error Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
        <AlertCircle className="h-6 w-6 text-danger" aria-hidden="true" />
      </div>

      {/* Error Title and Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">{message}</p>

      {/* Optional Retry Button */}
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          leftIcon={<RefreshCcw className="h-4 w-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

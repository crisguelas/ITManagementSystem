/**
 * @file empty-state.tsx
 * @description Standardized empty state component for when lists/tables have no data.
 * Conforms to the rule: "Every component must have an empty state".
 */

"use client";

/* Third-party imports */
import { PackageOpen } from "lucide-react";

/* Local imports */
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * EmptyState — Visually appealing component pointing out that there is no data.
 * Can include an optional call-to-action button (like "Create Asset").
 */
export const EmptyState = ({
  title = "No data found",
  message = "There are currently no items to display here.",
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center",
        "bg-white rounded-xl border border-gray-200/60 shadow-sm",
        "animate-fade-in",
        className
      )}
    >
      {/* Icon — Defaults to PackageOpen if none provided */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 mb-5">
        {icon ? (
          icon
        ) : (
          <PackageOpen className="h-8 w-8 text-primary-400" aria-hidden="true" />
        )}
      </div>

      {/* Title and Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{message}</p>

      {/* Optional Call to Action Button */}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

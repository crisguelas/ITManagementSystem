/**
 * @file textarea.tsx
 * @description Reusable Textarea component with label, error, and character count.
 * Integrates with React Hook Form via forwardRef.
 */

import { forwardRef } from "react";

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Textarea component props extending native textarea attributes */
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * Textarea — Multi-line text input with label, error handling, and hint text.
 * Uses forwardRef for seamless React Hook Form integration.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, containerClassName, label, error, hint, id, ...props },
    ref
  ) => {
    /* Generate a unique ID if not provided */
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {/* Label — rendered above the textarea if provided */}
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {/* Show required asterisk if required */}
            {props.required && (
              <span className="ml-0.5 text-danger">*</span>
            )}
          </label>
        )}

        {/* The actual textarea element */}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            /* Base styles */
            "flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2",
            "text-sm text-gray-900 placeholder:text-gray-400",
            /* Focus styles */
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            /* Transition and resize behavior */
            "transition-all duration-200 resize-y",
            /* Disabled styles */
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            /* Error state — red border */
            error
              ? "border-danger focus:ring-danger focus:border-danger"
              : "border-gray-300 hover:border-gray-400",
            className
          )}
          {...props}
        />

        {/* Error message — shown below the textarea in red */}
        {error && (
          <p className="text-xs text-danger animate-fade-in">{error}</p>
        )}

        {/* Hint text — shown below the textarea in muted color */}
        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

/* Display name for React DevTools */
Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };

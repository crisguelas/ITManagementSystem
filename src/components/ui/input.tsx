/**
 * @file input.tsx
 * @description Reusable Input component with label, error message, and icon support.
 * Integrates with React Hook Form via forwardRef.
 */

import { forwardRef } from "react";

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Input component props extending native input attributes */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * Input — Form input field with label, error display, hint text, and icon support.
 * Uses forwardRef to integrate seamlessly with React Hook Form's register function.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    /* Generate a unique ID if not provided */
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {/* Label — rendered above the input if provided */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {/* Show required asterisk if the input is required */}
            {props.required && (
              <span className="ml-0.5 text-danger">*</span>
            )}
          </label>
        )}

        {/* Input wrapper — handles icon positioning */}
        <div className="relative">
          {/* Left icon — positioned inside the input */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* The actual input element */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              /* Base styles */
              "flex h-10 w-full rounded-lg border bg-white px-3 py-2",
              "text-sm text-gray-900 placeholder:text-gray-400",
              /* Focus styles */
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              /* Transition */
              "transition-all duration-200",
              /* Disabled styles */
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              /* Error state — red border */
              error
                ? "border-danger focus:ring-danger focus:border-danger"
                : "border-gray-300 hover:border-gray-400",
              /* Adjust padding when icons are present */
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />

          {/* Right icon — positioned inside the input */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message — shown below the input in red */}
        {error && (
          <p className="text-xs text-danger animate-fade-in">{error}</p>
        )}

        {/* Hint text — shown below the input in muted color */}
        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

/* Display name for React DevTools */
Input.displayName = "Input";

export { Input };
export type { InputProps };

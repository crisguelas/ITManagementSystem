/**
 * @file select.tsx
 * @description Reusable Select dropdown component with label, error, and icon support.
 * Integrates with React Hook Form via forwardRef.
 */

import { forwardRef } from "react";

/* Third-party imports */
import { ChevronDown } from "lucide-react";

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Individual option for the select dropdown */
interface SelectOption {
  label: string;
  value: string;
}

/* Select component props extending native select attributes */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * Select — Dropdown selection component with label and error handling.
 * Renders native <select> with custom styling for consistent look.
 * Uses forwardRef for React Hook Form integration.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      hint,
      options,
      placeholder = "Select an option",
      id,
      ...props
    },
    ref
  ) => {
    /* Generate a unique ID if not provided */
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {/* Label — rendered above the select if provided */}
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {/* Show required asterisk if the select is required */}
            {props.required && (
              <span className="ml-0.5 text-danger">*</span>
            )}
          </label>
        )}

        {/* Select wrapper — handles chevron icon positioning */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              /* Base styles */
              "flex h-10 w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10",
              "text-sm text-gray-900",
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
              className
            )}
            {...props}
          >
            {/* Placeholder option — disabled and hidden by default */}
            <option value="" disabled>
              {placeholder}
            </option>

            {/* Render all options */}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron icon — custom dropdown indicator */}
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Error message — shown below the select in red */}
        {error && (
          <p className="text-xs text-danger animate-fade-in">{error}</p>
        )}

        {/* Hint text — shown below the select in muted color */}
        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

/* Display name for React DevTools */
Select.displayName = "Select";

export { Select };
export type { SelectProps, SelectOption };

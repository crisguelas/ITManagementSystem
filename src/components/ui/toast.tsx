/**
 * @file toast.tsx
 * @description Toast notification component and provider for showing
 * success, error, warning, and info messages, with auto-dismiss.
 */

"use client";

import { useState, useCallback, createContext, useContext } from "react";

/* Third-party imports */
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Toast notification variants */
type ToastVariant = "success" | "error" | "warning" | "info";

/* Individual toast message data */
interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

/* Toast context — provides methods to show/dismiss toasts */
interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

/* ═══════════════════════════════════════════════════════════════ */
/* VARIANT CONFIG — Icon and color mapping for each variant        */
/* ═══════════════════════════════════════════════════════════════ */

/* Maps variant to icon component */
const VARIANT_ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/* Maps variant to Tailwind classes for styling */
const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

/* Maps variant to icon color */
const ICON_CLASSES: Record<ToastVariant, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

/* ═══════════════════════════════════════════════════════════════ */
/* CONTEXT                                                         */
/* ═══════════════════════════════════════════════════════════════ */

/* Create context with undefined default — must be used within ToastProvider */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/* ═══════════════════════════════════════════════════════════════ */
/* PROVIDER COMPONENT                                              */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * ToastProvider — Wraps the application to provide toast notification capabilities.
 * Manages toast state and auto-dismissal with configurable duration.
 */
const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  /* State holding all active toast messages */
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /* Add a new toast message and schedule its removal */
  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    /* Generate a unique ID for this toast */
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: ToastMessage = { ...toast, id };

    /* Add toast to the list */
    setToasts((prev) => [...prev, newToast]);

    /* Auto-dismiss after duration (default: 5 seconds) */
    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  /* Remove a specific toast by ID */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* Toast container — fixed position in bottom-right corner */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          /* Get the icon component for this toast variant */
          const IconComponent = VARIANT_ICONS[toast.variant];

          return (
            <div
              key={toast.id}
              className={cn(
                /* Base styles — rounded, bordered, shadow */
                "flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg",
                "animate-slide-in-left pointer-events-auto",
                /* Apply variant-specific colors */
                VARIANT_CLASSES[toast.variant]
              )}
              role="alert"
            >
              {/* Toast icon */}
              <IconComponent
                className={cn("h-5 w-5 mt-0.5 shrink-0", ICON_CLASSES[toast.variant])}
              />

              {/* Toast content — title and optional message */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/* HOOK — Convenient access to toast methods                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * useToast — Custom hook to access toast notification methods.
 * Must be used within a ToastProvider.
 */
const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);

  /* Throw error if used outside of ToastProvider */
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};

export { ToastProvider, useToast };
export type { ToastMessage, ToastVariant };

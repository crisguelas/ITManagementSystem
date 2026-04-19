/**
 * @file modal.tsx
 * @description Reusable Modal (Dialog) component with overlay, animation, and close functionality.
 * Supports different sizes and header/body/footer composition.
 */

"use client";

import { useEffect, useLayoutEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";

/* Third-party imports */
import { X } from "lucide-react";

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Available modal sizes */
type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

/* Modal component props */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
}

/* ═══════════════════════════════════════════════════════════════ */
/* SIZE STYLES                                                     */
/* ═══════════════════════════════════════════════════════════════ */

/* Maps size names to max-width Tailwind classes */
const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw]",
};

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * Modal — Dialog overlay component for forms, confirmations, and detail views.
 * Handles keyboard escape, overlay click-to-close, and body scroll lock.
 * Renders with a smooth fade and scale animation.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  showCloseButton = true,
  closeOnOverlay = true,
}: ModalProps) => {
  /* Portal only after mount so `document.body` exists (client-only) */
  const [mounted, setMounted] = useState(false);
  /* useLayoutEffect so `mounted` is true before paint — portal ready when dialog opens */
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  /* Handle Escape key press to close the modal */
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  /* Add/remove escape key listener and lock body scroll when modal is open */
  useEffect(() => {
    if (isOpen) {
      /* Listen for escape key */
      document.addEventListener("keydown", handleEscape);
      /* Prevent background scrolling while modal is open */
      document.body.classList.add("overflow-hidden");
    }

    /* Cleanup — remove listener and restore scrolling */
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen, handleEscape]);

  /* Don't render anything if modal is closed or SSR before mount */
  if (!isOpen || !mounted) return null;

  const dialog = (
    /* Overlay — portaled to body so dashboard overflow/stacking never traps dialogs */
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Background overlay — click to close if enabled */}
      <div
        className="absolute inset-0 z-0 bg-black/50 animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal content — above backdrop; stopPropagation avoids accidental close quirks */}
      <div
        className={cn(
          "relative z-10 w-full bg-white rounded-xl shadow-xl",
          "animate-fade-in-up",
          "max-h-[85vh] flex flex-col",
          SIZE_CLASSES[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header — title, description, and close button */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
            <div>
              {/* Modal title */}
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {title}
                </h2>
              )}
              {/* Modal description below the title */}
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>

            {/* Close button — X icon in top right */}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-1 rounded-lg text-gray-400",
                  "hover:text-gray-600 hover:bg-gray-100",
                  "transition-colors duration-200",
                  "focus-ring"
                )}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal body — scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export { Modal };
export type { ModalProps, ModalSize };

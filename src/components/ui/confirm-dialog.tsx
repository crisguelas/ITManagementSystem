/**
 * @file confirm-dialog.tsx
 * @description Confirmation dialog for destructive actions like delete operations.
 * Displays a warning message with confirm and cancel buttons.
 */

"use client";

/* Third-party imports */
import { AlertTriangle } from "lucide-react";

/* Local imports */
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Confirm dialog props */
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * ConfirmDialog — Modal dialog for confirming dangerous operations.
 * Displays a warning icon, message, and confirm/cancel buttons.
 * Used before delete, dispose, or other irreversible actions.
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center py-2">
        {/* Warning icon — colored based on variant */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
            variant === "danger"
              ? "bg-red-100 text-danger"
              : "bg-amber-100 text-warning"
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>

        {/* Dialog title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

        {/* Warning message */}
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        {/* Action buttons — cancel and confirm */}
        <div className="flex items-center gap-3 w-full">
          {/* Cancel button — closes the dialog */}
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>

          {/* Confirm button — triggers the action */}
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { ConfirmDialog };
export type { ConfirmDialogProps };

/**
 * @file asset-assign-modal.tsx
 * @description Modal form to assign an asset to an employee and/or room (Phase 6).
 * Uses React Hook Form with the shared Zod schema used by the assignments API.
 */

"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ChevronDown } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createAssignmentSchema,
  type CreateAssignmentFormValues,
} from "@/lib/validations/assignment.schema";

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  department?: { name: string };
};

type RoomOption = {
  id: string;
  name: string;
  building: { code: string; name: string };
};

interface AssetAssignModalProps {
  assetId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * AssetAssignModal — collects employee/room/notes and POSTs to the assignments API.
 */
export function AssetAssignModal({
  assetId,
  isOpen,
  onClose,
  onSuccess,
}: AssetAssignModalProps) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssignmentFormValues>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      employeeId: "",
      roomId: "",
      notes: "",
    },
  });

  /* Load dropdown data when the modal opens; state updates run after await (not sync in effect) */
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [empRes, roomRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/rooms"),
        ]);
        const empJson = await empRes.json();
        const roomJson = await roomRes.json();

        if (!empRes.ok || !empJson.success) {
          throw new Error(empJson.error || "Failed to load employees");
        }
        if (!roomRes.ok || !roomJson.success) {
          throw new Error(roomJson.error || "Failed to load rooms");
        }

        if (!cancelled) {
          setEmployees(empJson.data as EmployeeOption[]);
          setRooms(roomJson.data as RoomOption[]);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load options");
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const selectClass = cn(
    "flex h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10",
    "text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
    "transition-all hover:border-gray-400"
  );

  const onSubmit = async (values: CreateAssignmentFormValues) => {
    setSubmitError(null);
    try {
      const res = await fetch(`/api/assets/${assetId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: values.employeeId,
          roomId: values.roomId,
          notes: values.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Assignment failed");
      }
      onSuccess();
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Assignment failed");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign asset"
      description="Choose an employee, a location, or both. Any current assignment will be closed and recorded in history."
      size="md"
    >
      {loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-1">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="assign-employee"
                className="text-sm font-medium text-gray-700"
              >
                Employee
              </label>
              <div className="relative">
                <select
                  id="assign-employee"
                  className={cn(
                    selectClass,
                    errors.employeeId ? "border-danger focus:ring-danger" : ""
                  )}
                  {...register("employeeId")}
                >
                  <option value="">— None —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                      {e.department ? ` (${e.department.name})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.employeeId && (
                <p className="text-xs text-danger">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="assign-room" className="text-sm font-medium text-gray-700">
                Room / location
              </label>
              <div className="relative">
                <select
                  id="assign-room"
                  className={cn(
                    selectClass,
                    errors.roomId ? "border-danger focus:ring-danger" : ""
                  )}
                  {...register("roomId")}
                >
                  <option value="">— None —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.building.code} — {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.roomId && (
                <p className="text-xs text-danger">{errors.roomId.message}</p>
              )}
            </div>

            <Textarea
              label="Notes (optional)"
              rows={3}
              error={errors.notes?.message}
              {...register("notes")}
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Assign
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

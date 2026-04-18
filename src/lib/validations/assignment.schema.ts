/**
 * @file assignment.schema.ts
 * @description Zod schemas for asset assignment API and forms.
 * Shared between assign modal and POST /api/assets/[id]/assignments.
 */

import * as z from "zod";

/* Normalizes empty string from native <select> to undefined before validation */
const optionalCuid = z
  .union([z.string().cuid(), z.literal("")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

/**
 * Body for creating an assignment — at least one of employee or room must be set.
 */
export const createAssignmentSchema = z
  .object({
    employeeId: optionalCuid,
    roomId: optionalCuid,
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((data) => Boolean(data.employeeId || data.roomId), {
    message: "Select an employee, a room, or both.",
    path: ["employeeId"],
  });

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

/** RHF form shape (matches `z.input` before transforms) */
export type CreateAssignmentFormValues = z.input<typeof createAssignmentSchema>;

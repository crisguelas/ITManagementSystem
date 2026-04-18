/**
 * @file user.schema.ts
 * @description Zod schemas for IT staff User accounts (login), managed by admins.
 */

import * as z from "zod";

import { MIN_PASSWORD_LENGTH } from "@/lib/constants";

/* Role enum aligned with Prisma `Role` */
const roleEnum = z.enum(["ADMIN", "MEMBER"]);

/** Body for creating a new login user (admin only) */
export const createUserSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  name: z.string().trim().min(1, "Name is required").max(120),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  role: roleEnum,
});

/** Body for updating an existing user (admin only) */
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    role: roleEnum.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.role !== undefined || data.isActive !== undefined, {
    message: "At least one field must be provided",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

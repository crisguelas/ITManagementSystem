/**
 * @file organization.schema.ts
 * @description Zod validation schemas for Buildings, Rooms, Departments, and Employees.
 */

import * as z from "zod";
import { RoomType, Title } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════ */
/* LOCATIONS (BUILDINGS & ROOMS)                                   */
/* ═══════════════════════════════════════════════════════════════ */

export const buildingSchema = z.object({
  name: z.string().min(2, "Building name is required"),
  code: z.string().min(1, "Short code is required").max(10, "Code is too long"),
  description: z.string().optional(),
});
export type BuildingFormValues = z.infer<typeof buildingSchema>;


export const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  roomNumber: z.string().optional(),
  floor: z.string().optional(),
  buildingId: z.string().min(1, "Please select a building"),
  type: z.nativeEnum(RoomType),
});
export type RoomFormValues = z.infer<typeof roomSchema>;

/* ═══════════════════════════════════════════════════════════════ */
/* ORGANIZATION (DEPARTMENTS & EMPLOYEES)                          */
/* ═══════════════════════════════════════════════════════════════ */

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Short code is required"),
});
export type DepartmentFormValues = z.infer<typeof departmentSchema>;


export const employeeSchema = z.object({
  title: z.nativeEnum(Title),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  /* Allow blank optional email without failing `.email()` (omit or "" from client) */
  email: z
    .union([z.literal(""), z.string().email("Invalid email address")])
    .optional(),
  phone: z.string().optional(),
  departmentId: z.string().min(1, "Please select a department"),
  position: z.string().optional(),
});
export type EmployeeFormValues = z.infer<typeof employeeSchema>;

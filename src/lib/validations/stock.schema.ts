/**
 * @file stock.schema.ts
 * @description Zod validation schemas for Stock Room management.
 * Shared between client-side forms and server-side API routes.
 * Covers StockCategory, StockItem, and StockTransaction models.
 */

import * as z from "zod";
import { TransactionType } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════ */
/* STOCK CATEGORY SCHEMAS                                          */
/* ═══════════════════════════════════════════════════════════════ */

export const stockCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  prefix: z
    .string()
    .min(2, "Prefix must be at least 2 characters")
    .max(5, "Prefix cannot exceed 5 characters")
    .regex(/^[A-Z0-9]+$/, "Prefix must be uppercase letters and numbers only"),
  description: z.string().optional(),
});

export type StockCategoryFormValues = z.infer<typeof stockCategorySchema>;

/* ═══════════════════════════════════════════════════════════════ */
/* STOCK ITEM SCHEMAS                                              */
/* ═══════════════════════════════════════════════════════════════ */

export const stockItemSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  categoryId: z.string().min(1, "Please select a stock category"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
  minQuantity: z.coerce
    .number()
    .int("Minimum quantity must be a whole number")
    .min(0, "Minimum quantity cannot be negative"),
  location: z.string().min(1, "Location is required"),
  /* Unit must be a descriptive label only (for example: boxes, pcs, meters) */
  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .refine((value) => !/\d/.test(value), {
      message: "Unit must not include numbers. Enter only the unit label (e.g. boxes).",
    }),
});

export type StockItemFormValues = z.infer<typeof stockItemSchema>;

/* ═══════════════════════════════════════════════════════════════ */
/* STOCK TRANSACTION SCHEMAS                                       */
/* ═══════════════════════════════════════════════════════════════ */

export const stockTransactionSchema = z.object({
  stockItemId: z.string().min(1, "Stock item is required"),
  type: z.nativeEnum(TransactionType),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  recipientName: z.string().optional(),
  recipientDepartment: z.string().optional(),
  approvedById: z.string().optional(),
  notes: z.string().optional(),
});

export type StockTransactionFormValues = z.infer<typeof stockTransactionSchema>;

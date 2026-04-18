/**
 * @file asset.schema.ts
 * @description Zod validation schemas for Asset and Category data structures.
 * Shared between client forms and backend API routes.
 */

import * as z from "zod";
import { AssetStatus } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════ */
/* ASSET CATEGORY SCHEMAS                                          */
/* ═══════════════════════════════════════════════════════════════ */

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  prefix: z
    .string()
    .min(2, "Prefix must be at least 2 characters")
    .max(5, "Prefix cannot exceed 5 characters")
    .regex(/^[A-Z0-9]+$/, "Prefix must be uppercase letters and numbers only"),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

/* ═══════════════════════════════════════════════════════════════ */
/* ASSET SCHEMAS                                                   */
/* ═══════════════════════════════════════════════════════════════ */

export const assetSchema = z.object({
  categoryId: z.string().min(1, "Please select an asset category"),
  
  /* Identifiers */
  pcNumber: z.string().optional(),
  macAddress: z.string().optional(),
  serialNumber: z.string().optional(),
  
  /* Specs */
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  
  /* System Details (primarily for PCs/Laptops) */
  osInstalled: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  
  /* Operational Status */
  status: z.nativeEnum(AssetStatus).default(AssetStatus.AVAILABLE),
});

export type AssetFormValues = z.infer<typeof assetSchema>;

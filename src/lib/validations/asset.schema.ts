/**
 * @file asset.schema.ts
 * @description Zod validation schema for asset data structures.
 * Shared between client forms and backend API routes.
 */

import * as z from "zod";
import { AssetStatus } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════ */
/* ASSET SCHEMA                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export const assetSchema = z.object({
  stockCategoryId: z.string().min(1, "Please select an inventory category"),
  
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

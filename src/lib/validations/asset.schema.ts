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

const isValidIpAddress = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  /* IPv4: 0.0.0.0 - 255.255.255.255 */
  const ipv4 =
    /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

  /* IPv6: supports :: compression (practical validation) */
  const ipv6 =
    /^(?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7}|(?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){0,6})?::(?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){0,6})?)$/;

  return ipv4.test(trimmed) || ipv6.test(trimmed);
};

export const assetSchema = z.object({
  stockCategoryId: z.string().min(1, "Please select an inventory category"),
  
  /* Identifiers */
  pcNumber: z.string().optional(),
  macAddress: z.string().optional(),
  serialNumber: z.string().optional(),
  remoteAddress: z.string().optional(),
  dataPort: z.string().optional(),
  ipAddress: z
    .string()
    .refine((value) => isValidIpAddress(value), { message: "Please enter a valid IP address" })
    .optional(),
  
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

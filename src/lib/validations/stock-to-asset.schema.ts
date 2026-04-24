/**
 * @file stock-to-asset.schema.ts
 * @description Zod validation schema for converting a stock item into a tracked asset instance.
 */

import * as z from "zod";

import { assetSchema } from "@/lib/validations/asset.schema";

export const stockToAssetSchema = assetSchema.extend({
  stockItemId: z.string().min(1, "Stock item is required"),
  notes: z.string().optional(),
});

export type StockToAssetFormValues = z.infer<typeof stockToAssetSchema>;


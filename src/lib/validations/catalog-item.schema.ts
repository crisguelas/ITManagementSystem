/**
 * @file catalog-item.schema.ts
 * @description Zod validation schema for unified Catalog items shared by assets and stock.
 */

import * as z from "zod";

export const catalogItemSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required"),
  model: z.string().trim().min(1, "Model is required"),
  category: z.string().trim().min(1, "Category is required"),
  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .refine((value) => !/\d/.test(value), {
      message: "Unit must not include numbers. Enter only the unit label (e.g. boxes).",
    }),
});

export type CatalogItemFormValues = z.infer<typeof catalogItemSchema>;


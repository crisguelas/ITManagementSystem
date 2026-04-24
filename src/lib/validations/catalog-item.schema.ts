/**
 * @file catalog-item.schema.ts
 * @description Zod validation schema for unified Catalog items shared by assets and stock.
 */

import * as z from "zod";

export const catalogItemSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  category: z.string().trim().min(1, "Category is required"),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .refine((value) => !/\d/.test(value), {
      message: "Unit must not include numbers. Enter only the unit label (e.g. boxes).",
    }),
});

export type CatalogItemFormValues = z.infer<typeof catalogItemSchema>;


/**
 * @file catalog.service.ts
 * @description Service layer for CatalogItem operations.
 * Centralizes Prisma access for unified stock/asset catalog entities.
 */

import type { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { catalogItemSchema } from "@/lib/validations/catalog-item.schema";

/**
 * Loads catalog items ordered by brand/model for predictable selection lists.
 */
export async function getCatalogItems() {
  return prisma.catalogItem.findMany({
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });
}

/**
 * Loads one catalog item by id for edit/detail workflows.
 */
export async function getCatalogItemById(id: string) {
  return prisma.catalogItem.findUnique({
    where: { id },
  });
}

/**
 * Creates a catalog item after trimming text fields for normalized storage.
 */
export async function createCatalogItem(data: z.infer<typeof catalogItemSchema>) {
  return prisma.catalogItem.create({
    data: {
      brand: data.brand.trim(),
      model: data.model.trim(),
      category: data.category.trim(),
      unit: data.unit.trim(),
    },
  });
}

/**
 * Updates a catalog item and fails fast when the target id does not exist.
 */
export async function updateCatalogItem(id: string, data: z.infer<typeof catalogItemSchema>) {
  const existing = await prisma.catalogItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error("Catalog item not found");

  return prisma.catalogItem.update({
    where: { id },
    data: {
      brand: data.brand.trim(),
      model: data.model.trim(),
      category: data.category.trim(),
      unit: data.unit.trim(),
    },
  });
}

/**
 * Deletes a catalog item only when it is no longer linked to assets/stock rows.
 */
export async function deleteCatalogItem(id: string) {
  const linkedAssets = await prisma.asset.count({ where: { catalogItemId: id } });
  const linkedStock = await prisma.stockItem.count({ where: { catalogItemId: id } });

  if (linkedAssets > 0 || linkedStock > 0) {
    throw new Error("Cannot delete catalog item because it is linked to assets or stock items.");
  }

  return prisma.catalogItem.delete({ where: { id } });
}


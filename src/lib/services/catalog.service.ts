/**
 * @file catalog.service.ts
 * @description Service layer for CatalogItem operations.
 * Centralizes Prisma access for unified stock/asset catalog entities.
 */

import type { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { catalogItemSchema } from "@/lib/validations/catalog-item.schema";

export async function getCatalogItems() {
  return prisma.catalogItem.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCatalogItemById(id: string) {
  return prisma.catalogItem.findUnique({
    where: { id },
  });
}

export async function createCatalogItem(data: z.infer<typeof catalogItemSchema>) {
  return prisma.catalogItem.create({
    data: {
      name: data.name.trim(),
      category: data.category.trim(),
      brand: data.brand?.trim() || null,
      model: data.model?.trim() || null,
      unit: data.unit.trim(),
    },
  });
}

export async function updateCatalogItem(id: string, data: z.infer<typeof catalogItemSchema>) {
  const existing = await prisma.catalogItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error("Catalog item not found");

  return prisma.catalogItem.update({
    where: { id },
    data: {
      name: data.name.trim(),
      category: data.category.trim(),
      brand: data.brand?.trim() || null,
      model: data.model?.trim() || null,
      unit: data.unit.trim(),
    },
  });
}

export async function deleteCatalogItem(id: string) {
  const linkedAssets = await prisma.asset.count({ where: { catalogItemId: id } });
  const linkedStock = await prisma.stockItem.count({ where: { catalogItemId: id } });

  if (linkedAssets > 0 || linkedStock > 0) {
    throw new Error("Cannot delete catalog item because it is linked to assets or stock items.");
  }

  return prisma.catalogItem.delete({ where: { id } });
}


/**
 * @file asset.service.ts
 * @description Service layer for Asset and AssetCategory operations.
 * Centralizes Prisma database queries keeping API routes clean.
 */

import { getAssetTagPrefix } from "@/lib/asset-tag-config";
import { ASSET_TAG_DIGITS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { categorySchema, assetSchema } from "@/lib/validations/asset.schema";

/* ═══════════════════════════════════════════════════════════════ */
/* ASSET CATEGORY SERVICES                                         */
/* ═══════════════════════════════════════════════════════════════ */

export async function getCategories() {
  return prisma.assetCategory.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createCategory(data: z.infer<typeof categorySchema>) {
  /* Ensure prefix is uppercase */
  const prefix = data.prefix.toUpperCase();

  /* Check for existing category or prefix */
  const existing = await prisma.assetCategory.findFirst({
    where: {
      OR: [{ name: data.name }, { prefix }],
    },
  });

  if (existing) {
    if (existing.prefix === prefix) {
      throw new Error(`Category with prefix "${prefix}" already exists`);
    }
    throw new Error(`Category with name "${data.name}" already exists`);
  }

  return prisma.assetCategory.create({
    data: {
      ...data,
      prefix,
    },
  });
}

export async function deleteCategory(id: string) {
  /* Prevent deleting categories that have associated assets */
  const assetCount = await prisma.asset.count({
    where: { categoryId: id },
  });

  if (assetCount > 0) {
    throw new Error("Cannot delete category with associated assets. Reassign them first.");
  }

  return prisma.assetCategory.delete({
    where: { id },
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/* ASSET SERVICES                                                  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * Generates the next sequential asset tag: `{globalPrefix}-{categoryPrefix}-{n}`.
 */
async function generateNextAssetTag(categoryId: string): Promise<string> {
  const globalPrefix = getAssetTagPrefix();
  const category = await prisma.assetCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) throw new Error("Category not found");

  const tagStem = `${globalPrefix}-${category.prefix}-`;

  /* Find the highest numbered tag for this global + category prefix */
  const latestAsset = await prisma.asset.findFirst({
    where: { assetTag: { startsWith: tagStem } },
    orderBy: { assetTag: "desc" },
  });

  let nextNumber = 1;

  if (latestAsset) {
    /* Last segment is the numeric sequence */
    const parts = latestAsset.assetTag.split("-");
    const lastNumStr = parts[parts.length - 1];
    const lastNum = parseInt(lastNumStr, 10);

    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  const paddedNumber = String(nextNumber).padStart(ASSET_TAG_DIGITS, "0");
  return `${tagStem}${paddedNumber}`;
}

/**
 * Loads one asset with category and full assignment history for the detail API and UI.
 */
export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      stockItem: true,
      assignments: {
        include: {
          employee: { include: { department: true } },
          room: { include: { building: true } },
          assignedBy: true,
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });
}

export async function getAssets() {
  return prisma.asset.findMany({
    include: {
      category: true,
      assignments: {
        where: { returnedAt: null }, // Only active assignments
        include: { employee: true, room: { include: { building: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAsset(data: z.infer<typeof assetSchema>) {
  /* Check unique constraint: pcNumber (if provided) */
  if (data.pcNumber) {
    const existingPc = await prisma.asset.findUnique({
      where: { pcNumber: data.pcNumber },
    });
    if (existingPc) throw new Error(`PC Number "${data.pcNumber}" is already in use`);
  }

  /* Check unique constraint: serialNumber (if provided) */
  if (data.serialNumber) {
    const existingSn = await prisma.asset.findUnique({
      where: { serialNumber: data.serialNumber },
    });
    if (existingSn) throw new Error(`Serial Number "${data.serialNumber}" is already in use`);
  }

  /* Generate auto-tag */
  const assetTag = await generateNextAssetTag(data.categoryId);
  
  /* Create descriptive name -> e.g. "Dell Latitude" */
  const name = `${data.brand} ${data.model}`.trim();

  return prisma.asset.create({
    data: {
      ...data,
      name,
      assetTag,
    },
    include: {
      category: true,
    },
  });
}

export async function deleteAsset(id: string) {
  /* You may want to prevent deletion if there are active assignments or stock items */
  const activeAssignments = await prisma.assetAssignment.count({
    where: { assetId: id, returnedAt: null },
  });

  if (activeAssignments > 0) {
    throw new Error("Cannot delete asset because it is currently assigned. Return it first.");
  }

  return prisma.asset.delete({
    where: { id },
  });
}

/**
 * @file conversion.service.ts
 * @description Service functions that convert stock into tracked asset instances.
 * Ensures strict stock integrity by preventing conversions when quantity < 1.
 */

import { TransactionType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { getAssetTagPrefix } from "@/lib/asset-tag-config";
import { ASSET_TAG_DIGITS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { stockToAssetSchema } from "@/lib/validations/stock-to-asset.schema";

/**
 * Generates the next sequential asset tag: `{globalPrefix}-{categoryPrefix}-{n}`.
 * Accepts a Prisma transaction client so the sequence is computed consistently
 * inside larger atomic operations.
 */
async function generateNextAssetTag(
  tx: Prisma.TransactionClient,
  stockCategoryId: string
): Promise<string> {
  const globalPrefix = getAssetTagPrefix();
  const category = await tx.stockCategory.findUnique({
    where: { id: stockCategoryId },
    select: { prefix: true },
  });

  if (!category) throw new Error("Category not found");

  const tagStem = `${globalPrefix}-${category.prefix}-`;

  /* Find the highest numbered tag for this global + category prefix */
  const latestAsset = await tx.asset.findFirst({
    where: { assetTag: { startsWith: tagStem } },
    orderBy: { assetTag: "desc" },
    select: { assetTag: true },
  });

  let nextNumber = 1;

  if (latestAsset?.assetTag) {
    const parts = latestAsset.assetTag.split("-");
    const lastNumStr = parts[parts.length - 1];
    const lastNum = Number.parseInt(lastNumStr ?? "", 10);
    if (!Number.isNaN(lastNum)) nextNumber = lastNum + 1;
  }

  const paddedNumber = String(nextNumber).padStart(ASSET_TAG_DIGITS, "0");
  return `${tagStem}${paddedNumber}`;
}

/**
 * Converts one unit of a StockItem into a tracked Asset instance.
 * Decrements stock via a strict OUT transaction and links both records
 * to a shared CatalogItem identity (creating it on-demand if missing).
 */
export async function convertStockItemToAsset(
  input: z.infer<typeof stockToAssetSchema>,
  performedById: string
) {
  return prisma.$transaction(async (tx) => {
    const stockItem = await tx.stockItem.findUnique({
      where: { id: input.stockItemId },
      include: { category: true, catalogItem: true },
    });

    if (!stockItem) throw new Error("Stock item not found");
    if (stockItem.quantity < 1) {
      throw new Error(`Cannot convert to an asset — only ${stockItem.quantity} available`);
    }

    const catalogItemId =
      stockItem.catalogItemId ??
      (
        await tx.catalogItem.create({
          data: {
            brand: stockItem.brand,
            model: stockItem.model,
            category: stockItem.category.name,
            unit: stockItem.unit,
          },
          select: { id: true },
        })
      ).id;

    if (!stockItem.catalogItemId) {
      await tx.stockItem.update({
        where: { id: stockItem.id },
        data: { catalogItemId },
      });
    }

    /* Preserve existing unique guards by checking within the same transaction */
    if (input.pcNumber) {
      const existingPc = await tx.asset.findUnique({
        where: { pcNumber: input.pcNumber },
        select: { id: true },
      });
      if (existingPc) throw new Error(`PC Number "${input.pcNumber}" is already in use`);
    }

    if (input.ipAddress) {
      const existingIp = await tx.asset.findUnique({
        where: { ipAddress: input.ipAddress },
        select: { id: true },
      });
      if (existingIp) throw new Error(`IP Address "${input.ipAddress}" is already in use`);
    }

    if (input.macAddress) {
      const existingMac = await tx.asset.findUnique({
        where: { macAddress: input.macAddress },
        select: { id: true },
      });
      if (existingMac) throw new Error(`MAC Address "${input.macAddress}" is already in use`);
    }

    if (input.serialNumber) {
      const existingSn = await tx.asset.findUnique({
        where: { serialNumber: input.serialNumber },
        select: { id: true },
      });
      if (existingSn) throw new Error(`Serial Number "${input.serialNumber}" is already in use`);
    }

    if (input.remoteAddress) {
      const existingRemoteAddress = await tx.asset.findUnique({
        where: { remoteAddress: input.remoteAddress },
        select: { id: true },
      });
      if (existingRemoteAddress) {
        throw new Error(`Remote Address "${input.remoteAddress}" is already in use`);
      }
    }

    const assetTag = await generateNextAssetTag(tx, input.stockCategoryId);
    const name = `${input.brand} ${input.model}`.trim();

    const asset = await tx.asset.create({
      data: {
        stockCategoryId: input.stockCategoryId,
        catalogItemId,
        assetTag,
        name,
        brand: input.brand,
        model: input.model,
        pcNumber: input.pcNumber,
        serialNumber: input.serialNumber,
        macAddress: input.macAddress,
        ipAddress: input.ipAddress,
        dataPort: input.dataPort,
        remoteAddress: input.remoteAddress,
        osInstalled: input.osInstalled,
        ram: input.ram,
        storage: input.storage,
        status: input.status,
      },
      include: { stockCategory: true },
    });

    await tx.stockItem.update({
      where: { id: stockItem.id },
      data: { quantity: stockItem.quantity - 1 },
    });

    await tx.stockTransaction.create({
      data: {
        stockItemId: stockItem.id,
        type: TransactionType.OUT,
        quantity: 1,
        performedById,
        notes:
          input.notes ??
          `Converted 1 ${stockItem.unit} ${stockItem.brand} ${stockItem.model} to asset ${asset.assetTag} (${asset.id})`,
      },
    });

    return asset;
  });
}


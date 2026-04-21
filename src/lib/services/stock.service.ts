/**
 * @file stock.service.ts
 * @description Service layer for Stock Room management.
 * Handles StockCategory, StockItem, and StockTransaction CRUD.
 * All quantity adjustments are atomic via Prisma transactions.
 */

import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import type { z } from "zod";
import type {
  stockCategorySchema,
  stockItemSchema,
  stockTransactionSchema,
} from "@/lib/validations/stock.schema";

/* ═══════════════════════════════════════════════════════════════ */
/* STOCK CATEGORY SERVICES                                         */
/* ═══════════════════════════════════════════════════════════════ */

/** Fetches all stock categories ordered by name, with item count */
export async function getStockCategories() {
  return prisma.stockCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { stockItems: true } },
    },
  });
}

/** Creates a new stock category with duplicate name check */
export async function createStockCategory(
  data: z.infer<typeof stockCategorySchema>
) {
  /* Guard: prevent duplicate category names */
  const existing = await prisma.stockCategory.findUnique({
    where: { name: data.name },
  });
  if (existing) {
    throw new Error(`Stock category "${data.name}" already exists`);
  }

  return prisma.stockCategory.create({ data });
}

/** Updates an existing stock category with duplicate name check */
export async function updateStockCategory(
  id: string,
  data: z.infer<typeof stockCategorySchema>
) {
  /* Guard: prevent duplicate name collision with other categories */
  const duplicate = await prisma.stockCategory.findFirst({
    where: { name: data.name, NOT: { id } },
  });
  if (duplicate) {
    throw new Error(`Stock category "${data.name}" already exists`);
  }

  return prisma.stockCategory.update({ where: { id }, data });
}

/** Deletes a stock category — blocked if it has associated stock items */
export async function deleteStockCategory(id: string) {
  /* Guard: cannot delete category that still has items */
  const itemCount = await prisma.stockItem.count({
    where: { categoryId: id },
  });
  if (itemCount > 0) {
    throw new Error(
      "Cannot delete this category while it has stock items. Reassign or remove them first."
    );
  }

  return prisma.stockCategory.delete({ where: { id } });
}

/* ═══════════════════════════════════════════════════════════════ */
/* STOCK ITEM SERVICES                                             */
/* ═══════════════════════════════════════════════════════════════ */

/** Fetches all stock items with category info and transaction count */
export async function getStockItems() {
  return prisma.stockItem.findMany({
    orderBy: { name: "asc" },
    include: {
      category: true,
      _count: { select: { transactions: true } },
    },
  });
}

/** Fetches a single stock item by ID with full transaction history */
export async function getStockItemById(id: string) {
  return prisma.stockItem.findUnique({
    where: { id },
    include: {
      category: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          performedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      },
    },
  });
}

/** Creates a new stock item with unique SKU guard */
export async function createStockItem(
  data: z.infer<typeof stockItemSchema>
) {
  /* Guard: SKU must be unique if provided */
  if (data.sku) {
    const existing = await prisma.stockItem.findUnique({
      where: { sku: data.sku },
    });
    if (existing) {
      throw new Error(`SKU "${data.sku}" is already in use`);
    }
  }

  return prisma.stockItem.create({
    data,
    include: { category: true },
  });
}

/** Updates a stock item with unique SKU guard */
export async function updateStockItem(
  id: string,
  data: z.infer<typeof stockItemSchema>
) {
  /* Preserve transaction audit integrity: once transactions exist, item details are locked */
  const transactionCount = await prisma.stockTransaction.count({
    where: { stockItemId: id },
  });
  if (transactionCount > 0) {
    throw new Error(
      "Cannot edit this stock item because transaction history already exists. Create a new item record for corrected data."
    );
  }

  /* Guard: SKU must be unique among other items */
  if (data.sku) {
    const duplicate = await prisma.stockItem.findFirst({
      where: { sku: data.sku, NOT: { id } },
    });
    if (duplicate) {
      throw new Error(`SKU "${data.sku}" is already in use`);
    }
  }

  return prisma.stockItem.update({
    where: { id },
    data,
    include: { category: true },
  });
}

/** Deletes a stock item — blocked if it has any transactions on record */
export async function deleteStockItem(id: string) {
  /* Guard: cannot delete items with transaction history */
  const txCount = await prisma.stockTransaction.count({
    where: { stockItemId: id },
  });
  if (txCount > 0) {
    throw new Error(
      "Cannot delete this item because it has transaction history. Consider marking it inactive instead."
    );
  }

  return prisma.stockItem.delete({ where: { id } });
}

/* ═══════════════════════════════════════════════════════════════ */
/* STOCK TRANSACTION SERVICES                                      */
/* ═══════════════════════════════════════════════════════════════ */

/** Fetches all stock transactions ordered by most recent */
export async function getStockTransactions() {
  return prisma.stockTransaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      stockItem: { include: { category: true } },
      performedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * Creates a stock transaction and atomically updates the stock item quantity.
 * IN and RETURN increase quantity; OUT decreases; ADJUSTMENT sets absolute value.
 * Throws if an OUT transaction would make quantity go below zero.
 */
export async function createStockTransaction(
  data: z.infer<typeof stockTransactionSchema>,
  performedById: string
) {
  /* Run both DB writes in a single atomic transaction */
  return prisma.$transaction(async (tx) => {
    /* Fetch current stock item to calculate new quantity */
    const item = await tx.stockItem.findUnique({
      where: { id: data.stockItemId },
    });

    if (!item) throw new Error("Stock item not found");

    /* Calculate the new quantity based on transaction type */
    let newQuantity: number;

    if (data.type === TransactionType.IN) {
      newQuantity = item.quantity + data.quantity;
    } else if (data.type === TransactionType.RETURN) {
      newQuantity = item.quantity + data.quantity;
    } else if (data.type === TransactionType.OUT) {
      newQuantity = item.quantity - data.quantity;
      /* Guard: prevent negative stock */
      if (newQuantity < 0) {
        throw new Error(
          `Cannot issue ${data.quantity} ${item.unit}(s) — only ${item.quantity} available`
        );
      }
    } else {
      /* ADJUSTMENT — treat quantity as the new absolute value */
      newQuantity = data.quantity;
    }

    /* Update the stock item quantity */
    await tx.stockItem.update({
      where: { id: data.stockItemId },
      data: { quantity: newQuantity },
    });

    /* Create the transaction audit record */
    return tx.stockTransaction.create({
      data: {
        stockItemId: data.stockItemId,
        type: data.type,
        quantity: data.quantity,
        performedById,
        recipientName: data.recipientName,
        recipientDepartment: data.recipientDepartment,
        approvedById: data.approvedById ?? null,
        notes: data.notes,
      },
      include: {
        stockItem: true,
        performedBy: { select: { id: true, name: true } },
      },
    });
  });
}

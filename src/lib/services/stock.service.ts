/**
 * @file stock.service.ts
 * @description Service layer for Stock Room management.
 * Handles StockCategory, StockItem, and StockTransaction CRUD.
 * All quantity adjustments are atomic via Prisma transactions.
 */

import { prisma } from "@/lib/prisma";
import { Prisma, TransactionType } from "@prisma/client";
import type { z } from "zod";
import { STOCK_SKU_DIGITS, STOCK_SKU_PREFIX } from "@/lib/constants";
import type {
  stockCategorySchema,
  stockItemSchema,
  stockTransactionSchema,
} from "@/lib/validations/stock.schema";
import type { LowStockNotificationRow } from "@/lib/stock/low-stock-from-api";

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

/* Builds optional text search for category list APIs */
const buildStockCategoryWhere = (q?: string): Prisma.StockCategoryWhereInput => {
  if (!q || q.trim() === "") return {};
  const term = q.trim();
  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { prefix: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ],
  };
};

/** Paginated stock categories for tables and APIs */
export async function getStockCategoriesPaged(params: { page: number; pageSize: number; q?: string }) {
  const { page, pageSize, q } = params;
  const where = buildStockCategoryWhere(q);
  const skip = (page - 1) * pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.stockCategory.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
      include: { _count: { select: { stockItems: true } } },
    }),
    prisma.stockCategory.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

/** Creates a new stock category with duplicate name check */
export async function createStockCategory(
  data: z.infer<typeof stockCategorySchema>
) {
  const prefix = data.prefix.toUpperCase();
  /* Guard: prevent duplicate category names */
  const existing = await prisma.stockCategory.findFirst({
    where: {
      OR: [{ name: data.name }, { prefix }],
    },
  });
  if (existing) {
    throw new Error(`Stock category "${data.name}" or prefix "${prefix}" already exists`);
  }

  return prisma.stockCategory.create({ data: { ...data, prefix } });
}

/** Updates an existing stock category with duplicate name check */
export async function updateStockCategory(
  id: string,
  data: z.infer<typeof stockCategorySchema>
) {
  const prefix = data.prefix.toUpperCase();
  /* Guard: prevent duplicate name collision with other categories */
  const duplicate = await prisma.stockCategory.findFirst({
    where: {
      NOT: { id },
      OR: [{ name: data.name }, { prefix }],
    },
  });
  if (duplicate) {
    throw new Error(`Stock category "${data.name}" or prefix "${prefix}" already exists`);
  }

  return prisma.stockCategory.update({ where: { id }, data: { ...data, prefix } });
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
    orderBy: [{ brand: "asc" }, { model: "asc" }],
    include: {
      category: true,
      catalogItem: true,
      _count: { select: { transactions: true } },
    },
  });
}

/* Optional filters for paged stock item lists (table vs register-asset stock picker) */
const buildStockItemsWhere = (
  q?: string,
  availableForAsset?: boolean
): Prisma.StockItemWhereInput => {
  const clauses: Prisma.StockItemWhereInput[] = [];
  if (q && q.trim() !== "") {
    const term = q.trim();
    clauses.push({
      OR: [
        { brand: { contains: term, mode: "insensitive" } },
        { model: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
      ],
    });
  }
  if (availableForAsset) {
    clauses.push({ quantity: { gt: 0 } });
  }
  if (clauses.length === 0) return {};
  return { AND: clauses };
};

/** Paginated stock items for inventory tables and APIs */
export async function getStockItemsPaged(params: {
  page: number;
  pageSize: number;
  q?: string;
  availableForAsset?: boolean;
}) {
  const { page, pageSize, q, availableForAsset } = params;
  const where = buildStockItemsWhere(q, availableForAsset);
  const skip = (page - 1) * pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.stockItem.findMany({
      where,
      orderBy: [{ brand: "asc" }, { model: "asc" }],
      skip,
      take: pageSize,
      include: {
        category: true,
        catalogItem: true,
        _count: { select: { transactions: true } },
      },
    }),
    prisma.stockItem.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

/**
 * Loads low-stock lines for banners and notifications (quantity at or below minQuantity).
 * Uses a DB-side comparison so we never scan the full inventory in application memory.
 */
export async function getLowStockStockItemBannerRows(limit: number): Promise<LowStockNotificationRow[]> {
  const cap = Math.min(Math.max(1, limit), 50);
  const rows = await prisma.$queryRaw<
    Array<{ id: string; brand: string; model: string; quantity: number; minQuantity: number }>
  >(Prisma.sql`
    SELECT id, brand, model, quantity, "minQuantity"
    FROM stock_items
    WHERE quantity <= "minQuantity"
    ORDER BY quantity ASC
    LIMIT ${cap}
  `);
  return rows.map((row) => ({
    id: row.id,
    itemLabel: `${row.brand} ${row.model}`.trim() || "Stock item",
    quantity: row.quantity,
    minQuantity: row.minQuantity,
  }));
}

/** Fetches a single stock item by ID with full transaction history */
export async function getStockItemById(id: string) {
  return prisma.stockItem.findUnique({
    where: { id },
    include: {
      category: true,
      catalogItem: true,
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

/**
 * Generates the next stock SKU in `STK-000001` sequence.
 * Uses the latest generated SKU value to keep numbering predictable.
 */
async function generateNextStockSku(): Promise<string> {
  const skuStem = `${STOCK_SKU_PREFIX}-`;
  const existingGeneratedSkus = await prisma.stockItem.findMany({
    where: {
      sku: { startsWith: skuStem },
    },
    select: { sku: true },
  });

  const highestSequence = existingGeneratedSkus.reduce((maxSeq, row) => {
    const [, numericPart] = (row.sku ?? "").split("-");
    const parsed = Number.parseInt(numericPart ?? "", 10);
    return Number.isNaN(parsed) ? maxSeq : Math.max(maxSeq, parsed);
  }, 0);
  const nextNumber = highestSequence + 1;

  return `${skuStem}${String(nextNumber).padStart(STOCK_SKU_DIGITS, "0")}`;
}

/** Creates a new stock item with auto-generated SKU */
export async function createStockItem(
  data: z.infer<typeof stockItemSchema>
) {
  const sku = await generateNextStockSku();
  const catalogCategory = await prisma.stockCategory.findUnique({
    where: { id: data.categoryId },
    select: { name: true },
  });

  if (!catalogCategory) {
    throw new Error("Stock category not found");
  }

  const catalogItem = await prisma.catalogItem.create({
    data: {
      brand: data.brand,
      model: data.model,
      category: catalogCategory.name,
      unit: data.unit,
    },
    select: { id: true },
  });

  return prisma.stockItem.create({
    data: {
      ...data,
      sku,
      catalogItemId: catalogItem.id,
    },
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

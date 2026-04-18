/**
 * @file route.ts
 * @description API routes for individual Stock Item resources.
 * GET: fetch item with history. PATCH: update item. DELETE: delete item.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stockItemSchema } from "@/lib/validations/stock.schema";
import {
  getStockItemById,
  updateStockItem,
  deleteStockItem,
} from "@/lib/services/stock.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/stock-items/[id] — returns a single stock item with full transaction history */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const item = await getStockItemById(id);

    if (!item) {
      return NextResponse.json({ success: false, error: "Stock item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("[StockItemsAPI] GET[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stock item" }, { status: 500 });
  }
}

/** PATCH /api/stock-items/[id] — updates a stock item */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = stockItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const item = await updateStockItem(id, parsed.data);
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update stock item";
    console.error("[StockItemsAPI] PATCH error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/** DELETE /api/stock-items/[id] — deletes a stock item (blocked if it has transactions) */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteStockItem(id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete stock item";
    console.error("[StockItemsAPI] DELETE error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

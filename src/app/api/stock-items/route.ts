/**
 * @file route.ts
 * @description API routes for Stock Item collection.
 * GET: list all stock items. POST: create a new stock item.
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { getStockItemsPaged, createStockItem } from "@/lib/services/stock.service";
import { stockItemSchema } from "@/lib/validations/stock.schema";
import { parseListPaginationFromUrl } from "@/lib/validations/list-query.schema";

/** GET /api/stock-items — paginated stock items with category and transaction count */
export async function GET(request: Request) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const parsed = parseListPaginationFromUrl(request.url);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { page, pageSize, q } = parsed.data;
    const { searchParams } = new URL(request.url);
    const availableForAsset =
      searchParams.get("availableForAsset") === "true" || searchParams.get("availableForAsset") === "1";

    const result = await getStockItemsPaged({ page, pageSize, q, availableForAsset });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[StockItemsAPI] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock items" },
      { status: 500 }
    );
  }
}

/** POST /api/stock-items — creates a new stock item */
export async function POST(request: Request) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const body: unknown = await request.json();
    const parsed = stockItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const item = await createStockItem(parsed.data);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create stock item";
    console.error("[StockItemsAPI] POST error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

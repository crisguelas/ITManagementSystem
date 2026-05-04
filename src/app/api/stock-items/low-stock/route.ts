/**
 * @file route.ts
 * @description GET /api/stock-items/low-stock — capped list of items at or below minimum quantity (banner + header).
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { getLowStockStockItemBannerRows } from "@/lib/services/stock.service";

const DEFAULT_LIMIT = 50;

export async function GET(request: Request) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const limit = Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT;

    const data = await getLowStockStockItemBannerRows(limit);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[StockItemsLowStockAPI] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch low-stock items" },
      { status: 500 }
    );
  }
}

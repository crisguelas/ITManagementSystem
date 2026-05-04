/**
 * @file route.ts
 * @description API routes for Stock Category collection.
 * GET: list all stock categories. POST: create a new stock category.
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import {
  getStockCategoriesPaged,
  createStockCategory,
} from "@/lib/services/stock.service";
import { stockCategorySchema } from "@/lib/validations/stock.schema";
import { parseListPaginationFromUrl } from "@/lib/validations/list-query.schema";

/** GET /api/stock-categories — paginated stock categories with item counts */
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
    const result = await getStockCategoriesPaged({ page, pageSize, q });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[StockCategoriesAPI] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock categories" },
      { status: 500 }
    );
  }
}

/** POST /api/stock-categories — creates a new stock category */
export async function POST(request: Request) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const body: unknown = await request.json();
    const parsed = stockCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const category = await createStockCategory(parsed.data);
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create stock category";
    console.error("[StockCategoriesAPI] POST error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

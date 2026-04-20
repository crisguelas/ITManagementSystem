/**
 * @file route.ts
 * @description API routes for Stock Category collection.
 * GET: list all stock categories. POST: create a new stock category.
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { stockCategorySchema } from "@/lib/validations/stock.schema";
import {
  getStockCategories,
  createStockCategory,
} from "@/lib/services/stock.service";

/** GET /api/stock-categories — returns all stock categories with item counts */
export async function GET() {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const categories = await getStockCategories();
    return NextResponse.json({ success: true, data: categories });
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

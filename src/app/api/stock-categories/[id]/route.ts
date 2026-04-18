/**
 * @file route.ts
 * @description API routes for individual Stock Category resources.
 * PATCH: update a stock category. DELETE: delete a stock category.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stockCategorySchema } from "@/lib/validations/stock.schema";
import {
  updateStockCategory,
  deleteStockCategory,
} from "@/lib/services/stock.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** PATCH /api/stock-categories/[id] — updates a stock category */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = stockCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const category = await updateStockCategory(id, parsed.data);
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update stock category";
    console.error("[StockCategoriesAPI] PATCH error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/** DELETE /api/stock-categories/[id] — deletes a stock category */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteStockCategory(id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete stock category";
    console.error("[StockCategoriesAPI] DELETE error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

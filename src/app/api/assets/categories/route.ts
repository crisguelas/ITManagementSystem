/**
 * @file route.ts
 * @description Compatibility API routes for asset categories.
 * Uses stock categories as the unified category source.
 */

import { NextResponse } from "next/server";
import { getStockCategoriesPaged, createStockCategory } from "@/lib/services/stock.service";
import { stockCategorySchema } from "@/lib/validations/stock.schema";
import { requireAdmin, requireSession } from "@/lib/api-auth";
import { parseListPaginationFromUrl } from "@/lib/validations/list-query.schema";

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
    const categories = await getStockCategoriesPaged({ page, pageSize, q });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: unknown) {
    console.error("[API_CATEGORIES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const body = await request.json();
    
    /* Validate body with Zod */
    const validationResult = stockCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    /* Call Service */
    const newCategory = await createStockCategory(validationResult.data);
    
    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API_CATEGORIES_POST]", error);
    
    /* Handle unique constraint errors thrown by service */
    if (error instanceof Error && error.message.includes("already exists")) {
       return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while creating the category" },
      { status: 500 }
    );
  }
}

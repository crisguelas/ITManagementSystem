/**
 * @file route.ts
 * @description API routes for CatalogItem collection.
 * GET: list catalog items. POST: create a new catalog item.
 */

import { NextResponse } from "next/server";

import { requireAdmin, requireSession } from "@/lib/api-auth";
import { createCatalogItem, getCatalogItems } from "@/lib/services/catalog.service";
import { catalogItemSchema } from "@/lib/validations/catalog-item.schema";

/** GET /api/catalog-items — returns all catalog items */
export async function GET() {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const items = await getCatalogItems();
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("[CatalogItemsAPI] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch catalog items" },
      { status: 500 }
    );
  }
}

/** POST /api/catalog-items — creates a new catalog item */
export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const body: unknown = await request.json();
    const parsed = catalogItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const item = await createCatalogItem(parsed.data);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create catalog item";
    console.error("[CatalogItemsAPI] POST error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}


/**
 * @file route.ts
 * @description API routes for individual CatalogItem resources.
 * GET: fetch item. PATCH: update item. DELETE: delete item.
 */

import { NextResponse } from "next/server";

import { requireAdmin, requireSession } from "@/lib/api-auth";
import {
  deleteCatalogItem,
  getCatalogItemById,
  updateCatalogItem,
} from "@/lib/services/catalog.service";
import { catalogItemSchema } from "@/lib/validations/catalog-item.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/catalog-items/[id] — returns a single catalog item */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    const item = await getCatalogItemById(id);
    if (!item) {
      return NextResponse.json({ success: false, error: "Catalog item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("[CatalogItemsAPI] GET[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch catalog item" },
      { status: 500 }
    );
  }
}

/** PATCH /api/catalog-items/[id] — updates a catalog item */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = catalogItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const item = await updateCatalogItem(id, parsed.data);
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update catalog item";
    console.error("[CatalogItemsAPI] PATCH error:", error);
    const status = error instanceof Error && error.message === "Catalog item not found" ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/** DELETE /api/catalog-items/[id] — deletes a catalog item (blocked if linked) */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    await deleteCatalogItem(id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete catalog item";
    console.error("[CatalogItemsAPI] DELETE error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}


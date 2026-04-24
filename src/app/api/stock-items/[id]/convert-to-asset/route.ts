/**
 * @file route.ts
 * @description API route to convert one unit of stock into a tracked asset instance.
 * POST: strict stock OUT + asset creation in a single transaction.
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-auth";
import { convertStockItemToAsset } from "@/lib/services/conversion.service";
import { stockToAssetSchema } from "@/lib/validations/stock-to-asset.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/stock-items/[id]/convert-to-asset — converts 1 stock unit into an asset instance */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;
    const { session } = authResult;

    const { id } = await params;
    const body: unknown = await request.json();

    const parsed = stockToAssetSchema.safeParse({ ...(body as object), stockItemId: id });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const asset = await convertStockItemToAsset(parsed.data, session.user.id);
    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to convert stock item to asset";
    console.error("[StockItemsConvertAPI] POST error:", error);
    const status =
      error instanceof Error &&
      (error.message.includes("only") ||
        error.message.includes("already in use") ||
        error.message.includes("not found"))
        ? 400
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}


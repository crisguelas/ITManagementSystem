/**
 * @file route.ts
 * @description API Routes for a specific Asset (GET, PATCH, DELETE).
 */

import { NextResponse } from "next/server";

import { getAssetById } from "@/lib/services/asset.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asset = await getAssetById(id);

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: asset });
  } catch (error: unknown) {
    console.error("[API_ASSETS_ID_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch asset details" },
      { status: 500 }
    );
  }
}

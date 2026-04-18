/**
 * @file route.ts
 * @description API Routes for Assets.
 */

import { NextResponse } from "next/server";
import { getAssets, createAsset } from "@/lib/services/asset.service";
import { assetSchema } from "@/lib/validations/asset.schema";

export async function GET() {
  try {
    const assets = await getAssets();
    return NextResponse.json({ success: true, data: assets });
  } catch (error: any) {
    console.error("[API_ASSETS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    /* Validate body with Zod */
    const validationResult = assetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    /* Call Service */
    const newAsset = await createAsset(validationResult.data);
    
    return NextResponse.json({ success: true, data: newAsset }, { status: 201 });
  } catch (error: any) {
    console.error("[API_ASSETS_POST]", error);
    
    /* Handle service logic errors (e.g. duplicate PC number) */
    if (error.message && error.message.includes("already in use")) {
       return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while creating the asset" },
      { status: 500 }
    );
  }
}

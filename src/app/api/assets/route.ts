/**
 * @file route.ts
 * @description API Routes for Assets.
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAssets, createAsset } from "@/lib/services/asset.service";
import { assetSchema } from "@/lib/validations/asset.schema";

export async function GET() {
  try {
    const assets = await getAssets();
    return NextResponse.json({ success: true, data: assets });
  } catch (error: unknown) {
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
    const normalizedBody = {
      ...body,
      pcNumber: typeof body.pcNumber === "string" ? body.pcNumber.trim() : body.pcNumber,
      serialNumber:
        typeof body.serialNumber === "string" ? body.serialNumber.trim() : body.serialNumber,
      macAddress: typeof body.macAddress === "string" ? body.macAddress.trim() : body.macAddress,
      brand: typeof body.brand === "string" ? body.brand.trim() : body.brand,
      model: typeof body.model === "string" ? body.model.trim() : body.model,
      osInstalled:
        typeof body.osInstalled === "string" ? body.osInstalled.trim() : body.osInstalled,
      ram: typeof body.ram === "string" ? body.ram.trim() : body.ram,
      storage: typeof body.storage === "string" ? body.storage.trim() : body.storage,
    };
    
    /* Validate body with Zod */
    const validationResult = assetSchema.safeParse(normalizedBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    /* Call Service */
    const newAsset = await createAsset(validationResult.data);
    
    return NextResponse.json({ success: true, data: newAsset }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API_ASSETS_POST]", error);
    
    if (error instanceof Error) {
      /* Handle service logic errors (e.g. duplicate PC number / serial number) */
      if (error.message.includes("already in use")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }

      if (error.message === "Category not found") {
        return NextResponse.json(
          { success: false, error: "Selected category no longer exists. Refresh and try again." },
          { status: 404 }
        );
      }
    }

    /* Handle Prisma unique collisions (e.g. concurrent assetTag generation race) */
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : "unique field";
       return NextResponse.json(
        {
          success: false,
          error: `Duplicate value on ${target}. Please verify identifiers and try again.`,
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while creating the asset" },
      { status: 500 }
    );
  }
}

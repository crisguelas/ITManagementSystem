/**
 * @file route.ts
 * @description API Routes for a specific Asset (GET, PATCH, DELETE).
 */

import { NextResponse } from "next/server";

import { deleteAsset, getAssetById, updateAsset } from "@/lib/services/asset.service";
import { assetSchema } from "@/lib/validations/asset.schema";
import { requireAdmin, requireSession } from "@/lib/api-auth";

const normalizeOptionalText = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const normalizedBody = {
      ...body,
      pcNumber: normalizeOptionalText(body.pcNumber),
      serialNumber: normalizeOptionalText(body.serialNumber),
      macAddress: normalizeOptionalText(body.macAddress),
      brand: typeof body.brand === "string" ? body.brand.trim() : body.brand,
      model: typeof body.model === "string" ? body.model.trim() : body.model,
      osInstalled: normalizeOptionalText(body.osInstalled),
      ram: normalizeOptionalText(body.ram),
      storage: normalizeOptionalText(body.storage),
    };

    /* Validate update payload with shared Asset schema */
    const validationResult = assetSchema.safeParse(normalizedBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updatedAsset = await updateAsset(id, validationResult.data);
    return NextResponse.json({ success: true, data: updatedAsset });
  } catch (error: unknown) {
    console.error("[API_ASSETS_ID_PATCH]", error);

    if (error instanceof Error) {
      if (error.message === "Asset not found") {
        return NextResponse.json(
          { success: false, error: "Asset not found" },
          { status: 404 }
        );
      }

      if (error.message.includes("assignment history already exists")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }

      if (error.message.includes("already in use")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    await deleteAsset(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[API_ASSETS_ID_DELETE]", error);

    if (error instanceof Error) {
      if (error.message.includes("currently assigned")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }

      if (error.message.includes("transaction history")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }

      /* Explain audit lock clearly when related transaction history prevents deletion */
      if (error.message.includes("Foreign key constraint failed")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to delete this asset because it has transaction history. To preserve audit integrity, assets with historical transactions must remain in the system.",
          },
          { status: 409 }
        );
      }

      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json(
          { success: false, error: "Asset not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}

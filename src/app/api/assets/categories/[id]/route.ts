/**
 * @file route.ts
 * @description API routes for a specific asset category (PATCH, DELETE).
 */

import { NextResponse } from "next/server";

import { deleteCategory, updateCategory } from "@/lib/services/asset.service";
import { categorySchema } from "@/lib/validations/asset.schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validationResult = categorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updatedCategory = await updateCategory(id, validationResult.data);
    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error: unknown) {
    console.error("[API_ASSET_CATEGORY_ID_PATCH]", error);

    if (error instanceof Error) {
      if (error.message === "Category not found") {
        return NextResponse.json(
          { success: false, error: "Category not found" },
          { status: 404 }
        );
      }

      if (error.message.includes("already exists")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[API_ASSET_CATEGORY_ID_DELETE]", error);

    if (error instanceof Error) {
      if (error.message.includes("associated assets")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }

      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json(
          { success: false, error: "Category not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

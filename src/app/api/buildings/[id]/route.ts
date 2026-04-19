/**
 * @file route.ts
 * @description API routes for a specific building (PATCH, DELETE).
 */

import { NextResponse } from "next/server";

import { buildingSchema } from "@/lib/validations/organization.schema";
import { deleteBuilding, updateBuilding } from "@/lib/services/organization.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = buildingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateBuilding(id, validationResult.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Building not found") {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      }
      if (error.message.includes("already")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to update building" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteBuilding(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("registered rooms")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json({ success: false, error: "Building not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to delete building" }, { status: 500 });
  }
}

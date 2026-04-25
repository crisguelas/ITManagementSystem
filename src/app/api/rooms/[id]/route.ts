/**
 * @file route.ts
 * @description API routes for a specific room (PATCH, DELETE).
 */
 
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-auth";
import { deleteRoom, updateRoom } from "@/lib/services/organization.service";
import { roomSchema } from "@/lib/validations/organization.schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const validationResult = roomSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateRoom(id, validationResult.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Room not found") {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to update room" }, { status: 500 });
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
    await deleteRoom(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("active assignments")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to delete room" }, { status: 500 });
  }
}


/**
 * @file route.ts
 * @description API routes for a specific department (PATCH, DELETE).
 */

import { NextResponse } from "next/server";

import { departmentSchema } from "@/lib/validations/organization.schema";
import { deleteDepartment, updateDepartment } from "@/lib/services/organization.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = departmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateDepartment(id, validationResult.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Department not found") {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      }
      if (error.message.includes("already")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDepartment(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("active employees")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to delete department" }, { status: 500 });
  }
}

/**
 * @file route.ts
 * @description API routes for a specific employee (PATCH, DELETE/deactivate).
 */

import { NextResponse } from "next/server";

import { employeeSchema } from "@/lib/validations/organization.schema";
import { deleteEmployee, updateEmployee } from "@/lib/services/organization.service";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    const body = await request.json();

    if (body.email === "") delete body.email;
    if (body.phone === "") delete body.phone;
    if (body.phoneExt === "") delete body.phoneExt;
    if (body.position === "") delete body.position;

    const validationResult = employeeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateEmployee(id, validationResult.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Employee not found") {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to update employee" }, { status: 500 });
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
    await deleteEmployee(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("active asset assignments")) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ success: false, error: "Failed to delete employee" }, { status: 500 });
  }
}

/**
 * @file route.ts
 * @description Admin-only PATCH for updating a login user (role, active, name).
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-auth";
import { deleteUser, updateUser } from "@/lib/services/user.service";
import { updateUserSchema } from "@/lib/validations/user.schema";

/** PATCH /api/users/[id] — update user (admin only) */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await updateUser(id, parsed.data);
    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message === "User not found") {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    if (message.includes("last administrator")) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    console.error("[UsersAPI] PATCH error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** DELETE /api/users/[id] — delete user (admin only) */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const { id } = await context.params;
    await deleteUser(id, authResult.session.user.id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message === "User not found") {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    if (
      message.includes("last administrator") ||
      message.includes("Cannot delete this user") ||
      message.includes("cannot delete your own account")
    ) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    console.error("[UsersAPI] DELETE error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

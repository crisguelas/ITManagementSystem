/**
 * @file route.ts
 * @description Admin-only PATCH for updating a login user (role, active, name).
 */

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { updateUser } from "@/lib/services/user.service";
import { updateUserSchema } from "@/lib/validations/user.schema";

/** PATCH /api/users/[id] — update user (admin only) */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

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

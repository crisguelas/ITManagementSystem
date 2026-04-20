/**
 * @file route.ts
 * @description Authenticated route for changing the current user's password.
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { changeOwnPassword } from "@/lib/services/user.service";
import { changePasswordSchema } from "@/lib/validations/user.schema";

/** POST /api/account/change-password — change current user's password */
export async function POST(request: Request) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await changeOwnPassword(authResult.session.user.id, parsed.data);
    return NextResponse.json({ success: true, data: { message: "Password updated successfully" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message === "User not found") {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    if (
      message === "Current password is incorrect" ||
      message === "New password must be different from your current password"
    ) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    console.error("[ChangePasswordAPI] POST error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

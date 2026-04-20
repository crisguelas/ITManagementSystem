/**
 * @file route.ts
 * @description Admin-only API for IT staff login users (`User` model).
 * GET: list users. POST: create user.
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-auth";
import { createUser, listUsers } from "@/lib/services/user.service";
import { createUserSchema } from "@/lib/validations/user.schema";

/** GET /api/users — list all login users (admin only) */
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const users = await listUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("[UsersAPI] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/** POST /api/users — create login user (admin only) */
export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await createUser(parsed.data);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message.includes("already exists")) {
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }
    console.error("[UsersAPI] POST error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

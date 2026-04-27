/**
 * @file route.ts
 * @description API Routes for Rooms.
 */

import { NextResponse } from "next/server";

import { requireAdmin, requireSession } from "@/lib/api-auth";
import { getRooms, createRoom } from "@/lib/services/organization.service";
import { roomSchema } from "@/lib/validations/organization.schema";

export async function GET() {
  /* Returns rooms with building context for authenticated organization/location pages */
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const data = await getRooms();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  /* Creates a room for admin users after validating room payload constraints */
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const body = await request.json();
    const validationResult = roomSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const newRoom = await createRoom(validationResult.data);
    return NextResponse.json({ success: true, data: newRoom }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already exists")) {
       return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

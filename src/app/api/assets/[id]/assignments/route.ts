/**
 * @file route.ts
 * @description POST /api/assets/[id]/assignments — assign asset to employee and/or room.
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { assignAsset } from "@/lib/services/assignment.service";
import { createAssignmentSchema } from "@/lib/validations/assignment.schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;
    const { session } = authResult;
    if (!session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: assetId } = await params;
    const body: unknown = await request.json();
    const parsed = createAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      const first =
        parsed.error.flatten().formErrors[0] ??
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
        "Invalid request";
      return NextResponse.json({ success: false, error: first }, { status: 400 });
    }

    const assignment = await assignAsset(assetId, parsed.data, session.user.id);
    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create assignment";
    console.error("[API_ASSETS_ASSIGNMENTS_POST]", error);
    const status =
      message === "Asset not found" ||
      message === "Employee not found" ||
      message === "Room not found"
        ? 404
        : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

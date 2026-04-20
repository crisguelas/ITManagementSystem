/**
 * @file route.ts
 * @description POST /api/assets/[id]/assignments/return — return asset (close active assignment).
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { returnAsset } from "@/lib/services/assignment.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;
    if (!authResult.session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: assetId } = await params;

    const assignment = await returnAsset(assetId);
    return NextResponse.json({ success: true, data: assignment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to return asset";
    console.error("[API_ASSETS_ASSIGNMENTS_RETURN_POST]", error);
    const status = message === "No active assignment to return" ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

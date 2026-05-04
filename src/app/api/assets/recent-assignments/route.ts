/**
 * @file route.ts
 * @description GET /api/assets/recent-assignments — latest open assignments for header notifications (capped).
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { getRecentActiveAssignmentNotifications } from "@/lib/services/asset.service";

const DEFAULT_LIMIT = 12;

export async function GET(request: Request) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const limit = Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT;

    const data = await getRecentActiveAssignmentNotifications(limit);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[AssetsRecentAssignmentsAPI] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recent assignments" },
      { status: 500 }
    );
  }
}

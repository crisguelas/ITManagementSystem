/**
 * @file route.ts
 * @description API Routes for Buildings.
 */

import { NextResponse } from "next/server";
import { getBuildingsPaged, createBuilding } from "@/lib/services/organization.service";
import { buildingSchema } from "@/lib/validations/organization.schema";
import { requireAdmin, requireSession } from "@/lib/api-auth";
import { parseListPaginationFromUrl } from "@/lib/validations/list-query.schema";

export async function GET(request: Request) {
  /* Returns paginated buildings for authenticated organization/location management pages */
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const parsed = parseListPaginationFromUrl(request.url);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { page, pageSize, q } = parsed.data;
    const data = await getBuildingsPaged({ page, pageSize, q });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch buildings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  /* Creates a building for admin users after validating required building fields */
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const body = await request.json();
    const validationResult = buildingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const newBuilding = await createBuilding(validationResult.data);
    return NextResponse.json({ success: true, data: newBuilding }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already")) {
       return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

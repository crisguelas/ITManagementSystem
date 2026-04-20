/**
 * @file route.ts
 * @description API Routes for Buildings.
 */

import { NextResponse } from "next/server";
import { getBuildings, createBuilding } from "@/lib/services/organization.service";
import { buildingSchema } from "@/lib/validations/organization.schema";
import { requireAdmin, requireSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const data = await getBuildings();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch buildings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

/**
 * @file route.ts
 * @description API Routes for Buildings.
 */

import { NextResponse } from "next/server";
import { getBuildings, createBuilding } from "@/lib/services/organization.service";
import { buildingSchema } from "@/lib/validations/organization.schema";

export async function GET() {
  try {
    const data = await getBuildings();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch buildings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (error: any) {
    if (error.message && error.message.includes("already")) {
       return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

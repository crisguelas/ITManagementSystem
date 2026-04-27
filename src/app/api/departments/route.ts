/**
 * @file route.ts
 * @description API Routes for Departments.
 */

import { NextResponse } from "next/server";
import { getDepartments, createDepartment } from "@/lib/services/organization.service";
import { departmentSchema } from "@/lib/validations/organization.schema";
import { requireAdmin, requireSession } from "@/lib/api-auth";

export async function GET() {
  /* Returns department data for authenticated organization and employee workflows */
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const data = await getDepartments();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  /* Creates a new department for admin users after schema validation */
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const body = await request.json();
    const validationResult = departmentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const newDepartment = await createDepartment(validationResult.data);
    return NextResponse.json({ success: true, data: newDepartment }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already")) {
       return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

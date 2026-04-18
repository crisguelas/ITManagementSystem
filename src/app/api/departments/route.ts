/**
 * @file route.ts
 * @description API Routes for Departments.
 */

import { NextResponse } from "next/server";
import { getDepartments, createDepartment } from "@/lib/services/organization.service";
import { departmentSchema } from "@/lib/validations/organization.schema";

export async function GET() {
  try {
    const data = await getDepartments();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (error: any) {
    if (error.message && error.message.includes("already")) {
       return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

/**
 * @file route.ts
 * @description API Routes for Employees.
 */

import { NextResponse } from "next/server";
import { getEmployees, createEmployee } from "@/lib/services/organization.service";
import { employeeSchema } from "@/lib/validations/organization.schema";
import { requireAdmin, requireSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const data = await getEmployees();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (authResult.response) return authResult.response;

    const body = await request.json();
    
    /* Clean up empty optional fields into proper nulls or undefines for zod/prisma */
    if (body.email === "") delete body.email;
    if (body.phone === "") delete body.phone;
    if (body.position === "") delete body.position;

    const validationResult = employeeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const newEmployee = await createEmployee(validationResult.data);
    return NextResponse.json({ success: true, data: newEmployee }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already exists")) {
       return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

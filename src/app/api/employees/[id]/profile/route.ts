/**
 * @file route.ts
 * @description API route for loading one employee profile with active assignments.
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { getEmployeeProfileById } from "@/lib/services/organization.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    const profile = await getEmployeeProfileById(id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee profile" },
      { status: 500 },
    );
  }
}

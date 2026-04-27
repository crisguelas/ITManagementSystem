/**
 * @file route.ts
 * @description Authenticated global search endpoint for employee-first suggestions.
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { searchGlobalDirectory } from "@/lib/services/organization.service";

export async function GET(request: Request) {
  /* Returns global search suggestions for authenticated users across people and assets */
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const results = await searchGlobalDirectory(query);

    return NextResponse.json({ success: true, data: results });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to run global search" },
      { status: 500 },
    );
  }
}

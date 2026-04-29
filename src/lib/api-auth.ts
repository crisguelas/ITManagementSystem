/**
 * @file api-auth.ts
 * @description Shared API auth guards for authenticated and admin-only routes.
 */

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasExceededAbsoluteSessionLifetime } from "@/lib/auth.config";

export const requireSession = async () => {
  const session = await auth();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (
    typeof session.loginIssuedAt === "number" &&
    hasExceededAbsoluteSessionLifetime(session.loginIssuedAt)
  ) {
    return {
      session: null,
      response: NextResponse.json({ success: false, error: "Session expired. Please sign in again." }, { status: 401 }),
    };
  }
  return { session, response: null };
};

export const requireAdmin = async () => {
  const { session, response } = await requireSession();
  if (response) {
    return { session: null, response };
  }
  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, response: null };
};

/**
 * @file middleware.ts
 * @description Next.js middleware for route protection using NextAuth.
 * This runs at the Edge, ensuring unauthenticated users never reach protected code.
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/* Initialize NextAuth with the edge-compatible config */
export default NextAuth(authConfig).auth;

/* Configure which routes the middleware should run on */
export const config = {
  /* Match all request paths except api, static files, images, etc. */
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)'],
};

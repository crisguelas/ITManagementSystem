/**
 * @file auth.config.ts
 * @description NextAuth configuration object exported separately for Edge runtime compatibility.
 * Middleware uses this file without importing Node.js specific libraries (Prisma/Bcrypt).
 */

import type { NextAuthConfig } from "next-auth";

/* Shared absolute session lifetime policy: 12 hours from initial sign-in */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const ABSOLUTE_SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

/* Returns true when a persisted login timestamp has exceeded the absolute lifetime */
export const hasExceededAbsoluteSessionLifetime = (loginIssuedAt: number) =>
  Date.now() - loginIssuedAt >= ABSOLUTE_SESSION_MAX_AGE_MS;

export const authConfig = {
  /* Custom pages for NextAuth */
  pages: {
    signIn: "/login",
  },
  
  /* Callbacks for session and JWT manipulation */
  callbacks: {
    /* Authorized callback — runs in middleware to protect routes */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const loginIssuedAt =
        auth && typeof auth === "object" && "loginIssuedAt" in auth && typeof auth.loginIssuedAt === "number"
          ? auth.loginIssuedAt
          : null;
      const hasExpiredAbsoluteSession =
        loginIssuedAt !== null && hasExceededAbsoluteSessionLifetime(loginIssuedAt);
      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isLoginRoute = nextUrl.pathname.startsWith("/login");
      const isPublicScanRoute = nextUrl.pathname.startsWith("/scan");
      
      /* Always allow API auth routes */
      if (isApiAuthRoute) return true;
      /* Keep asset QR scan pages publicly accessible */
      if (isPublicScanRoute) return true;

      /* Restrict dashboard access */
      if (!isLoginRoute) {
        if (isLoggedIn && hasExpiredAbsoluteSession) {
          return false;
        }
        if (isLoggedIn) return true;
        return false; /* Redirect unauthenticated users to login page */
      } else if (isLoggedIn) {
        /* Keep expired sessions on /login so users can re-authenticate without redirect loops */
        if (hasExpiredAbsoluteSession) {
          return true;
        }
        /* Redirect authenticated users attempting to access login back to dashboard */
        return Response.redirect(new URL('/', nextUrl));
      }
      
      return true;
    },
    
    /* JWT callback — adds custom fields to the token */
    async jwt({ token, user }) {
      if (user) {
        /* User object only available during sign-in */
        token.role = user.role;
        token.id = user.id;
        /* Persist immutable login timestamp for absolute session cutoff checks */
        token.loginIssuedAt = Date.now();
      }
      if (typeof token.loginIssuedAt !== "number") {
        token.loginIssuedAt = typeof token.iat === "number" ? token.iat * 1000 : Date.now();
      }
      return token;
    },
    
    /* Session callback — passes token values to the client session */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as "ADMIN" | "MEMBER";
        session.user.id = token.id as string;
        session.loginIssuedAt = typeof token.loginIssuedAt === "number" ? token.loginIssuedAt : Date.now();
      }
      return session;
    }
  },
  
  /* Providers to be added in auth.ts */
  providers: [], 
} satisfies NextAuthConfig;

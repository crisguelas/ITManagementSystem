/**
 * @file auth.config.ts
 * @description NextAuth configuration object exported separately for Edge runtime compatibility.
 * Middleware uses this file without importing Node.js specific libraries (Prisma/Bcrypt).
 */

import type { NextAuthConfig } from "next-auth";

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
      const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
      const isLoginRoute = nextUrl.pathname.startsWith('/login');
      const isPublicScanRoute = nextUrl.pathname.startsWith("/scan");
      
      /* Always allow API auth routes */
      if (isApiAuthRoute) return true;
      /* Keep asset QR scan pages publicly accessible */
      if (isPublicScanRoute) return true;

      /* Restrict dashboard access */
      if (!isLoginRoute) {
        if (isLoggedIn) return true;
        return false; /* Redirect unauthenticated users to login page */
      } else if (isLoggedIn) {
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
      }
      return token;
    },
    
    /* Session callback — passes token values to the client session */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as "ADMIN" | "MEMBER";
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  
  /* Providers to be added in auth.ts */
  providers: [], 
} satisfies NextAuthConfig;

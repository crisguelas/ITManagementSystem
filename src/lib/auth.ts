/**
 * @file auth.ts
 * @description Main NextAuth instance integrating Prisma and Bcrypt.
 * This runs in a Node.js environment (not Edge), so we can use server databases.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/* Local imports */
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";

/* Enforces an absolute 12-hour session lifetime for authenticated users */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        /* Validation check */
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          /* Fetch user from the database */
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          /* Deny access if user not found or deactivated */
          if (!user || !user.isActive) {
            return null;
          }

          /* Compare hashed passwords */
          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          /* Return user object (omitting password implicitly handled by return type) to encode in JWT */
          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }

        return null;
      },
    }),
  ],
});

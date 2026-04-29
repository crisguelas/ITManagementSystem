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
import { SESSION_MAX_AGE_SECONDS } from "./auth.config";
import {
  applyLoginFailureBackoff,
  clearLoginFailures,
  createLoginAttemptKey,
  getLoginRateLimitStatus,
  getRequestIpAddress,
  registerLoginFailure,
} from "@/lib/auth-rate-limit";
import { prisma } from "@/lib/prisma";

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
      async authorize(credentials, request) {
        /* Validation check */
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        /* Build a per-email-and-IP key to throttle repeated credential failures */
        const normalizedEmail = String(credentials.email).trim().toLowerCase();
        const requestIp = getRequestIpAddress(request);
        const attemptKey = createLoginAttemptKey(normalizedEmail, requestIp);

        /* Block login checks while a temporary lockout is active for this key */
        const rateLimitStatus = getLoginRateLimitStatus(attemptKey);
        if (rateLimitStatus.isLocked) {
          return null;
        }

        try {
          /* Fetch user from the database */
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          /* Deny access if user not found or deactivated */
          if (!user || !user.isActive) {
            registerLoginFailure(attemptKey);
            await applyLoginFailureBackoff(attemptKey);
            return null;
          }

          /* Compare hashed passwords */
          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          /* Return user object (omitting password implicitly handled by return type) to encode in JWT */
          if (passwordsMatch) {
            clearLoginFailures(attemptKey);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }

          /* Register failed password attempts to reduce brute-force effectiveness */
          registerLoginFailure(attemptKey);
          await applyLoginFailureBackoff(attemptKey);
        } catch (error) {
          registerLoginFailure(attemptKey);
          await applyLoginFailureBackoff(attemptKey);
          console.error("Authorization error:", error);
          return null;
        }

        return null;
      },
    }),
  ],
});

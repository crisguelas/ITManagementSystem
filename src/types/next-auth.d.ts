import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MEMBER";
    } & DefaultSession["user"];
    loginIssuedAt: number;
  }

  interface User {
    role: "ADMIN" | "MEMBER";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: "ADMIN" | "MEMBER";
    loginIssuedAt?: number;
  }
}

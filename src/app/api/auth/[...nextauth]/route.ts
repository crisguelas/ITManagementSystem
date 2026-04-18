/**
 * @file route.ts
 * @description NextAuth capture route for handling auth endpoints (signin, signout, session).
 */

import { handlers } from "@/lib/auth";

/* Export the generated NextAuth GET and POST router handlers */
export const { GET, POST } = handlers;

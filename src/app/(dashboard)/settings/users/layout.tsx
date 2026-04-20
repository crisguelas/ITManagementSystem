/**
 * @file layout.tsx
 * @description Restricts `/settings/users` to **ADMIN** — user account management only.
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function SettingsUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  /* Only administrators may manage login accounts and roles */
  if (session.user.role !== "ADMIN") {
    redirect("/settings");
  }

  return <>{children}</>;
}

/**
 * @file layout.tsx
 * @description Dashboard layout wrapper for authenticated routes.
 * Includes the Sidebar and Header components.
 */

import { auth } from "@/lib/auth";
import { ResponsiveDashboardShell } from "@/components/layout/responsive-dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const currentUserName = session?.user?.name ?? session?.user?.email ?? "User";
  const currentUserRole = session?.user?.role ?? "MEMBER";

  return (
    <ResponsiveDashboardShell
      isAdmin={isAdmin}
      currentUserName={currentUserName}
      currentUserRole={currentUserRole}
    >
      {children}
    </ResponsiveDashboardShell>
  );
}

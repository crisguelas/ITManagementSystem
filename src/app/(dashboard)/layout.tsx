/**
 * @file layout.tsx
 * @description Dashboard layout wrapper for authenticated routes.
 * Includes the Sidebar and Header components.
 */

import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation — admin-only links hidden for members */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header currentUserName={currentUserName} currentUserRole={currentUserRole} />

        {/* Page Content Region (scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

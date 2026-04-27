/**
 * @file responsive-dashboard-shell.tsx
 * @description Responsive dashboard shell wiring sidebar/header and scrollable content area.
 */

"use client";

import { useCallback, useState } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

interface ResponsiveDashboardShellProps {
  children: React.ReactNode;
  isAdmin: boolean;
  currentUserName: string;
  currentUserRole: "ADMIN" | "MEMBER";
}

/**
 * ResponsiveDashboardShell — wraps dashboard pages with a mobile drawer sidebar.
 */
export const ResponsiveDashboardShell = ({
  children,
  isAdmin,
  currentUserName,
  currentUserRole,
}: ResponsiveDashboardShellProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const handleMobileSidebarClose = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);
  const handleMobileSidebarOpen = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-background">
      <Sidebar
        isAdmin={isAdmin}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onOpenMobileSidebar={handleMobileSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

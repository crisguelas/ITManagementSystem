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

  /* Viewport-height shell + min-h-0 chain keeps scroll inside `main` so the header stays visible while content scrolls */
  return (
    <div className="relative flex h-dvh min-h-0 overflow-hidden bg-background print:block print:h-auto print:min-h-0 print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar
          isAdmin={isAdmin}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleMobileSidebarClose}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden print:block print:min-w-0 print:overflow-visible">
        <div className="print:hidden">
          <Header
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
            isMobileSidebarOpen={isMobileSidebarOpen}
            onOpenMobileSidebar={handleMobileSidebarOpen}
          />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background p-3 sm:p-4 md:p-6 lg:p-8 print:overflow-visible print:bg-white print:p-0">
          <div className="mx-auto max-w-7xl print:mx-0 print:max-w-none">{children}</div>
        </main>
      </div>
    </div>
  );
};

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
  const [isDesktopSidebarHidden, setIsDesktopSidebarHidden] = useState(false);
  const handleMobileSidebarClose = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);
  const handleMobileSidebarOpen = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);
  const handleDesktopSidebarToggle = useCallback(() => {
    setIsDesktopSidebarHidden((prev) => !prev);
  }, []);
  const handleDesktopSidebarShow = useCallback(() => {
    setIsDesktopSidebarHidden(false);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-background">
      <Sidebar
        isAdmin={isAdmin}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
        isDesktopHidden={isDesktopSidebarHidden}
        onDesktopToggle={handleDesktopSidebarToggle}
      />
      {isDesktopSidebarHidden && (
        <button
          type="button"
          onClick={handleDesktopSidebarShow}
          className="fixed left-3 top-20 z-30 hidden items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 md:flex"
          aria-label="Show sidebar"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      )}

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

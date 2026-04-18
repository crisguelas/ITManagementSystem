/**
 * @file layout.tsx
 * @description Dashboard layout wrapper for authenticated routes.
 * Includes the Sidebar and Header components.
 */

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header />

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

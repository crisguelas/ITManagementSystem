/**
 * @file header.tsx
 * @description Top header for the application dashboard layout.
 * Contains user profile dropdown, notifications placeholder, and mobile menu toggle.
 */

"use client";

import { usePathname } from "next/navigation";
import { User, LogOut, Bell } from "lucide-react";

/* Local imports */
import { cn, capitalize } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

export const Header = () => {
  const pathname = usePathname();
  
  /* Create a simple title based on the pathname for the header */
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    
    // Extract the first segment of the path
    const segment = pathname.split("/").filter(Boolean)[0];
    if (segment) {
      return capitalize(segment.replace(/-/g, " "));
    }
    
    return "";
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 z-10 sticky top-0 shadow-sm">
      {/* Left side: Page Title */}
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors focus-ring">
          <Bell className="w-5 h-5" />
          {/* Unread badge indicator */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border-2 border-white"></span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* User Profile Summary (Simplified for now before Auth integration) */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-medium text-gray-800 group-hover:text-primary-600 transition-colors">Admin User</span>
            <span className="text-xs text-gray-500">Administrator</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 border border-primary-200 group-hover:border-primary-300 transition-colors">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

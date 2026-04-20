/**
 * @file header.tsx
 * @description Top header for the application dashboard layout.
 * Contains user profile dropdown, notifications placeholder, and mobile menu toggle.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { User, Bell, ChevronDown, LogOut, KeyRound } from "lucide-react";

/* Local imports */
import { capitalize } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

interface HeaderProps {
  currentUserName: string;
  currentUserRole: "ADMIN" | "MEMBER";
}

export const Header = ({ currentUserName, currentUserRole }: HeaderProps) => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /* Close the profile dropdown when users click outside the menu */
  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, []);

  /* Sign out the current user and redirect back to the login screen */
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };
  
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

        {/* User Profile Summary + dropdown menu for account actions */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 cursor-pointer group rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-sm font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                {currentUserName}
              </span>
              <span className="text-xs text-gray-500">
                {currentUserRole === "ADMIN" ? "Administrator" : "Member"}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 border border-primary-200 group-hover:border-primary-300 transition-colors">
              <User className="w-4 h-4" />
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg p-1 z-30"
              role="menu"
            >
              <Link
                href="/account/change-password"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <KeyRound className="w-4 h-4" />
                Change Password
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

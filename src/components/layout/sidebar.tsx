/**
 * @file sidebar.tsx
 * @description Main application sidebar navigation.
 * Renders the primary navigation links based on NAV_ITEMS.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/* Third-party imports */
import {
  LayoutDashboard,
  Monitor,
  Building2,
  Users,
  Warehouse,
  FileBarChart,
  Settings,
  ChevronDown,
  Menu,
} from "lucide-react";

/* Local imports */
import { cn } from "@/lib/utils";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";

/* ═══════════════════════════════════════════════════════════════ */
/* ICON MAPPING                                                    */
/* ═══════════════════════════════════════════════════════════════ */

/* Map string icon names from constants to actual Lucide components */
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Monitor,
  Building2,
  Users,
  Warehouse,
  FileBarChart,
  Settings,
};

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

interface SidebarProps {
  /** When false, items marked `adminOnly` in NAV_ITEMS are hidden */
  isAdmin?: boolean;
}

export const Sidebar = ({ isAdmin = false }: SidebarProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  /* Toggle a specific dropdown menu open/closed */
  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  /* Check if a nav item or its children are currently active */
  const isItemActive = (item: typeof NAV_ITEMS[number]) => {
    if (item.href === "/" && pathname !== "/") return false;
    if (pathname === item.href) return true;
    
    // Check if any child is active
    if ('children' in item && item.children) {
        return item.children.some(child => pathname.startsWith(child.href));
    }
    
    // Fallback: check if the path starts with the href (for nested routes)
    return item.href !== "/" && pathname.startsWith(item.href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-primary-900 text-white transition-all duration-300 z-20 shrink-0",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Sidebar Header: Logo and App Name */}
      <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-primary-800">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded bg-primary-500 flex items-center justify-center shrink-0 font-bold text-white shadow-sm">
              I
            </div>
            <div className="flex flex-col min-w-0">
               <span className="font-semibold text-sm truncate">{APP_NAME}</span>
               <span className="text-[10px] text-primary-300 truncate">IT Department</span>
            </div>
          </div>
        )}
        {collapsed && (
           <div className="w-8 h-8 rounded bg-primary-500 flex items-center justify-center shrink-0 font-bold text-white mx-auto shadow-sm">
             I
           </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="px-3 space-y-1">
          {NAV_ITEMS.filter((item) => {
            if ("adminOnly" in item && item.adminOnly) {
              return isAdmin;
            }
            return true;
          }).map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isActive = isItemActive(item);
            const hasChildren = "children" in item && item.children && item.children.length > 0;
            const isDropdownOpen = openDropdowns[item.label] || isActive;

            return (
              <div key={item.label} className="flex flex-col">
                {/* Main Nav Item */}
                {hasChildren ? (
                  <button
                    onClick={() => {
                      if (collapsed) setCollapsed(false);
                      toggleDropdown(item.label);
                    }}
                    className={cn(
                      "flex items-center w-full px-3 py-2.5 rounded-lg transition-colors group",
                      isActive
                        ? "bg-primary-800 text-white"
                        : "text-primary-100 hover:bg-primary-800/50 hover:text-white"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-400" : "text-primary-300 group-hover:text-primary-200")} />
                    {!collapsed && (
                      <>
                        <span className="ml-3 text-sm font-medium flex-1 text-left">
                          {item.label}
                        </span>
                        <ChevronDown 
                          className={cn(
                            "w-4 h-4 transition-transform duration-200", 
                            isDropdownOpen ? "rotate-180" : ""
                          )} 
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg transition-colors group",
                      isActive
                        ? "bg-primary-800 text-white"
                        : "text-primary-100 hover:bg-primary-800/50 hover:text-white"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-400" : "text-primary-300 group-hover:text-primary-200")} />
                    {!collapsed && (
                      <span className="ml-3 text-sm font-medium">
                        {item.label}
                      </span>
                    )}
                  </Link>
                )}

                {/* Submenu for items with children */}
                {!collapsed && hasChildren && isDropdownOpen && (
                  <div className="mt-1 ml-4 pl-4 border-l border-primary-800/50 space-y-1">
                    {item.children
                      .filter((child) => {
                        /* Hide admin-only submenu entries (e.g. User Accounts) from members */
                        return !("adminOnly" in child && child.adminOnly) || isAdmin;
                      })
                      .map((child) => {
                       const isChildActive = pathname === child.href || pathname.startsWith(child.href);
                       return (
                        <Link
                          key={child.label}
                          href={child.href}
                          className={cn(
                            "flex items-center block py-2 px-3 rounded-lg text-sm transition-colors",
                            isChildActive 
                              ? "bg-primary-800/60 text-white font-medium" 
                              : "text-primary-200 hover:bg-primary-800/30 hover:text-white"
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      
      {/* Toggle Sidebar Button */}
      <div className="p-3 border-t border-primary-800 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full p-2 text-primary-300 hover:text-white hover:bg-primary-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
      </div>
    </aside>
  );
};

/**
 * @file settings-nav.tsx
 * @description Sub-navigation for Settings — user accounts for admins; categories for all authenticated roles.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINK_DEFS = [
  { href: "/settings/users", label: "User accounts", adminOnly: true },
  { href: "/categories", label: "Categories", adminOnly: false },
] as const;

interface SettingsNavProps {
  /** When true, the User accounts tab is shown */
  isAdmin: boolean;
}

/**
 * SettingsNav — horizontal tabs linking to settings sections; omits admin-only tabs for members.
 */
export const SettingsNav = ({ isAdmin }: SettingsNavProps) => {
  const pathname = usePathname();

  const links = LINK_DEFS.filter((link) => !link.adminOnly || isAdmin);

  return (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3" aria-label="Settings sections">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-100 text-primary-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

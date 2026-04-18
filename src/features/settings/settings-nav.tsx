/**
 * @file settings-nav.tsx
 * @description Sub-navigation for Settings (admin-only). Highlights the active section.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [{ href: "/settings/users", label: "User accounts" }] as const;

export const SettingsNav = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3" aria-label="Settings sections">
      {LINKS.map(({ href, label }) => {
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

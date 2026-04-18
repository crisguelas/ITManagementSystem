/**
 * @file breadcrumb.tsx
 * @description Navigation breadcrumb component to show the current path.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

/* Local imports */
import { capitalize } from "@/lib/utils";

export const Breadcrumb = () => {
  const pathname = usePathname();
  
  if (pathname === "/") {
    return null; // Don't show breadcrumbs on the home dashboard
  }

  /* Split the pathname into segments, filter out empty strings */
  const pathSegments = pathname.split("/").filter((segment) => segment);

  return (
    <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {/* Home Link */}
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-primary-600 transition-colors"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        
        {/* Dynamic Segments */}
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
          
          /* Format the segment text (e.g., "asset-types" -> "Asset Types") */
          const label = capitalize(segment.replace(/-/g, " "));

          return (
            <li key={segment} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1 text-gray-400 shrink-0" />
              {isLast ? (
                <span className="font-medium text-gray-900" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-primary-600 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

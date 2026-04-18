/**
 * @file loading-state.tsx
 * @description Standardized loading skeletons and spinners to show while data is fetching.
 * Conforms to the rule: "Every component must have a loading state".
 */

/* Third-party imports */
import { Loader2 } from "lucide-react";

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT: LoadingSpinner                                       */
/* ═══════════════════════════════════════════════════════════════ */

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner — Standard spinner with optional message.
 * Can be used inline or full-screen for page loading.
 */
export const LoadingSpinner = ({
  message = "Loading...",
  className,
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3 text-gray-500", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
};

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT: SkeletonCard                                         */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * SkeletonCard — Placeholder layout for card lists.
 */
export const SkeletonCard = ({ className }: { className?: string }) => {
  return (
    <div className={cn("skeleton w-full h-[200px] border border-gray-100", className)} />
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT: SkeletonTable                                        */
/* ═══════════════════════════════════════════════════════════════ */

interface SkeletonTableProps {
  rows?: number;
}

/**
 * SkeletonTable — Placeholder layout for data tables.
 */
export const SkeletonTable = ({ rows = 5 }: SkeletonTableProps) => {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Table Header Skeleton */}
      <div className="flex bg-gray-50/80 px-6 py-4 border-b border-gray-200">
        <div className="skeleton h-5 w-1/4 mr-4" />
        <div className="skeleton h-5 w-1/4 mr-4" />
        <div className="skeleton h-5 w-1/4 mr-4" />
        <div className="skeleton h-5 w-1/4" />
      </div>

      {/* Table Body Skeleton Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex px-6 py-5 border-b border-gray-100 last:border-0"
        >
          <div className="skeleton h-4 w-1/4 mr-4 bg-gray-100" />
          <div className="skeleton h-4 w-1/4 mr-4 bg-gray-100" />
          <div className="skeleton h-4 w-1/4 mr-4 bg-gray-100" />
          <div className="skeleton h-4 w-1/4 bg-gray-100" />
        </div>
      ))}
    </div>
  );
};

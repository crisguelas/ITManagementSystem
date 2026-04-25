/**
 * @file header.tsx
 * @description Top header for the application dashboard layout.
 * Contains user profile dropdown, notifications placeholder, and mobile menu toggle.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import {
  User,
  Bell,
  ChevronDown,
  LogOut,
  KeyRound,
  AlertTriangle,
  PackagePlus,
  Menu,
} from "lucide-react";

/* Local imports */
import {
  extractLowStockRowsFromItemsList,
  type LowStockNotificationRow,
} from "@/lib/stock/low-stock-from-api";
import { capitalize } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

interface HeaderProps {
  currentUserName: string;
  currentUserRole: "ADMIN" | "MEMBER";
  isMobileSidebarOpen: boolean;
  onOpenMobileSidebar: () => void;
}

interface AssetAssignmentNotification {
  id: string;
  assetId: string;
  assetTag: string;
  assigneeName: string | null;
  roomLabel: string | null;
  assignedAt: string;
}

interface AssetNotificationPayload {
  id: string;
  assetTag: string;
  assignments: Array<{
    id: string;
    assignedAt: string;
    employee: { firstName: string; lastName: string } | null;
    room: { name: string; building: { code: string } } | null;
  }>;
}

export const Header = ({
  currentUserName,
  currentUserRole,
  isMobileSidebarOpen,
  onOpenMobileSidebar,
}: HeaderProps) => {
  const NOTIFICATION_READ_STORAGE_KEY = "itms:read-notification-ids";
  const pathname = usePathname();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lowStockNotifications, setLowStockNotifications] = useState<LowStockNotificationRow[]>([]);
  const [assignmentNotifications, setAssignmentNotifications] = useState<AssetAssignmentNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("itms:read-notification-ids");
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === "string");
    } catch {
      return [];
    }
  });
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /* Fetch low-stock and assignment notifications and map them into display-friendly rows */
  const fetchNotifications = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setIsNotificationsLoading(true);
    }
    setNotificationsError(null);

    try {
      const [stockResponse, assetsResponse] = await Promise.all([
        fetch("/api/stock-items", { credentials: "same-origin" }),
        fetch("/api/assets", { credentials: "same-origin" }),
      ]);
      const stockPayload: unknown = await stockResponse.json();
      const assetsPayload: unknown = await assetsResponse.json();

      if (!stockResponse.ok || !assetsResponse.ok) {
        throw new Error("Failed to load notifications");
      }

      if (
        !stockPayload ||
        typeof stockPayload !== "object" ||
        !("data" in stockPayload) ||
        !Array.isArray(stockPayload.data)
      ) {
        throw new Error("Invalid stock notification response");
      }

      if (
        !assetsPayload ||
        typeof assetsPayload !== "object" ||
        !("data" in assetsPayload) ||
        !Array.isArray(assetsPayload.data)
      ) {
        throw new Error("Invalid asset notification response");
      }

      /* Same low-stock rule as `LowStockAlertBanner`, with tolerant numeric parsing for JSON payloads */
      const lowStockItems = extractLowStockRowsFromItemsList(stockPayload.data).slice(0, 12);

      const assignmentItems = assetsPayload.data
        .filter((item): item is AssetNotificationPayload => {
          if (!item || typeof item !== "object") return false;
          if (!("id" in item) || !("assetTag" in item) || !("assignments" in item)) {
            return false;
          }

          return (
            typeof item.id === "string" &&
            typeof item.assetTag === "string" &&
            Array.isArray(item.assignments)
          );
        })
        .flatMap((asset) =>
          asset.assignments
            .filter((assignment) => {
              if (!assignment || typeof assignment !== "object") return false;
              if (!("id" in assignment) || !("assignedAt" in assignment)) return false;
              return typeof assignment.id === "string" && typeof assignment.assignedAt === "string";
            })
            .map((assignment) => {
              const assigneeName = assignment.employee
                ? `${assignment.employee.firstName} ${assignment.employee.lastName}`
                : null;
              const roomLabel = assignment.room
                ? `${assignment.room.building.code} — ${assignment.room.name}`
                : null;

              return {
                id: assignment.id,
                assetId: asset.id,
                assetTag: asset.assetTag,
                assigneeName,
                roomLabel,
                assignedAt: assignment.assignedAt,
              } as AssetAssignmentNotification;
            })
        )
        .sort(
          (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
        )
        .slice(0, 6);

      setLowStockNotifications(lowStockItems);
      setAssignmentNotifications(assignmentItems);
    } catch (error) {
      setNotificationsError(
        error instanceof Error ? error.message : "Unable to load notifications",
      );
    } finally {
      if (!silent) {
        setIsNotificationsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchNotifications();
    });
  }, [fetchNotifications]);

  /* Persists read notification ids whenever they change */
  useEffect(() => {
    window.localStorage.setItem(
      NOTIFICATION_READ_STORAGE_KEY,
      JSON.stringify(readNotificationIds),
    );
  }, [NOTIFICATION_READ_STORAGE_KEY, readNotificationIds]);

  const lowStockNotificationEntries = lowStockNotifications.map((item) => ({
    ...item,
    notificationId: `low-stock:${item.id}:${item.quantity}:${item.minQuantity}`,
  }));

  const assignmentNotificationEntries = assignmentNotifications.map((item) => ({
    ...item,
    notificationId: `assignment:${item.id}`,
  }));

  const allNotificationIds = [
    ...lowStockNotificationEntries.map((item) => item.notificationId),
    ...assignmentNotificationEntries.map((item) => item.notificationId),
  ];

  const unreadCount = allNotificationIds.filter(
    (notificationId) => !readNotificationIds.includes(notificationId),
  ).length;

  /* Marks one or many notifications as read */
  const markNotificationsAsRead = (notificationIds: string[]) => {
    if (notificationIds.length === 0) return;
    setReadNotificationIds((current) => {
      const next = new Set(current);
      for (const id of notificationIds) next.add(id);
      return [...next];
    });
  };

  /* Marks every currently visible notification as read and clears the badge */
  const markAllNotificationsAsRead = () => {
    markNotificationsAsRead(allNotificationIds);
  };

  /* Close dropdowns when users click outside their containers */
  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }

      if (menuRef.current && !menuRef.current.contains(target)) {
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
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm sm:px-4 md:px-6">
      {/* Left side: Page Title */}
      <div className="flex items-center">
        {!isMobileSidebarOpen && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="mr-2 rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold tracking-tight text-gray-800 sm:text-xl">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((prev) => {
                const next = !prev;
                if (next) {
                  void fetchNotifications({ silent: true });
                }
                return next;
              });
            }}
            className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors focus-ring"
            aria-label="Open notifications"
            aria-haspopup="menu"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="w-5 h-5" />
            {/* Show unread count from low stock + assignment alerts */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-danger text-white border-2 border-white text-[10px] leading-none font-semibold flex items-center justify-center">
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              className="absolute right-0 z-30 mt-2 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
              role="menu"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Low stock alerts and recent asset assignments.
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {isNotificationsLoading && (
                  <p className="px-4 py-6 text-sm text-gray-500">Loading notifications...</p>
                )}

                {!isNotificationsLoading && notificationsError && (
                  <div className="px-4 py-4">
                    <p className="text-sm text-red-600">{notificationsError}</p>
                    <button
                      type="button"
                      onClick={() => void fetchNotifications()}
                      className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!isNotificationsLoading &&
                  !notificationsError &&
                  lowStockNotifications.length === 0 &&
                  assignmentNotifications.length === 0 && (
                    <p className="px-4 py-6 text-sm text-gray-500">No new notifications.</p>
                  )}

                {!isNotificationsLoading &&
                  !notificationsError &&
                  lowStockNotifications.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Low stock
                        </p>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        {lowStockNotificationEntries.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={`/stock/${item.id}`}
                              onClick={() => {
                                markNotificationsAsRead([item.notificationId]);
                                setIsNotificationsOpen(false);
                              }}
                              className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
                              role="menuitem"
                            >
                              <span className="mt-0.5 text-amber-500">
                                <AlertTriangle className="w-4 h-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-gray-800 truncate">
                                  {item.itemLabel}
                                </span>
                                <span className="block text-xs text-gray-500 mt-0.5">
                                  Quantity is {item.quantity} (minimum {item.minQuantity})
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {!isNotificationsLoading &&
                  !notificationsError &&
                  assignmentNotifications.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Asset assignments
                        </p>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        {assignmentNotificationEntries.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={`/assets/${item.assetId}`}
                              onClick={() => {
                                markNotificationsAsRead([item.notificationId]);
                                setIsNotificationsOpen(false);
                              }}
                              className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
                              role="menuitem"
                            >
                              <span className="mt-0.5 text-primary-500">
                                <PackagePlus className="w-4 h-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-gray-800 truncate">
                                  {item.assetTag} assigned
                                </span>
                                <span className="block text-xs text-gray-500 mt-0.5">
                                  {item.assigneeName ?? "No employee"}
                                  {item.roomLabel ? ` · ${item.roomLabel}` : ""}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <Link
                  href="/stock"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  View inventory
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-gray-200 sm:block"></div>

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

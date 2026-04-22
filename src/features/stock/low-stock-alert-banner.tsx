/**
 * @file low-stock-alert-banner.tsx
 * @description Sticky alert banner that appears at the top when any stock item is at or below its minQuantity.
 */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { isAtOrBelowMinimumStock } from "@/lib/stock/low-stock-from-api";

/* Minimal stock item shape needed by this banner */
interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
}

interface LowStockAlertBannerProps {
  items: LowStockItem[];
}

export const LowStockAlertBanner = ({ items }: LowStockAlertBannerProps) => {
  const lowStockItems = useMemo(() => {
    return items.filter((item) => isAtOrBelowMinimumStock(item.quantity, item.minQuantity));
  }, [items]);

  if (lowStockItems.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start sm:items-center justify-between shadow-sm mb-6 animate-in slide-in-from-top-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-amber-800 font-semibold text-sm">
            Low Stock Alert
          </h3>
          <p className="text-amber-700 text-sm mt-0.5">
            You have {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} at or below the minimum stock threshold.
          </p>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-0 flex flex-nowrap items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-md pb-1 hide-scrollbar">
        {lowStockItems.slice(0, 3).map(item => (
          <Link key={item.id} href={`/stock/${item.id}`}>
            <span className="text-xs bg-white text-amber-800 border border-amber-200 px-2 py-1 rounded-md whitespace-nowrap hover:bg-amber-100 flex items-center gap-1 transition-colors">
              {item.name} 
              <span className="font-bold text-amber-600">({item.quantity})</span>
            </span>
          </Link>
        ))}
        {lowStockItems.length > 3 && (
          <span className="text-xs text-amber-700 ml-1">+{lowStockItems.length - 3} more</span>
        )}
      </div>
    </div>
  );
};

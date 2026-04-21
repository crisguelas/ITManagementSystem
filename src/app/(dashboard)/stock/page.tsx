/**
 * @file page.tsx
 * @description Main Inventory page. Contains two tabs (Items and Categories).
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Tags } from "lucide-react";
import type { StockItem, StockCategory } from "@prisma/client";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-state";

import { StockItemsTab } from "@/features/stock/stock-items-tab";
import { StockCategoriesTab } from "@/features/stock/stock-categories-tab";
import { LowStockAlertBanner } from "@/features/stock/low-stock-alert-banner";

/* API-shaped types with relational data included */
interface StockItemWithRelations extends StockItem {
  category: StockCategory;
  _count: { transactions: number };
}

interface StockCategoryWithCount extends StockCategory {
  _count: { stockItems: number };
}

export default function StockRoomPage() {
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
  
  const [items, setItems] = useState<StockItemWithRelations[]>([]);
  const [categories, setCategories] = useState<StockCategoryWithCount[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        fetch("/api/stock-items"),
        fetch("/api/stock-categories"),
      ]);

      const itemsJson = await itemsRes.json();
      const categoriesJson = await categoriesRes.json();

      if (!itemsRes.ok) throw new Error(itemsJson.error || "Failed to load stock items");
      if (!categoriesRes.ok) throw new Error(categoriesJson.error || "Failed to load stock categories");

      setItems(itemsJson.data);
      setCategories(categoriesJson.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  if (loading && items.length === 0) return <LoadingSpinner message="Loading inventory data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h1>
        <p className="text-gray-500 mt-1">Manage consumable inventory, spare parts, and transaction logs.</p>
      </div>

      <LowStockAlertBanner items={items} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "items"
                ? "text-primary-700 bg-primary-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Package className="h-4 w-4" /> Inventory Items
            {activeTab === "items" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "categories"
                ? "text-primary-700 bg-primary-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Tags className="h-4 w-4" /> Categories
            {activeTab === "categories" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full" />
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === "items" ? (
            <StockItemsTab items={items} onRefresh={fetchData} />
          ) : (
            <StockCategoriesTab categories={categories} onRefresh={fetchData} />
          )}
        </div>
      </div>
    </div>
  );
}

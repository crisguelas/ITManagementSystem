/**
 * @file page.tsx
 * @description Main Inventory page. Contains two tabs (Items and Categories) with server-side pagination.
 */
"use client";

import { useEffect, useState } from "react";
import { Package, Tags } from "lucide-react";
import type { StockItem, StockCategory } from "@prisma/client";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-state";

import { StockItemsTab } from "@/features/stock/stock-items-tab";
import { StockCategoriesTab } from "@/features/stock/stock-categories-tab";
import { LowStockAlertBanner } from "@/features/stock/low-stock-alert-banner";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { LowStockNotificationRow } from "@/lib/stock/low-stock-from-api";
import type { PaginatedListPayload } from "@/types";

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
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [categories, setCategories] = useState<StockCategoryWithCount[]>([]);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [categoriesPageSize, setCategoriesPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [lowStockRows, setLowStockRows] = useState<LowStockNotificationRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /* Loads inventory tabs + low-stock banner whenever either tab changes pagination */
  useEffect(() => {
    const ac = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const itemsQs = new URLSearchParams({
          page: String(itemsPage),
          pageSize: String(itemsPageSize),
        });
        const catsQs = new URLSearchParams({
          page: String(categoriesPage),
          pageSize: String(categoriesPageSize),
        });

        const [itemsRes, catsRes, lowRes] = await Promise.all([
          fetch(`/api/stock-items?${itemsQs.toString()}`, { signal: ac.signal }),
          fetch(`/api/stock-categories?${catsQs.toString()}`, { signal: ac.signal }),
          fetch("/api/stock-items/low-stock?limit=50", { signal: ac.signal }),
        ]);

        const itemsJson: unknown = await itemsRes.json();
        const catsJson: unknown = await catsRes.json();
        const lowJson: unknown = await lowRes.json();

        if (!itemsRes.ok || typeof itemsJson !== "object" || itemsJson === null || !("success" in itemsJson)) {
          throw new Error("Failed to load stock items");
        }
        if (!catsRes.ok || typeof catsJson !== "object" || catsJson === null || !("success" in catsJson)) {
          throw new Error("Failed to load stock categories");
        }

        const itemsBody = itemsJson as {
          success: boolean;
          error?: string;
          data?: PaginatedListPayload<StockItemWithRelations>;
        };
        const catsBody = catsJson as {
          success: boolean;
          error?: string;
          data?: PaginatedListPayload<StockCategoryWithCount>;
        };

        if (!itemsBody.success || !itemsBody.data) {
          throw new Error(typeof itemsBody.error === "string" ? itemsBody.error : "Failed to load stock items");
        }
        if (!catsBody.success || !catsBody.data) {
          throw new Error(typeof catsBody.error === "string" ? catsBody.error : "Failed to load stock categories");
        }

        setItems(itemsBody.data.items);
        setItemsTotal(itemsBody.data.total);
        setItemsPage(itemsBody.data.page);
        setItemsPageSize(itemsBody.data.pageSize);

        setCategories(catsBody.data.items);
        setCategoriesTotal(catsBody.data.total);
        setCategoriesPage(catsBody.data.page);
        setCategoriesPageSize(catsBody.data.pageSize);

        if (
          lowRes.ok &&
          typeof lowJson === "object" &&
          lowJson !== null &&
          "success" in lowJson &&
          (lowJson as { success: boolean }).success &&
          "data" in lowJson &&
          Array.isArray((lowJson as { data: unknown }).data)
        ) {
          setLowStockRows((lowJson as { data: LowStockNotificationRow[] }).data);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => ac.abort();
  }, [itemsPage, itemsPageSize, categoriesPage, categoriesPageSize, reloadKey]);

  if (loading && items.length === 0 && categories.length === 0) {
    return <LoadingSpinner message="Loading inventory data..." />;
  }
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setReloadKey((k) => k + 1);
        }}
      />
    );
  }

  const reloadAfterMutation = () => {
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h1>
        <p className="text-gray-500 mt-1">Manage consumable inventory, spare parts, and transaction logs.</p>
      </div>

      <LowStockAlertBanner items={lowStockRows} />

      <div className="mb-6 flex w-full max-w-3xl gap-1 rounded-xl border border-gray-200/60 bg-gray-100/50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === "items"
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
          }`}
        >
          <Package className="h-4 w-4" />
          Inventory Items
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === "categories"
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
          }`}
        >
          <Tags className="h-4 w-4" />
          Categories
        </button>
      </div>

      <div>
        {activeTab === "items" ? (
          <StockItemsTab
            items={items}
            itemsTotal={itemsTotal}
            itemsPage={itemsPage}
            itemsPageSize={itemsPageSize}
            onItemsPageChange={(next) => setItemsPage(next)}
            onItemsPageSizeChange={(next) => {
              setItemsPageSize(next);
              setItemsPage(1);
            }}
            onRefresh={reloadAfterMutation}
          />
        ) : (
          <StockCategoriesTab
            categories={categories}
            categoriesTotal={categoriesTotal}
            categoriesPage={categoriesPage}
            categoriesPageSize={categoriesPageSize}
            onCategoriesPageChange={(next) => setCategoriesPage(next)}
            onCategoriesPageSizeChange={(next) => {
              setCategoriesPageSize(next);
              setCategoriesPage(1);
            }}
            onRefresh={reloadAfterMutation}
          />
        )}
      </div>
    </div>
  );
}

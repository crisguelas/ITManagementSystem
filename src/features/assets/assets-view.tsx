/**
 * @file assets-view.tsx
 * @description Tabbed Assets module view for All Assets and Categories.
 */
"use client";

import { useMemo, useState } from "react";
import { Monitor, Tags } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AssetTable } from "@/features/assets/asset-table";
import { CategoriesView } from "@/features/assets/categories-view";

type AssetsTab = "assets" | "categories";

/**
 * AssetsView — single module page with tabbed sections for inventory and categories.
 */
export const AssetsView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab: AssetsTab = useMemo(() => {
    return searchParams.get("tab") === "categories" ? "categories" : "assets";
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<AssetsTab>(initialTab);

  const setTab = (nextTab: AssetsTab) => {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "categories") {
      params.set("tab", "categories");
    } else {
      params.delete("tab");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">IT Assets Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage core equipment, registration records, and category prefixes in one module.
        </p>
      </div>

      <div className="mb-6 flex w-full max-w-sm space-x-1 rounded-xl border border-gray-200/60 bg-gray-100/50 p-1">
        <button
          type="button"
          onClick={() => setTab("assets")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === "assets"
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
          }`}
        >
          <Monitor className="h-4 w-4" />
          All Assets
        </button>
        <button
          type="button"
          onClick={() => setTab("categories")}
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

      {activeTab === "assets" && <AssetTable />}
      {activeTab === "categories" && <CategoriesView />}
    </div>
  );
};

/**
 * @file assets-view.tsx
 * @description Assets module view.
 */
"use client";

import { AssetTable } from "@/features/assets/asset-table";

/**
 * AssetsView — single module page for asset inventory.
 */
export const AssetsView = () => {
  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">IT Assets Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage core equipment and registration records in one module.
        </p>
      </div>

      <AssetTable />
    </div>
  );
};

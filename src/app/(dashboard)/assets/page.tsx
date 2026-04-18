/**
 * @file page.tsx
 * @description Main Assets page displaying the physical IT equipment inventory.
 */

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { AssetTable } from "@/features/assets/asset-table";

export const metadata = {
  title: "IT Assets | IT Management System",
};

export default function AssetsPage() {
  return (
    <div className="animate-fade-in">
      <Breadcrumb />
      
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">IT Assets Inventory</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage all core equipment (PCs, laptops, monitors) tracked by serial or MAC address.
          </p>
        </div>
      </div>

      {/* Main Feature Component */}
      <AssetTable />
    </div>
  );
}

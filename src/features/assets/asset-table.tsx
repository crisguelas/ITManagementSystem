/**
 * @file asset-table.tsx
 * @description Renders the data grid for Assets, including loading and error states.
 * Fits within the generic /features/assets/ structure.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Asset, StockCategory } from "@prisma/client";

/* Third-party imports */
import { Plus, Search } from "lucide-react";

/* Local imports */
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AssetForm } from "@/features/assets/asset-form";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Complex type including relations joined from the backend */
type AssetWithRelations = Asset & {
  stockCategory: StockCategory;
  assignments: unknown[];
};

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * AssetTable — Lists registered assets with local search and quick navigation actions.
 * Includes modal-based registration and table refresh after successful creation.
 */
export const AssetTable = () => {
  const [data, setData] = useState<AssetWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* Fetch assets from the standard API route */
  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed to fetch server route");
      
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "API returned an error");
      
      setData(json.data as AssetWithRelations[]);
    } catch (err: unknown) {
      console.error("[AssetTable] Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred fetching assets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Initial data load */
  useEffect(() => {
    queueMicrotask(() => {
      void fetchAssets();
    });
  }, [fetchAssets]);

  /* Local search filtering */
  const filteredData = data.filter((asset) => {
    const q = searchQuery.toLowerCase();
    return (
      asset.assetTag.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      (asset.pcNumber && asset.pcNumber.toLowerCase().includes(q)) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(q))
    );
  });

  /* ═══════════════════════════════════════════════════════════════ */
  /* STATE RENDERING (Loading / Error / Empty)                       */
  /* ═══════════════════════════════════════════════════════════════ */

  if (isLoading) return <SkeletonTable rows={8} />;
  
  if (error) {
    return <ErrorState message={error} onRetry={fetchAssets} />;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* MAIN RENDER                                                     */
  /* ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Table Toolbar Controls */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-md relative">
           {/* Custom search input */}
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="h-4 w-4 text-gray-400" />
           </div>
           <input
             type="text"
             placeholder="Search by tag, name, PC number, or S/N..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
           />
        </div>
        
        <div className="w-full sm:w-auto">
          {/* Action button opens the asset registration modal */}
          <Button 
            variant="primary" 
            className="w-full sm:w-auto"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Register Asset
          </Button>
        </div>
      </div>

      {/* Main Table Payload */}
      {filteredData.length === 0 ? (
         <EmptyState 
           title="No assets found" 
           message={searchQuery ? `No assets match your search: "${searchQuery}"` : "You haven't registered any IT assets yet."}
           actionLabel={!searchQuery ? "Register First Asset" : undefined}
           onAction={() => setIsModalOpen(true)}
         />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Asset Tag</th>
                  <th className="px-6 py-4">Name & Specs</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Identifiers</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/assets/${asset.id}`} className="text-primary-600 hover:text-primary-800 hover:underline">
                        {asset.assetTag}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{asset.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                        {asset.ram} {asset.ram && asset.storage && "•"} {asset.storage}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{asset.stockCategory.name}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-gray-600 gap-0.5">
                        {asset.pcNumber && <span className="flex gap-1"><b>PC:</b> {asset.pcNumber}</span>}
                        {asset.serialNumber && <span className="flex gap-1"><b>S/N:</b> {asset.serialNumber}</span>}
                        {asset.macAddress && <span className="flex gap-1"><b>MAC:</b> {asset.macAddress}</span>}
                        {asset.remoteAddress && <span className="flex gap-1"><b>Remote:</b> {asset.remoteAddress}</span>}
                        {asset.dataPort && <span className="flex gap-1"><b>Port:</b> {asset.dataPort}</span>}
                        {!asset.pcNumber && !asset.serialNumber && !asset.macAddress && !asset.remoteAddress && !asset.dataPort && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge 
                         variant={
                           asset.status === "AVAILABLE" ? "success" :
                           asset.status === "DEPLOYED" ? "info" :
                           asset.status === "MAINTENANCE" ? "warning" : "danger"
                         }
                       >
                         {asset.status.replace("_", " ")}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/assets/${asset.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filteredData.length} entries</span>
            {/* Pagination Controls will go here */}
          </div>
        </div>
      )}

      {/* Asset Registration Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Register New Asset"
        description="Fill out the details below to add a new IT asset to the inventory."
        size="lg"
      >
        <AssetForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAssets(); // Refresh table view automatically
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

    </div>
  );
};

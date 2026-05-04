/**
 * @file asset-table.tsx
 * @description Renders the data grid for Assets, including loading and error states.
 * Fits within the generic /features/assets/ structure.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Asset, StockCategory } from "@prisma/client";

import { Eye, Plus, Search } from "lucide-react";
import Link from "next/link";

import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { AssetForm } from "@/features/assets/asset-form";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { PaginatedListPayload } from "@/types";

/* Complex type including relations joined from the backend */
type AssetWithRelations = Asset & {
  stockCategory: StockCategory;
  assignments: unknown[];
};

/**
 * AssetTable — Lists registered assets with server-side search, pagination, and register modal.
 */
export const AssetTable = () => {
  const [data, setData] = useState<AssetWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* Debounce search input before hitting the API */
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQ((prev) => {
        const next = searchInput.trim();
        if (next !== prev) {
          queueMicrotask(() => setPage(1));
        }
        return next;
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedQ) qs.set("q", debouncedQ);

      const res = await fetch(`/api/assets?${qs.toString()}`);
      const json: unknown = await res.json();
      if (!res.ok || typeof json !== "object" || json === null || !("success" in json)) {
        throw new Error("Failed to fetch assets");
      }
      const body = json as { success: boolean; error?: string; data?: PaginatedListPayload<AssetWithRelations> };
      if (!body.success || !body.data) {
        throw new Error(typeof body.error === "string" ? body.error : "API returned an error");
      }
      setData(body.data.items);
      setTotal(body.data.total);
      setPage(body.data.page);
      setPageSize(body.data.pageSize);
    } catch (err: unknown) {
      console.error("[AssetTable] Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred fetching assets");
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [page, pageSize, debouncedQ]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAssets();
    });
  }, [fetchAssets]);

  if (!hasLoadedOnce && isLoading) {
    return <SkeletonTable rows={8} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchAssets} />;
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by tag, name, PC number, or S/N..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm transition-shadow placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="w-full sm:w-auto">
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

      {total === 0 ? (
        <EmptyState
          title="No assets found"
          message={
            debouncedQ
              ? `No assets match your search: "${debouncedQ}"`
              : "You haven't registered any IT assets yet."
          }
          actionLabel={!debouncedQ ? "Register First Asset" : undefined}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className={`overflow-x-auto ${isLoading ? "opacity-60" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/80 font-medium text-gray-600">
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
                {data.map((asset) => (
                  <tr key={asset.id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        {asset.assetTag}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{asset.name}</div>
                      <div className="mt-0.5 max-w-[200px] truncate text-xs text-gray-500">
                        {asset.ram} {asset.ram && asset.storage && "•"} {asset.storage}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{asset.stockCategory.name}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                        {asset.pcNumber && (
                          <span className="flex gap-1">
                            <b>PC:</b> {asset.pcNumber}
                          </span>
                        )}
                        {asset.serialNumber && (
                          <span className="flex gap-1">
                            <b>S/N:</b> {asset.serialNumber}
                          </span>
                        )}
                        {asset.macAddress && (
                          <span className="flex gap-1">
                            <b>MAC:</b> {asset.macAddress}
                          </span>
                        )}
                        {asset.remoteAddress && (
                          <span className="flex gap-1">
                            <b>Remote:</b> {asset.remoteAddress}
                          </span>
                        )}
                        {asset.dataPort && (
                          <span className="flex gap-1">
                            <b>Port:</b> {asset.dataPort}
                          </span>
                        )}
                        {!asset.pcNumber &&
                          !asset.serialNumber &&
                          !asset.macAddress &&
                          !asset.remoteAddress &&
                          !asset.dataPort && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          asset.status === "AVAILABLE"
                            ? "success"
                            : asset.status === "DEPLOYED"
                              ? "info"
                              : asset.status === "MAINTENANCE"
                                ? "warning"
                                : "danger"
                        }
                      >
                        {asset.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/assets/${asset.id}`} className="inline-flex">
                        <Button type="button" size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />}>
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            total={total}
            page={page}
            pageSize={pageSize}
            disabled={isLoading}
            onPageChange={(next) => setPage(next)}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
          />
        </div>
      )}

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
            void fetchAssets();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

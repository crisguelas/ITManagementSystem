/**
 * @file page.tsx
 * @description Detail page for a specific stock item. Shows info and transaction history.
 */
"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import type { StockCategory, StockItem, StockTransaction } from "@prisma/client";
import { ArrowLeft, Package, MapPin, AlertTriangle, Hash, Grid } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

import { StockTransactionTable } from "@/features/stock/stock-transaction-table";
import { StockTransactionForm } from "@/features/stock/stock-transaction-form";

type StockTransactionWithActors = StockTransaction & {
  performedBy: { id: string; name: string | null };
  approvedBy: { id: string; name: string | null } | null;
};

type StockItemDetailPayload = StockItem & {
  category: StockCategory;
  transactions: StockTransactionWithActors[];
};

export default function StockItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [item, setItem] = useState<StockItemDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txModalOpen, setTxModalOpen] = useState(false);

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stock-items/${id}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || "Failed to load item");
      setItem(json.data as StockItemDetailPayload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load item");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    /* Defer fetch so the effect body does not synchronously cascade setState (eslint react-hooks) */
    queueMicrotask(() => {
      void fetchItem();
    });
  }, [fetchItem]);

  if (loading) return <LoadingSpinner message="Loading item details..." />;
  if (error) return <ErrorState message={error} onRetry={fetchItem} />;
  if (!item) return <ErrorState message="Item not found" />;

  const isLowStock = item.quantity <= item.minQuantity;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
        <Link href="/stock" className="hover:text-primary-600 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Inventory
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {item.name}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Hash className="h-4 w-4" /> {item.sku || "No SKU"}</span>
            <span className="flex items-center gap-1"><Grid className="h-4 w-4" /> {item.category.name}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location}</span>
          </div>
        </div>

        <Button onClick={() => setTxModalOpen(true)} variant="primary" size="lg">
          Record Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className={`p-6 rounded-xl border ${isLowStock ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'} shadow-sm text-center`}>
            <div className="text-sm font-medium text-gray-500 mb-1">Current Quantity</div>
            <div className={`text-5xl font-bold ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
              {item.quantity}
            </div>
            <div className={`text-sm mt-1 ${isLowStock ? 'text-amber-700' : 'text-gray-500'}`}>
              {item.unit} in stock
            </div>
            
            {isLowStock && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/50 px-3 py-1.5 rounded-full border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5" /> 
                Below min threshold ({item.minQuantity})
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center gap-2">
               <Package className="h-5 w-5 text-gray-500" />
               <h3 className="font-semibold text-gray-900">Transaction History</h3>
            </div>
            <StockTransactionTable transactions={item.transactions} unit={item.unit} />
          </div>
        </div>
      </div>

      <Modal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} title="Record Transaction" size="md">
        <StockTransactionForm
          stockItemId={item.id}
          itemName={item.name}
          currentQuantity={item.quantity}
          unit={item.unit}
          onSuccess={() => { setTxModalOpen(false); fetchItem(); }}
          onCancel={() => setTxModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

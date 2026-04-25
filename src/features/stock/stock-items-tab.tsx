/**
 * @file stock-items-tab.tsx
 * @description Tab content for listing stock items.
 * Displays data table, handles delete layout, triggers forms.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit2, Trash2, Package, AlertTriangle } from "lucide-react";
import type { StockItem, StockCategory } from "@prisma/client";

import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { StockItemForm } from "./stock-item-form";
import { StockTransactionForm } from "./stock-transaction-form";

/* Represents a stock item as returned by the API with relational data */
interface StockItemWithRelations extends StockItem {
  category: StockCategory;
  _count: { transactions: number };
}

interface StockItemsTabProps {
  items: StockItemWithRelations[];
  onRefresh: () => void;
}

/**
 * StockItemsTab — Renders the inventory item data table with actions.
 * Supports Add, Edit, Transact, View detail, and Delete operations.
 */
export const StockItemsTab = ({ items, onRefresh }: StockItemsTabProps) => {
  const { addToast } = useToast();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItemWithRelations | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* Sends DELETE request for the selected stock item */
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/stock-items/${deleteId}`, { method: "DELETE" });
      const json = (await res.json()) as { success: boolean; error?: string };

      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to delete item");

      addToast({ title: "Item deleted", message: "Stock item removed.", variant: "success" });
      setDeleteId(null);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      addToast({ title: "Delete Failed", message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  /* Opens the create/edit form modal, pre-populating if editing an existing item */
  const handleOpenForm = (item?: StockItemWithRelations) => {
    setSelectedItem(item ?? null);
    setFormModalOpen(true);
  };

  /* Opens the transaction recording modal for a specified item */
  const handleOpenTx = (item: StockItemWithRelations) => {
    setSelectedItem(item);
    setTxModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
        <Button onClick={() => handleOpenForm()} variant="primary" className="flex items-center gap-2">
          <Package className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {!items.length ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium">No stock items found</h3>
          <p className="text-gray-500 text-sm mt-1">Get started by adding items to the inventory.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Brand / Model</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const isLow = item.quantity <= item.minQuantity;
                  const hasTransactionHistory = item._count.transactions > 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {item.brand} {item.model}
                          </span>
                          {isLow && (
                            <span title="Low Stock Warning">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                        {item.sku ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {item.category.name}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-semibold ${isLow ? "text-amber-600" : "text-gray-900"}`}>
                          {item.quantity}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs truncate max-w-[120px]" title={item.location}>
                        {item.location}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleOpenTx(item)} className="h-8 px-3 text-xs">
                            Transact
                          </Button>
                          <Link href={`/stock/${item.id}`} passHref>
                            <Button variant="outline" size="sm" className="h-8 px-3 text-xs text-primary-700">
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenForm(item)}
                            className="h-8 px-3 text-xs"
                            disabled={hasTransactionHistory}
                            title={
                              hasTransactionHistory
                                ? "Editing is disabled because this item already has transaction history."
                                : "Edit stock item"
                            }
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(item.id)}
                            className="h-8 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={hasTransactionHistory}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={selectedItem ? "Edit Stock Item" : "Add Stock Item"} size="lg">
        <StockItemForm
          item={selectedItem}
          onSuccess={() => { setFormModalOpen(false); onRefresh(); }}
          onCancel={() => setFormModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} title="Record Transaction" size="md">
        {selectedItem && (
          <StockTransactionForm
            stockItemId={selectedItem.id}
            itemName={`${selectedItem.brand} ${selectedItem.model}`}
            currentQuantity={selectedItem.quantity}
            unit={selectedItem.unit}
            onSuccess={() => { setTxModalOpen(false); onRefresh(); }}
            onCancel={() => setTxModalOpen(false)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Stock Item"
        message="Are you sure you want to remove this stock item? This action cannot be undone."
        confirmLabel="Delete Item"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

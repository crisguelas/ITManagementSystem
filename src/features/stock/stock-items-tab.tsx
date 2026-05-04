/**
 * @file stock-items-tab.tsx
 * @description Tab content for listing stock items.
 * Displays data table, handles delete layout, triggers forms.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Edit2, Eye, Package, Trash2 } from "lucide-react";
import type { StockItem, StockCategory } from "@prisma/client";

import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { TablePagination } from "@/components/ui/table-pagination";

import { StockItemForm } from "./stock-item-form";
import { StockTransactionForm } from "./stock-transaction-form";

/* Represents a stock item as returned by the API with relational data */
interface StockItemWithRelations extends StockItem {
  category: StockCategory;
  _count: { transactions: number };
}

interface StockItemsTabProps {
  items: StockItemWithRelations[];
  itemsTotal: number;
  itemsPage: number;
  itemsPageSize: number;
  onItemsPageChange: (page: number) => void;
  onItemsPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}

/**
 * StockItemsTab — Renders the inventory item data table with actions.
 * Supports Add, Edit, Transact, View detail, and Delete operations.
 */
export const StockItemsTab = ({
  items,
  itemsTotal,
  itemsPage,
  itemsPageSize,
  onItemsPageChange,
  onItemsPageSizeChange,
  onRefresh,
}: StockItemsTabProps) => {
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
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 border-b border-gray-100 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
          <div className="w-full sm:w-auto">
            <Button onClick={() => handleOpenForm()} variant="primary" className="w-full sm:w-auto">
            <Package className="h-4 w-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {itemsTotal === 0 ? (
            <div className="border border-dashed border-gray-300 p-12 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-gray-400" />
              <h3 className="font-medium text-gray-900">No stock items found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding items to the inventory.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-3">Brand / Model</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const isLow = item.quantity <= item.minQuantity;
                  const hasTransactionHistory = item._count.transactions > 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {item.sku ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {item.category.name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${isLow ? "text-amber-600" : "text-gray-900"}`}>
                          {item.quantity}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                      </td>
                      <td className="max-w-[120px] truncate px-6 py-4 text-xs text-gray-600" title={item.location}>
                        {item.location}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleOpenTx(item)} className="h-8 px-3 text-xs">
                            Transact
                          </Button>
                          <Link href={`/stock/${item.id}`} passHref>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              leftIcon={<Eye className="h-4 w-4" />}
                            >
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
          )}
          {itemsTotal > 0 ? (
            <TablePagination
              total={itemsTotal}
              page={itemsPage}
              pageSize={itemsPageSize}
              onPageChange={onItemsPageChange}
              onPageSizeChange={onItemsPageSizeChange}
            />
          ) : null}
        </CardBody>
      </Card>

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

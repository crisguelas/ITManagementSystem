/**
 * @file stock-categories-tab.tsx
 * @description Tab content for listing stock categories.
 */
"use client";

import { useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import type { StockCategory } from "@prisma/client";

import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";

import { StockCategoryForm } from "./stock-category-form";

/* Represents a stock category as returned by the API with an item count */
interface StockCategoryWithCount extends StockCategory {
  _count: { stockItems: number };
}

interface StockCategoriesTabProps {
  categories: StockCategoryWithCount[];
  onRefresh: () => void;
}

/**
 * StockCategoriesTab — Renders stock category management in a table layout.
 * Supports add, edit, and guarded delete actions for stock categories.
 */
export const StockCategoriesTab = ({ categories, onRefresh }: StockCategoriesTabProps) => {
  const { addToast } = useToast();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StockCategoryWithCount | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* Sends DELETE request for the selected stock category */
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/stock-categories/${deleteId}`, { method: "DELETE" });
      const json = (await res.json()) as { success: boolean; error?: string };

      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to delete category");

      addToast({ title: "Category deleted", message: "Stock category removed.", variant: "success" });
      setDeleteId(null);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      addToast({ title: "Delete Failed", message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  /* Opens the create/edit modal, pre-populating if editing an existing category */
  const handleOpenForm = (category?: StockCategoryWithCount) => {
    setSelectedCategory(category ?? null);
    setFormModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Stock Categories</h2>
        <Button onClick={() => handleOpenForm()} variant="primary" className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {!categories.length ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Tags className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium">No categories configured</h3>
          <p className="text-gray-500 text-sm mt-1">Add categories to organize your stock items.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Tag Prefix</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Items Tracked</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => {
                  const hasLinkedItems = cat._count.stockItems > 0;
                  return (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline">{cat.prefix}</Badge>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{cat.description || "—"}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        {cat._count.stockItems}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenForm(cat)}
                            className="h-8 px-3 text-xs"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(cat.id)}
                            className="h-8 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={hasLinkedItems}
                            title={
                              hasLinkedItems
                                ? "Cannot delete category with linked stock items."
                                : "Delete category"
                            }
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

      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={selectedCategory ? "Edit Category" : "Add Stock Category"}>
        <StockCategoryForm
          category={selectedCategory}
          onSuccess={() => { setFormModalOpen(false); onRefresh(); }}
          onCancel={() => setFormModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Stock Category"
        message="Are you sure you want to remove this stock category? Only categories without active items can be deleted."
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

/**
 * @file stock-categories-tab.tsx
 * @description Tab content for listing stock categories.
 */
"use client";

import { useState } from "react";
import { Edit2, Trash2, Tags } from "lucide-react";
import type { StockCategory } from "@prisma/client";

import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
 * StockCategoriesTab — Renders the category management cards with Add/Edit/Delete actions.
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
          <Tags className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {!categories.length ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Tags className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium">No categories configured</h3>
          <p className="text-gray-500 text-sm mt-1">Add categories to organize your stock items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenForm(cat)} className="h-7 w-7 p-0 text-gray-500">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(cat.id)}
                    className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                    disabled={cat._count.stockItems > 0}
                    title={cat._count.stockItems > 0 ? "Cannot delete category with items" : "Delete category"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500 min-h-[40px] line-clamp-2">
                {cat.description ?? "No description provided."}
              </p>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400">Items tracked:</span>
                <span className="text-sm font-medium bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                  {cat._count.stockItems}
                </span>
              </div>
            </div>
          ))}
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

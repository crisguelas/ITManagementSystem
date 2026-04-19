/**
 * @file categories-view.tsx
 * @description Lists asset categories and opens a modal to add new ones.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import type { AssetCategory } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryForm } from "@/features/assets/category-form";

export const CategoriesView = () => {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assets/categories");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load categories");
      }
      setCategories(json.data as AssetCategory[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchCategories();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchCategories]);

  const handleEditOpen = (category: AssetCategory) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
  };

  const handleDelete = async (category: AssetCategory) => {
    const confirmed = window.confirm(
      `Delete category ${category.name} (${category.prefix})? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleteLoadingId(category.id);
    try {
      const res = await fetch(`/api/assets/categories/${category.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          typeof json.error === "string" ? json.error : "Failed to delete category"
        );
      }
      await fetchCategories();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  if (isLoading) {
    return <SkeletonTable rows={4} />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={fetchCategories} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tags className="w-5 h-5 text-gray-400" />
            Asset categories
          </h2>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Add category
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {categories.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No categories yet"
                message="Create categories (e.g. PC, Laptop) to classify assets and generate tag prefixes."
                actionLabel="Add category"
                onAction={() => setCreateModalOpen(true)}
              />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Tag prefix</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono">
                        {c.prefix}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.description || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          leftIcon={<Pencil className="w-4 h-4" />}
                          onClick={() => handleEditOpen(c)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          isLoading={deleteLoadingId === c.id}
                          onClick={() => void handleDelete(c)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add asset category"
        description="Used for asset tags: {GLOBAL_PREFIX}-{CATEGORY_PREFIX}-{NUMBER}. Prefix must be unique."
        size="md"
      >
        <CategoryForm
          onSuccess={() => {
            setCreateModalOpen(false);
            void fetchCategories();
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit asset category"
        description="Update category information used for asset classification and tag prefixes."
        size="md"
      >
        <CategoryForm
          key={selectedCategory?.id ?? "edit-category"}
          categoryId={selectedCategory?.id}
          initialData={
            selectedCategory
              ? {
                  name: selectedCategory.name,
                  prefix: selectedCategory.prefix,
                  description: selectedCategory.description ?? "",
                }
              : undefined
          }
          onSuccess={() => {
            setEditModalOpen(false);
            void fetchCategories();
          }}
          onCancel={() => setEditModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

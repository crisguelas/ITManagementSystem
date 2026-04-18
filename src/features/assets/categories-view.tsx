/**
 * @file categories-view.tsx
 * @description Lists asset categories and opens a modal to add new ones.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Tags } from "lucide-react";
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
  const [modalOpen, setModalOpen] = useState(false);

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
    void fetchCategories();
  }, [fetchCategories]);

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
            onClick={() => setModalOpen(true)}
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
                onAction={() => setModalOpen(true)}
              />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Tag prefix</th>
                  <th className="px-6 py-3">Description</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add asset category"
        description="Used for asset tags: {GLOBAL_PREFIX}-{CATEGORY_PREFIX}-{NUMBER}. Prefix must be unique."
        size="md"
      >
        <CategoryForm
          onSuccess={() => {
            setModalOpen(false);
            void fetchCategories();
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

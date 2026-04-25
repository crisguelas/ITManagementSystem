/**
 * @file stock-category-form.tsx
 * @description Form component for creating and editing stock categories.
 * Uses React Hook Form with Zod validation.
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { StockCategory } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  stockCategorySchema,
  type StockCategoryFormValues,
} from "@/lib/validations/stock.schema";

interface StockCategoryFormProps {
  category?: StockCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StockCategoryForm = ({
  category,
  onSuccess,
  onCancel,
}: StockCategoryFormProps) => {
  const { addToast } = useToast();
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StockCategoryFormValues>({
    resolver: zodResolver(stockCategorySchema),
    defaultValues: {
      name: category?.name || "",
      prefix: category?.prefix || "",
      description: category?.description || "",
    },
  });

  const onSubmit = async (data: StockCategoryFormValues) => {
    try {
      const url = isEditing
        ? `/api/stock-categories/${category.id}`
        : "/api/stock-categories";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${isEditing ? "update" : "create"} stock category`);
      }

      addToast({
        title: `Category ${isEditing ? "Updated" : "Created"}`,
        message: `${json.data.name} has been ${isEditing ? "updated" : "created"} successfully.`,
        variant: "success",
      });

      reset();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      addToast({
        title: "Action Failed",
        message,
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Input
          label="Category Name"
          placeholder="e.g. Cables, Consumables"
          {...register("name")}
          error={errors.name?.message}
          required
        />
        <Input
          label="Tag Prefix"
          placeholder="e.g. CBL"
          {...register("prefix")}
          error={errors.prefix?.message}
          required
        />
        <Textarea
          label="Description (Optional)"
          placeholder="Detailed description of this category"
          {...register("description")}
          error={errors.description?.message}
          rows={3}
        />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditing ? "Save Changes" : "Create Category"}
        </Button>
      </div>
    </form>
  );
};

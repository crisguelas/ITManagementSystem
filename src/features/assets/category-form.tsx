/**
 * @file category-form.tsx
 * @description Creates an asset category (name, tag prefix) via React Hook Form + Zod.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { categorySchema, type CategoryFormValues } from "@/lib/validations/asset.schema";

interface CategoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  categoryId?: string;
  initialData?: CategoryFormValues;
}

export const CategoryForm = ({ onSuccess, onCancel, categoryId, initialData }: CategoryFormProps) => {
  const { addToast } = useToast();
  const isEditMode = Boolean(categoryId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      prefix: initialData?.prefix ?? "",
      description: initialData?.description ?? "",
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      const endpoint = isEditMode
        ? `/api/assets/categories/${categoryId}`
        : "/api/assets/categories";
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          prefix: data.prefix.trim().toUpperCase(),
          description: data.description?.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (isEditMode ? "Failed to update category" : "Failed to create category"));
      }

      addToast({
        title: isEditMode ? "Category updated" : "Category created",
        message: isEditMode
          ? `${json.data.name} (${json.data.prefix}) updated successfully.`
          : `${json.data.name} (${json.data.prefix}) is ready for new assets.`,
        variant: "success",
      });
      reset();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      addToast({
        title: isEditMode ? "Could not update category" : "Could not create category",
        message,
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Input
          label="Category name"
          placeholder="e.g. Laptop"
          {...register("name")}
          error={errors.name?.message}
          required
        />
        <Input
          label="Tag prefix"
          placeholder="e.g. LAP (uppercase letters/numbers, 2–5 chars)"
          {...register("prefix")}
          error={errors.prefix?.message}
          required
        />
        <Input
          label="Description (optional)"
          {...register("description")}
          error={errors.description?.message}
        />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? "Save changes" : "Add category"}
        </Button>
      </div>
    </form>
  );
};

/**
 * @file stock-item-form.tsx
 * @description Form component for creating and editing stock items.
 * Uses React Hook Form with Zod validation.
 */
"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { StockItem, StockCategory } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { stockItemSchema } from "@/lib/validations/stock.schema";

interface StockItemFormProps {
  item?: StockItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * StockItemForm — Handles creation and editing of stock inventory items.
 * Fetches categories from the API for the dropdown. Uses React Hook Form + Zod.
 */
export const StockItemForm = ({
  item,
  onSuccess,
  onCancel,
}: StockItemFormProps) => {
  const { addToast } = useToast();
  const isEditing = !!item;

  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.input<typeof stockItemSchema>>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      brand: item?.brand ?? "",
      model: item?.model ?? "",
      categoryId: item?.categoryId ?? "",
      quantity: item?.quantity ?? 0,
      minQuantity: item?.minQuantity ?? 5,
      location: item?.location ?? "Main Stock Room",
      unit: item?.unit ?? "pcs",
    },
  });

  /* Track categoryId so the Select reflects the latest controlled value */
  const categoryId = useWatch({ control, name: "categoryId" });

  /* Fetch available stock categories for the dropdown on mount */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/stock-categories");
        const json = (await res.json()) as { success: boolean; data: StockCategory[] };
        if (json.success) {
          setCategories(json.data);
        }
      } catch (err: unknown) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  /* Submits create or update request depending on edit mode */
  const onSubmit = async (data: z.input<typeof stockItemSchema>) => {
    try {
      const url = isEditing
        ? `/api/stock-items/${item.id}`
        : "/api/stock-items";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { brand: string; model: string };
        error?: string;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `Failed to ${isEditing ? "update" : "create"} stock item`);
      }

      addToast({
        title: `Item ${isEditing ? "Updated" : "Created"}`,
        message: `${json.data?.brand ?? ""} ${json.data?.model ?? ""} has been ${isEditing ? "updated" : "created"} successfully.`,
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

  /* Map categories to label/value pairs for the Select component */
  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  /* Suppress unused state warning: loadingCategories used to disable select */
  const isSelectDisabled = loadingCategories;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Brand"
          placeholder="e.g. Dell, HP, Ugreen"
          {...register("brand")}
          error={errors.brand?.message}
          required
        />

        <Input
          label="Model"
          placeholder="e.g. Latitude 5530, Cat6 Cable 1m"
          {...register("model")}
          error={errors.model?.message}
          required
        />

        <Select
          label="Category"
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => setValue("categoryId", e.target.value, { shouldValidate: true })}
          error={errors.categoryId?.message}
          required
          disabled={isSelectDisabled}
        />

        <div className="md:col-span-2 rounded-lg border border-primary-100 bg-primary-50/40 px-3 py-2 text-xs text-primary-700">
          SKU is generated automatically after saving to keep stock item codes consistent.
        </div>

        <Input
          label="Unit"
          placeholder="e.g. pcs, meters, boxes (no numbers)"
          {...register("unit")}
          error={errors.unit?.message}
          required
        />

        <Input
          type="number"
          label={isEditing ? "Quantity" : "Initial Quantity"}
          {...register("quantity")}
          error={errors.quantity?.message}
          required
        />

        <Input
          type="number"
          label="Low Stock Alert Threshold"
          {...register("minQuantity")}
          error={errors.minQuantity?.message}
          required
        />

        <div className="md:col-span-2">
          <Input
            label="Location"
            placeholder="e.g. Shelf A2, Server Room Cabinet"
            {...register("location")}
            error={errors.location?.message}
            required
          />
        </div>
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
          {isEditing ? "Save Changes" : "Create Stock Item"}
        </Button>
      </div>
    </form>
  );
};

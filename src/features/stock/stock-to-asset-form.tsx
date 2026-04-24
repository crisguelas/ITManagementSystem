/**
 * @file stock-to-asset-form.tsx
 * @description Form for converting a stock item unit into a tracked asset instance.
 */

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AssetCategory } from "@prisma/client";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

import { stockToAssetSchema } from "@/lib/validations/stock-to-asset.schema";

interface StockToAssetFormProps {
  stockItemId: string;
  stockItemName: string;
  onSuccess: (assetId: string) => void;
  onCancel: () => void;
}

/**
 * StockToAssetForm — Converts one unit of stock to a tracked asset.
 * Pulls asset categories, validates via Zod, and calls the conversion API.
 */
export const StockToAssetForm = ({
  stockItemId,
  stockItemName,
  onSuccess,
  onCancel,
}: StockToAssetFormProps) => {
  const { addToast } = useToast();

  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof stockToAssetSchema>>({
    resolver: zodResolver(stockToAssetSchema),
    defaultValues: {
      stockItemId,
      categoryId: "",
      brand: "",
      model: "",
      status: "AVAILABLE",
      pcNumber: "",
      serialNumber: "",
      macAddress: "",
      osInstalled: "",
      ram: "",
      storage: "",
      notes: `Converted from stock item: ${stockItemName}`,
    },
  });

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    setCategoryError(null);
    try {
      const res = await fetch("/api/assets/categories");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load categories");
      setCategories(json.data as AssetCategory[]);
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchCategories();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const onSubmit = async (data: z.input<typeof stockToAssetSchema>) => {
    try {
      const res = await fetch(`/api/stock-items/${stockItemId}/convert-to-asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create asset from inventory");
      }

      addToast({
        title: "Asset Created",
        message: `${json.data.assetTag} created and inventory decremented by 1.`,
        variant: "success",
      });

      onSuccess(json.data.id as string);
    } catch (err: unknown) {
      addToast({
        title: "Conversion Failed",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "error",
      });
    }
  };

  if (isLoadingCategories) return <LoadingSpinner message="Loading categories..." />;
  if (categoryError) return <ErrorState message={categoryError} onRetry={fetchCategories} />;

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const statusOptions = [
    { label: "Available", value: "AVAILABLE" },
    { label: "Deployed", value: "DEPLOYED" },
    { label: "Maintenance", value: "MAINTENANCE" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="rounded-lg border border-primary-100 bg-primary-50/40 px-3 py-2 text-xs text-primary-700">
        This will create a new Asset and record an OUT transaction to decrement inventory by 1.
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">
          Classification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Asset Category"
            options={categoryOptions}
            {...register("categoryId")}
            error={errors.categoryId?.message}
            required
          />
          <Select
            label="Status"
            options={statusOptions}
            {...register("status")}
            error={errors.status?.message}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">
          Hardware
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Brand"
            placeholder="e.g. Dell, HP, Apple"
            {...register("brand")}
            error={errors.brand?.message}
            required
          />
          <Input
            label="Model"
            placeholder="e.g. Latitude 5530"
            {...register("model")}
            error={errors.model?.message}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">
          Identifiers (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="PC Number"
            placeholder="e.g. C000001"
            {...register("pcNumber")}
            error={errors.pcNumber?.message}
          />
          <Input
            label="Serial Number"
            placeholder="S/N"
            {...register("serialNumber")}
            error={errors.serialNumber?.message}
          />
          <Input
            label="MAC Address"
            placeholder="00:1B:44:11:3A:B7"
            {...register("macAddress")}
            error={errors.macAddress?.message}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">
          System Specs (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Operating System"
            placeholder="e.g. Windows 11 Pro"
            {...register("osInstalled")}
            error={errors.osInstalled?.message}
          />
          <Input label="RAM" placeholder="e.g. 16GB DDR4" {...register("ram")} error={errors.ram?.message} />
          <Input
            label="Storage"
            placeholder="e.g. 512GB NVMe"
            {...register("storage")}
            error={errors.storage?.message}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">
          Notes (Optional)
        </h3>
        <Input
          label="Notes"
          placeholder="Optional conversion note"
          {...register("notes")}
          error={errors.notes?.message}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Create Asset (Decrement Stock)
        </Button>
      </div>
    </form>
  );
};


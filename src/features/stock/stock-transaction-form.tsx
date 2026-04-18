/**
 * @file stock-transaction-form.tsx
 * @description Form component for recording stock transactions (IN, OUT, RETURN, ADJUSTMENT).
 * Updates stock quantities atomically and leaves an audit trail.
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { TransactionType } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  stockTransactionSchema,
  type StockTransactionFormValues,
} from "@/lib/validations/stock.schema";

interface StockTransactionFormProps {
  stockItemId: string;
  itemName: string;
  currentQuantity: number;
  unit: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * StockTransactionForm — Records IN, OUT, RETURN, or ADJUSTMENT transactions.
 * Shows recipient fields conditionally for OUT transactions.
 */
export const StockTransactionForm = ({
  stockItemId,
  itemName,
  currentQuantity,
  unit,
  onSuccess,
  onCancel,
}: StockTransactionFormProps) => {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.input<typeof stockTransactionSchema>>({
    resolver: zodResolver(stockTransactionSchema),
    defaultValues: {
      stockItemId,
      type: TransactionType.OUT,
      quantity: 1,
      recipientName: "",
      recipientDepartment: "",
      notes: "",
    },
  });

  /* Watch the transaction type to conditionally render recipient fields */
  const txType = watch("type");
  const isOut = txType === TransactionType.OUT;
  const isAdjustment = txType === TransactionType.ADJUSTMENT;

  const transactionOptions = [
    { label: "Dispatch (OUT)", value: TransactionType.OUT },
    { label: "Restock (IN)", value: TransactionType.IN },
    { label: "Return (RETURN)", value: TransactionType.RETURN },
    { label: "Manual Adjustment", value: TransactionType.ADJUSTMENT },
  ];

  /* Submits the transaction to the API and triggers quantity update atomically */
  const onSubmit = async (data: z.input<typeof stockTransactionSchema>) => {
    try {
      const res = await fetch("/api/stock-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to record transaction");
      }

      addToast({
        title: "Transaction Recorded",
        message: `Successfully processed ${data.quantity} ${unit} for ${itemName}.`,
        variant: "success",
      });

      reset();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      addToast({
        title: "Transaction Failed",
        message,
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="bg-primary-50 p-4 rounded-lg flex justify-between items-center border border-primary-100">
        <div>
          <p className="text-sm text-primary-700 font-medium">{itemName}</p>
          <p className="text-xs text-primary-600 mt-1">Current Stock: {currentQuantity} {unit}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Transaction Type"
          options={transactionOptions}
          value={txType}
          onChange={(e) => setValue("type", e.target.value as TransactionType, { shouldValidate: true })}
          error={errors.type?.message}
          required
        />

        <Input
          type="number"
          label={isAdjustment ? "New Absolute Quantity" : "Quantity"}
          {...register("quantity")}
          error={errors.quantity?.message}
          required
        />

        {isOut && (
          <>
            <Input
              label="Recipient Name"
              placeholder="e.g. Dr. John Doe"
              {...register("recipientName")}
              error={errors.recipientName?.message}
              required
            />
            <Input
              label="Recipient Department"
              placeholder="e.g. IT Department"
              {...register("recipientDepartment")}
              error={errors.recipientDepartment?.message}
              required
            />
          </>
        )}

        <div className="md:col-span-2">
          <Textarea
            label="Notes (Optional)"
            placeholder="Reason for transaction, PO number, etc."
            {...register("notes")}
            error={errors.notes?.message}
            rows={2}
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
          Record Transaction
        </Button>
      </div>
    </form>
  );
};

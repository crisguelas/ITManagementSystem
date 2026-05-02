/**
 * @file stock-transaction-form.tsx
 * @description Form component for recording stock transactions (IN, OUT, RETURN, ADJUSTMENT).
 * Updates stock quantities atomically and leaves an audit trail.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { TransactionType } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { stockTransactionSchema } from "@/lib/validations/stock.schema";

interface StockTransactionFormProps {
  stockItemId: string;
  itemName: string;
  currentQuantity: number;
  unit: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface EmployeeRecipientOption {
  id: string;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  department: {
    name: string;
  };
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
  const [employees, setEmployees] = useState<EmployeeRecipientOption[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [selectedRecipientEmployeeId, setSelectedRecipientEmployeeId] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    control,
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

  /* Track the selected transaction type for conditional form fields */
  const txType = useWatch({ control, name: "type" });
  const isOut = txType === TransactionType.OUT;
  const isAdjustment = txType === TransactionType.ADJUSTMENT;
  const selectedRecipientEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedRecipientEmployeeId) ?? null,
    [employees, selectedRecipientEmployeeId]
  );
  const recipientDepartmentName = selectedRecipientEmployee?.department.name ?? "";

  /* Loads active registered employees for OUT transaction recipient selection */
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsEmployeesLoading(true);
      setEmployeesError(null);
      try {
        const response = await fetch("/api/employees");
        const json = (await response.json()) as {
          success: boolean;
          data?: EmployeeRecipientOption[];
          error?: string;
        };
        if (!response.ok || !json.success || !Array.isArray(json.data)) {
          throw new Error(json.error ?? "Failed to load registered employees");
        }
        setEmployees(json.data);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to load registered employees";
        setEmployeesError(message);
      } finally {
        setIsEmployeesLoading(false);
      }
    };

    void fetchEmployees();
  }, []);

  const transactionOptions = [
    { label: "Dispatch (OUT)", value: TransactionType.OUT },
    { label: "Restock (IN)", value: TransactionType.IN },
    { label: "Return (RETURN)", value: TransactionType.RETURN },
    { label: "Manual Adjustment", value: TransactionType.ADJUSTMENT },
  ];

  /* Submits the transaction to the API and triggers quantity update atomically */
  const onSubmit = async (data: z.input<typeof stockTransactionSchema>) => {
    if (isOut) {
      if (!selectedRecipientEmployee) {
        addToast({
          title: "Recipient required",
          message: "Please select a registered employee as the recipient.",
          variant: "error",
        });
        return;
      }
      if (!recipientDepartmentName) {
        addToast({
          title: "Recipient department missing",
          message: "The selected employee does not have a department.",
          variant: "error",
        });
        return;
      }
    }

    try {
      const payload: z.input<typeof stockTransactionSchema> = {
        ...data,
        recipientName: isOut
          ? `${selectedRecipientEmployee?.firstName ?? ""} ${selectedRecipientEmployee?.lastName ?? ""}`.trim()
          : data.recipientName,
        recipientDepartment: isOut ? recipientDepartmentName : data.recipientDepartment,
      };

      const res = await fetch("/api/stock-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to record transaction");
      }

      addToast({
        title: "Transaction Recorded",
        message: `Successfully processed ${payload.quantity} ${unit} for ${itemName}.`,
        variant: "success",
      });

      reset();
      setSelectedRecipientEmployeeId("");
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
            <Select
              label="Recipient Name"
              value={selectedRecipientEmployeeId}
              onChange={(event) => setSelectedRecipientEmployeeId(event.target.value)}
              options={employees.map((employee) => {
                const fullName = `${employee.firstName} ${employee.lastName}`.trim();
                const employeeIdLabel = employee.employeeId ? ` (${employee.employeeId})` : "";
                return {
                  label: `${fullName}${employeeIdLabel} - ${employee.department.name}`,
                  value: employee.id,
                };
              })}
              placeholder={
                isEmployeesLoading ? "Loading registered employees..." : "Select a registered employee"
              }
              error={errors.recipientName?.message}
              disabled={isEmployeesLoading || employees.length === 0}
              required
            />
            <Input
              label="Recipient Department"
              value={recipientDepartmentName}
              placeholder="Auto-filled from selected employee"
              readOnly
              error={errors.recipientDepartment?.message ?? employeesError ?? undefined}
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
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isOut && (isEmployeesLoading || employees.length === 0 || !selectedRecipientEmployeeId)}
        >
          Record Transaction
        </Button>
      </div>
    </form>
  );
};

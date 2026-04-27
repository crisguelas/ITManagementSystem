/**
 * @file stock-transaction-table.tsx
 * @description Standardized data table for viewing stock transaction history.
 */
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { TransactionType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

interface Transaction {
  id: string;
  type: TransactionType;
  quantity: number;
  recipientName: string | null;
  recipientDepartment: string | null;
  performedBy: { name: string | null };
  createdAt: string | Date;
  notes: string | null;
}

interface StockTransactionTableProps {
  transactions: Transaction[];
  unit: string;
}

/**
 * StockTransactionTable — Presents stock transaction rows with type/status formatting.
 * Keeps quantity signs and recipient context readable for stock audits.
 */
export const StockTransactionTable = ({
  transactions,
  unit,
}: StockTransactionTableProps) => {
  const tableData = useMemo(() => transactions, [transactions]);

  return (
    <Card>
      <CardHeader className="py-4">
        <h3 className="text-base font-semibold text-gray-900">Transaction History</h3>
      </CardHeader>
      <CardBody className="p-0">
        {!tableData.length ? (
          <div className="border border-dashed border-gray-200 p-8 text-center text-gray-500">
            No transaction history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3">Recipient</th>
                  <th className="px-6 py-3">Performed By</th>
                  <th className="w-1/4 px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tableData.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                      {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {tx.type === TransactionType.IN && (
                        <Badge variant="success">Restock (IN)</Badge>
                      )}
                      {tx.type === TransactionType.OUT && (
                        <Badge variant="warning">Dispatch (OUT)</Badge>
                      )}
                      {tx.type === TransactionType.RETURN && (
                        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                          Return
                        </Badge>
                      )}
                      {tx.type === TransactionType.ADJUSTMENT && (
                        <Badge variant="secondary">Adjustment</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium">
                      {tx.type === TransactionType.IN && <span className="text-green-600">+{tx.quantity}</span>}
                      {tx.type === TransactionType.RETURN && <span className="text-blue-600">+{tx.quantity}</span>}
                      {tx.type === TransactionType.OUT && <span className="text-amber-600">-{tx.quantity}</span>}
                      {tx.type === TransactionType.ADJUSTMENT && <span className="text-gray-600">{tx.quantity} (Set)</span>}
                      <span className="ml-1 text-xs text-gray-400">{unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.recipientName ? (
                        <div>
                          <span className="font-medium text-gray-900">{tx.recipientName}</span>
                          <span className="block text-xs text-gray-500">{tx.recipientDepartment}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                      {tx.performedBy.name ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-gray-600" title={tx.notes || ""}>
                      {tx.notes || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

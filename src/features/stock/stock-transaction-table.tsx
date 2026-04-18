/**
 * @file stock-transaction-table.tsx
 * @description Standardized data table for viewing stock transaction history.
 */
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { TransactionType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  type: TransactionType;
  quantity: number;
  recipientName: string | null;
  recipientDepartment: string | null;
  performedBy: { name: string };
  createdAt: string | Date;
  notes: string | null;
}

interface StockTransactionTableProps {
  transactions: Transaction[];
  unit: string;
}

export const StockTransactionTable = ({
  transactions,
  unit,
}: StockTransactionTableProps) => {
  const tableData = useMemo(() => transactions, [transactions]);

  if (!tableData.length) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        No transaction history found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3 text-right">Quantity</th>
            <th className="px-4 py-3">Recipient</th>
            <th className="px-4 py-3">Performed By</th>
            <th className="px-4 py-3 w-1/4">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tableData.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
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
              <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                {tx.type === TransactionType.IN && <span className="text-green-600">+{tx.quantity}</span>}
                {tx.type === TransactionType.RETURN && <span className="text-blue-600">+{tx.quantity}</span>}
                {tx.type === TransactionType.OUT && <span className="text-amber-600">-{tx.quantity}</span>}
                {tx.type === TransactionType.ADJUSTMENT && <span className="text-gray-600">{tx.quantity} (Set)</span>}
                <span className="text-gray-400 text-xs ml-1">{unit}</span>
              </td>
              <td className="px-4 py-3">
                {tx.recipientName ? (
                  <div>
                    <span className="font-medium text-gray-900">{tx.recipientName}</span>
                    <span className="text-xs text-gray-500 block">{tx.recipientDepartment}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                {tx.performedBy.name}
              </td>
              <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]" title={tx.notes || ""}>
                {tx.notes || <span className="text-gray-400">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

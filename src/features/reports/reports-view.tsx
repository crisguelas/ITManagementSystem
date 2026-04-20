/**
 * @file reports-view.tsx
 * @description Client UI for report exports (Excel and PDF) using server-loaded datasets.
 */

"use client";

import { useMemo } from "react";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { ReportsData } from "@/lib/services/report.service";

interface ReportsViewProps {
  data: ReportsData;
}

/**
 * ReportsView — shows summary metrics and export actions for Phase 8 reporting.
 */
export function ReportsView({ data }: ReportsViewProps) {
  const generatedAt = useMemo(() => new Date().toLocaleString(), []);

  /* Converts ISO timestamps into readable local date-time strings for files */
  const formatDateTime = (value: string) => new Date(value).toLocaleString();

  /* Exports current asset rows to an Excel workbook */
  const exportAssetsToExcel = () => {
    const rows = data.assets.map((asset) => ({
      "Asset Tag": asset.assetTag,
      Name: asset.name,
      Category: asset.category,
      Status: asset.status,
      Condition: asset.condition,
      "Serial Number": asset.serialNumber,
      "PC Number": asset.pcNumber,
      "Assigned To": asset.assignedTo,
      Location: asset.location,
      "Created At": formatDateTime(asset.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
    XLSX.writeFile(workbook, `assets-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* Exports stock transaction history to an Excel workbook */
  const exportStockTransactionsToExcel = () => {
    const rows = data.stockTransactions.map((transaction) => ({
      Item: transaction.itemName,
      Category: transaction.category,
      Type: transaction.type,
      Quantity: transaction.quantity,
      Recipient: transaction.recipientName,
      Department: transaction.recipientDepartment,
      "Performed By": transaction.performedBy,
      "Created At": formatDateTime(transaction.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Transactions");
    XLSX.writeFile(workbook, `stock-transactions-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* Exports a PDF summary plus compact data tables for quick sharing/printing */
  const exportSummaryToPdf = () => {
    const document = new jsPDF({ orientation: "landscape" });

    document.setFontSize(16);
    document.text("ITMS Reporting Summary", 14, 14);
    document.setFontSize(10);
    document.text(`Generated at: ${generatedAt}`, 14, 20);

    autoTable(document, {
      startY: 26,
      head: [["Metric", "Value"]],
      body: [
        ["Total assets", String(data.summary.totalAssets)],
        ["Deployed assets", String(data.summary.deployedAssets)],
        ["Available assets", String(data.summary.availableAssets)],
        ["Low-stock items", String(data.summary.lowStockItems)],
        ["Stock transactions", String(data.summary.totalStockTransactions)],
      ],
      theme: "grid",
      headStyles: { fillColor: [2, 132, 199] },
    });

    autoTable(document, {
      startY: (document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
        ? (document as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
        : 70,
      head: [["Asset Tag", "Name", "Category", "Status", "Assigned To", "Location"]],
      body: data.assets.slice(0, 20).map((asset) => [
        asset.assetTag,
        asset.name,
        asset.category,
        asset.status,
        asset.assignedTo,
        asset.location,
      ]),
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    document.addPage("landscape");
    autoTable(document, {
      startY: 14,
      head: [["Item", "Category", "Type", "Qty", "Recipient", "Department", "Created At"]],
      body: data.stockTransactions.slice(0, 25).map((transaction) => [
        transaction.itemName,
        transaction.category,
        transaction.type,
        String(transaction.quantity),
        transaction.recipientName,
        transaction.recipientDepartment,
        formatDateTime(transaction.createdAt),
      ]),
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    document.save(`itms-report-summary-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumb />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Export operational snapshots for assets and stock movement in Excel or PDF format.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardBody className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total assets</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.summary.totalAssets}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Deployed</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.summary.deployedAssets}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Available</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.summary.availableAssets}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Low stock</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.summary.lowStockItems}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Transactions</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {data.summary.totalStockTransactions}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Assets Excel Report</h2>
            <p className="text-xs text-gray-500">Exports all current assets with assignment context.</p>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-gray-600">{data.assets.length} asset rows ready for export.</p>
            <Button leftIcon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportAssetsToExcel}>
              Export Assets (.xlsx)
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Stock Excel Report</h2>
            <p className="text-xs text-gray-500">
              Exports stock transaction history for inventory tracking.
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-gray-600">
              {data.stockTransactions.length} transaction rows ready for export.
            </p>
            <Button
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={exportStockTransactionsToExcel}
            >
              Export Transactions (.xlsx)
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">PDF Summary</h2>
            <p className="text-xs text-gray-500">
              Exports key metrics plus compact asset and stock tables.
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-gray-600">Generated at run time from the current dashboard data.</p>
            <Button leftIcon={<FileText className="h-4 w-4" />} onClick={exportSummaryToPdf}>
              Export Summary (.pdf)
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
        <Download className="h-3.5 w-3.5" />
        Latest data snapshot loaded at: {generatedAt}
      </div>
    </div>
  );
}

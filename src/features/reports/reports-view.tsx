/**
 * @file reports-view.tsx
 * @description Client UI for report exports (Excel and PDF) using server-loaded datasets.
 */

"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { CalendarRange, Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ReportsData } from "@/lib/services/report.service";

interface ReportsViewProps {
  data: ReportsData;
}

/* Builds a human-readable period line for PDF headers and footers */
const describePeriod = (period: ReportsData["period"]): string => {
  if (!period.from && !period.to) {
    return "All dates (no filter)";
  }
  if (period.from && period.to) {
    return `${period.from} → ${period.to} (UTC, inclusive)`;
  }
  if (period.from) {
    return `From ${period.from} (UTC)`;
  }
  return `Through ${period.to ?? ""} (UTC)`;
};

/* File-name segment reflecting the active filter */
const filterFileSegment = (period: ReportsData["period"]): string => {
  if (!period.from && !period.to) {
    return new Date().toISOString().slice(0, 10);
  }
  const a = period.from ?? "open";
  const b = period.to ?? "open";
  return `${a}_to_${b}`;
};

/**
 * ReportsView — shows summary metrics and export actions for Phase 8 reporting.
 */
export function ReportsView({ data }: ReportsViewProps) {
  const router = useRouter();
  const generatedAt = useMemo(() => new Date().toLocaleString(), []);

  const [from, setFrom] = useState(data.period.from ?? "");
  const [to, setTo] = useState(data.period.to ?? "");

  /* Converts ISO timestamps into readable local date-time strings for files */
  const formatDateTime = (value: string) => new Date(value).toLocaleString();

  const periodLabel = useMemo(() => describePeriod(data.period), [data.period]);
  const fileSeg = useMemo(() => filterFileSegment(data.period), [data.period]);

  /* Pushes `from` / `to` into the URL so the server returns a filtered dataset */
  const applyDateFilter = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    router.push(qs ? `/reports?${qs}` : "/reports");
  };

  const clearDateFilter = () => {
    setFrom("");
    setTo("");
    router.push("/reports");
  };

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
    XLSX.writeFile(workbook, `assets-report-${fileSeg}.xlsx`);
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
    XLSX.writeFile(workbook, `stock-transactions-report-${fileSeg}.xlsx`);
  };

  /* Exports a PDF summary plus compact data tables for quick sharing/printing */
  const exportSummaryToPdf = () => {
    const document = new jsPDF({ orientation: "landscape" });

    document.setFontSize(16);
    document.text("ITMS Reporting Summary", 14, 14);
    document.setFontSize(10);
    document.text(`Generated at: ${generatedAt}`, 14, 20);
    document.text(`Period: ${periodLabel}`, 14, 26);

    autoTable(document, {
      startY: 32,
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
        : 76,
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

    document.save(`itms-report-summary-${fileSeg}.pdf`);
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumb />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Export operational snapshots for assets and stock movement in Excel or PDF format. Filter by{" "}
          <strong className="font-medium text-gray-700">created date</strong> (assets and stock transactions). Low-stock
          counts stay global.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Date range</h2>
          </div>
          <p className="text-xs text-gray-500">
            Uses inclusive UTC day bounds. Empty fields mean no start/end limit. Lists and exports use the same filter.
          </p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:min-w-[280px]">
            <Input
              label="From"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full"
            />
            <Input
              label="To"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={applyDateFilter}>
              Apply filter
            </Button>
            <Button type="button" variant="outline" onClick={clearDateFilter}>
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

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

      <p className="mb-6 text-sm text-gray-600">
        <span className="font-medium text-gray-800">Active period:</span> {periodLabel}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Assets Excel Report</h2>
            <p className="text-xs text-gray-500">Exports assets in the current filter (assignment context).</p>
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
              Exports stock transactions in the current filter for inventory tracking.
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
              Exports key metrics plus compact asset and stock tables for the current filter.
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-gray-600">Generated at run time from the filtered datasets.</p>
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

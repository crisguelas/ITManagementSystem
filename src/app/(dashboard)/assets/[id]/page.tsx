/**
 * @file page.tsx
 * @description Asset details page, showing complete hardware specs, history, and a printable QR code label.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

/* Third-party imports */
import { ArrowLeft, Printer, MapPin, User as UserIcon, Monitor, Clock, Tag, PackagePlus, Trash2 } from "lucide-react";
import { AssetStatus } from "@prisma/client";

/* Local imports */
import { LoadingSpinner } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AssetAssignModal } from "@/features/assets/asset-assign-modal";
import { AssetForm } from "@/features/assets/asset-form";
import type { AssetAssignmentWithRelations, AssetWithRelations } from "@/types";
import type { z } from "zod";
import { assetSchema } from "@/lib/validations/asset.schema";

export default function AssetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params?.id as string;

  const [asset, setAsset] = useState<AssetWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  /* Remount assign modal on each open so form and load state reset without sync setState in effects */
  const [assignModalKey, setAssignModalKey] = useState(0);
  const [returnLoading, setReturnLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAsset = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(`/api/assets/${assetId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load asset details");
      setAsset(json.data as AssetWithRelations);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load asset");
    } finally {
      if (!opts?.silent) {
        setIsLoading(false);
      }
    }
  }, [assetId]);

  useEffect(() => {
    if (!assetId) return;
    /* Defer load so initial setState runs outside the effect body (react-hooks/set-state-in-effect) */
    const t = window.setTimeout(() => {
      void fetchAsset();
    }, 0);
    return () => window.clearTimeout(t);
  }, [assetId, fetchAsset]);

  const handlePrint = () => {
    window.print();
  };

  /* Closes the active assignment and refreshes the asset record */
  const handleReturn = async () => {
    if (!assetId) return;
    setActionError(null);
    setReturnLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/assignments/return`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Return failed");
      }
      await fetchAsset({ silent: true });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Return failed");
    } finally {
      setReturnLoading(false);
    }
  };

  /* Deletes the asset and returns to the asset list on success */
  const handleDelete = async () => {
    if (!assetId) return;

    setActionError(null);
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Delete failed");
      }
      router.push("/assets");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchAsset} />;
  if (!asset) return null;

  const editFormDefaults: z.input<typeof assetSchema> = {
    stockCategoryId: asset.stockCategoryId,
    brand: asset.brand ?? "",
    model: asset.model ?? "",
    pcNumber: asset.pcNumber ?? "",
    macAddress: asset.macAddress ?? "",
    serialNumber: asset.serialNumber ?? "",
    osInstalled: asset.osInstalled ?? "",
    ram: asset.ram ?? "",
    storage: asset.storage ?? "",
    status: asset.status,
  };

  /* Open assignment row (at most one should be open per asset lifecycle rules) */
  const activeAssignment = asset.assignments.find(
    (a: AssetAssignmentWithRelations) => !a.returnedAt
  );
  const hasAssignmentHistory = asset.assignments.length > 0;
  const canAssign =
    asset.status !== AssetStatus.RETIRED && asset.status !== AssetStatus.DISPOSED;

  /* Badge styling maps Prisma enum values from the API */
  const statusVariant =
    asset.status === AssetStatus.AVAILABLE
      ? "success"
      : asset.status === AssetStatus.DEPLOYED
        ? "info"
        : "warning";

  /* QR encodes plain ownership text so scanners show a message without opening a website */
  const qrUrl =
    asset.status === AssetStatus.DEPLOYED
      ? `This IMC property is currently assigned to ${
          activeAssignment?.employee
            ? `${activeAssignment.employee.firstName} ${activeAssignment.employee.lastName}`
            : "an IMC staff member"
        }${
          activeAssignment?.room
            ? ` at ${activeAssignment.room.building?.code ?? "Building"} - ${activeAssignment.room.name}`
            : ""
        }. Please return this item to the IT Department if found.`
      : "This asset is marked as IMC property and is currently available in inventory. Please return it to the IT Department if found.";

  return (
    <div className="animate-fade-in pb-12">
      
      {/* 🔴 PRINT VIEW — Only visible during window.print() 🔴 */}
      <div className="hidden print:flex flex-col items-center justify-center p-8 absolute inset-0 bg-white">
        <div className="border-4 border-black p-6 rounded-2xl flex flex-col items-center max-w-sm">
          <QRCodeSVG value={qrUrl} size={180} level="H" />
          <h2 className="text-3xl font-bold mt-4 tracking-tight">{asset.assetTag}</h2>
          <p className="text-sm font-medium mt-1 uppercase tracking-widest text-center">
            {asset.name}
          </p>
          <div className="mt-4 pt-4 border-t-2 border-black w-full text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">IT Department</p>
            <p className="text-[10px] text-gray-400 mt-1">IT Property • Do Not Remove</p>
          </div>
        </div>
      </div>

      {/* 🔵 STANDARD SCREEN VIEW — Hidden during print 🔵 */}
      <div className="print:hidden">
        {/* Navigation / Header */}
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors mb-4 focus-ring rounded"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Inventory
          </button>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{asset.assetTag}</h1>
                  <Badge variant={statusVariant}>
                    {String(asset.status).replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-gray-500">{asset.name}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canAssign && (
                  <Button
                    leftIcon={<PackagePlus className="w-4 h-4" />}
                    variant="secondary"
                  onClick={() => {
                    setActionError(null);
                    setAssignModalKey((k) => k + 1);
                    setAssignModalOpen(true);
                  }}
                  >
                    Assign
                  </Button>
                )}
                {activeAssignment && (
                  <Button
                    variant="outline"
                    isLoading={returnLoading}
                    onClick={() => void handleReturn()}
                  >
                    Return
                  </Button>
                )}
                <Button leftIcon={<Printer className="w-4 h-4" />} variant="outline" onClick={handlePrint}>
                  Print Label
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setEditModalOpen(true)}
                  disabled={hasAssignmentHistory}
                  title={
                    hasAssignmentHistory
                      ? "Editing is disabled because this asset already has assignment history."
                      : "Edit asset details"
                  }
                >
                  Edit Asset
                </Button>
                <Button
                  variant="danger"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  isLoading={deleteLoading}
                  onClick={() => void handleDelete()}
                >
                  Delete Asset
                </Button>
              </div>
            </div>
            {actionError && (
              <p className="text-sm text-danger" role="alert">
                {actionError}
              </p>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Specs Column */}
          <div className="lg:col-span-2 space-y-6">
             <Card>
               <CardHeader>
                 <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                   <Monitor className="w-5 h-5 text-gray-400" />
                   Hardware Specifications
                 </h2>
               </CardHeader>
               <CardBody>
                 <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                   <div>
                     <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</dt>
                     <dd className="mt-1 text-sm font-medium text-gray-900">{asset.brand || "—"}</dd>
                   </div>
                   <div>
                     <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Model</dt>
                     <dd className="mt-1 text-sm font-medium text-gray-900">{asset.model || "—"}</dd>
                   </div>
                   <div>
                     <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">PC Number</dt>
                     <dd className="mt-1 text-sm font-medium text-gray-900">{asset.pcNumber || "—"}</dd>
                   </div>
                   <div>
                     <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</dt>
                     <dd className="mt-1 text-sm font-medium text-gray-900 font-mono text-xs">{asset.serialNumber || "—"}</dd>
                   </div>
                   <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                     <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">System Details</dt>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div>
                         <span className="block text-xs text-gray-500">Operating System</span>
                         <span className="block text-sm font-medium text-gray-900 mt-0.5">{asset.osInstalled || "—"}</span>
                       </div>
                       <div>
                         <span className="block text-xs text-gray-500">Memory (RAM)</span>
                         <span className="block text-sm font-medium text-gray-900 mt-0.5">{asset.ram || "—"}</span>
                       </div>
                       <div>
                         <span className="block text-xs text-gray-500">Storage</span>
                         <span className="block text-sm font-medium text-gray-900 mt-0.5">{asset.storage || "—"}</span>
                       </div>
                     </div>
                   </div>
                 </dl>
               </CardBody>
             </Card>

             <Card>
               <CardHeader>
                 <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                   <Clock className="w-5 h-5 text-gray-400" />
                   Assignment History
                 </h2>
               </CardHeader>
               <CardBody className="p-0">
                  {asset.assignments.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No assignment history recorded for this asset.
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {asset.assignments.map((assignment: AssetAssignmentWithRelations) => (
                        <li key={assignment.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                           <div className="flex items-start justify-between gap-3">
                             <div className="min-w-0">
                               <div className="text-sm font-medium text-gray-900 space-y-1">
                                 {assignment.employee && (
                                   <p className="flex items-center gap-2">
                                     <UserIcon className="w-4 h-4 shrink-0 text-primary-500" />
                                     <span>
                                       {assignment.employee.firstName} {assignment.employee.lastName}
                                     </span>
                                   </p>
                                 )}
                                 {assignment.room && (
                                   <p className="flex items-center gap-2 text-gray-800">
                                     <MapPin className="w-4 h-4 shrink-0 text-blue-500" />
                                     <span>
                                       {assignment.room.building?.code} — {assignment.room.name}
                                     </span>
                                   </p>
                                 )}
                                 {!assignment.employee && !assignment.room && (
                                   <p className="text-gray-500">No assignee or location recorded</p>
                                 )}
                               </div>
                               <p className="text-xs text-gray-500 mt-1">
                                 Assigned by {assignment.assignedBy.name}
                               </p>
                               {assignment.notes && (
                                 <p className="text-xs text-gray-600 mt-2 border-l-2 border-gray-200 pl-2">
                                   {assignment.notes}
                                 </p>
                               )}
                             </div>
                             <div className="text-right">
                               <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium border border-gray-200">
                                 {new Date(assignment.assignedAt).toLocaleDateString()}
                               </span>
                               {assignment.returnedAt && (
                                 <p className="text-xs text-gray-500 mt-1">Returned: {new Date(assignment.returnedAt).toLocaleDateString()}</p>
                               )}
                               {!assignment.returnedAt && (
                                 <span className="block mt-1 text-[10px] font-bold text-success uppercase tracking-wider">Current</span>
                               )}
                             </div>
                           </div>
                        </li>
                      ))}
                    </ul>
                  )}
               </CardBody>
             </Card>
          </div>

          {/* Sidebar Area (QR Code & Quick Info) */}
          <div className="space-y-6">
            <Card variant="glass" className="bg-gradient-to-br from-white to-primary-50/20">
              <CardBody className="flex flex-col items-center text-center p-6 sm:p-8">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-4">
                  <QRCodeSVG value={qrUrl} size={150} level="H" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Scan for details</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-[200px]">Use any mobile device to quickly access this record.</p>
                <Button variant="outline" className="w-full" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
                  Print Physical Label
                </Button>
              </CardBody>
            </Card>

            <Card>
               <CardHeader className="py-4 border-b border-gray-100">
                 <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                   <Tag className="w-4 h-4 text-gray-400" />
                   Category Details
                 </h2>
               </CardHeader>
               <CardBody className="py-4 text-sm">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-gray-500">Category Name</span>
                  <span className="font-medium">{asset.stockCategory.name}</span>
                 </div>
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-gray-500">Prefix</span>
                  <Badge>{asset.stockCategory.prefix}</Badge>
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                   <span className="text-gray-500">Registered On</span>
                   <span className="font-medium text-gray-900">{new Date(asset.createdAt).toLocaleDateString()}</span>
                 </div>
               </CardBody>
             </Card>
          </div>

        </div>
      </div>

      <AssetAssignModal
        key={assignModalKey}
        assetId={assetId}
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => void fetchAsset({ silent: true })}
      />

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Asset"
        description="Update asset details and save your changes."
        size="lg"
      >
        <AssetForm
          assetId={asset.id}
          initialData={editFormDefaults}
          onSuccess={() => {
            setEditModalOpen(false);
            void fetchAsset({ silent: true });
          }}
          onCancel={() => setEditModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

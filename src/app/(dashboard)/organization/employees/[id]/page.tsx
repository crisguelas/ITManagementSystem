/**
 * @file page.tsx
 * @description Employee profile page showing assignment, asset, and location details.
 */

"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Laptop, Phone, Printer, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-state";
import { TITLE_LABELS } from "@/lib/constants";

interface EmployeeProfileAssetSummary {
  id: string;
  assetTag: string;
  stockCategoryName: string;
  brand: string;
  model: string;
  pcNumber: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  remoteAddress: string | null;
  dataPort: string | null;
  osInstalled: string | null;
  ram: string | null;
  storage: string | null;
  serialNumber: string | null;
  name: string;
  status: string;
}

interface EmployeeProfileAssignment {
  id: string;
  assignedAt: string;
  notes: string | null;
  location: {
    buildingName: string | null;
    roomNumber: string | null;
    roomName: string | null;
    floor: string | null;
  };
  asset: EmployeeProfileAssetSummary;
}

interface EmployeeProfileData {
  id: string;
  employeeId: string;
  fullName: string;
  title: string;
  departmentName: string;
  email: string | null;
  phone: string | null;
  phoneExt: string | null;
  position: string | null;
  activeAssignments: EmployeeProfileAssignment[];
}

interface EmployeeProfileResponse {
  success: boolean;
  data?: EmployeeProfileData;
  error?: string;
}

type AssetKind = "desktopOrLaptop" | "voipPhone" | "other";

const getAssetKind = (asset: EmployeeProfileAssetSummary): AssetKind => {
  const source = `${asset.stockCategoryName} ${asset.name} ${asset.brand} ${asset.model}`.toLowerCase();

  if (source.includes("desktop") || source.includes("laptop") || source.includes("pc")) {
    return "desktopOrLaptop";
  }
  if (source.includes("voip") || source.includes("phone")) {
    return "voipPhone";
  }
  return "other";
};

const formatDateTime = (isoDate: string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));

const buildNonEmptyFieldRows = (asset: EmployeeProfileAssetSummary) => {
  const rows = [
    { label: "Asset tag", value: asset.assetTag },
    { label: "Category", value: asset.stockCategoryName },
    { label: "Brand", value: asset.brand },
    { label: "Model", value: asset.model },
    { label: "PC number", value: asset.pcNumber ?? "" },
    { label: "IP address", value: asset.ipAddress ?? "" },
    { label: "MAC address", value: asset.macAddress ?? "" },
    { label: "Remote address", value: asset.remoteAddress ?? "" },
    { label: "Data port", value: asset.dataPort ?? "" },
    { label: "Operating system", value: asset.osInstalled ?? "" },
    { label: "RAM", value: asset.ram ?? "" },
    { label: "Storage", value: asset.storage ?? "" },
    { label: "Serial number", value: asset.serialNumber ?? "" },
  ];

  return rows.filter((row) => row.value.trim().length > 0);
};

/**
 * EmployeeProfilePage — Displays employee profile, location assignments, and asset details.
 * Renders device-specific detail blocks and hides empty fields for non-PC equipment.
 */
export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/employees/${id}/profile`, { credentials: "same-origin" });
      const payload = (await response.json()) as EmployeeProfileResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Failed to load employee profile");
      }
      setProfile(payload.data);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load employee profile");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchProfile();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchProfile]);

  const employeeHeaderTitle = useMemo(() => {
    if (!profile) return "Employee profile";
    const titleLabel = TITLE_LABELS[profile.title as keyof typeof TITLE_LABELS] ?? profile.title;
    return `${titleLabel} ${profile.fullName}`;
  }, [profile]);

  if (isLoading) return <LoadingSpinner message="Loading employee profile..." />;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;
  if (!profile) return <ErrorState message="Employee not found" onRetry={fetchProfile} />;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/organization" className="flex items-center gap-1 transition-colors hover:text-primary-600">
          <ArrowLeft className="h-4 w-4" /> Back to Organization
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100 py-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
            <User className="h-6 w-6 text-gray-400" />
            {employeeHeaderTitle}
          </h1>
        </CardHeader>
        <CardBody className="grid gap-4 p-5 text-sm md:grid-cols-2">
          <div>
            <p className="text-gray-500">Employee ID</p>
            <p className="font-medium text-gray-900">{profile.employeeId}</p>
          </div>
          <div>
            <p className="text-gray-500">Department</p>
            <p className="font-medium text-gray-900">{profile.departmentName}</p>
          </div>
          {profile.email && (
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{profile.email}</p>
            </div>
          )}
          {profile.phone && (
            <div>
              <p className="text-gray-500">Mobile</p>
              <p className="font-medium text-gray-900">{profile.phone}</p>
            </div>
          )}
          {profile.phoneExt && (
            <div>
              <p className="text-gray-500">Phone extension</p>
              <p className="font-medium text-gray-900">{profile.phoneExt}</p>
            </div>
          )}
          {profile.position && (
            <div>
              <p className="text-gray-500">Position</p>
              <p className="font-medium text-gray-900">{profile.position}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-100 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Assigned assets</h2>
        </CardHeader>
        <CardBody className="space-y-4 p-5">
          {profile.activeAssignments.length === 0 ? (
            <p className="text-sm text-gray-500">No active assignments for this employee.</p>
          ) : (
            profile.activeAssignments.map((assignment) => {
              const assetKind = getAssetKind(assignment.asset);
              const locationLabel = assignment.location.buildingName
                ? `${assignment.location.buildingName} · ${assignment.location.roomName ?? "Unnamed room"}`
                : "No room assignment";

              return (
                <div key={assignment.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {assignment.asset.brand} {assignment.asset.model}
                      </p>
                      <p className="text-xs text-gray-500">
                        Assigned {formatDateTime(assignment.assignedAt)} · {locationLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{assignment.asset.stockCategoryName}</Badge>
                      <Badge variant="outline">{assignment.asset.status}</Badge>
                    </div>
                  </div>

                  <div className="mb-3 grid gap-3 rounded-lg bg-gray-50 p-3 text-sm md:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">
                          {assignment.location.buildingName ?? "—"}
                        </p>
                        {assignment.location.roomName && (
                          <p className="text-xs text-gray-500">
                            Room: {assignment.location.roomName}
                            {assignment.location.roomNumber ? ` (${assignment.location.roomNumber})` : ""}
                            {assignment.location.floor ? ` · Floor ${assignment.location.floor}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    {assignment.notes && (
                      <div>
                        <p className="text-gray-500">Assignment note</p>
                        <p className="font-medium text-gray-900">{assignment.notes}</p>
                      </div>
                    )}
                  </div>

                  {assetKind === "desktopOrLaptop" && (
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Laptop className="h-4 w-4 text-gray-500" />
                        Desktop / Laptop details
                      </p>
                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        {[
                          { label: "PC number", value: assignment.asset.pcNumber },
                          { label: "Brand and model", value: `${assignment.asset.brand} ${assignment.asset.model}`.trim() },
                          { label: "IP address", value: assignment.asset.ipAddress },
                          { label: "MAC address", value: assignment.asset.macAddress },
                          { label: "Remote address", value: assignment.asset.remoteAddress },
                          { label: "Data port", value: assignment.asset.dataPort },
                          { label: "Operating system", value: assignment.asset.osInstalled },
                          { label: "RAM", value: assignment.asset.ram },
                          { label: "Storage", value: assignment.asset.storage },
                        ]
                          .filter((row) => (row.value ?? "").trim().length > 0)
                          .map((row) => (
                            <div key={row.label}>
                              <p className="text-gray-500">{row.label}</p>
                              <p className="font-medium text-gray-900">{row.value}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {assetKind === "voipPhone" && (
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Phone className="h-4 w-4 text-gray-500" />
                        VoIP phone details
                      </p>
                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        {[
                          { label: "Phone extension", value: profile.phoneExt },
                          { label: "Brand and model", value: `${assignment.asset.brand} ${assignment.asset.model}`.trim() },
                          { label: "MAC address", value: assignment.asset.macAddress },
                        ]
                          .filter((row) => (row.value ?? "").trim().length > 0)
                          .map((row) => (
                            <div key={row.label}>
                              <p className="text-gray-500">{row.label}</p>
                              <p className="font-medium text-gray-900">{row.value}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {assetKind === "other" && (
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Printer className="h-4 w-4 text-gray-500" />
                        Asset details
                      </p>
                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        {buildNonEmptyFieldRows(assignment.asset).map((row) => (
                          <div key={row.label}>
                            <p className="text-gray-500">{row.label}</p>
                            <p className="font-medium text-gray-900">{row.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * @file page.tsx
 * @description Public QR scan destination that shows IMC ownership/assignment notice for assets.
 */

import { AssetStatus } from "@prisma/client";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAssetScanDetails } from "@/lib/services/asset.service";

interface ScanAssetPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScanAssetPage({ params }: ScanAssetPageProps) {
  const { id } = await params;
  const asset = await getAssetScanDetails(id);

  if (!asset) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <h1 className="text-xl font-semibold text-gray-900">IMC Property Notice</h1>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-700">
                The scanned asset record was not found. Please contact the IT Department for assistance.
              </p>
            </CardBody>
          </Card>
        </div>
      </main>
    );
  }

  const activeAssignment = asset.assignments[0];
  const assignedTo = activeAssignment?.employee
    ? `${activeAssignment.employee.firstName} ${activeAssignment.employee.lastName}`
    : "an IMC staff member";
  const locationText = activeAssignment?.room
    ? `${activeAssignment.room.building.code} - ${activeAssignment.room.name}`
    : null;
  const isDeployed = asset.status === AssetStatus.DEPLOYED;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-4">
        <Card>
          <CardHeader className="space-y-3">
            <Badge variant={isDeployed ? "info" : "success"}>
              {isDeployed ? "Assigned Asset" : "Available Asset"}
            </Badge>
            <h1 className="text-xl font-semibold text-gray-900">IMC Property Notice</h1>
            <p className="text-sm text-gray-600">
              Asset Tag: <span className="font-medium text-gray-900">{asset.assetTag}</span>
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            {isDeployed ? (
              <>
                <p className="text-sm text-gray-700">
                  This IMC property is currently assigned to <span className="font-semibold">{assignedTo}</span>.
                </p>
                {locationText && (
                  <p className="text-sm text-gray-700">
                    Registered location: <span className="font-semibold">{locationText}</span>.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-700">
                This asset is currently marked as available inventory and remains IMC property.
              </p>
            )}
            <p className="text-sm font-medium text-gray-900">
              Please return this item to the IT Department once found.
            </p>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}

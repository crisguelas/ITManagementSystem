/**
 * @file loading.tsx
 * @description Route-level loading state for dashboard shell while stats are computed.
 */

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card, CardBody } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="animate-fade-in">
      <Breadcrumb />
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardBody className="h-28 animate-pulse rounded-lg bg-gray-100 p-5">
              <span className="sr-only">Loading</span>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="h-64 animate-pulse rounded-lg bg-gray-100">
            <span className="sr-only">Loading</span>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="h-64 animate-pulse rounded-lg bg-gray-100">
            <span className="sr-only">Loading</span>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

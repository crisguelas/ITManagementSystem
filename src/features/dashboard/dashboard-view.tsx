/**
 * @file dashboard-view.tsx
 * @description Client dashboard UI: summary cards, Recharts analytics, activity feed, quick links.
 */

"use client";

import Link from "next/link";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Monitor,
  Building2,
  Users,
  AlertTriangle,
  Package,
  Wrench,
  Activity,
  ArrowRight,
} from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/services/dashboard.service";

/* Distinct series colors for charts (aligned with primary / semantic palette) */
const PIE_COLORS = [
  "#0284c7",
  "#16a34a",
  "#ea580c",
  "#64748b",
  "#dc2626",
];
const STATUS_DOT_CLASSES = [
  "bg-sky-600",
  "bg-green-600",
  "bg-orange-600",
  "bg-slate-500",
  "bg-red-600",
];

const BAR_FILL = "#0284c7";

interface DashboardViewProps {
  data: DashboardStats;
}

/**
 * DashboardView — renders Phase 7 analytics from server-loaded `DashboardStats`.
 */
export function DashboardView({ data }: DashboardViewProps) {
  const { summary, byCategory, byStatus, byBuilding, recentActivity } = data;

  const statusChartData = byStatus.filter((s) => s.count > 0);
  const totalStatusCount = statusChartData.reduce((sum, item) => sum + item.count, 0);
  const categoryChartData = byCategory.map((c) => ({ name: c.name, count: c.count }));
  const buildingChartData = byBuilding.map((b) => ({ name: b.label, count: b.count }));

  return (
    <div className="animate-fade-in">
      <Breadcrumb />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Live counts across assets, locations, and stock. Charts reflect current records.
        </p>
      </div>

      {/* Summary — asset lifecycle + low stock */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card variant="gradient" className="hover-lift border-primary-100">
          <CardBody className="flex h-full flex-col justify-between p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-primary-800">Total assets</span>
              <div className="rounded-lg bg-primary-100/50 p-2 text-primary-600">
                <Monitor className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{summary.totalAssets}</div>
              <p className="mt-1 text-xs font-medium text-primary-600">All registered equipment</p>
            </div>
          </CardBody>
        </Card>

        <Card variant="default">
          <CardBody className="flex h-full flex-col justify-between p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Deployed</span>
              <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{summary.deployed}</div>
              <p className="mt-1 text-xs text-gray-500">In active use</p>
            </div>
          </CardBody>
        </Card>

        <Card variant="default">
          <CardBody className="flex h-full flex-col justify-between p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Available</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Monitor className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{summary.available}</div>
              <p className="mt-1 text-xs text-gray-500">Ready to assign</p>
            </div>
          </CardBody>
        </Card>

        <Card variant="default">
          <CardBody className="flex h-full flex-col justify-between p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Maintenance</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Wrench className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{summary.maintenance}</div>
              <p className="mt-1 text-xs text-gray-500">Under repair / check</p>
            </div>
          </CardBody>
        </Card>

        <Card variant="default" className="border-warning-light bg-orange-50/20">
          <CardBody className="flex h-full flex-col justify-between p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-warning">Low stock</span>
              <div className="rounded-lg bg-amber-100 p-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{summary.lowStockCount}</div>
              <p className="mt-1 text-xs text-warning">At or below minimum</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Organization snapshot */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardBody className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Buildings
                </p>
                <p className="text-xl font-bold text-gray-900">{summary.totalBuildings}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Rooms</p>
                <p className="text-xl font-bold text-gray-900">{summary.totalRooms}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Active employees
                </p>
                <p className="text-xl font-bold text-gray-900">{summary.totalEmployees}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Assets by status</h2>
            <p className="text-xs text-gray-500">Distribution of lifecycle states</p>
          </CardHeader>
          <CardBody className="h-72 min-h-[18rem]">
            {statusChartData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-gray-500">
                No assets yet.
              </p>
            ) : (
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={84}
                        paddingAngle={2}
                        label={false}
                        labelLine={false}
                      >
                        {statusChartData.map((_, index) => (
                          <Cell
                            key={`status-cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value ?? 0, "Assets"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs">
                  {statusChartData.map((item, index) => {
                    const percent =
                      totalStatusCount > 0 ? Math.round((item.count / totalStatusCount) * 100) : 0;
                    return (
                      <div
                        key={`status-row-${item.label}`}
                        className="flex items-center justify-between rounded-md border border-gray-100 px-2 py-1"
                      >
                        <div className="flex items-center gap-2 text-gray-700">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_CLASSES[index % STATUS_DOT_CLASSES.length]}`}
                          />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {item.count} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Assets by category</h2>
            <p className="text-xs text-gray-500">Counts per asset category</p>
          </CardHeader>
          <CardBody className="h-72 min-h-[18rem]">
            {categoryChartData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-gray-500">
                No categorized assets yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [value ?? 0, "Assets"]} />
                  <Bar dataKey="count" fill={BAR_FILL} radius={[4, 4, 0, 0]} name="Assets" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Deployed by location</h2>
            <p className="text-xs text-gray-500">Open assignments with a room, plus user-only</p>
          </CardHeader>
          <CardBody className="h-72 min-h-[18rem]">
            {buildingChartData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-gray-500">
                No room-based deployments yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={buildingChartData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip formatter={(value) => [value ?? 0, "Assets"]} />
                  <Bar dataKey="count" fill={BAR_FILL} radius={[0, 4, 4, 0]} name="Assets" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">Recent activity</h2>
              </div>
              <p className="text-xs text-gray-500">Latest assignments and stock movements</p>
            </CardHeader>
            <CardBody className="p-0">
              {recentActivity.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500">
                  No recent activity. Assign assets or record stock transactions to see updates here.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentActivity.map((item) => (
                    <li key={`${item.kind}-${item.id}`} className="px-4 py-3 sm:px-6">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.headline}</p>
                          <p className="text-xs text-gray-500">{item.detail}</p>
                        </div>
                        <time
                          className="shrink-0 text-xs text-gray-400"
                          dateTime={item.at}
                        >
                          {new Date(item.at).toLocaleString()}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900">Quick actions</h2>
            </CardHeader>
            <CardBody className="flex flex-col gap-2 py-4">
              <Link
                href="/assets"
                className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              >
                Register or view assets
                <ArrowRight className="h-4 w-4 opacity-50" />
              </Link>
              <Link
                href="/organization"
                className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              >
                Organization &amp; employees
                <ArrowRight className="h-4 w-4 opacity-50" />
              </Link>
              <Link
                href="/stock"
                className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              >
                Stock room &amp; transactions
                <ArrowRight className="h-4 w-4 opacity-50" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

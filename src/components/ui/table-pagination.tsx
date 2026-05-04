/**
 * @file table-pagination.tsx
 * @description Footer controls for server-paginated data tables (page size, prev/next, range label).
 */

import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { cn, getPaginationMeta } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type TablePaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * TablePagination — renders "Showing X–Y of Z" with page size select and prev/next navigation.
 */
export const TablePagination = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  className,
}: TablePaginationProps) => {
  const meta = getPaginationMeta(total, page, pageSize);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing{" "}
          <span className="font-medium text-gray-900">
            {total === 0 ? 0 : meta.startItem}–{meta.endItem}
          </span>{" "}
          of <span className="font-medium text-gray-900">{total}</span>
        </span>
        <label className="flex items-center gap-2">
          <span className="text-gray-500">Rows per page</span>
          <select
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            value={pageSize}
            disabled={disabled}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              onPageSizeChange(next);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !meta.hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="tabular-nums text-gray-500">
          Page {meta.currentPage} of {Math.max(1, meta.totalPages)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !meta.hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

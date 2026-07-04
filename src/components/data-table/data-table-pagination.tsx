"use client";

import type { Table } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 50, 100],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-2 overflow-auto p-1 sm:gap-8",
        className
      )}
      {...props}
    >
      <div className="text-muted-foreground text-sm whitespace-nowrap">
        {selectedCount > 0 ? (
          <>
            {selectedCount} / {totalCount} dòng được chọn.
          </>
        ) : (
          <>{totalCount} dòng.</>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-6 lg:gap-8">
        <div className="hidden items-center gap-2 sm:flex">
          <p className="text-sm font-medium whitespace-nowrap">Hàng mỗi trang</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[4.5rem] [&[data-size]]:h-8">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center text-sm font-medium whitespace-nowrap">
          Trang {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
        </div>

        <div className="flex items-center gap-1">
          <Button
            aria-label="Trang đầu"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <DoubleArrowLeftIcon className="size-4" />
          </Button>
          <Button
            aria-label="Trang trước"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            aria-label="Trang tiếp"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            aria-label="Trang cuối"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <DoubleArrowRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

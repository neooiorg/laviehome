"use client";

import type { Column, Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import * as React from "react";

import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  searchColumn?: string;
  searchPlaceholder?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchColumn,
  searchPlaceholder = "Tìm kiếm...",
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const filterableColumns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (col) =>
            col.getCanFilter() &&
            (col.columnDef.meta?.variant === "select" ||
              col.columnDef.meta?.variant === "multiSelect"),
        ),
    [table],
  );

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn("flex w-full items-center justify-between gap-2", className)}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn(searchColumn)?.setFilterValue(e.target.value)
            }
            className="h-8 w-40 lg:w-56"
          />
        )}
        {filterableColumns.map((column) => (
          <DataTableFacetedFilter
            key={column.id}
            column={column as Column<TData, unknown>}
            title={column.columnDef.meta?.label ?? column.id}
            options={column.columnDef.meta?.options ?? []}
            multiple={column.columnDef.meta?.variant === "multiSelect"}
          />
        ))}
        {children}
        {isFiltered && (
          <Button
            aria-label="Xóa bộ lọc"
            variant="outline"
            size="sm"
            className="h-8 border-dashed"
            onClick={() => table.resetColumnFilters()}
          >
            <X className="mr-1.5 size-3.5" />
            Xóa lọc
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}

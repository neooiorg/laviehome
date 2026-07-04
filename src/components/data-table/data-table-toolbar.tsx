"use client";

import type { Table } from "@tanstack/react-table";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
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
        {children}
        {isFiltered && (
          <Button
            aria-label="Xóa bộ lọc"
            variant="outline"
            size="sm"
            className="h-8 border-dashed"
            onClick={() => table.resetColumnFilters()}
          >
            <Cross2Icon className="mr-1.5 size-3.5" />
            Xóa lọc
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}

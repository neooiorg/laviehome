"use client";

import type { Table } from "@tanstack/react-table";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const hidableColumns = table
    .getAllColumns()
    .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide());

  if (hidableColumns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Hiện/ẩn cột"
          variant="outline"
          size="sm"
          className="ml-auto h-8 lg:flex"
        >
          <MixerHorizontalIcon className="mr-2 size-4" />
          Cột
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Hiện/ẩn cột</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hidableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {typeof column.columnDef.header === "string"
              ? column.columnDef.header
              : (column.columnDef.meta as { label?: string } | undefined)?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

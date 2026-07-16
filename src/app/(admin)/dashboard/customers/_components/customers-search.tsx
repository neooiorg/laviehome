"use client";
"use no memo";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { money } from "@/lib/format";
import type { GuestSummary } from "@/lib/homestay-dashboard";

export function CustomersSearch({ guests }: { guests: GuestSummary[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const branchOptions = React.useMemo(() => {
    const names = new Set<string>();
    for (const guest of guests) for (const branch of guest.branches) names.add(branch);
    return Array.from(names).map((name) => ({ label: name, value: name }));
  }, [guests]);

  const columns = React.useMemo<ColumnDef<GuestSummary>[]>(
    () => [
      {
        id: "search",
        accessorFn: (row) => `${row.guestName} ${row.branches.join(" ")}`,
        filterFn: "includesString",
        enableHiding: false,
      },
      {
        id: "rank",
        header: "#",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums">{row.index + 1}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "guestName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tên khách" />,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.guestName}</span>,
      },
      {
        accessorKey: "bookings",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Số lần đặt" />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">{row.original.bookings} lần</Badge>
        ),
      },
      {
        id: "branches",
        header: "Chi nhánh đã ở",
        accessorFn: (row) => row.branches,
        filterFn: (row, _id, values: string[]) =>
          !values.length || row.original.branches.some((b) => values.includes(b)),
        meta: {
          label: "Chi nhánh",
          variant: "multiSelect",
          options: branchOptions,
        },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.branches.join(", ")}</span>
        ),
      },
      {
        accessorKey: "latestStay",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Lần cuối" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.latestStay}</span>
        ),
      },
      {
        accessorKey: "totalSpent",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tổng chi tiêu" />,
        cell: ({ row }) => (
          <span className="block text-right text-sm font-semibold tabular-nums">
            {money(row.original.totalSpent)}đ
          </span>
        ),
      },
    ],
    [branchOptions],
  );

  const table = useReactTable({
    data: guests,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataTable table={table} emptyMessage="Không tìm thấy khách nào.">
      <DataTableToolbar table={table} searchColumn="search" searchPlaceholder="Tìm theo tên khách...">
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {table.getFilteredRowModel().rows.length} khách
        </span>
      </DataTableToolbar>
    </DataTable>
  );
}

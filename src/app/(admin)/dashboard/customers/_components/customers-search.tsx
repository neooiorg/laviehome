"use client";
"use no memo";

import * as React from "react";
import { Search } from "lucide-react";
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { money } from "@/lib/format";
import type { GuestSummary } from "@/lib/homestay-dashboard";

const columns: ColumnDef<GuestSummary>[] = [
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
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.guestName}</span>
    ),
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
    accessorFn: (row) => row.branches.join(", "),
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
      <span className="text-right text-sm font-semibold tabular-nums block">
        {money(row.original.totalSpent)}đ
      </span>
    ),
  },
];

export function CustomersSearch({ guests }: { guests: GuestSummary[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!search) return guests;
    const q = search.toLowerCase();
    return guests.filter((g) => g.guestName.toLowerCase().includes(q));
  }, [guests, search]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const toolbar = (
    <div className="flex items-center justify-between gap-3">
      <InputGroup className="h-8 w-full max-w-xs">
        <InputGroupAddon align="inline-start">
          <Search className="size-3.5" />
        </InputGroupAddon>
        <InputGroupInput
          className="h-8"
          placeholder="Tìm theo tên khách..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); table.setPageIndex(0); }}
        />
      </InputGroup>
      <div className="text-sm text-muted-foreground tabular-nums">{guests.length} khách</div>
    </div>
  );

  return <DataTable table={table} emptyMessage="Không tìm thấy khách nào." toolbar={toolbar} />;
}

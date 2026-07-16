"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import type { BranchRow } from "@/lib/homestay-dashboard";
import { toggleBranchActive, toggleBranchClassic } from "@/lib/branch-actions";

export function BranchesClient({ branches: initial }: { branches: BranchRow[] }) {
  const [branches, setBranches] = React.useState(initial);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  function handleToggleActive(id: number, value: boolean) {
    setBranches((prev) => prev.map((b) => b.id === id ? { ...b, active: value ? 1 : 0 } : b));
    void toggleBranchActive(id, value);
  }

  function handleToggleClassic(id: number, value: boolean) {
    setBranches((prev) => prev.map((b) => b.id === id ? { ...b, classic_booking_enabled: value ? 1 : 0 } : b));
    void toggleBranchClassic(id, value);
  }

  const columns: ColumnDef<BranchRow>[] = [
    {
      id: "search",
      accessorFn: (row) => `${row.name} ${row.hotline ?? ""}`,
      filterFn: "includesString",
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên chi nhánh" />,
      cell: ({ row }) => <div className="font-medium text-sm">{row.original.name}</div>,
    },
    {
      accessorKey: "hotline",
      header: "Hotline",
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.hotline || "—"}</div>,
    },
    {
      accessorKey: "google_maps_link",
      header: "Bản đồ",
      cell: ({ row }) =>
        row.original.google_maps_link ? (
          <a href={row.original.google_maps_link} target="_blank" rel="noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline">
            Maps ↗
          </a>
        ) : <span className="text-sm text-muted-foreground">—</span>,
    },
    {
      accessorKey: "active",
      header: "Đang mở",
      cell: ({ row }) => (
        <Switch checked={row.original.active === 1} onCheckedChange={(v) => handleToggleActive(row.original.id, v)} />
      ),
    },
    {
      accessorKey: "classic_booking_enabled",
      header: "Classic",
      cell: ({ row }) => (
        <Switch checked={row.original.classic_booking_enabled === 1} onCheckedChange={(v) => handleToggleClassic(row.original.id, v)} />
      ),
    },
    {
      id: "status",
      accessorFn: (row) => (row.active === 1 ? "open" : "closed"),
      header: "Trạng thái",
      filterFn: (row, _id, values: string[]) =>
        !values.length || values.includes(row.original.active === 1 ? "open" : "closed"),
      meta: {
        label: "Trạng thái",
        variant: "select",
        options: [
          { label: "Đang mở", value: "open" },
          { label: "Tạm ngưng", value: "closed" },
        ],
      },
      cell: ({ row }) => (
        <Badge variant={row.original.active === 1 ? "default" : "outline"}>
          {row.original.active === 1 ? "Đang mở" : "Tạm ngưng"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/dashboard/branches/${row.original.id}/edit`}>
            <Pencil className="mr-1.5 size-3.5" />
            Sửa
          </Link>
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: branches,
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

  const toolbar = (
    <DataTableToolbar table={table} searchColumn="search" searchPlaceholder="Tìm tên, hotline...">
      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
        {table.getFilteredRowModel().rows.length} chi nhánh
      </span>
    </DataTableToolbar>
  );

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-xl leading-none">Chi nhánh</CardTitle>
          <CardDescription>Quản lý trạng thái và booking classic từng chi nhánh.</CardDescription>
        </div>
        <div data-slot="card-action" className="flex items-start justify-end">
          <Button size="sm" asChild>
            <Link href="/dashboard/branches/create">
              <Plus className="mr-1.5 size-3.5" />
              Thêm chi nhánh
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <DataTable table={table} emptyMessage="Không có chi nhánh nào." toolbar={toolbar} />
      </CardContent>
    </Card>
  );
}

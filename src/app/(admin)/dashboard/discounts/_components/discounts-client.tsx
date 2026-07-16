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
import type { DiscountCode } from "@/lib/homestay-dashboard";
import { toggleDiscountActive } from "@/lib/discount-actions";

export function DiscountsClient({ codes: initial }: { codes: DiscountCode[] }) {
  const [codes, setCodes] = React.useState(initial);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  async function handleToggle(code: string, active: boolean) {
    setCodes((prev) => prev.map((c) => c.code === code ? { ...c, active } : c));
    await toggleDiscountActive(code, active);
  }

  const columns: ColumnDef<DiscountCode>[] = [
    {
      id: "search",
      accessorFn: (row) => `${row.code} ${row.description ?? ""}`,
      filterFn: "includesString",
      enableHiding: false,
    },
    {
      accessorKey: "code",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.code}</span>,
    },
    {
      accessorKey: "percent",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Giảm" />,
      cell: ({ row }) => <Badge variant="secondary">{row.original.percent}%</Badge>,
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description || "—"}</span>,
    },
    {
      id: "usage",
      header: "Đã dùng",
      accessorFn: (row) => row.used_count,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.original.used_count} / {row.original.max_uses}</span>
      ),
    },
    {
      accessorKey: "expires_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Hết hạn" />,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.expires_at ? new Date(row.original.expires_at).toLocaleDateString("vi-VN") : "—"}
        </span>
      ),
    },
    {
      id: "active",
      accessorFn: (row) => (row.active ? "active" : "inactive"),
      header: "Hoạt động",
      filterFn: (row, _id, values: string[]) =>
        !values.length || values.includes(row.original.active ? "active" : "inactive"),
      meta: {
        label: "Trạng thái",
        variant: "select",
        options: [
          { label: "Đang bật", value: "active" },
          { label: "Đã tắt", value: "inactive" },
        ],
      },
      cell: ({ row }) => (
        <Switch checked={row.original.active} onCheckedChange={(v) => handleToggle(row.original.code, v)} />
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/dashboard/discounts/${row.original.code}/edit`}>
            <Pencil className="size-3.5" />
          </Link>
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: codes,
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
    <DataTableToolbar table={table} searchColumn="search" searchPlaceholder="Tìm mã, mô tả...">
      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
        {table.getFilteredRowModel().rows.length} mã
      </span>
    </DataTableToolbar>
  );

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-xl leading-none">Mã giảm giá</CardTitle>
          <CardDescription>Quản lý mã khuyến mãi ({codes.length} mã).</CardDescription>
        </div>
        <div data-slot="card-action" className="flex items-start justify-end">
          <Button size="sm" asChild>
            <Link href="/dashboard/discounts/create">
              <Plus className="mr-1.5 size-3.5" />
              Thêm mã
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <DataTable table={table} emptyMessage="Không có mã giảm giá nào." toolbar={toolbar} />
      </CardContent>
    </Card>
  );
}

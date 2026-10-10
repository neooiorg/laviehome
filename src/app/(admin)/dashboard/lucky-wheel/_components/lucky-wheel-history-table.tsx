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
import { CalendarClock, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import type { LuckyWheelRecentSpin } from "@/lib/lucky-wheel-admin";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getVoucherStatus(spin: LuckyWheelRecentSpin) {
  if (!spin.voucherCode) return "Không trúng";
  if (spin.voucherUsed) return "Đã dùng";
  if (spin.voucherActive === false) return "Đã tắt";
  return "Chưa dùng";
}

function VoucherStatus({ spin }: { spin: LuckyWheelRecentSpin }) {
  if (!spin.voucherCode) return <Badge variant="outline">Không trúng</Badge>;
  if (spin.voucherUsed) {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" /> Đã dùng
      </Badge>
    );
  }
  if (spin.voucherActive === false) return <Badge variant="secondary">Đã tắt</Badge>;
  return <Badge variant="outline">Chưa dùng</Badge>;
}

const statusOptions = [
  { label: "Không trúng", value: "Không trúng" },
  { label: "Chưa dùng", value: "Chưa dùng" },
  { label: "Đã dùng", value: "Đã dùng" },
  { label: "Đã tắt", value: "Đã tắt" },
];

export function LuckyWheelHistoryTable({ spins }: { spins: LuckyWheelRecentSpin[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const columns: ColumnDef<LuckyWheelRecentSpin>[] = [
    {
      id: "search",
      accessorFn: (spin) => `${spin.phoneMasked} ${spin.prizeLabel} ${spin.voucherCode ?? ""}`,
      filterFn: "includesString",
      enableHiding: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thời gian" />,
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      accessorKey: "phoneMasked",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Số điện thoại" />,
      cell: ({ row }) => <span className="whitespace-nowrap font-medium tabular-nums">{row.original.phoneMasked}</span>,
    },
    {
      accessorKey: "prizeLabel",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phần thưởng" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.prizeLabel}</p>
          {row.original.prizePercent > 0 && <p className="text-xs text-muted-foreground">Giảm {row.original.prizePercent}%</p>}
        </div>
      ),
    },
    {
      accessorKey: "voucherCode",
      header: "Mã voucher",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.voucherCode ?? "—"}</span>,
    },
    {
      accessorKey: "voucherExpiresAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Hết hạn" />,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.voucherExpiresAt)}</span>,
    },
    {
      id: "status",
      accessorFn: getVoucherStatus,
      header: "Trạng thái voucher",
      filterFn: (row, _id, values: string[]) => !values.length || values.includes(getVoucherStatus(row.original)),
      meta: { label: "Trạng thái", variant: "select", options: statusOptions },
      cell: ({ row }) => <VoucherStatus spin={row.original} />,
    },
  ];

  // TanStack Table keeps internal mutable state that React Compiler cannot safely memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: spins,
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
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-1 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Lịch sử lượt quay</h2>
        </div>
        <p className="text-sm text-muted-foreground">Số điện thoại được che; tìm theo số đã che, phần thưởng hoặc mã voucher.</p>
      </div>
      <DataTable table={table} emptyMessage="Không tìm thấy lượt quay nào.">
        <DataTableToolbar table={table} searchColumn="search" searchPlaceholder="Tìm số điện thoại, voucher...">
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {table.getFilteredRowModel().rows.length.toLocaleString("vi-VN")} lượt
          </span>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}

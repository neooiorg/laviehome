"use client";
"use no memo";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, RefreshCw, Search } from "lucide-react";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BookingSnapshot, BranchRow, RoomRow } from "@/lib/homestay-dashboard";

import { DataTable } from "@/components/data-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { BookingDetailSheet } from "./booking-detail-sheet";
import { bookingsColumns } from "./bookings-columns";
import { CreateBookingSheet } from "./create-booking-sheet";

const STATUSES = ["All", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

function exportCsv(bookings: BookingSnapshot[]) {
  const headers = ["ID", "Khách", "SĐT", "Phòng", "Chi nhánh", "Ngày", "Giờ", "Kênh", "Trạng thái", "Số tiền", "Tạo lúc"];
  const rows = bookings.map((b) => [
    b.id, b.guestName, b.customerPhone ?? "", b.room.card_name, b.branch.name,
    b.stayDate, b.timeRange, b.channel, b.status, b.amount, b.createdAt
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Bookings({
  bookings,
  branches,
  rooms,
}: {
  bookings: BookingSnapshot[];
  branches: BranchRow[];
  rooms: RoomRow[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [selectedBooking, setSelectedBooking] = React.useState<BookingSnapshot | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState(new Date());

  // Auto-refresh every 30s so payment confirmations appear without manual reload
  React.useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setLastRefresh(new Date());
    }, 30_000);
    return () => clearInterval(id);
  }, [router]);

  // Client-side branch + date filters (separate from TanStack column filters)
  const [branchFilter, setBranchFilter] = React.useState("All");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const filteredData = React.useMemo(() => {
    return bookings.filter((b) => {
      if (branchFilter !== "All" && String(b.branch.id) !== branchFilter) return false;
      if (dateFrom && b.stayDate < dateFrom) return false;
      if (dateTo && b.stayDate > dateTo) return false;
      return true;
    });
  }, [bookings, branchFilter, dateFrom, dateTo]);

  const table = useReactTable({
    data: filteredData,
    columns: bookingsColumns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: { onDetail: setSelectedBooking },
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "All";

  function setStatusFilter(value: string) {
    table.getColumn("status")?.setFilterValue(value === "All" ? undefined : value);
    table.setPageIndex(0);
  }

  function handleBranchFilter(value: string) {
    setBranchFilter(value);
    table.setPageIndex(0);
  }

  const visibleRows = table.getFilteredRowModel().rows.map((r) => r.original);

  return (
    <>
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <div>
            <CardTitle className="text-xl leading-none">Đặt phòng</CardTitle>
            <CardDescription className="max-w-sm leading-snug">
              Danh sách đặt phòng từ tất cả chi nhánh.
            </CardDescription>
          </div>
          <div data-slot="card-action" className="flex items-start justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => { router.refresh(); setLastRefresh(new Date()); }}>
              <RefreshCw className="mr-1.5 size-3.5" />
              {lastRefresh.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportCsv(visibleRows)}>
              <Download className="mr-1.5 size-3.5" />
              Xuất CSV
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 size-3.5" />
              Tạo đặt phòng
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <InputGroup className="h-7 w-full md:w-56">
                <InputGroupAddon align="inline-start">
                  <Search className="size-3.5" />
                </InputGroupAddon>
                <InputGroupInput
                  className="h-7"
                  placeholder="Tìm khách, SĐT, phòng..."
                  value={searchQuery}
                  onChange={(e) => {
                    table.getColumn("search")?.setFilterValue(e.target.value || undefined);
                    table.setPageIndex(0);
                  }}
                />
              </InputGroup>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={branchFilter} onValueChange={handleBranchFilter}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Chi nhánh:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    <SelectItem value="All">Tất cả</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  className="h-7 rounded-md border bg-background px-2 text-xs text-foreground"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); table.setPageIndex(0); }}
                />
                <span className="text-xs text-muted-foreground">–</span>
                <input
                  type="date"
                  className="h-7 rounded-md border bg-background px-2 text-xs text-foreground"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); table.setPageIndex(0); }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground tabular-nums">
                {table.getFilteredRowModel().rows.length} booking
              </span>
              <DataTableViewOptions table={table} />
            </div>
          </div>

          <DataTable table={table} emptyMessage="Không có booking nào." />
        </CardContent>
      </Card>

      <BookingDetailSheet
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      <CreateBookingSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        branches={branches}
        rooms={rooms}
      />
    </>
  );
}

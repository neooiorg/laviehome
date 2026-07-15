"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
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

import { DataTable } from "@/components/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BookingSnapshot, BranchRow } from "@/lib/homestay-dashboard";

import { bookingsColumns } from "./bookings-columns";

function exportCsv(bookings: BookingSnapshot[]) {
  const headers = [
    "ID",
    "Khách",
    "SĐT",
    "Phòng",
    "Chi nhánh",
    "Ngày",
    "Giờ",
    "Kênh",
    "Trạng thái",
    "Tiền phòng",
    "Menu items",
    "Tổng cộng",
    "Tạo lúc",
  ];
  const rows = bookings.map((booking) => {
    const menuItemsTotal = Number(booking.menuItemsTotal ?? 0);
    const totalAmount = Number(booking.amount) + menuItemsTotal;

    return [
      booking.id,
      booking.guestName,
      booking.customerPhone ?? "",
      booking.room.card_name,
      booking.branch.name,
      booking.stayDate,
      booking.timeRange,
      booking.channel,
      booking.status,
      booking.amount,
      menuItemsTotal,
      totalAmount,
      booking.createdAt,
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Bookings({
  bookings,
  branches,
}: {
  bookings: BookingSnapshot[];
  branches: BranchRow[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const eventSource = new EventSource("/api/booking-events");

    eventSource.onmessage = () => {
      router.refresh();
      setLastRefresh(new Date());
    };

    return () => eventSource.close();
  }, [router]);

  const [branchFilter, setBranchFilter] = React.useState("All");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const filteredData = React.useMemo(() => {
    return bookings.filter((booking) => {
      if (branchFilter !== "All" && String(booking.branch.id) !== branchFilter) return false;
      if (dateFrom && booking.stayDate < dateFrom) return false;
      if (dateTo && booking.stayDate > dateTo) return false;
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
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const visibleRows = table.getFilteredRowModel().rows.map((row) => row.original);

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-xl leading-none">Đặt phòng</CardTitle>
          <CardDescription className="max-w-sm leading-snug">Danh sách đặt phòng từ tất cả chi nhánh.</CardDescription>
        </div>
        <div data-slot="card-action" className="flex items-start justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              router.refresh();
              setLastRefresh(new Date());
            }}
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            {lastRefresh
              ? lastRefresh.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
              : "Live"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportCsv(visibleRows)}>
            <Download className="mr-1.5 size-3.5" />
            Xuất CSV
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/bookings/create">
              <Plus className="mr-1.5 size-3.5" />
              Tạo đặt phòng
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="px-4 pt-4">
          <DataTableToolbar table={table}>
            <InputGroup className="h-8 w-full md:w-56">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-8"
                placeholder="Tìm khách, SĐT, phòng..."
                value={searchQuery}
                onChange={(e) => {
                  table.getColumn("search")?.setFilterValue(e.target.value || undefined);
                  table.setPageIndex(0);
                }}
              />
            </InputGroup>

            <Select
              value={branchFilter}
              onValueChange={(value) => {
                setBranchFilter(value);
                table.setPageIndex(0);
              }}
            >
              <SelectTrigger size="sm" className="h-8">
                <span className="text-muted-foreground">Chi nhánh:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  <SelectItem value="All">Tất cả</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <DatePicker
              value={dateFrom}
              onChange={(value) => {
                setDateFrom(value);
                table.setPageIndex(0);
              }}
              placeholder="Từ ngày"
              className="h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <DatePicker
              value={dateTo}
              onChange={(value) => {
                setDateTo(value);
                table.setPageIndex(0);
              }}
              placeholder="Đến ngày"
              className="h-8 text-xs"
            />

            <span className="text-sm text-muted-foreground tabular-nums">{table.getFilteredRowModel().rows.length} booking</span>
          </DataTableToolbar>
        </div>

        <DataTable table={table} emptyMessage="Không có booking nào." />
      </CardContent>
    </Card>
  );
}

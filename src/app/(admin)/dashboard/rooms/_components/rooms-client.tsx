"use client";
"use no memo";

import * as React from "react";
import {
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import type { BranchRow, RoomRow } from "@/lib/homestay-dashboard";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getRoomsColumns } from "./rooms-columns";

interface Props {
  rooms: RoomRow[];
  branches: BranchRow[];
}

export function RoomsClient({ rooms, branches }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const columns = React.useMemo(
    () => getRoomsColumns(branches.map((b) => ({ label: b.name, value: b.name }))),
    [branches],
  );

  const table = useReactTable({
    data: rooms,
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
    <DataTableToolbar table={table} searchColumn="search" searchPlaceholder="Tìm tên phòng, chi nhánh...">
      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
        {table.getFilteredRowModel().rows.length} phòng
      </span>
    </DataTableToolbar>
  );

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-xl leading-none">Phòng</CardTitle>
          <CardDescription>Danh sách tất cả phòng ({rooms.length} phòng).</CardDescription>
        </div>
        <div data-slot="card-action" className="flex items-start justify-end">
          <Button size="sm" asChild>
            <Link href="/dashboard/rooms/create">
              <Plus className="mr-1.5 size-3.5" />
              Thêm phòng
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <DataTable table={table} emptyMessage="Không có phòng nào." toolbar={toolbar} />
      </CardContent>
    </Card>
  );
}

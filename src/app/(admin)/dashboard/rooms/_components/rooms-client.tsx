"use client";
"use no memo";

import * as React from "react";
import { Search } from "lucide-react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import type { BranchRow, RoomRow } from "@/lib/homestay-dashboard";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { roomsColumns } from "./rooms-columns";

interface Props {
  rooms: RoomRow[];
  branches: BranchRow[];
}

export function RoomsClient({ rooms, branches }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [branchFilter, setBranchFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");

  const filteredData = React.useMemo(() => {
    return rooms.filter((r) => {
      if (branchFilter !== "All" && String(r.branch_id) !== branchFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.card_name.toLowerCase().includes(q) && !r.branch_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rooms, branchFilter, search]);

  const table = useReactTable({
    data: filteredData,
    columns: roomsColumns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="h-8 w-56">
          <InputGroupAddon align="inline-start">
            <Search className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            className="h-8"
            placeholder="Tìm tên phòng, chi nhánh..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); table.setPageIndex(0); }}
          />
        </InputGroup>

        <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); table.setPageIndex(0); }}>
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
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground tabular-nums">
          {filteredData.length} phòng
        </span>
        <DataTableViewOptions table={table} />
      </div>
    </div>
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

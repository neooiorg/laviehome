"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import type { BranchRow } from "@/lib/homestay-dashboard";
import { toggleBranchActive, toggleBranchClassic } from "@/lib/branch-actions";

export function BranchesClient({ branches: initial }: { branches: BranchRow[] }) {
  const [branches, setBranches] = React.useState(initial);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = React.useState("");

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
      header: "Trạng thái",
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

  const filteredData = React.useMemo(() => {
    if (!search) return branches;
    const q = search.toLowerCase();
    return branches.filter((b) => b.name.toLowerCase().includes(q) || b.hotline.toLowerCase().includes(q));
  }, [branches, search]);

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
      <InputGroup className="h-8 w-56">
        <InputGroupAddon align="inline-start"><Search className="size-3.5" /></InputGroupAddon>
        <InputGroupInput className="h-8" placeholder="Tìm tên, hotline..."
          value={search} onChange={(e) => { setSearch(e.target.value); table.setPageIndex(0); }} />
      </InputGroup>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground tabular-nums">{branches.length} chi nhánh</span>
        <DataTableViewOptions table={table} />
      </div>
    </div>
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

'use client';
'use no memo';

import * as React from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { money } from '@/lib/format';
import { deleteMenuItem, toggleMenuItemStatus } from '@/lib/menu-actions';
import type { MenuItem } from '@/lib/menu-actions';
import type { BranchRow } from '@/lib/homestay-dashboard';

interface MenuItemsTableProps {
  items: MenuItem[];
  branches: BranchRow[];
}

export function MenuItemsTable({ items, branches }: MenuItemsTableProps) {
  const [isDeleting, setIsDeleting] = React.useState<number | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState<number | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<import('@tanstack/react-table').ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const branchNameById = React.useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );

  async function handleDelete(id: number) {
    if (!confirm('Bạn chắc chắn muốn xóa menu item này?')) return;
    setIsDeleting(id);
    try {
      await deleteMenuItem(id);
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleToggleStatus(id: number) {
    setIsTogglingStatus(id);
    try {
      await toggleMenuItemStatus(id);
    } finally {
      setIsTogglingStatus(null);
    }
  }

  const columns = React.useMemo<ColumnDef<MenuItem>[]>(
    () => [
      {
        id: 'search',
        accessorFn: (row) => `${row.name} ${row.description ?? ''}`,
        filterFn: 'includesString',
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tên" />,
        cell: ({ row }) => <span className="font-medium text-sm">{row.original.name}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-xs text-sm text-muted-foreground">
            {row.original.description || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Giá" />,
        cell: ({ row }) => (
          <span className="font-semibold text-sm text-primary tabular-nums">{money(row.original.price)}đ</span>
        ),
      },
      {
        id: 'branch',
        accessorFn: (row) => String(row.branch_id),
        header: 'Chi nhánh',
        filterFn: (row, _id, values: string[]) =>
          !values.length || values.includes(String(row.original.branch_id)),
        meta: {
          label: 'Chi nhánh',
          variant: 'multiSelect',
          options: branches.map((b) => ({ label: b.name, value: String(b.id) })),
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {branchNameById.get(row.original.branch_id) ?? `Chi nhánh ${row.original.branch_id}`}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => (row.is_active ? 'active' : 'inactive'),
        header: 'Trạng thái',
        filterFn: (row, _id, values: string[]) =>
          !values.length || values.includes(row.original.is_active ? 'active' : 'inactive'),
        meta: {
          label: 'Trạng thái',
          variant: 'select',
          options: [
            { label: 'Hoạt động', value: 'active' },
            { label: 'Tắt', value: 'inactive' },
          ],
        },
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'default' : 'outline'}>
            {row.original.is_active ? 'Hoạt động' : 'Tắt'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleToggleStatus(row.original.id)}
              disabled={isTogglingStatus === row.original.id}
              title={row.original.is_active ? 'Tắt' : 'Bật'}
            >
              {row.original.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" asChild title="Sửa">
              <Link href={`/dashboard/menu-items/${row.original.id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(row.original.id)}
              disabled={isDeleting === row.original.id}
              title="Xóa"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [branches, branchNameById, isDeleting, isTogglingStatus],
  );

  const table = useReactTable({
    data: items,
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
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-xl leading-none">Menu Items</CardTitle>
          <CardDescription>Quản lý các tùy chọn menu khi đặt phòng ({items.length} món).</CardDescription>
        </div>
        <div data-slot="card-action" className="flex items-start justify-end">
          <Button size="sm" asChild>
            <Link href="/dashboard/menu-items/create">
              <Plus className="mr-1.5 size-3.5" />
              Thêm Menu Item
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <DataTable table={table} emptyMessage="Chưa có menu items nào.">
          <DataTableToolbar table={table} searchColumn="search" searchPlaceholder="Tìm tên, mô tả...">
            <span className="ml-auto text-sm text-muted-foreground tabular-nums">
              {table.getFilteredRowModel().rows.length} món
            </span>
          </DataTableToolbar>
        </DataTable>
      </CardContent>
    </Card>
  );
}

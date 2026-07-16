"use client";
"use no memo";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { TruncatedCell } from "@/components/data-table/data-table-truncate";
import type { Option } from "@/types/data-table";
import type { RoomRow } from "@/lib/homestay-dashboard";

function money(v: number) {
  return new Intl.NumberFormat("vi-VN").format(v);
}

export function getRoomsColumns(branchOptions: Option[]): ColumnDef<RoomRow>[] {
  return [
  {
    id: "search",
    accessorFn: (row) => `${row.card_name} ${row.branch_name}`,
    filterFn: "includesString",
    enableHiding: false,
    header: () => null,
    cell: () => null,
  },
  {
    accessorKey: "card_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tên phòng" />,
    cell: ({ row }) => (
      <TruncatedCell text={row.original.card_name} className="max-w-[200px] font-medium text-sm" />
    ),
  },
  {
    accessorKey: "branch_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Chi nhánh" />,
    filterFn: (row, _id, values: string[]) =>
      !values.length || values.includes(row.original.branch_name),
    meta: {
      label: "Chi nhánh",
      variant: "multiSelect",
      options: branchOptions,
    },
    cell: ({ row }) => (
      <TruncatedCell text={row.original.branch_name} className="max-w-[160px] text-sm text-muted-foreground" />
    ),
  },
  {
    id: "price",
    header: "Giá",
    accessorFn: (row) => row.price_from,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm tabular-nums">
        {money(row.original.price_from)}đ – {money(row.original.price_to)}đ
      </div>
    ),
  },
  {
    accessorKey: "full_day_price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cả ngày" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm tabular-nums">
        {money(row.original.full_day_price)}đ
      </div>
    ),
  },
  {
    id: "amenities",
    header: "Tiện ích",
    accessorFn: (row) => row.room_amenities.length,
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.room_amenities.length} tiện ích</Badge>
    ),
  },
  {
    id: "is_classic",
    accessorFn: (row) => (row.is_classic === 1 ? "classic" : "standard"),
    header: "Loại",
    filterFn: (row, _id, values: string[]) =>
      !values.length || values.includes(row.original.is_classic === 1 ? "classic" : "standard"),
    meta: {
      label: "Loại phòng",
      variant: "select",
      options: [
        { label: "Classic", value: "classic" },
        { label: "Thường", value: "standard" },
      ],
    },
    cell: ({ row }) =>
      row.original.is_classic === 1 ? (
        <Badge variant="outline">Classic</Badge>
      ) : (
        <span className="text-sm text-muted-foreground">Thường</span>
      ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <Button asChild size="sm" variant="ghost">
        <Link href={`/dashboard/rooms/${row.original.id}`}>
          <Pencil className="mr-1.5 size-3.5" />
          Sửa
        </Link>
      </Button>
    ),
  },
  ];
}

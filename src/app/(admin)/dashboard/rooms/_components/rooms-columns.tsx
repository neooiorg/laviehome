"use client";
"use no memo";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { RoomRow } from "@/lib/homestay-dashboard";

function money(v: number) {
  return new Intl.NumberFormat("vi-VN").format(v);
}

export const roomsColumns: ColumnDef<RoomRow>[] = [
  {
    id: "search",
    accessorFn: (row) => `${row.card_name} ${row.branch_name}`,
    filterFn: "includesString",
    enableHiding: true,
    header: () => null,
    cell: () => null,
  },
  {
    accessorKey: "card_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tên phòng" />,
    cell: ({ row }) => (
      <div className="font-medium text-sm">{row.original.card_name}</div>
    ),
  },
  {
    accessorKey: "branch_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Chi nhánh" />,
    filterFn: "equalsString",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.original.branch_name}</div>
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
    accessorKey: "is_classic",
    header: "Loại",
    cell: ({ row }) =>
      row.original.is_classic === 1 ? (
        <Badge variant="outline">Classic</Badge>
      ) : null,
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

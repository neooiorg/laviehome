"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingSnapshot } from "@/lib/homestay-dashboard";

const statusMeta: Record<string, { badgeClass: string; dotClass: string }> = {
  "Đã xác nhận": {
    badgeClass: "border-blue-200 text-blue-700 dark:border-blue-500/30 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  "Chờ cọc": {
    badgeClass: "border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  "Đang ở": {
    badgeClass: "border-green-200 text-green-700 dark:border-green-500/30 dark:text-green-400",
    dotClass: "bg-green-500",
  },
  "Hoàn tất": {
    badgeClass: "border-muted-foreground/30 text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? {
    badgeClass: "border-muted-foreground/30 text-muted-foreground",
    dotClass: "bg-muted-foreground",
  };

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export const bookingsColumns: ColumnDef<BookingSnapshot>[] = [
  {
    id: "search",
    accessorFn: (row) => `${row.guestName} ${row.room.card_name} ${row.branch.name}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "guestName",
    header: "Khách",
    cell: ({ row }) => (
      <div className="font-medium text-sm text-foreground">{row.original.guestName}</div>
    ),
  },
  {
    id: "room",
    header: "Phòng",
    accessorFn: (row) => row.room.card_name,
    cell: ({ row }) => (
      <div className="text-sm">{row.original.room.card_name}</div>
    ),
  },
  {
    id: "branch",
    header: "Chi nhánh",
    accessorFn: (row) => row.branch.name,
    cell: ({ row }) => (
      <div className="text-sm">{row.original.branch.name}</div>
    ),
  },
  {
    accessorKey: "dateLabel",
    header: "Ngày",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">{row.original.dateLabel}</div>
    ),
  },
  {
    accessorKey: "timeRange",
    header: "Giờ",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm text-muted-foreground">{row.original.timeRange}</div>
    ),
  },
  {
    accessorKey: "channel",
    header: "Kênh",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <div className="text-sm">{row.original.channel}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "amount",
    header: "Số tiền",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm font-medium">{money(row.original.amount)}đ</div>
    ),
  },
];

"use client";
"use no memo";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import type { BookingSnapshot } from "@/lib/homestay-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TruncatedCell } from "@/components/data-table/data-table-truncate";
import { cn } from "@/lib/utils";

const statusMeta: Record<string, { badgeClass: string; dotClass: string }> = {
  "Chờ thanh toán": {
    badgeClass: "border-orange-200 text-orange-700 dark:border-orange-500/30 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
  "Đã thanh toán": {
    badgeClass: "border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
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
  "Đã hết hạn - Không thanh toán": {
    badgeClass: "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-400",
    dotClass: "bg-red-500",
  },
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? {
    badgeClass: "border-muted-foreground/30 text-muted-foreground",
    dotClass: "bg-muted-foreground",
  };

  return (
    <Badge
      className={cn("max-w-[170px] gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)}
      title={status}
      variant="outline"
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClass)} />
      <span className="min-w-0 truncate">{status}</span>
    </Badge>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export const bookingsColumns: ColumnDef<BookingSnapshot & { onDetail?: (booking: BookingSnapshot) => void }>[] = [
  {
    id: "search",
    accessorFn: (row) =>
      `${row.guestName} ${row.customerName ?? ""} ${row.customerPhone ?? ""} ${row.customerEmail ?? ""} ${row.doorCode ?? ""} ${row.room.card_name} ${row.branch.name}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "guestName",
    header: "Khách",
    size: 170,
    cell: ({ row }) => (
      <div className="min-w-0">
        <TruncatedCell text={row.original.guestName} className="max-w-[150px] text-sm font-medium text-foreground" />
        {row.original.customerPhone && (
          <TruncatedCell text={row.original.customerPhone} className="max-w-[150px] text-xs text-muted-foreground" />
        )}
        {row.original.customerEmail && (
          <TruncatedCell text={row.original.customerEmail} className="max-w-[150px] text-xs text-muted-foreground" />
        )}
      </div>
    ),
  },
  {
    id: "room",
    header: "Phòng",
    size: 210,
    accessorFn: (row) => row.room.card_name,
    cell: ({ row }) => <TruncatedCell text={row.original.room.card_name} className="max-w-[180px] text-sm" />,
  },
  {
    id: "branch",
    header: "Chi nhánh",
    size: 170,
    accessorFn: (row) => row.branch.name,
    cell: ({ row }) => <TruncatedCell text={row.original.branch.name} className="max-w-[150px] text-sm" />,
  },
  {
    accessorKey: "dateLabel",
    header: "Ngày",
    size: 120,
    cell: ({ row }) => <div className="whitespace-nowrap text-sm">{row.original.dateLabel}</div>,
  },
  {
    accessorKey: "timeRange",
    header: "Giờ",
    size: 390,
    cell: ({ row }) => (
      <TruncatedCell text={row.original.timeRange} className="max-w-[360px] text-sm text-muted-foreground" />
    ),
  },
  {
    accessorKey: "channel",
    header: "Kênh",
    size: 90,
    filterFn: "equalsString",
    cell: ({ row }) => <TruncatedCell text={row.original.channel} className="max-w-[80px] text-sm" />,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    size: 190,
    filterFn: (row, _id, filterValues: string[]) => !filterValues.length || filterValues.includes(row.original.status),
    meta: {
      label: "Trạng thái",
      variant: "multiSelect" as const,
      options: [
        { label: "Chờ thanh toán", value: "Chờ thanh toán" },
        { label: "Đã thanh toán", value: "Đã thanh toán" },
        { label: "Đã xác nhận", value: "Đã xác nhận" },
        { label: "Chờ cọc", value: "Chờ cọc" },
        { label: "Đang ở", value: "Đang ở" },
        { label: "Hoàn tất", value: "Hoàn tất" },
        { label: "Đã hết hạn - Không thanh toán", value: "Đã hết hạn - Không thanh toán" },
      ],
    },
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "amount",
    header: "Tổng cộng",
    size: 120,
    cell: ({ row }) => {
      const totalAmount = Number(row.original.amount) + Number(row.original.menuItemsTotal ?? 0);
      return <div className="whitespace-nowrap text-sm font-medium">{money(totalAmount)}đ</div>;
    },
  },
  {
    id: "actions",
    header: "",
    size: 52,
    cell: ({ row }) => (
      <Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground" asChild aria-label="Xem chi tiết">
        <Link href={`/dashboard/bookings/${row.original.id}`}>
          <Eye className="size-3.5" />
        </Link>
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

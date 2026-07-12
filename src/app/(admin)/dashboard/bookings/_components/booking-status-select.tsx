"use client";

import * as React from "react";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBookingStatus } from "@/lib/booking-actions";
import type { BookingStatus } from "@/lib/homestay-dashboard";

const STATUSES: BookingStatus[] = ["Chờ thanh toán", "Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

interface Props {
  id: string;
  currentStatus: BookingStatus;
}

export function BookingStatusSelect({ id, currentStatus }: Props) {
  const [status, setStatus] = React.useState<BookingStatus>(currentStatus);
  const [pending, setPending] = React.useState(false);

  async function handleChange(value: string) {
    const next = value as BookingStatus;
    setPending(true);
    setStatus(next);
    await updateBookingStatus(id, next);
    setPending(false);
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="h-7 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

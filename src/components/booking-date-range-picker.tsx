"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

import type { BookingDateRange } from "@/lib/booking-slots";
import { getTodayIso } from "@/lib/booking-slots";
import { cn } from "@/lib/utils";

type BookingDateRangePickerProps = {
  value: BookingDateRange;
  onChange: (value: BookingDateRange) => void;
  className?: string;
  label?: string;
  description?: string;
};

function isoToDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(iso: string) {
  return format(isoToDate(iso), "dd/MM/yyyy", { locale: vi });
}

export function BookingDateRangePicker({
  value,
  onChange,
  className,
  label = "Chọn ngày lưu trú",
  description = "Chọn ngày nhận phòng và trả phòng.",
}: BookingDateRangePickerProps) {
  const today = getTodayIso();

  function handleFromChange(nextFrom: string) {
    if (!nextFrom) return;
    onChange({
      from: nextFrom,
      to: value.to < nextFrom ? nextFrom : value.to,
    });
  }

  function handleToChange(nextTo: string) {
    if (!nextTo) return;
    onChange({
      from: value.from,
      to: nextTo < value.from ? value.from : nextTo,
    });
  }

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-4", className)}>
      <div className="mb-3">
        <p className="flex items-center gap-2 text-sm font-black text-white">
          <CalendarDays className="size-4 text-pink-200" />
          {label}
        </p>
        <p className="mt-1 text-xs font-semibold text-white/60">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block rounded-xl border border-white/10 bg-[#1b1023] p-3">
          <span className="mb-2 block text-sm font-bold text-white">Nhận phòng</span>
          <input
            type="date"
            lang="vi-VN"
            value={value.from}
            min={today}
            onChange={(event) => handleFromChange(event.target.value)}
            className="h-12 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-base font-black text-white outline-none transition [color-scheme:dark] focus:border-pink-200/70 focus:ring-2 focus:ring-pink-200/25"
          />
          <span className="mt-2 block text-xs font-medium text-white/50">{formatDate(value.from)}</span>
        </label>

        <label className="block rounded-xl border border-white/10 bg-[#1b1023] p-3">
          <span className="mb-2 block text-sm font-bold text-white">Trả phòng</span>
          <input
            type="date"
            lang="vi-VN"
            value={value.to}
            min={value.from}
            onChange={(event) => handleToChange(event.target.value)}
            className="h-12 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-base font-black text-white outline-none transition [color-scheme:dark] focus:border-pink-200/70 focus:ring-2 focus:ring-pink-200/25"
          />
          <span className="mt-2 block text-xs font-medium text-white/50">{formatDate(value.to)}</span>
        </label>
      </div>
    </div>
  );
}

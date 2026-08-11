"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

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

export function BookingDateRangePicker({
  value,
  onChange,
  className,
  label = "Chọn khoảng ngày",
  description = "Xem lịch trống và chọn thời gian lưu trú.",
}: BookingDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
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

  if (!open) {
    return (
      <div className={cn("w-full", className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group mx-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#282252] px-4 py-3 text-sm font-extrabold text-white transition hover:border-pink-200/35 hover:bg-[#312a68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200/70 sm:w-fit sm:min-w-64"
        >
          <Search className="size-4 text-pink-200 transition group-hover:text-white" aria-hidden="true" />
          Tìm phòng cho ngày khác
        </button>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/12 bg-[#1b1023]/90 px-4 py-4 sm:px-5",
        className,
      )}
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">{label}</h3>
          <p className="mt-1 text-sm font-medium text-white/60">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Đóng chọn ngày"
          className="-mr-1 -mt-1 rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200/70"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-white">Từ ngày</span>
          <input
            type="date"
            lang="vi-VN"
            value={value.from}
            min={today}
            onChange={(event) => handleFromChange(event.target.value)}
            className="h-12 w-full rounded-xl border border-white/20 bg-white/[0.04] px-3 text-base font-bold text-white outline-none transition [color-scheme:dark] focus:border-pink-200/80 focus:bg-white/[0.08] focus:ring-2 focus:ring-pink-200/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-white">Đến ngày</span>
          <input
            type="date"
            lang="vi-VN"
            value={value.to}
            min={value.from}
            onChange={(event) => handleToChange(event.target.value)}
            className="h-12 w-full rounded-xl border border-white/20 bg-white/[0.04] px-3 text-base font-bold text-white outline-none transition [color-scheme:dark] focus:border-pink-200/80 focus:bg-white/[0.08] focus:ring-2 focus:ring-pink-200/20"
          />
        </label>
      </div>
    </section>
  );
}

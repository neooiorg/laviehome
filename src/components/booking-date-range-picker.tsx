"use client";

import * as React from "react";
import { addYears, format } from "date-fns";
import { vi } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, ChevronRight, Search, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
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

function dateToIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: Date | undefined) {
  return date ? format(date, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày";
}

export function BookingDateRangePicker({
  value,
  onChange,
  className,
  label = "Chọn khoảng ngày",
  description = "Xem lịch trống và chọn thời gian lưu trú.",
}: BookingDateRangePickerProps) {
  const today = isoToDate(getTodayIso());
  const [open, setOpen] = React.useState(false);
  const [draftRange, setDraftRange] = React.useState<DateRange>(() => ({
    from: isoToDate(value.from),
    to: isoToDate(value.to),
  }));

  React.useEffect(() => {
    setDraftRange({
      from: isoToDate(value.from),
      to: isoToDate(value.to),
    });
  }, [value.from, value.to]);

  function handleSelect(nextRange: DateRange | undefined) {
    if (!nextRange?.from) return;

    setDraftRange(nextRange);
    if (nextRange.to) {
      onChange({
        from: dateToIso(nextRange.from),
        to: dateToIso(nextRange.to),
      });
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <div className={cn("w-full", className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#282252] px-4 py-3 text-sm font-extrabold text-white transition hover:border-pink-200/35 hover:bg-[#312a68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200/70"
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
        "overflow-hidden rounded-2xl border border-white/12 bg-[#1b1023]/90",
        className,
      )}
      aria-label={label}
    >
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 size-5 shrink-0 text-pink-200" aria-hidden="true" />
            <div>
              <h3 className="text-base font-black text-white">{label}</h3>
              <p className="mt-1 text-sm font-medium text-white/60">{description}</p>
            </div>
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

        <div className="mt-4 flex items-center gap-3" aria-live="polite">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">Từ ngày</p>
            <p className="mt-1 truncate text-base font-black text-white">{formatDate(draftRange.from)}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-pink-200/70" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">Đến ngày</p>
            <p className="mt-1 truncate text-base font-black text-white">{formatDate(draftRange.to)}</p>
          </div>
        </div>
      </div>

      <div className="px-2 py-3 sm:px-4 sm:py-4">
        <Calendar
          mode="range"
          locale={vi}
          selected={draftRange}
          onSelect={handleSelect}
          defaultMonth={draftRange.from ?? today}
          startMonth={today}
          endMonth={addYears(today, 2)}
          disabled={{ before: today }}
          showOutsideDays={false}
          className="w-full bg-transparent p-0 [--cell-size:2.5rem] sm:[--cell-size:2.75rem]"
          classNames={{
            months: "w-full",
            month: "w-full gap-3",
            month_caption: "mb-1 h-10",
            caption_label: "text-sm font-black capitalize text-white",
            nav: "top-0",
            button_previous: "text-white/70 hover:bg-white/10 hover:text-white",
            button_next: "text-white/70 hover:bg-white/10 hover:text-white",
            month_grid: "w-full",
            weekdays: "mb-1 flex",
            weekday: "flex-1 text-center text-[11px] font-bold text-white/45",
            week: "mt-1 flex w-full",
            day: "rounded-lg p-0 text-center",
            range_start: "rounded-l-lg bg-pink-500/20",
            range_middle: "rounded-none bg-pink-500/20",
            range_end: "rounded-r-lg bg-pink-500/20",
            today: "bg-white/10 text-white",
            outside: "text-transparent",
            disabled: "text-white/20 opacity-50",
            day_button:
              "h-(--cell-size) w-full rounded-lg text-sm font-bold text-white transition hover:bg-pink-300/20 hover:text-white data-[selected-single=true]:bg-pink-400 data-[selected-single=true]:text-[#1b1023] data-[range-start=true]:rounded-lg data-[range-start=true]:bg-pink-400 data-[range-start=true]:text-[#1b1023] data-[range-end=true]:rounded-lg data-[range-end=true]:bg-pink-400 data-[range-end=true]:text-[#1b1023] data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-white",
          }}
        />
        <p className="mt-2 text-center text-xs font-medium text-white/45">
          Chọn ngày bắt đầu, sau đó chọn ngày kết thúc.
        </p>
      </div>
    </section>
  );
}

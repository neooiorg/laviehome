"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BookingDateRange } from "@/lib/booking-slots";
import { addDaysToIso, getTodayIso } from "@/lib/booking-slots";
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

function formatDate(iso: string) {
  return format(isoToDate(iso), "dd/MM/yyyy", { locale: vi });
}

export function BookingDateRangePicker({
  value,
  onChange,
  className,
  label = "Chọn khoảng ngày",
  description = "Chọn ngày bắt đầu và ngày kết thúc để xem lịch đặt phòng.",
}: BookingDateRangePickerProps) {
  const isMobile = useIsMobile();
  const today = getTodayIso();
  const [open, setOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const selected: DateRange = {
    from: isoToDate(rangeStart ?? value.from),
    to: rangeStart ? undefined : isoToDate(value.to),
  };

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setRangeStart(null);
    }
  }

  function setPreset(totalDays: number) {
    const from = getTodayIso();
    onChange({
      from,
      to: addDaysToIso(from, Math.max(totalDays - 1, 0)),
    });
    setRangeStart(null);
    setOpen(false);
  }

  function handleDayClick(day: Date, modifiers: { disabled?: boolean }) {
    if (modifiers.disabled) return;
    const iso = dateToIso(day);

    if (!rangeStart) {
      setRangeStart(iso);
      onChange({ from: iso, to: iso });
      return;
    }

    const startDate = isoToDate(rangeStart);
    const nextRange =
      day.getTime() >= startDate.getTime()
        ? { from: rangeStart, to: iso }
        : { from: iso, to: rangeStart };

    onChange(nextRange);
    setRangeStart(null);
    setOpen(false);
  }

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-4", className)}>
      <div className="mb-3">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="mt-1 text-xs text-white/55">{description}</p>
      </div>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 w-full justify-start whitespace-normal border-white/15 bg-white/10 px-3 py-2 text-left font-bold text-white hover:bg-white/15 hover:text-white"
          >
            <CalendarDays className="mr-2 size-4 shrink-0 text-pink-200" />
            <span>{formatDate(value.from)} - {formatDate(value.to)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="max-h-[min(82vh,720px)] w-[calc(100vw-1rem)] max-w-[680px] overflow-y-auto border-white/10 bg-[#1b1023] p-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.42)] sm:w-auto"
          align="center"
          sideOffset={10}
        >
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
            <p className="text-sm font-black text-white">
              {rangeStart ? "Chọn ngày kết thúc" : "Chọn ngày bắt đầu"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-white/60">
              {rangeStart
                ? `Ngày bắt đầu: ${formatDate(rangeStart)}`
                : "Bấm một ngày bất kỳ để bắt đầu chọn khoảng lịch."}
            </p>
          </div>
          <Calendar
            mode="range"
            locale={vi}
            selected={selected}
            onDayClick={handleDayClick}
            defaultMonth={selected.from}
            disabled={{ before: isoToDate(today) }}
            numberOfMonths={isMobile ? 1 : 2}
            weekStartsOn={1}
            fixedWeeks
            showOutsideDays={false}
            className="w-full text-white [--cell-size:--spacing(9)] sm:[--cell-size:--spacing(8)]"
            classNames={{
              root: "w-full",
              months: "flex w-full flex-col gap-3 sm:flex-row sm:gap-4",
              month: "w-full",
              month_grid: "w-full border-collapse",
              nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 text-white",
              button_previous: "text-white hover:bg-white/10 hover:text-white",
              button_next: "text-white hover:bg-white/10 hover:text-white",
              month_caption: "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
              caption_label: "text-sm font-black capitalize text-white",
              weekdays: "mb-1 flex",
              weekday: "flex-1 text-center text-[0.78rem] font-black text-pink-100/80",
              week: "mt-1 flex w-full",
              day: "relative aspect-square h-full w-full p-0 text-center text-white",
              day_button:
                "min-w-(--cell-size) rounded-lg text-sm font-black text-white hover:bg-white/12 hover:text-white focus-visible:ring-pink-200/70 data-[selected-single=true]:bg-[#f6d76f] data-[selected-single=true]:text-[#170913] data-[range-start=true]:bg-[#f6d76f] data-[range-start=true]:text-[#170913] data-[range-end=true]:bg-[#f6d76f] data-[range-end=true]:text-[#170913] data-[range-middle=true]:bg-[#f35abd]/22 data-[range-middle=true]:text-white",
              today: "rounded-lg bg-white/10 text-pink-100",
              outside: "invisible",
              hidden: "invisible",
              disabled: "text-white/25 opacity-40",
              range_start: "rounded-l-lg bg-[#f35abd]/18",
              range_middle: "rounded-none bg-[#f35abd]/18 text-white",
              range_end: "rounded-r-lg bg-[#f35abd]/18",
            }}
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setPreset(days)}
                className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-2 text-xs font-black text-white transition hover:border-pink-200/60 hover:bg-white/10"
              >
                {days} ngày
              </button>
            ))}
          </div>
          <p className="mt-3 px-1 pb-1 text-xs font-semibold text-white/55">Có thể chọn tối đa 31 ngày trong một lần xem.</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

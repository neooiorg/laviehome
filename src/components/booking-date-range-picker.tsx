"use client";

import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function BookingDateRangePicker({
  value,
  onChange,
  className,
  label = "Chọn khoảng ngày",
  description = "Chọn ngày bắt đầu và ngày kết thúc để xem lịch đặt phòng.",
}: BookingDateRangePickerProps) {
  const today = getTodayIso();
  const selected: DateRange = {
    from: isoToDate(value.from),
    to: isoToDate(value.to),
  };

  function handleSelect(range: DateRange | undefined) {
    if (!range?.from) return;
    onChange({
      from: dateToIso(range.from),
      to: dateToIso(range.to ?? range.from),
    });
  }

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-4", className)}>
      <div className="mb-3">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="mt-1 text-xs text-white/55">{description}</p>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-start border-white/15 bg-white/10 text-left font-bold text-white hover:bg-white/15 hover:text-white"
          >
            <CalendarDays className="mr-2 size-4 text-pink-200" />
            {formatDate(value.from)} - {formatDate(value.to)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto border-white/10 bg-[#1b1023] p-2 text-white" align="center">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected.from}
            disabled={{ before: isoToDate(today) }}
            numberOfMonths={2}
            className="text-white"
            classNames={{
              caption_label: "text-white",
              weekday: "text-white/55",
              day: "text-white",
              today: "bg-white/10 text-pink-200",
              outside: "text-white/25",
              disabled: "text-white/20 opacity-40",
              range_start: "bg-pink-500",
              range_middle: "bg-pink-500/20 text-white",
              range_end: "bg-pink-500",
            }}
          />
          <p className="px-2 pb-1 text-xs font-semibold text-white/50">Tối đa hiển thị 31 ngày trong một lần xem.</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

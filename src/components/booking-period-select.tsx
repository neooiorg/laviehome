"use client";

import { useMemo } from "react";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { getBookingPeriodOptions } from "@/lib/booking-slots";
import { cn } from "@/lib/utils";

type BookingPeriodSelectProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  totalPeriods?: number;
  daysPerPeriod?: number;
  label?: string;
  description?: string;
};

export function BookingPeriodSelect({
  value,
  onChange,
  className,
  totalPeriods = 12,
  daysPerPeriod = 7,
  label = "Chọn tháng / tuần",
  description = "Xem các tuần và tháng tiếp theo để đặt phòng xa hơn.",
}: BookingPeriodSelectProps) {
  const options = useMemo(
    () => getBookingPeriodOptions({ totalPeriods, daysPerPeriod }),
    [totalPeriods, daysPerPeriod]
  );

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-4", className)}>
      <div className="mb-3">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="mt-1 text-xs text-white/55">{description}</p>
      </div>
      <NativeSelect
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      >
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

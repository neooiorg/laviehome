"use client";

import * as React from "react";
import { AlertTriangle, Moon, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeDuration,
  findSlotOverlaps,
  isOvernightRange,
  makeSlot,
  makeSlotLabel,
  timeToMinutes,
  type RoomSlot,
} from "@/lib/booking-slots";

export type SlotRow = { start: string; end: string; price: string };

export function slotRowsToSlots(rows: SlotRow[]): RoomSlot[] {
  return rows.map((r) => makeSlot(r.start, r.end));
}

export function slotRowsToPrices(rows: SlotRow[]): (number | null)[] {
  return rows.map((r) => {
    const v = Number(r.price);
    return Number.isFinite(v) && v > 0 ? v : null;
  });
}

/** A row is complete when both times are valid "HH:MM". */
function isRowFilled(row: SlotRow): boolean {
  return timeToMinutes(row.start) !== null && timeToMinutes(row.end) !== null;
}

/** Overlaps computed only over rows with valid times (ignoring half-typed rows). */
export function computeRowOverlaps(rows: SlotRow[]): Array<[number, number]> {
  // Map filled rows to their original indexes so warnings point at the right row.
  const filledIndexes: number[] = [];
  const filledSlots: RoomSlot[] = [];
  rows.forEach((row, i) => {
    if (isRowFilled(row)) {
      filledIndexes.push(i);
      filledSlots.push(makeSlot(row.start, row.end));
    }
  });
  return findSlotOverlaps(filledSlots).map(
    ([a, b]) => [filledIndexes[a], filledIndexes[b]] as [number, number]
  );
}

export function SlotEditor({
  rows,
  onChange,
  priceFromFallback,
  fullDayFallback,
}: {
  rows: SlotRow[];
  onChange: (rows: SlotRow[]) => void;
  priceFromFallback?: string;
  fullDayFallback?: string;
}) {
  const overlaps = React.useMemo(() => computeRowOverlaps(rows), [rows]);
  const conflictIndexes = React.useMemo(() => {
    const s = new Set<number>();
    overlaps.forEach(([a, b]) => {
      s.add(a);
      s.add(b);
    });
    return s;
  }, [overlaps]);

  function updateRow(index: number, patch: Partial<SlotRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...rows, { start: "", end: "", price: "" }]);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <div>
        <Label>Khung giờ đặt phòng</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Đặt giờ bắt đầu / kết thúc cho từng khung. Kết thúc &le; bắt đầu sẽ tính là khung
          qua đêm 🌙. Giá để trống sẽ dùng mặc định.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có khung giờ nào. Bấm “Thêm khung giờ”.</p>
        )}
        {rows.map((row, i) => {
          const filled = isRowFilled(row);
          const overnight = filled && isOvernightRange(row.start, row.end);
          const label = filled ? makeSlotLabel(row.start, row.end) : "—";
          const duration = filled ? computeDuration(row.start, row.end) : "";
          const conflict = conflictIndexes.has(i);
          const fallback = overnight ? fullDayFallback : priceFromFallback;
          return (
            <div
              key={i}
              className={`flex flex-wrap items-end gap-2 rounded-md border p-2 ${
                conflict ? "border-destructive bg-destructive/5" : "bg-background"
              }`}
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Bắt đầu</Label>
                <Input
                  type="time"
                  className="w-28"
                  value={row.start}
                  onChange={(e) => updateRow(i, { start: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Kết thúc</Label>
                <Input
                  type="time"
                  className="w-28"
                  value={row.end}
                  onChange={(e) => updateRow(i, { end: e.target.value })}
                />
              </div>
              <div className="flex min-w-24 flex-col gap-1">
                <Label className="text-xs">Khung</Label>
                <span className="flex h-9 items-center gap-1 text-sm">
                  {label}
                  {duration ? <span className="text-muted-foreground">({duration})</span> : null}
                  {overnight ? <Moon className="size-3.5 text-indigo-500" /> : null}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs">Giá (đ)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={row.price}
                  placeholder={fallback ? `Mặc định ${fallback}` : "Mặc định"}
                  onChange={(e) => updateRow(i, { price: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Xoá khung giờ"
                onClick={() => removeRow(i)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>

      <div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1.5 size-3.5" />
          Thêm khung giờ
        </Button>
      </div>

      {overlaps.length > 0 && (
        <div className="flex flex-col gap-1 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="size-4" />
            Các khung giờ bị chồng chéo — vui lòng sửa trước khi lưu:
          </div>
          <ul className="ml-6 list-disc">
            {overlaps.map(([a, b], k) => (
              <li key={k}>
                “{makeSlotLabel(rows[a].start, rows[a].end)}” và “
                {makeSlotLabel(rows[b].start, rows[b].end)}”
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
